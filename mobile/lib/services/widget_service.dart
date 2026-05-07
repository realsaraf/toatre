import 'dart:convert';

import 'package:home_widget/home_widget.dart';

import 'package:toatre/models/toat_summary.dart';

/// Writes upcoming toats to the iOS App Group shared container so the
/// WidgetKit extension (ToatreWidget) can read them without the app being open.
///
/// Called by [ToatsProvider] after every successful fetch.
class WidgetService {
  static const _appGroup = 'group.com.toatre.app';
  static const _dataKey = 'toat_data';
  static const _widgetKind = 'ToatreWidget';

  static bool _initialized = false;

  static Future<void> init() async {
    if (_initialized) return;
    await HomeWidget.setAppGroupId(_appGroup);
    _initialized = true;
  }

  /// Serializes the next [maxItems] upcoming open toats and pushes them to
  /// the widget's shared UserDefaults, then asks WidgetKit to reload.
  ///
  /// "Upcoming" = open, has a datetime, datetime >= now.
  /// If none today, uses tomorrow's, then the day after — i.e. just
  /// chronologically the soonest ones.
  static Future<void> update(
    List<ToatSummary> toats, {
    int maxItems = 8,
  }) async {
    await init();

    final now = DateTime.now();

    final upcoming =
        toats
            .where(
              (t) =>
                  t.state == 'open' &&
                  t.datetime != null &&
                  t.datetime!.isAfter(now.subtract(const Duration(minutes: 1))),
            )
            .toList()
          ..sort((a, b) => a.datetime!.compareTo(b.datetime!));

    final unscheduled =
        toats.where((t) => t.state == 'open' && t.datetime == null).toList()
          ..sort((a, b) => _sortByRecency(b).compareTo(_sortByRecency(a)));

    final overdue =
        toats
            .where(
              (t) =>
                  t.state == 'open' &&
                  t.datetime != null &&
                  t.datetime!.isBefore(
                    now.subtract(const Duration(minutes: 1)),
                  ),
            )
            .toList()
          ..sort((a, b) => b.datetime!.compareTo(a.datetime!));

    final ranked = <ToatSummary>[];

    void appendUnique(List<ToatSummary> batch) {
      for (final toat in batch) {
        final title = toat.title.trim();
        if (title.isEmpty) continue;
        final alreadyAdded = ranked.any((entry) => entry.id == toat.id);
        if (alreadyAdded) continue;
        ranked.add(toat);
        if (ranked.length >= maxItems) return;
      }
    }

    appendUnique(upcoming);
    if (ranked.length < maxItems) appendUnique(unscheduled);
    if (ranked.length < maxItems) appendUnique(overdue);

    final payload = ranked.take(maxItems).map((t) {
      return <String, Object?>{
        'id': t.id,
        'title': t.title,
        'kind': _kind(t),
        'tier': t.tier,
        'time': t.datetime?.toIso8601String(),
        'location': t.location,
      };
    }).toList();

    await HomeWidget.saveWidgetData<String>(_dataKey, jsonEncode(payload));
    await HomeWidget.updateWidget(name: _widgetKind, iOSName: _widgetKind);
  }

  static DateTime _sortByRecency(ToatSummary toat) {
    return toat.updatedAt ??
        toat.createdAt ??
        DateTime.fromMillisecondsSinceEpoch(0);
  }

  static String _kind(ToatSummary t) {
    final action = t.actionEnrichment;
    if (action != null) {
      final type = action['type'] as String? ?? '';
      if (type == 'call' || type == 'meeting') return 'meeting';
    }
    final comm = t.communicationEnrichment;
    if (comm != null) {
      final type = comm['method'] as String? ?? '';
      if (type == 'meeting' || type == 'video') return 'meeting';
    }
    // Fall back to enrichment-based kind detection
    if (t.timeEnrichment?['dueAt'] != null) return 'deadline';
    if (t.eventEnrichment != null) return 'event';
    if (t.placeEnrichment != null) return 'errand';
    return 'task';
  }
}
