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

  /// Serializes the next [maxItems] open toats and pushes them to
  /// the widget's shared UserDefaults, then asks WidgetKit to reload.
  ///
  /// Order matches the timeline: overdue (oldest first) → upcoming
  /// (chronological) → unscheduled (most-recently-updated first).
  static Future<void> update(
    List<ToatSummary> toats, {
    int maxItems = 8,
  }) async {
    await init();

    final now = DateTime.now();

    // Overdue: open, has datetime, in the past. Sorted oldest-first so the
    // most-past item (highest urgency) appears at top — matches timeline.
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
          ..sort((a, b) => a.datetime!.compareTo(b.datetime!));

    // Upcoming: open, has datetime, in the future. Sorted chronologically.
    final upcoming =
        toats
            .where(
              (t) =>
                  t.state == 'open' &&
                  t.datetime != null &&
                  !t.datetime!.isBefore(
                    now.subtract(const Duration(minutes: 1)),
                  ),
            )
            .toList()
          ..sort((a, b) => a.datetime!.compareTo(b.datetime!));

    // Unscheduled: open, no datetime. Sorted by most recently updated.
    final unscheduled =
        toats.where((t) => t.state == 'open' && t.datetime == null).toList()
          ..sort((a, b) => _sortByRecency(b).compareTo(_sortByRecency(a)));

    final ranked = <ToatSummary>[];

    void appendUnique(List<ToatSummary> batch) {
      for (final toat in batch) {
        final title = toat.title.trim();
        if (title.isEmpty) continue;
        if (ranked.any((entry) => entry.id == toat.id)) continue;
        ranked.add(toat);
        if (ranked.length >= maxItems) return;
      }
    }

    // Priority order: overdue → upcoming → unscheduled.
    appendUnique(overdue);
    if (ranked.length < maxItems) appendUnique(upcoming);
    if (ranked.length < maxItems) appendUnique(unscheduled);

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
