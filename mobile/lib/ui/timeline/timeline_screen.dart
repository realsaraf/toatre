import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:firebase_auth/firebase_auth.dart' show User;
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

import 'package:toatre/models/toat_summary.dart';
import 'package:toatre/providers/auth_provider.dart';
import 'package:toatre/providers/capture_provider.dart';
import 'package:toatre/providers/toats_provider.dart';
import 'package:toatre/services/analytics_service.dart';
import 'package:toatre/ui/capture/capture_screen.dart';
import 'package:toatre/ui/toat/toat_detail_screen.dart';
import 'package:toatre/utils/app_colors.dart';
import 'package:toatre/utils/confetti.dart';
import 'package:toatre/utils/text_styles.dart';
import 'package:toatre/widgets/mobile_page_chrome.dart';
import 'package:toatre/widgets/toatre_mark.dart';
import 'package:toatre/widgets/toat_detail/toat_detail_utils.dart'
    show
        detailEnrichmentAccent,
        detailEnrichmentColors,
        detailEnrichmentGlyph,
        detailEnrichmentSoft;

class TimelineScreen extends StatefulWidget {
  const TimelineScreen({super.key, this.onSwitchToSettings});

  final VoidCallback? onSwitchToSettings;

  @override
  State<TimelineScreen> createState() => _TimelineScreenState();
}

class _TimelineScreenState extends State<TimelineScreen> {
  _TimelineRange _selectedRange = _TimelineRange.day;
  bool _hasManualRangeSelection = false;
  String? _removingToatId;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      final provider = context.read<ToatsProvider>();
      if (provider.status == ToatsStatus.idle) {
        await provider.fetchToats();
      }
      await AnalyticsService.logTimelineViewed();
    });
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final toatsProvider = context.watch<ToatsProvider>();
    final toats = toatsProvider.toats;
    final preferredRange = _preferredRange(toats);
    if (!_hasManualRangeSelection && _selectedRange != preferredRange) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (!mounted ||
            _hasManualRangeSelection ||
            _selectedRange == preferredRange) {
          return;
        }
        setState(() {
          _selectedRange = preferredRange;
        });
      });
    }
    final visibleToats = _filterToats(toats, _selectedRange);
    final grouped = _groupToats(visibleToats, _selectedRange);
    final clearAfterToday = _latestTimeForSelectedScope(toats);
    final selectedCount = _isSingleDayRange(_selectedRange)
        ? visibleToats.length
        : _filterToats(toats, _TimelineRange.day).length;

    return Scaffold(
      backgroundColor: const Color(0xFFF7F1E8),
      extendBody: true,
      body: Stack(
        children: [
          SafeArea(
            child: RefreshIndicator(
              color: const Color(0xFFBE7716),
              backgroundColor: const Color(0xFFFCF9F4),
              onRefresh: context.read<ToatsProvider>().fetchToats,
              child: ListView(
                padding: const EdgeInsets.fromLTRB(20, 12, 20, 116),
                children: [
                  Row(
                    children: [
                      const _AppBrand(),
                      const Spacer(),
                      _ProfileButton(user: auth.user, onTap: _openSettings),
                    ],
                  ),
                  const SizedBox(height: 14),
                  Row(
                    children: [
                      _DatePillButton(
                        label: _selectedDatePillLabel(),
                        onTap: _openRangePicker,
                      ),
                      const Spacer(),
                      _ToatCountPill(count: selectedCount),
                    ],
                  ),
                  const SizedBox(height: 12),
                  _ClearHeroCard(clearAfter: clearAfterToday),
                  const SizedBox(height: 14),
                  if (toatsProvider.status == ToatsStatus.loading)
                    const Padding(
                      padding: EdgeInsets.only(top: 80),
                      child: Center(child: CircularProgressIndicator()),
                    )
                  else if (toatsProvider.status == ToatsStatus.error)
                    _TimelineMessage(
                      title: 'Could not load your timeline.',
                      subtitle:
                          toatsProvider.error ?? 'Try pulling to refresh.',
                    )
                  else if (toats.isEmpty)
                    _EmptyState(
                      onCapture: _openVoiceCapture,
                      onTextCapture: _openTextCapture,
                    )
                  else if (visibleToats.isEmpty)
                    _TimelineMessage(
                      title: 'Nothing here yet.',
                      subtitle: 'Try another range or capture a new toat.',
                    )
                  else ...[
                    for (final entry in grouped.entries) ...[
                      if (entry.key.isNotEmpty) ...[
                        Padding(
                          padding: const EdgeInsets.only(left: 70, bottom: 6),
                          child: Text(
                            entry.key,
                            style: TextStyles.small.copyWith(
                              color: _groupColor(entry.value, entry.key),
                              fontWeight: FontWeight.w700,
                              letterSpacing: 1.0,
                            ),
                          ),
                        ),
                      ],
                      ...entry.value.map(
                        (toat) => _TimelineRow(
                          toat: toat,
                          onTap: () => _openToat(toat),
                          onAction: () => _runPrimaryAction(toat),
                          onDone: () => _markDone(toat),
                          removing: _removingToatId == toat.id,
                        ),
                      ),
                      const SizedBox(height: 8),
                    ],
                  ],
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _openVoiceCapture() async {
    final capture = context.read<CaptureProvider>();
    capture.reset();
    capture.setMode(CaptureInputMode.voice);
    await Navigator.of(
      context,
    ).push(MaterialPageRoute<void>(builder: (_) => const CaptureScreen()));
    if (!mounted) return;
    await context.read<ToatsProvider>().fetchToats();
  }

  Future<void> _openTextCapture() async {
    final capture = context.read<CaptureProvider>();
    capture.reset();
    capture.setMode(CaptureInputMode.text);
    await Navigator.of(
      context,
    ).push(MaterialPageRoute<void>(builder: (_) => const CaptureScreen()));
    if (!mounted) {
      return;
    }
    await context.read<ToatsProvider>().fetchToats();
  }

  Future<void> _openSettings() async {
    widget.onSwitchToSettings?.call();
  }

  Future<void> _openRangePicker() async {
    final selected = await showModalBottomSheet<_TimelineRange>(
      context: context,
      useSafeArea: true,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      barrierColor: const Color(0x330F0B08),
      builder: (dialogContext) {
        return _TimelineRangeSheet(selectedRange: _selectedRange);
      },
    );

    if (selected == null || selected == _selectedRange) {
      return;
    }

    setState(() {
      _hasManualRangeSelection = true;
      _selectedRange = selected;
    });
  }

  Future<void> _openToat(ToatSummary toat) async {
    final result = await Navigator.of(context).push<Object?>(
      MaterialPageRoute<Object?>(
        builder: (_) => ToatDetailScreen(initialToat: toat),
      ),
    );
    if (!mounted) return;
    if (result == 'done') {
      context.read<ToatsProvider>().removeToatLocally(toat.id);
    } else if (result == true) {
      await context.read<ToatsProvider>().fetchToats();
    }
  }

  Future<void> _runPrimaryAction(ToatSummary toat) async {
    final action = _primaryAction(toat);
    if (action == null) {
      await _openToat(toat);
      return;
    }

    final uri = action.uri;

    if (uri == null) {
      await _openToat(toat);
      return;
    }

    final launched = await launchUrl(uri, mode: LaunchMode.externalApplication);
    if (!mounted || launched) {
      return;
    }

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Could not open ${action.label.toLowerCase()}.')),
    );
  }

  Future<void> _markDone(ToatSummary toat) async {
    if (toat.state == 'done') return;

    final toatsProvider = context.read<ToatsProvider>();
    final messenger = ScaffoldMessenger.maybeOf(context);
    final overlay = Overlay.of(context, rootOverlay: true);
    final screenSize = MediaQuery.sizeOf(context);

    try {
      await HapticFeedback.heavyImpact();
      final updated = await toatsProvider.updateToat(toat.id, <String, Object?>{
        'state': 'done',
      });
      await AnalyticsService.logToatCompleted(kind: updated.tier);
      if (!mounted) return;
      // Start exit animation
      setState(() => _removingToatId = toat.id);
      // Fire confetti from the bottom after card fade-out
      Future<void>.delayed(const Duration(milliseconds: 600), () {
        if (mounted) {
          showConfettiOnOverlay(overlay: overlay, size: screenSize);
        }
      });
      // Remove card locally after animation — no server refetch
      Future<void>.delayed(const Duration(milliseconds: 400), () {
        if (!mounted) return;
        setState(() => _removingToatId = null);
        toatsProvider.removeToatLocally(toat.id);
      });
    } catch (error) {
      if (!mounted) return;
      messenger?.showSnackBar(SnackBar(content: Text(error.toString())));
    }
  }

  Map<String, List<ToatSummary>> _groupToats(
    List<ToatSummary> toats,
    _TimelineRange range,
  ) {
    final groups = <String, List<ToatSummary>>{};
    const int undatedSortValue = 1 << 62;

    if (_isSingleDayRange(range)) {
      final sorted = List<ToatSummary>.from(toats)
        ..sort((a, b) {
          final aMs = a.datetime?.millisecondsSinceEpoch ?? undatedSortValue;
          final bMs = b.datetime?.millisecondsSinceEpoch ?? undatedSortValue;
          return aMs.compareTo(bMs);
        });
      for (final toat in sorted) {
        final label = _timeBucket(toat.datetime);
        groups.putIfAbsent(label, () => <ToatSummary>[]).add(toat);
      }
    } else {
      final sorted = List<ToatSummary>.from(toats)
        ..sort((a, b) {
          final aMs = a.datetime?.millisecondsSinceEpoch ?? undatedSortValue;
          final bMs = b.datetime?.millisecondsSinceEpoch ?? undatedSortValue;
          return aMs.compareTo(bMs);
        });
      for (final toat in sorted) {
        final label = _dateBucket(toat.datetime);
        groups.putIfAbsent(label, () => <ToatSummary>[]).add(toat);
      }
    }

    return groups;
  }

  List<ToatSummary> _filterToats(
    List<ToatSummary> toats,
    _TimelineRange range,
  ) {
    return toats.where((toat) => _matchesRange(toat, range)).toList();
  }

  bool _matchesRange(ToatSummary toat, _TimelineRange range) {
    final dateTime = toat.datetime;
    if (dateTime == null) {
      return !_isSingleDayRange(range);
    }

    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final toatDay = DateTime(dateTime.year, dateTime.month, dateTime.day);
    final diff = toatDay.difference(today).inDays;

    final dayOffset = _rangeToOffset(range);
    if (dayOffset != null) {
      return diff == dayOffset;
    }
    switch (range) {
      case _TimelineRange.day:
        return diff == 0;
      case _TimelineRange.next7:
        return diff >= 0 && diff < 7;
      case _TimelineRange.next30:
        return diff >= 0 && diff < 30;
      case _TimelineRange.next3months:
        final start = DateTime(today.year, today.month, today.day);
        final end = DateTime(start.year, start.month + 3, start.day);
        return !toatDay.isBefore(start) && toatDay.isBefore(end);
      default:
        return false;
    }
  }

  /// Returns the day-offset (0 = today, 1 = tomorrow…) for individual-day
  /// ranges; null for aggregate ranges.
  int? _rangeToOffset(_TimelineRange range) {
    switch (range) {
      case _TimelineRange.day1:
        return 1;
      case _TimelineRange.day2:
        return 2;
      case _TimelineRange.day3:
        return 3;
      case _TimelineRange.day4:
        return 4;
      case _TimelineRange.day5:
        return 5;
      case _TimelineRange.day6:
        return 6;
      default:
        return null;
    }
  }

  bool _isSingleDayRange(_TimelineRange range) {
    return range == _TimelineRange.day || _rangeToOffset(range) != null;
  }

  _TimelineRange _preferredRange(List<ToatSummary> toats) {
    final todayCount = _filterToats(toats, _TimelineRange.day).length;
    return todayCount < 3 ? _TimelineRange.next7 : _TimelineRange.day;
  }

  String _rangeTitle(_TimelineRange range) {
    switch (range) {
      case _TimelineRange.day:
        return 'Today';
      case _TimelineRange.next7:
        return 'Next 7 days';
      case _TimelineRange.next30:
        return 'Next 30 days';
      case _TimelineRange.next3months:
        return 'Next 3 months';
      default:
        final offset = _rangeToOffset(range)!;
        final d = DateTime.now().add(Duration(days: offset));
        return _shortWeekday(d);
    }
  }

  String _shortWeekday(DateTime d) {
    const days = [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
    ];
    return days[d.weekday - 1];
  }

  String _selectedDatePillLabel() {
    final offset = _rangeToOffset(_selectedRange);
    if (offset != null) {
      final d = DateTime.now().add(Duration(days: offset));
      const months = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ];
      const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      return '${months[d.month - 1]} ${d.day}, ${weekdays[d.weekday - 1]}';
    }
    if (_selectedRange == _TimelineRange.day) {
      final now = DateTime.now();
      const months = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ];
      const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      return '${months[now.month - 1]} ${now.day}, ${weekdays[now.weekday - 1]}';
    }

    return _rangeTitle(_selectedRange);
  }

  String _dateBucket(DateTime? dateTime) {
    if (dateTime == null) return 'SOMEDAY';
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final toatDay = DateTime(dateTime.year, dateTime.month, dateTime.day);
    final diff = toatDay.difference(today).inDays;
    if (diff < 0) return 'Overdue';
    if (diff == 0) return 'Today';
    if (diff == 1) return 'Tomorrow';
    const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    return '${weekdays[dateTime.weekday - 1]}, '
        '${months[dateTime.month - 1]} ${dateTime.day}';
  }

  String _timeBucket(DateTime? dateTime) {
    if (dateTime == null) return 'SOMEDAY';
    if (dateTime.hour < 12) return 'MORNING';
    if (dateTime.hour < 18) return 'AFTERNOON';
    return 'EVENING';
  }

  Color _groupColor(List<ToatSummary> toats, String label) {
    if (toats.isNotEmpty) {
      return detailEnrichmentAccent(toats.first);
    }
    switch (label) {
      case 'EVENING':
        return const Color(0xFF6A35FF);
      case 'SOMEDAY':
        return const Color(0xFF7B61FF);
      case 'MORNING':
      case 'AFTERNOON':
        return const Color(0xFFBE7716);
      default:
        return const Color(0xFFBE7716);
    }
  }

  String? _latestTimeForSelectedScope(List<ToatSummary> toats) {
    final scopeDate = _isSingleDayRange(_selectedRange)
        ? DateTime.now().add(
            Duration(days: _rangeToOffset(_selectedRange) ?? 0),
          )
        : DateTime.now();
    final targetDay = DateTime(scopeDate.year, scopeDate.month, scopeDate.day);
    final dated = toats.where((toat) => toat.datetime != null).toList();
    final scopeToats = dated.where((toat) {
      final date = toat.datetime!;
      final toatDay = DateTime(date.year, date.month, date.day);
      return toatDay == targetDay;
    }).toList();
    if (scopeToats.isEmpty) return null;
    scopeToats.sort((a, b) => a.datetime!.compareTo(b.datetime!));
    return _formatTime(scopeToats.last.datetime!);
  }

  String _formatTime(DateTime dateTime) {
    final hour = dateTime.hour == 0
        ? 12
        : dateTime.hour > 12
        ? dateTime.hour - 12
        : dateTime.hour;
    final minute = dateTime.minute.toString().padLeft(2, '0');
    final suffix = dateTime.hour >= 12 ? 'PM' : 'AM';
    return '$hour:$minute $suffix';
  }
}

class _ToatCountPill extends StatelessWidget {
  const _ToatCountPill({required this.count});

  final int count;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 34,
      padding: const EdgeInsets.symmetric(horizontal: 10),
      decoration: BoxDecoration(
        color: const Color(0xFFFCF9F4),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: const Color(0xFFE8DFD2)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x14000000),
            blurRadius: 14,
            offset: Offset(0, 5),
          ),
        ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            '✦',
            style: TextStyles.small.copyWith(
              color: const Color(0xFF9B6A22),
              fontSize: 10,
              fontWeight: FontWeight.w700,
              height: 1,
            ),
          ),
          const SizedBox(width: 4),
          Text(
            '$count toats today',
            style: TextStyles.smallMedium.copyWith(
              color: const Color(0xFF37302A),
              fontSize: 11.5,
              fontWeight: FontWeight.w600,
              height: 1,
            ),
          ),
        ],
      ),
    );
  }
}

class _ClearHeroCard extends StatelessWidget {
  const _ClearHeroCard({required this.clearAfter});

  final String? clearAfter;

  @override
  Widget build(BuildContext context) {
    final allClear = clearAfter == null;

    return Container(
      constraints: const BoxConstraints(minHeight: 116),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFE8DFD2)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x14352719),
            blurRadius: 18,
            offset: Offset(0, 8),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(24),
        child: Stack(
          children: [
            // Warm gradient card background
            Positioned.fill(
              child: Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [Color(0xFFFEFBF6), Color(0xFFF8F1E8)],
                  ),
                ),
              ),
            ),
            Positioned.fill(
              child: Align(
                alignment: Alignment.centerRight,
                child: SizedBox(
                  width: 150,
                  child: IgnorePointer(
                    child: Stack(
                      fit: StackFit.expand,
                      children: const [
                        _ClearHeroRibbonArc(
                          diameter: 420,
                          right: -296,
                          top: -142,
                          strokeWidth: 30,
                          color: Color(0xFFF8EBD6),
                        ),
                        _ClearHeroRibbonArc(
                          diameter: 384,
                          right: -264,
                          top: -122,
                          strokeWidth: 20,
                          color: Color(0xFFF3C780),
                        ),
                        _ClearHeroRibbonArc(
                          diameter: 354,
                          right: -238,
                          top: -104,
                          strokeWidth: 18,
                          color: Color(0xFFF3AF72),
                        ),
                        _ClearHeroRibbonArc(
                          diameter: 326,
                          right: -213,
                          top: -88,
                          strokeWidth: 18,
                          color: Color(0xFFF5C6BC),
                        ),
                        _ClearHeroRibbonArc(
                          diameter: 298,
                          right: -188,
                          top: -72,
                          strokeWidth: 20,
                          color: Color(0xFFF8E9D8),
                        ),
                        _ClearHeroRibbonArc(
                          diameter: 270,
                          right: -162,
                          top: -56,
                          strokeWidth: 24,
                          color: Color(0xFFD8D0FF),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 14, 16, 14),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Container(
                    width: 60,
                    height: 60,
                    decoration: const BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: RadialGradient(
                        colors: [
                          Color(0x3DE1AB56),
                          Color(0x12E1AB56),
                          Color(0x00E1AB56),
                        ],
                        stops: [0.0, 0.48, 0.76],
                      ),
                    ),
                    child: Center(
                      child: Container(
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: const Color(0xFFBE7716),
                            width: 3,
                          ),
                          color: const Color(0xFFFFFDF8),
                          boxShadow: const [
                            BoxShadow(
                              color: Color(0x2EBE7716),
                              blurRadius: 12,
                              offset: Offset(0, 6),
                            ),
                          ],
                        ),
                        child: const Center(
                          child: Icon(
                            Icons.check_rounded,
                            size: 24,
                            color: Color(0xFFBE7716),
                          ),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text.rich(
                          TextSpan(
                            style: TextStyles.heading1.copyWith(
                              color: const Color(0xFF171C27),
                              fontSize: 20,
                              fontWeight: FontWeight.w700,
                              height: 1.02,
                            ),
                            children: [
                              const TextSpan(text: 'You\'re all clear '),
                              TextSpan(
                                text: allClear ? 'today' : 'after $clearAfter',
                                style: const TextStyle(
                                  color: Color(0xFFBE7716),
                                ),
                              ),
                            ],
                          ),
                          maxLines: 2,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          allClear
                              ? 'Your day looks open. Enjoy the quiet.'
                              : 'Your evening looks light after that. Enjoy!',
                          style: TextStyles.small.copyWith(
                            color: const Color(0xFF6A6159),
                            fontSize: 11.25,
                            fontWeight: FontWeight.w500,
                            height: 1.28,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ClearHeroRibbonArc extends StatelessWidget {
  const _ClearHeroRibbonArc({
    required this.diameter,
    required this.right,
    required this.top,
    required this.strokeWidth,
    required this.color,
  });

  final double diameter;
  final double right;
  final double top;
  final double strokeWidth;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Positioned(
      right: right,
      top: top,
      child: Container(
        width: diameter,
        height: diameter,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          border: Border.all(color: color, width: strokeWidth),
        ),
      ),
    );
  }
}

enum _TimelineRange {
  day,
  next7,
  next30,
  next3months,
  day1,
  day2,
  day3,
  day4,
  day5,
  day6,
}

class _TimelineRangeMenuEntry {
  const _TimelineRangeMenuEntry({
    required this.range,
    required this.title,
    required this.subtitle,
  });

  final _TimelineRange range;
  final String title;
  final String subtitle;
}

class _TimelineRangeSheet extends StatelessWidget {
  const _TimelineRangeSheet({required this.selectedRange});

  final _TimelineRange selectedRange;

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.viewInsetsOf(context).bottom;
    final entries = _entries();

    return Padding(
      padding: EdgeInsets.only(bottom: bottomInset),
      child: Align(
        alignment: Alignment.bottomCenter,
        child: Material(
          color: Colors.transparent,
          child: Container(
            constraints: BoxConstraints(
              maxWidth: 520,
              maxHeight: MediaQuery.sizeOf(context).height * 0.76,
            ),
            padding: const EdgeInsets.fromLTRB(12, 10, 12, 14),
            decoration: const BoxDecoration(
              color: Color(0xFFFDF9F3),
              borderRadius: BorderRadius.vertical(top: Radius.circular(30)),
              boxShadow: [
                BoxShadow(
                  color: Color(0x2A22170E),
                  blurRadius: 40,
                  offset: Offset(0, -4),
                ),
              ],
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 52,
                  height: 5,
                  decoration: BoxDecoration(
                    color: const Color(0xFFD8CCBF),
                    borderRadius: BorderRadius.circular(999),
                  ),
                ),
                const SizedBox(height: 14),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 8),
                  child: Row(
                    children: [
                      Text(
                        'Choose timeline range',
                        style: TextStyles.smallMedium.copyWith(
                          color: const Color(0xFF171C27),
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const Spacer(),
                      TextButton(
                        onPressed: () => Navigator.of(context).pop(),
                        style: TextButton.styleFrom(
                          foregroundColor: const Color(0xFF7A6D61),
                          textStyle: TextStyles.small.copyWith(
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        child: const Text('Close'),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 4),
                Flexible(
                  child: SingleChildScrollView(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        for (final entry in entries)
                          _TimelineRangeOption(
                            range: entry.range,
                            title: entry.title,
                            subtitle: entry.subtitle,
                            selected: selectedRange == entry.range,
                          ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  List<_TimelineRangeMenuEntry> _entries() {
    final now = DateTime.now();
    final dayRanges = <_TimelineRange>[
      _TimelineRange.day,
      _TimelineRange.day1,
      _TimelineRange.day2,
      _TimelineRange.day3,
      _TimelineRange.day4,
      _TimelineRange.day5,
      _TimelineRange.day6,
    ];

    return <_TimelineRangeMenuEntry>[
      const _TimelineRangeMenuEntry(
        range: _TimelineRange.next7,
        title: 'Next 7 days',
        subtitle: 'Today through the week',
      ),
      const _TimelineRangeMenuEntry(
        range: _TimelineRange.next30,
        title: 'Next 30 days',
        subtitle: 'Everything coming up',
      ),
      const _TimelineRangeMenuEntry(
        range: _TimelineRange.next3months,
        title: 'Next 3 months',
        subtitle: 'Longer horizon',
      ),
      for (final range in dayRanges)
        _TimelineRangeMenuEntry(
          range: range,
          title: range == _TimelineRange.day
              ? 'Today'
              : _menuDayTitle(now.add(Duration(days: _offsetForRange(range)))),
          subtitle: _menuDayMeta(
            now.add(
              Duration(
                days: range == _TimelineRange.day ? 0 : _offsetForRange(range),
              ),
            ),
          ),
        ),
    ];
  }

  int _offsetForRange(_TimelineRange range) {
    switch (range) {
      case _TimelineRange.day1:
        return 1;
      case _TimelineRange.day2:
        return 2;
      case _TimelineRange.day3:
        return 3;
      case _TimelineRange.day4:
        return 4;
      case _TimelineRange.day5:
        return 5;
      case _TimelineRange.day6:
        return 6;
      default:
        return 0;
    }
  }

  String _menuDayTitle(DateTime dateTime) {
    const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    return '${weekdays[dateTime.weekday - 1]}, ${months[dateTime.month - 1]} ${dateTime.day}';
  }

  String _menuDayMeta(DateTime dateTime) {
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    return '${months[dateTime.month - 1]} ${dateTime.day}';
  }
}

class _TimelineRangeOption extends StatelessWidget {
  const _TimelineRangeOption({
    required this.range,
    required this.title,
    required this.subtitle,
    required this.selected,
  });

  final _TimelineRange range;
  final String title;
  final String subtitle;
  final bool selected;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () => Navigator.of(context).pop(range),
      borderRadius: BorderRadius.circular(18),
      child: Container(
        constraints: const BoxConstraints(minHeight: 60),
        width: double.infinity,
        margin: const EdgeInsets.symmetric(vertical: 2),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(18),
          gradient: selected
              ? const LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [Color(0x1F6A35FF), Color(0x14FF2E91)],
                )
              : null,
          color: selected ? null : Colors.white.withValues(alpha: 0.78),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              title,
              style: TextStyles.smallMedium.copyWith(
                color: selected
                    ? const Color(0xFF5B23FF)
                    : const Color(0xFF22273A),
                fontSize: 13,
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              subtitle,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyles.small.copyWith(
                color: const Color(0xFF7C6F63),
                fontSize: 11,
                fontWeight: FontWeight.w700,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _AppBrand extends StatelessWidget {
  const _AppBrand();

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 48,
          height: 48,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            boxShadow: const [
              BoxShadow(
                color: Color(0x22000000),
                blurRadius: 18,
                offset: Offset(0, 8),
              ),
            ],
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(16),
            child: Image.asset(
              'assets/images/icon.png',
              width: 48,
              height: 48,
              fit: BoxFit.cover,
            ),
          ),
        ),
        const SizedBox(width: 12),
        const ToatreMark(fontSize: 30, color: Color(0xFF0F1B4C)),
      ],
    );
  }
}

class _ProfileButton extends StatelessWidget {
  const _ProfileButton({required this.user, required this.onTap});

  final User? user;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return MobileUserAvatarButton(user: user, onTap: onTap);
  }
}

class _DatePillButton extends StatelessWidget {
  const _DatePillButton({required this.label, required this.onTap});

  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: 34,
        padding: const EdgeInsets.symmetric(horizontal: 10),
        decoration: BoxDecoration(
          color: const Color(0xFFFCF9F4),
          borderRadius: BorderRadius.circular(15),
          border: Border.all(color: const Color(0xFFE8DFD2)),
          boxShadow: const [
            BoxShadow(
              color: Color(0x10000000),
              blurRadius: 14,
              offset: Offset(0, 5),
            ),
          ],
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(
              Icons.calendar_today_rounded,
              size: 13,
              color: Color(0xFF262B37),
            ),
            const SizedBox(width: 5),
            Text(
              label,
              style: TextStyles.smallMedium.copyWith(
                color: const Color(0xFF262B37),
                fontSize: 12,
                fontWeight: FontWeight.w600,
                height: 1,
              ),
            ),
            const SizedBox(width: 3),
            const Icon(
              Icons.keyboard_arrow_down_rounded,
              size: 15,
              color: Color(0xFF262B37),
            ),
          ],
        ),
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState({required this.onCapture, required this.onTextCapture});

  final VoidCallback onCapture;
  final VoidCallback onTextCapture;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 32),
      child: Column(
        children: [
          Container(
            width: 96,
            height: 96,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: const LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [Color(0xFF818CF8), Color(0xFFF59E0B)],
              ),
              boxShadow: const [
                BoxShadow(
                  color: Color(0x404F46E5),
                  blurRadius: 40,
                  spreadRadius: 4,
                  offset: Offset(0, 10),
                ),
              ],
            ),
            child: const Icon(
              Icons.auto_awesome_rounded,
              color: Colors.white,
              size: 44,
            ),
          ),
          const SizedBox(height: 28),
          Text(
            'Your timeline is clear',
            style: TextStyles.heading1.copyWith(
              color: const Color(0xFF171C27),
              fontSize: 24,
              fontWeight: FontWeight.w700,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 10),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Text(
              'Tap the mic and say what needs to happen.\nToatre will turn your words into toats.',
              style: TextStyles.body.copyWith(
                color: const Color(0xFF6A6159),
                height: 1.55,
              ),
              textAlign: TextAlign.center,
            ),
          ),
          const SizedBox(height: 32),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              GestureDetector(
                onTap: onCapture,
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 22,
                    vertical: 14,
                  ),
                  decoration: BoxDecoration(
                    gradient: AppColors.brandGradient,
                    borderRadius: BorderRadius.circular(20),
                    boxShadow: const [
                      BoxShadow(
                        color: Color(0x404F46E5),
                        blurRadius: 18,
                        offset: Offset(0, 6),
                      ),
                    ],
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(
                        Icons.mic_rounded,
                        color: Colors.white,
                        size: 18,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        'Capture',
                        style: TextStyles.bodyMedium.copyWith(
                          color: Colors.white,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 12),
              GestureDetector(
                onTap: onTextCapture,
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 22,
                    vertical: 14,
                  ),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFCF9F4),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: const Color(0xFFE8DFD2)),
                    boxShadow: const [
                      BoxShadow(
                        color: Color(0x14000000),
                        blurRadius: 12,
                        offset: Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(
                        Icons.edit_rounded,
                        color: Color(0xFFBE7716),
                        size: 18,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        'Type',
                        style: TextStyles.bodyMedium.copyWith(
                          color: const Color(0xFF37302A),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 40),
          Wrap(
            alignment: WrapAlignment.center,
            spacing: 8,
            runSpacing: 8,
            children: [
              _HintChip(text: '"Call dentist tomorrow at 2pm"'),
              _HintChip(text: '"Team meeting Friday 10am Zoom"'),
              _HintChip(text: '"Buy groceries this evening"'),
            ],
          ),
        ],
      ),
    );
  }
}

class _HintChip extends StatelessWidget {
  const _HintChip({required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: const Color(0x0C4F46E5),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withValues(alpha: 0.18)),
      ),
      child: Text(
        text,
        style: TextStyles.small.copyWith(
          color: const Color(0xFFEDE7FF),
          fontStyle: FontStyle.italic,
        ),
      ),
    );
  }
}

class _TimelineRow extends StatelessWidget {
  const _TimelineRow({
    required this.toat,
    required this.onTap,
    required this.onAction,
    required this.onDone,
    this.removing = false,
  });

  final ToatSummary toat;
  final VoidCallback onTap;
  final VoidCallback onAction;
  final VoidCallback onDone;
  final bool removing;

  @override
  Widget build(BuildContext context) {
    final action = _primaryAction(toat);
    final isDone = toat.state == 'done';
    final toatColors = _toatColors(toat);

    return AnimatedOpacity(
      opacity: removing ? 0.0 : 1.0,
      duration: const Duration(milliseconds: 400),
      curve: Curves.easeOut,
      child: AnimatedSlide(
        offset: removing ? const Offset(0, -0.06) : Offset.zero,
        duration: const Duration(milliseconds: 400),
        curve: Curves.easeOut,
        child: Padding(
          padding: const EdgeInsets.only(bottom: 8),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SizedBox(
                width: 46,
                child: Padding(
                  padding: const EdgeInsets.only(top: 9),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        toat.datetime == null
                            ? '--'
                            : _hourLabel(toat.datetime!),
                        maxLines: 1,
                        softWrap: false,
                        style: TextStyles.smallMedium.copyWith(
                          color: const Color(0xFF1B202B),
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          height: 1,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        toat.datetime == null
                            ? ''
                            : _minuteSuffix(toat.datetime!),
                        maxLines: 1,
                        softWrap: false,
                        style: TextStyles.small.copyWith(
                          color: const Color(0xFF84786E),
                          fontSize: 7,
                          fontWeight: FontWeight.w600,
                          height: 1,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              _RibbonRail(height: 78, dotColor: toatColors.first),
              const SizedBox(width: 4),
              Expanded(
                child: GestureDetector(
                  onTap: onTap,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 8,
                    ),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [Color(0xFFFEFBF6), Color(0xFFF8F1E8)],
                      ),
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(color: const Color(0xFFE8DFD2)),
                      boxShadow: const [
                        BoxShadow(
                          color: Color(0x14000000),
                          blurRadius: 20,
                          offset: Offset(0, 8),
                        ),
                      ],
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 34,
                          height: 34,
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(11),
                            gradient: LinearGradient(colors: toatColors),
                          ),
                          child: Center(
                            child: detailEnrichmentGlyph(
                              toat,
                              size: 19,
                              color: Colors.white,
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                toat.title,
                                style: TextStyles.smallMedium.copyWith(
                                  color: const Color(0xFF171C27),
                                  fontSize: 11,
                                  fontWeight: FontWeight.w600,
                                  height: 1.12,
                                ),
                              ),
                              const SizedBox(height: 3),
                              Text(
                                _supportingText(toat),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: TextStyles.tiny.copyWith(
                                  color: const Color(0xFF716960),
                                  fontSize: 8.75,
                                  height: 1.2,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 8),
                        Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            if (action != null) ...[
                              _StatusPill(
                                toat: toat,
                                action: action,
                                onTap: onAction,
                              ),
                              const SizedBox(width: 6),
                            ],
                            _DoneCircleButton(done: isDone, onTap: onDone),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _hourLabel(DateTime dateTime) {
    final hour = dateTime.hour == 0
        ? 12
        : dateTime.hour > 12
        ? dateTime.hour - 12
        : dateTime.hour;
    return '$hour:${dateTime.minute.toString().padLeft(2, '0')}';
  }

  String _minuteSuffix(DateTime dateTime) => dateTime.hour >= 12 ? 'PM' : 'AM';
}

class _RibbonRail extends StatelessWidget {
  const _RibbonRail({required this.height, required this.dotColor});

  final double height;
  final Color dotColor;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 16,
      height: height,
      child: CustomPaint(painter: _RailPainter(dotColor: dotColor)),
    );
  }
}

class _RailPainter extends CustomPainter {
  const _RailPainter({required this.dotColor});

  final Color dotColor;

  @override
  void paint(Canvas canvas, Size size) {
    final cx = size.width / 2;
    const dotY = 20.0;

    // Match the web rail by extending beyond the row bounds and only fading at the ends.
    final lineRect = Rect.fromLTWH(cx - 1, -30, 2, size.height + 52);
    final linePaint = Paint()
      ..shader = const LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [
          Colors.transparent,
          Color(0x26BE7716),
          Color(0x26BE7716),
          Colors.transparent,
        ],
        stops: [0.0, 0.35, 0.65, 1.0],
      ).createShader(lineRect);
    canvas.drawRRect(
      RRect.fromRectAndRadius(lineRect, const Radius.circular(999)),
      linePaint,
    );

    // White outer ring
    canvas.drawCircle(
      Offset(cx, dotY),
      6.0,
      Paint()..color = const Color(0xFFFCF9F4),
    );

    // Colored dot
    canvas.drawCircle(Offset(cx, dotY), 4.0, Paint()..color = dotColor);
  }

  @override
  bool shouldRepaint(_RailPainter oldDelegate) =>
      dotColor != oldDelegate.dotColor;
}

class _StatusPill extends StatelessWidget {
  const _StatusPill({
    required this.toat,
    required this.action,
    required this.onTap,
  });

  final ToatSummary toat;
  final _TimelineAction action;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final background = detailEnrichmentSoft(toat);
    final borderColor = Colors.white.withValues(alpha: 0.45);
    final foreground = detailEnrichmentAccent(toat);
    final label = action.label;

    final child = Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(action.icon, size: 11, color: foreground),
        const SizedBox(width: 3),
        Flexible(
          child: Text(
            label,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyles.tiny.copyWith(
              color: foreground,
              fontSize: 9,
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
      ],
    );

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(18),
        child: Container(
          constraints: const BoxConstraints(
            minWidth: 72,
            maxWidth: 94,
            minHeight: 30,
          ),
          padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 6),
          decoration: BoxDecoration(
            color: background,
            borderRadius: BorderRadius.circular(13),
            border: Border.all(color: borderColor),
          ),
          child: child,
        ),
      ),
    );
  }
}

class _DoneCircleButton extends StatelessWidget {
  const _DoneCircleButton({required this.done, required this.onTap});

  final bool done;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final background = done ? const Color(0xFFE8F6E8) : const Color(0xFFF0F3F7);
    final borderColor = done
        ? const Color(0xFFD2ECD4)
        : const Color(0xFFE3E8F0);
    final foreground = done ? const Color(0xFF2E9D45) : const Color(0xFF7A8594);

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: done ? null : onTap,
        borderRadius: BorderRadius.circular(999),
        child: Container(
          width: 32,
          height: 32,
          decoration: BoxDecoration(
            color: background,
            shape: BoxShape.circle,
            border: Border.all(color: borderColor),
          ),
          child: Icon(Icons.check_rounded, size: 18, color: foreground),
        ),
      ),
    );
  }
}

class _TimelineMessage extends StatelessWidget {
  const _TimelineMessage({required this.title, required this.subtitle});

  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [Color(0xFFFEFBF6), Color(0xFFF8F1E8)],
        ),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFE8DFD2)),
      ),
      child: Row(
        children: [
          const Icon(Icons.auto_awesome_rounded, color: Color(0xFFBE7716)),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyles.bodyMedium.copyWith(
                    color: const Color(0xFF171C27),
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  subtitle,
                  style: TextStyles.small.copyWith(
                    color: const Color(0xFF6A6159),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

List<Color> _toatColors(ToatSummary toat) => detailEnrichmentColors(toat);

String _supportingText(ToatSummary toat) {
  final comm = toat.communicationEnrichment;
  if (comm != null) {
    final phone = comm['phone'] as String?;
    if (phone != null && phone.isNotEmpty) return phone;
    final joinUrl = comm['joinUrl'] as String?;
    if (joinUrl != null && joinUrl.isNotEmpty) return _meetingPlatform(joinUrl);
  }
  final loc = toat.location;
  if (loc != null && loc.isNotEmpty) return loc;
  if (toat.people.isNotEmpty) return toat.people.first;
  return 'Personal';
}

String _meetingPlatform(String link) {
  final lowerLink = link.toLowerCase();
  if (lowerLink.contains('zoom')) return 'Zoom meeting';
  if (lowerLink.contains('meet.google')) return 'Google Meet';
  if (lowerLink.contains('teams')) return 'Teams meeting';
  return 'Meeting link';
}

_TimelineAction? _primaryAction(ToatSummary toat) {
  final comm = toat.communicationEnrichment;
  if (comm != null) {
    final joinUrl = comm['joinUrl'] as String?;
    if (joinUrl != null && joinUrl.isNotEmpty) {
      return _TimelineAction(
        label: 'Join',
        icon: Icons.videocam_rounded,
        uri: _externalUri(joinUrl),
        type: _TimelineActionType.meeting,
      );
    }
    final phone = comm['phone'] as String?;
    if (phone != null && phone.isNotEmpty) {
      return _TimelineAction(
        label: 'Call',
        icon: Icons.call_rounded,
        uri: Uri(scheme: 'tel', path: _normalizedPhone(phone)),
        type: _TimelineActionType.call,
      );
    }
  }
  final loc = toat.location;
  if (loc != null && loc.isNotEmpty) {
    return _TimelineAction(
      label: 'Directions',
      icon: Icons.drive_eta_rounded,
      uri: Uri.https('www.google.com', '/maps/search/', <String, String>{
        'api': '1',
        'query': loc,
      }),
      type: _TimelineActionType.directions,
    );
  }
  return null;
}

String _normalizedPhone(String phone) {
  final trimmed = phone.trim();
  final prefix = trimmed.startsWith('+') ? '+' : '';
  final digits = trimmed.replaceAll(RegExp(r'[^0-9]'), '');
  return '$prefix$digits';
}

Uri? _externalUri(String value) {
  final trimmed = value.trim();
  if (trimmed.isEmpty) {
    return null;
  }
  final withScheme = trimmed.startsWith(RegExp(r'https?://'))
      ? trimmed
      : 'https://$trimmed';
  return Uri.tryParse(withScheme);
}

class _TimelineAction {
  const _TimelineAction({
    required this.label,
    required this.icon,
    required this.uri,
    required this.type,
  });

  final String label;
  final IconData icon;
  final Uri? uri;
  final _TimelineActionType type;
}

enum _TimelineActionType { meeting, call, directions }
