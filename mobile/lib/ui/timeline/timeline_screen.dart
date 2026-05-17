import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:firebase_auth/firebase_auth.dart' show User;
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

import 'package:toatre/models/toat_summary.dart';
import 'package:toatre/providers/auth_provider.dart';
import 'package:toatre/providers/capture_provider.dart';
import 'package:toatre/providers/schedule_provider.dart';
import 'package:toatre/providers/toats_provider.dart';
import 'package:toatre/services/analytics_service.dart';
import 'package:toatre/ui/capture/capture_screen.dart';
import 'package:toatre/ui/search/search_screen.dart';
import 'package:toatre/ui/toat/share_toat_screen.dart';
import 'package:toatre/ui/toat/toat_detail_screen.dart';
import 'package:toatre/utils/app_colors.dart';
import 'package:toatre/utils/confetti.dart';
import 'package:toatre/utils/text_styles.dart';
import 'package:toatre/widgets/toatre_mark.dart';
import 'package:toatre/widgets/toat_detail/toat_detail_utils.dart'
    show detailEnrichmentKey, toatSmartIcon;

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
        if (!mounted || _hasManualRangeSelection || _selectedRange == preferredRange) {
          return;
        }
        setState(() {
          _selectedRange = preferredRange;
        });
      });
    }
    final rangeCounts = _rangeCounts(toats);
    final visibleToats = _filterToats(toats, _selectedRange);
    final grouped = _groupToats(visibleToats, _selectedRange);
    final clearAfterToday = _latestTimeForToday(visibleToats);
    final selectedCount = _selectedRange == _TimelineRange.day
        ? visibleToats.length
        : _filterToats(toats, _TimelineRange.day).length;
    final upNext = _upNextToat(visibleToats);

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
                padding: const EdgeInsets.fromLTRB(16, 10, 16, 128),
                children: [
                  Row(
                    children: [
                      const _AppBrand(),
                      const Spacer(),
                      _DatePillButton(
                        label: _selectedDatePillLabel(),
                        onTap: () => _openRangePicker(rangeCounts),
                      ),
                      const SizedBox(width: 12),
                      _ProfileButton(user: auth.user, onTap: _openSettings),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Align(
                    alignment: Alignment.centerRight,
                    child: _ToatCountPill(count: selectedCount),
                  ),
                  const SizedBox(height: 10),
                  _ClearHeroCard(clearAfter: clearAfterToday),
                  const SizedBox(height: 6),
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
                    if (upNext != null) ...[
                      const SizedBox(height: 8),
                      _UpNextCard(
                        toat: upNext,
                        onTap: () => _openToat(upNext),
                        onAction: () => _runPrimaryAction(upNext),
                        onDone: () => _markDone(upNext),
                        removing: _removingToatId == upNext.id,
                      ),
                      const SizedBox(height: 14),
                    ],
                    for (final entry in grouped.entries) ...[
                      if (entry.key.isNotEmpty) ...[
                        Padding(
                          padding: const EdgeInsets.only(left: 96, bottom: 8),
                          child: Row(
                            children: [
                              Text(
                                _groupIcon(entry.key),
                                style: const TextStyle(fontSize: 12),
                              ),
                              const SizedBox(width: 6),
                              Text(
                                entry.key,
                                style: TextStyles.small.copyWith(
                                  color: _groupColor(entry.key),
                                  fontWeight: FontWeight.w700,
                                  letterSpacing: 1.2,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                      ...entry.value.map(
                        (toat) => _TimelineRow(
                          toat: toat,
                          onTap: () => _openToat(toat),
                          onAction: () => _runPrimaryAction(toat),
                          onDone: () => _markDone(toat),
                          onShare: () => _shareToat(toat),
                          removing: _removingToatId == toat.id,
                        ),
                      ),
                      const SizedBox(height: 14),
                    ],
                    _TimelineMessage(
                      title: _selectedRange != _TimelineRange.someday
                          ? (clearAfterToday != null
                                ? 'You\'re all clear after $clearAfterToday'
                                : 'You\'re all clear today.')
                          : 'You\'re all clear.',
                      subtitle: _selectedRange != _TimelineRange.someday
                          ? (clearAfterToday != null
                                ? 'Nothing else on your schedule today.'
                                : 'Nothing on the schedule today.')
                          : 'Nothing else in someday.',
                    ),
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

  Future<void> _openScheduleSuggest() async {
    final scheduleProvider = context.read<ScheduleProvider>();
    scheduleProvider.reset();
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => ChangeNotifierProvider.value(
        value: scheduleProvider,
        child: const _ScheduleSuggestSheet(),
      ),
    );
  }

  Future<void> _openSearch() async {
    final changed = await Navigator.of(
      context,
    ).push<bool>(MaterialPageRoute<bool>(builder: (_) => const SearchScreen()));
    if (!mounted || changed != true) {
      return;
    }
    await context.read<ToatsProvider>().fetchToats();
  }


  Future<void> _shareToat(ToatSummary toat) async {
    await Navigator.of(context).push(
      MaterialPageRoute<void>(builder: (_) => ShareToatScreen(toat: toat)),
    );
  }

  Future<void> _openRangePicker(Map<_TimelineRange, int> counts) async {
    final selected = await showDialog<_TimelineRange>(
      context: context,
      barrierColor: Colors.transparent,
      builder: (context) {
        return _TimelineRangeDialog(
          selectedRange: _selectedRange,
          counts: counts,
        );
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

    try {
      await HapticFeedback.heavyImpact();
      final updated = await context.read<ToatsProvider>().updateToat(
        toat.id,
        <String, Object?>{'state': 'done'},
      );
      await AnalyticsService.logToatCompleted(kind: updated.tier);
      if (!mounted) return;
      // Start exit animation
      setState(() => _removingToatId = toat.id);
      // Fire confetti from the bottom after card fade-out
      Future<void>.delayed(const Duration(milliseconds: 600), () {
        if (mounted) showConfetti(context);
      });
      // Remove card locally after animation — no server refetch
      Future<void>.delayed(const Duration(milliseconds: 400), () {
        if (!mounted) return;
        setState(() => _removingToatId = null);
        context.read<ToatsProvider>().removeToatLocally(toat.id);
      });
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(error.toString())));
    }
  }

  Map<String, List<ToatSummary>> _groupToats(
    List<ToatSummary> toats,
    _TimelineRange range,
  ) {
    final groups = <String, List<ToatSummary>>{};

    if (range == _TimelineRange.day) {
      final sorted = List<ToatSummary>.from(toats)
        ..sort((a, b) {
          final aMs = a.datetime?.millisecondsSinceEpoch ?? 0;
          final bMs = b.datetime?.millisecondsSinceEpoch ?? 0;
          return aMs.compareTo(bMs);
        });
      for (final toat in sorted) {
        final label = _timeBucket(toat.datetime);
        groups.putIfAbsent(label, () => <ToatSummary>[]).add(toat);
      }
    } else {
      final sorted = List<ToatSummary>.from(toats)
        ..sort((a, b) {
          final aMs = a.datetime?.millisecondsSinceEpoch ?? 0;
          final bMs = b.datetime?.millisecondsSinceEpoch ?? 0;
          return aMs.compareTo(bMs);
        });
      for (final toat in sorted) {
        final label = range == _TimelineRange.next7
            ? _dateBucket(toat.datetime)
            : '';
        groups.putIfAbsent(label, () => <ToatSummary>[]).add(toat);
      }
    }

    return groups;
  }

  Map<_TimelineRange, int> _rangeCounts(List<ToatSummary> toats) {
    return <_TimelineRange, int>{
      for (final r in _TimelineRange.values)
        r: _filterToats(toats, r).length,
    };
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
      return range == _TimelineRange.someday;
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
      case _TimelineRange.someday:
        return diff >= 7;
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
      default:
        return null;
    }
  }

  _TimelineRange _rangeForToat(ToatSummary toat) {
    final dateTime = toat.datetime;
    if (dateTime == null) return _TimelineRange.someday;
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final toatDay = DateTime(dateTime.year, dateTime.month, dateTime.day);
    final diff = toatDay.difference(today).inDays;
    if (diff == 0) return _TimelineRange.day;
    if (diff < 7) return _TimelineRange.next7;
    return _TimelineRange.someday;
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
      case _TimelineRange.someday:
        return 'Someday';
      default:
        final offset = _rangeToOffset(range)!;
        final d = DateTime.now().add(Duration(days: offset));
        return _shortWeekday(d);
    }
  }

  String _shortWeekday(DateTime d) {
    const days = [
      'Monday', 'Tuesday', 'Wednesday', 'Thursday',
      'Friday', 'Saturday', 'Sunday',
    ];
    return days[d.weekday - 1];
  }

  String _rangeSubtitle(_TimelineRange range) {
    final now = DateTime.now();
    switch (range) {
      case _TimelineRange.day:
        return _formatDateLabel(now);
      case _TimelineRange.next7:
        final end = now.add(const Duration(days: 6));
        return '${_formatDateLabel(now)} – ${_formatDateLabel(end)}';
      case _TimelineRange.someday:
        return 'Whenever you get to it';
      default:
        final offset = _rangeToOffset(range)!;
        return _formatDateLabel(now.add(Duration(days: offset)));
    }
  }

  String _selectedDatePillLabel() {
    final offset = _rangeToOffset(_selectedRange);
    if (offset != null) {
      final d = DateTime.now().add(Duration(days: offset));
      const months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
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

  String _formatDateLabel(DateTime dateTime) {
    const weekdays = [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
    ];
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

    return '${weekdays[dateTime.weekday - 1]}, ${months[dateTime.month - 1]} ${dateTime.day}';
  }

  String _dateBucket(DateTime? dateTime) {
    if (dateTime == null) return 'No date';
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

  String _groupIcon(String label) {
    switch (label) {
      case 'MORNING':
        return '☼';
      case 'AFTERNOON':
        return '☀';
      case 'EVENING':
        return '☾';
      default:
        return '✦';
    }
  }

  Color _groupColor(String label) {
    switch (label) {
      case 'EVENING':
        return const Color(0xFF6A35FF);
      case 'MORNING':
      case 'AFTERNOON':
        return const Color(0xFFBE7716);
      default:
        return const Color(0xFFBE7716);
    }
  }

  String? _latestTimeForToday(List<ToatSummary> toats) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final dated = toats.where((toat) => toat.datetime != null).toList();
    final todayToats = dated.where((toat) {
      final date = toat.datetime!;
      final toatDay = DateTime(date.year, date.month, date.day);
      return toatDay == today;
    }).toList();
    if (todayToats.isEmpty) return null;
    todayToats.sort((a, b) => a.datetime!.compareTo(b.datetime!));
    return _formatTime(todayToats.last.datetime!);
  }

  ToatSummary? _upNextToat(List<ToatSummary> toats) {
    final now = DateTime.now();
    final upcoming = toats
        .where(
          (t) =>
              t.state == 'open' &&
              t.datetime != null &&
              t.datetime!.isAfter(now.subtract(const Duration(minutes: 1))),
        )
        .toList();
    if (upcoming.isEmpty) return null;
    upcoming.sort((a, b) => a.datetime!.compareTo(b.datetime!));
    return upcoming.first;
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
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: BoxDecoration(
        color: const Color(0xFFFCF9F4),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: const Color(0xFFE8DFD2)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x14000000),
            blurRadius: 18,
            offset: Offset(0, 6),
          ),
        ],
      ),
      child: Text(
        '✦ $count toats today',
        style: TextStyles.smallMedium.copyWith(
          color: const Color(0xFF37302A),
          fontWeight: FontWeight.w500,
        ),
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
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFE8DFD2)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x14000000),
            blurRadius: 24,
            offset: Offset(0, 10),
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
            // Sky image confined to the right side of the card
            Positioned(
              top: 0,
              right: 0,
              bottom: 0,
              child: Image.asset(
                'assets/images/skybg.png',
                width: 160,
                fit: BoxFit.cover,
                alignment: Alignment.center,
              ),
            ),
            // Gradient overlay: left-to-right, fades sky into card background
            Positioned.fill(
              child: DecoratedBox(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.centerLeft,
                    end: Alignment.centerRight,
                    colors: [
                      const Color(0xFFFEFBF6),
                      const Color(0xFFFEFBF6).withValues(alpha: 0.92),
                      const Color(0xFFFEFBF6).withValues(alpha: 0.30),
                      Colors.transparent,
                    ],
                    stops: const [0, 0.40, 0.68, 1],
                  ),
                ),
              ),
            ),
            // Card content
            Padding(
              padding: const EdgeInsets.fromLTRB(18, 16, 18, 16),
              child: Row(
                children: [
                  Container(
                    width: 68,
                    height: 68,
                    decoration: const BoxDecoration(
                      shape: BoxShape.circle,
                      color: Color(0xFFFFF8EC),
                    ),
                    child: Center(
                      child: Container(
                        width: 48,
                        height: 48,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: const Color(0xFFBE7716),
                            width: 3,
                          ),
                          color: const Color(0xFFFFFDF8),
                        ),
                        child: const Center(
                          child: Icon(
                            Icons.check_rounded,
                            size: 28,
                            color: Color(0xFFBE7716),
                          ),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text.rich(
                          TextSpan(
                            style: TextStyles.heading1.copyWith(
                              color: const Color(0xFF171C27),
                              fontSize: 24,
                              fontWeight: FontWeight.w700,
                              height: 1.05,
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
                        ),
                        const SizedBox(height: 8),
                        Text(
                          allClear
                              ? 'Your day looks open. Enjoy the quiet.'
                              : 'Your evening looks light after that. Enjoy!',
                          style: TextStyles.small.copyWith(
                            color: const Color(0xFF6A6159),
                            fontWeight: FontWeight.w500,
                            height: 1.35,
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

class _TopIconButton extends StatelessWidget {
  const _TopIconButton({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Tooltip(
      message: label,
      child: Semantics(
        label: label,
        button: true,
        child: GestureDetector(
          onTap: onTap,
          child: Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.18),
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: Colors.white.withValues(alpha: 0.22)),
            ),
            child: Icon(icon, color: Colors.white, size: 20),
          ),
        ),
      ),
    );
  }
}

enum _TimelineRange { day, next7, someday, day1, day2, day3, day4, day5 }

class _TimelineRangeDialog extends StatelessWidget {
  const _TimelineRangeDialog({
    required this.selectedRange,
    required this.counts,
  });

  final _TimelineRange selectedRange;
  final Map<_TimelineRange, int> counts;

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        Positioned(
          top: MediaQuery.paddingOf(context).top + 112,
          left: 34,
          right: 92,
          child: Material(
            color: Colors.transparent,
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.96),
                borderRadius: BorderRadius.circular(28),
                boxShadow: const [
                  BoxShadow(
                    color: Color(0x220F172A),
                    blurRadius: 34,
                    offset: Offset(0, 16),
                  ),
                ],
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  _TimelineRangeOption(
                    range: _TimelineRange.day,
                    title: 'Today',
                    subtitle: _dateLabel(DateTime.now()),
                    count: counts[_TimelineRange.day] ?? 0,
                    selected: selectedRange == _TimelineRange.day,
                  ),
                  ...List.generate(5, (i) {
                    final offset = i + 1;
                    final r = _TimelineRange.values.firstWhere(
                      (v) => v.name == 'day$offset',
                    );
                    final d = DateTime.now().add(Duration(days: offset));
                    return Padding(
                      padding: const EdgeInsets.only(top: 8),
                      child: _TimelineRangeOption(
                        range: r,
                        title: offset == 1 ? 'Tomorrow' : _weekdayName(d),
                        subtitle: _dateLabel(d),
                        count: counts[r] ?? 0,
                        selected: selectedRange == r,
                      ),
                    );
                  }),
                  const SizedBox(height: 8),
                  _TimelineRangeOption(
                    range: _TimelineRange.next7,
                    title: 'Next 7 days',
                    subtitle:
                        '${_dateLabel(DateTime.now())} – '
                        '${_dateLabel(DateTime.now().add(const Duration(days: 6)))}',
                    count: counts[_TimelineRange.next7] ?? 0,
                    selected: selectedRange == _TimelineRange.next7,
                  ),
                  const SizedBox(height: 8),
                  _TimelineRangeOption(
                    range: _TimelineRange.someday,
                    title: 'Someday',
                    subtitle: 'Whenever you get to it',
                    count: counts[_TimelineRange.someday] ?? 0,
                    selected: selectedRange == _TimelineRange.someday,
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  String _weekdayName(DateTime dateTime) {
    const weekdays = [
      'Monday', 'Tuesday', 'Wednesday', 'Thursday',
      'Friday', 'Saturday', 'Sunday',
    ];
    return weekdays[dateTime.weekday - 1];
  }

  String _dateLabel(DateTime dateTime) {
    const weekdays = [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
    ];
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

    return '${weekdays[dateTime.weekday - 1]}, ${months[dateTime.month - 1]} ${dateTime.day}';
  }
}

class _TimelineRangeOption extends StatelessWidget {
  const _TimelineRangeOption({
    required this.range,
    required this.title,
    required this.subtitle,
    required this.count,
    required this.selected,
  });

  final _TimelineRange range;
  final String title;
  final String subtitle;
  final int count;
  final bool selected;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () => Navigator.of(context).pop(range),
      borderRadius: BorderRadius.circular(22),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: selected ? const Color(0xFFF2E7DA) : Colors.transparent,
          borderRadius: BorderRadius.circular(22),
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: TextStyles.heading3),
                  const SizedBox(height: 8),
                  Text(
                    subtitle,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyles.body.copyWith(
                      color: const Color(0xFF6A6159),
                    ),
                  ),
                ],
              ),
            ),
            Container(
              width: 50,
              height: 50,
              decoration: const BoxDecoration(
                color: Color(0xFFFBF2E4),
                shape: BoxShape.circle,
              ),
              child: Center(
                child: Text(
                  '$count',
                  style: TextStyles.heading3.copyWith(
                    color: const Color(0xFFBE7716),
                  ),
                ),
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
        ClipRRect(
          borderRadius: BorderRadius.circular(12),
          child: Image.asset(
            'assets/images/icon.png',
            width: 34,
            height: 34,
            fit: BoxFit.cover,
          ),
        ),
        const SizedBox(width: 8),
        const ToatreMark(fontSize: 22),
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
    final photoUrl = user?.photoURL;
    final displayName = user?.displayName;
    final email = user?.email;
    final initials = _initials(displayName, email);

    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 44,
        height: 44,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(22),
          border: Border.all(color: const Color(0xFFEEE4D8)),
          color: const Color(0xFFFCF9F4),
          boxShadow: const [
            BoxShadow(
              color: Color(0x12000000),
              blurRadius: 18,
              offset: Offset(0, 8),
            ),
          ],
        ),
        clipBehavior: Clip.antiAlias,
        child: photoUrl == null || photoUrl.isEmpty
            ? DecoratedBox(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [Color(0xFF7C3AED), Color(0xFFEC4899)],
                  ),
                ),
                child: Center(
                  child: Text(
                    initials,
                    style: TextStyles.bodyMedium.copyWith(color: Colors.white),
                  ),
                ),
              )
            : Image.network(
                photoUrl,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => DecoratedBox(
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [Color(0xFF7C3AED), Color(0xFFEC4899)],
                    ),
                  ),
                  child: Center(
                    child: Text(
                      initials,
                      style: TextStyles.bodyMedium.copyWith(
                        color: Colors.white,
                      ),
                    ),
                  ),
                ),
              ),
      ),
    );
  }

  String _initials(String? displayName, String? email) {
    final name = displayName?.trim();
    if (name != null && name.isNotEmpty) {
      return name
          .split(RegExp(r'\s+'))
          .where((part) => part.isNotEmpty)
          .map((part) => part[0])
          .take(2)
          .join()
          .toUpperCase();
    }
    final firstEmailCharacter = email?.trim().isNotEmpty == true
        ? email!.trim()[0]
        : 'T';
    return firstEmailCharacter.toUpperCase();
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
        height: 42,
        padding: const EdgeInsets.symmetric(horizontal: 14),
        decoration: BoxDecoration(
          color: const Color(0xFFFCF9F4),
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: const Color(0xFFE8DFD2)),
          boxShadow: const [
            BoxShadow(
              color: Color(0x10000000),
              blurRadius: 16,
              offset: Offset(0, 6),
            ),
          ],
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(
              Icons.calendar_today_rounded,
              size: 16,
              color: Color(0xFF262B37),
            ),
            const SizedBox(width: 8),
            Text(
              label,
              style: TextStyles.smallMedium.copyWith(
                color: const Color(0xFF262B37),
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(width: 6),
            const Icon(
              Icons.keyboard_arrow_down_rounded,
              size: 18,
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

class _UpNextCard extends StatelessWidget {
  const _UpNextCard({
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

    return AnimatedOpacity(
      opacity: removing ? 0.0 : 1.0,
      duration: const Duration(milliseconds: 400),
      curve: Curves.easeOut,
      child: AnimatedSlide(
        offset: removing ? const Offset(0, -0.06) : Offset.zero,
        duration: const Duration(milliseconds: 400),
        curve: Curves.easeOut,
        child: GestureDetector(
          onTap: onTap,
          child: Container(
            padding: const EdgeInsets.fromLTRB(12, 12, 12, 12),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [Color(0xE8FFFFFF), Color(0xDAFFF7FF)],
              ),
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: const Color(0xB8F8D4FF)),
              boxShadow: const [
                BoxShadow(
                  color: Color(0x14000000),
                  blurRadius: 32,
                  offset: Offset(0, 10),
                ),
              ],
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(14),
                    gradient: LinearGradient(colors: _toatColors(toat)),
                  ),
                  child: Icon(_toatIcon(toat), color: Colors.white, size: 21),
                ),
                const SizedBox(width: 9),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 4,
                            ),
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.82),
                              borderRadius: BorderRadius.circular(18),
                              border: Border.all(
                                color: Colors.white.withValues(alpha: 0.20),
                              ),
                            ),
                            child: Text(
                              'UP NEXT',
                              style: TextStyles.tiny.copyWith(
                                color: const Color(0xFF6D28D9),
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),
                          const Spacer(),
                          if (toat.datetime != null)
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 8,
                                vertical: 4,
                              ),
                              decoration: BoxDecoration(
                                color: Colors.white.withValues(alpha: 0.88),
                                borderRadius: BorderRadius.circular(16),
                              ),
                              child: Text(
                                _formatCompactTime(toat.datetime!),
                                style: TextStyles.tiny.copyWith(
                                  color: AppColors.text,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ),
                        ],
                      ),
                      const SizedBox(height: 7),
                      Text(
                        toat.title,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyles.smallMedium.copyWith(
                          color: const Color(0xFF1F2937),
                          fontSize: 13,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        _supportingText(toat),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyles.tiny.copyWith(
                          color: const Color(0xFF6B7280),
                        ),
                      ),
                      if (toat.datetime != null) ...[
                        const SizedBox(height: 4),
                        Text(
                          _timeToGo(toat.datetime!),
                          style: TextStyles.tiny.copyWith(
                            color: _toatColors(toat).first,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
                const SizedBox(width: 10),
                Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    if (action != null) ...[
                      _ActionButton(
                        action: action,
                        filled: true,
                        onTap: onAction,
                      ),
                      const SizedBox(height: 6),
                    ],
                    _DoneButton(done: toat.state == 'done', onTap: onDone),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  String _timeToGo(DateTime dateTime) {
    final difference = dateTime.difference(DateTime.now());
    if (difference.inMinutes <= 0) return 'Happening now';
    return 'Leave in ${difference.inMinutes} min';
  }
}

class _TimelineRow extends StatelessWidget {
  const _TimelineRow({
    required this.toat,
    required this.onTap,
    required this.onAction,
    required this.onDone,
    required this.onShare,
    this.removing = false,
  });

  final ToatSummary toat;
  final VoidCallback onTap;
  final VoidCallback onAction;
  final VoidCallback onDone;
  final VoidCallback onShare;
  final bool removing;

  @override
  Widget build(BuildContext context) {
    final action = _primaryAction(toat);
    final isDone = toat.state == 'done';

    return AnimatedOpacity(
      opacity: removing ? 0.0 : 1.0,
      duration: const Duration(milliseconds: 400),
      curve: Curves.easeOut,
      child: AnimatedSlide(
        offset: removing ? const Offset(0, -0.06) : Offset.zero,
        duration: const Duration(milliseconds: 400),
        curve: Curves.easeOut,
        child: Padding(
          padding: const EdgeInsets.only(bottom: 10),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SizedBox(
                width: 44,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      toat.datetime == null ? '--' : _hourLabel(toat.datetime!),
                      style: TextStyles.smallMedium.copyWith(
                        color: const Color(0xFF1B202B),
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    Text(
                      toat.datetime == null
                          ? ''
                          : _minuteSuffix(toat.datetime!),
                      style: TextStyles.small.copyWith(
                        color: const Color(0xFF84786E),
                        fontSize: 8,
                      ),
                    ),
                  ],
                ),
              ),
              _RibbonRail(height: 74, dotColor: _toatColors(toat).first),
              const SizedBox(width: 6),
              Expanded(
                child: GestureDetector(
                  onTap: onTap,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 10,
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
                          width: 36,
                          height: 36,
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(12),
                            gradient: LinearGradient(colors: _toatColors(toat)),
                          ),
                          child: Icon(
                            _toatIcon(toat),
                            color: Colors.white,
                            size: 20,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                toat.title,
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                                style: TextStyles.smallMedium.copyWith(
                                  color: const Color(0xFF171C27),
                                  fontSize: 13,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                _supportingText(toat),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: TextStyles.tiny.copyWith(
                                  color: const Color(0xFF716960),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 8),
                        _StatusPill(
                          action: action,
                          done: isDone,
                          onTap: action != null ? onAction : onDone,
                        ),
                        const SizedBox(width: 4),
                        GestureDetector(
                          onTap: () => _showOverflow(context),
                          child: const SizedBox(
                            width: 28,
                            height: 28,
                            child: Icon(
                              Icons.more_horiz_rounded,
                              color: Color(0xFF9E9087),
                              size: 18,
                            ),
                          ),
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

  void _showOverflow(BuildContext context) {
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (_) => Container(
        decoration: const BoxDecoration(
          color: Color(0xFFFCF9F4),
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        ),
        padding: const EdgeInsets.fromLTRB(20, 12, 20, 28),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 40,
              height: 4,
              margin: const EdgeInsets.only(bottom: 20),
              decoration: BoxDecoration(
                color: const Color(0xFFCDC5BC),
                borderRadius: BorderRadius.circular(99),
              ),
            ),
            Text(
              toat.title,
              maxLines: 2,
              textAlign: TextAlign.center,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w700,
                color: Color(0xFF171C27),
              ),
            ),
            const SizedBox(height: 20),
            _OverflowRow(
              icon: Icons.share_outlined,
              label: 'Share',
              onTap: () {
                Navigator.of(context).pop();
                onShare();
              },
            ),
            _OverflowRow(
              icon: Icons.copy_outlined,
              label: 'Copy link',
              onTap: () {
                final link = 'https://toatre.com/t/${toat.id}';
                Clipboard.setData(ClipboardData(text: link));
                Navigator.of(context).pop();
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Link copied to clipboard.')),
                );
              },
            ),
            _OverflowRow(
              icon: Icons.link_rounded,
              label: 'Add link',
              onTap: () {
                Navigator.of(context).pop();
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Open the toat to add links.')),
                );
              },
            ),
            _OverflowRow(
              icon: Icons.attach_file_rounded,
              label: 'Add attachment',
              onTap: () {
                Navigator.of(context).pop();
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Open the toat to add attachments.'),
                  ),
                );
              },
            ),
          ],
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
      width: 20,
      height: height,
      child: CustomPaint(
        painter: _RailPainter(dotColor: dotColor),
      ),
    );
  }
}

class _RailPainter extends CustomPainter {
  const _RailPainter({required this.dotColor});

  final Color dotColor;

  @override
  void paint(Canvas canvas, Size size) {
    final cx = size.width / 2;
    const dotY = 22.0;

    // Vertical line with gradient fade
    final lineRect = Rect.fromLTWH(cx - 1, 0, 2, size.height);
    final linePaint = Paint()
      ..shader = const LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [
          Colors.transparent,
          Color(0x38BE7716),
          Color(0x38BE7716),
          Colors.transparent,
        ],
        stops: [0.0, 0.25, 0.75, 1.0],
      ).createShader(lineRect);
    canvas.drawRect(lineRect, linePaint);

    // White outer ring
    canvas.drawCircle(
      Offset(cx, dotY),
      7.0,
      Paint()..color = const Color(0xFFFCF9F4),
    );

    // Colored dot
    canvas.drawCircle(
      Offset(cx, dotY),
      5.0,
      Paint()..color = dotColor,
    );
  }

  @override
  bool shouldRepaint(_RailPainter oldDelegate) => dotColor != oldDelegate.dotColor;
}

// ──────────────────────────────────────────────────────────────────────────────
// Overflow row — used in toat card bottom sheet
// ──────────────────────────────────────────────────────────────────────────────

class _OverflowRow extends StatelessWidget {
  const _OverflowRow({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 12),
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(14),
                color: const Color(0xFFF0EAE0),
              ),
              child: Icon(icon, size: 20, color: const Color(0xFF5C4B36)),
            ),
            const SizedBox(width: 14),
            Text(
              label,
              style: const TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w600,
                color: Color(0xFF171C27),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _StatusPill extends StatelessWidget {
  const _StatusPill({
    required this.done,
    required this.action,
    required this.onTap,
  });

  final bool done;
  final _TimelineAction? action;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final colors = action == null ? null : _actionColors(action!.type);
    final background = done
        ? const Color(0xFFE8F6E8)
        : action == null
        ? const Color(0xFFF0F3F7)
        : colors!.first.withValues(alpha: 0.12);
    final borderColor = done
        ? const Color(0xFFD2ECD4)
        : action == null
        ? const Color(0xFFE3E8F0)
        : colors!.last.withValues(alpha: 0.16);
    final foreground = done
        ? const Color(0xFF2E9D45)
        : action == null
        ? const Color(0xFF677286)
        : colors!.last;
    final label = done ? 'Done' : action?.label ?? 'Done';

    final child = Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        if (done)
          const Text('✓', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700))
        else if (action != null)
          Icon(action!.icon, size: 13, color: foreground),
        const SizedBox(width: 4),
        Flexible(
          child: Text(
            label,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyles.tiny.copyWith(
              color: foreground,
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
      ],
    );

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: done ? null : onTap,
        borderRadius: BorderRadius.circular(18),
        child: Container(
          constraints: const BoxConstraints(minWidth: 72, maxWidth: 108),
          padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 8),
          decoration: BoxDecoration(
            color: background,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: borderColor),
          ),
          child: child,
        ),
      ),
    );
  }
}

/// Compact action chip rendered on the dark gradient of the Up-Next card.
class _ActionButton extends StatelessWidget {
  const _ActionButton({
    required this.action,
    required this.filled,
    required this.onTap,
  });

  final _TimelineAction action;
  final bool filled;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 6),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: filled ? 0.22 : 0.12),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.white.withValues(alpha: 0.28)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(action.icon, size: 12, color: Colors.white),
            const SizedBox(width: 4),
            Text(
              action.label,
              style: TextStyles.tiny.copyWith(
                color: Colors.white,
                fontWeight: FontWeight.w700,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Done / mark-done chip rendered on the dark gradient of the Up-Next card.
class _DoneButton extends StatelessWidget {
  const _DoneButton({required this.done, required this.onTap});

  final bool done;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: done ? null : onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 6),
        decoration: BoxDecoration(
          color: done
              ? Colors.white.withValues(alpha: 0.30)
              : Colors.white.withValues(alpha: 0.14),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.white.withValues(alpha: 0.28)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (done)
              const Text(
                '✓',
                style: TextStyle(
                  fontSize: 11,
                  color: Colors.white,
                  fontWeight: FontWeight.w800,
                ),
              )
            else
              const Icon(Icons.check_rounded, size: 12, color: Colors.white),
            const SizedBox(width: 4),
            Text(
              done ? 'Done' : 'Mark done',
              style: TextStyles.tiny.copyWith(
                color: Colors.white,
                fontWeight: FontWeight.w700,
              ),
            ),
          ],
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

List<Color> _toatColors(ToatSummary toat) =>
    _templateColors(detailEnrichmentKey(toat));

IconData _toatIcon(ToatSummary toat) =>
    toatSmartIcon(detailEnrichmentKey(toat), toat.title);

// Template-based color dispatch
List<Color> _templateColors(String template) {
  switch (template) {
    case 'meeting':
      return const [Color(0xFF3B82F6), Color(0xFF2563EB)];
    case 'call':
      return const [Color(0xFFF43F5E), Color(0xFFEC4899)];
    case 'appointment':
      return const [Color(0xFF7C3AED), Color(0xFF5B3DF5)];
    case 'event':
      return const [Color(0xFF7C3AED), Color(0xFF5B3DF5)];
    case 'deadline':
      return const [Color(0xFFEF4444), Color(0xFFDC2626)];
    case 'checklist':
      return const [Color(0xFF22C55E), Color(0xFF16A34A)];
    case 'errand':
      return const [Color(0xFFA855F7), Color(0xFF8B5CF6)];
    case 'follow_up':
      return const [Color(0xFF06B6D4), Color(0xFF0891B2)];
    case 'idea':
      return const [Color(0xFFFBBF24), Color(0xFFF59E0B)];
    default: // task
      return const [Color(0xFFF97316), Color(0xFFF59E0B)];
  }
}

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

String _formatCompactTime(DateTime dateTime) {
  final hour = dateTime.hour == 0
      ? 12
      : dateTime.hour > 12
      ? dateTime.hour - 12
      : dateTime.hour;
  final minute = dateTime.minute.toString().padLeft(2, '0');
  final suffix = dateTime.hour >= 12 ? 'PM' : 'AM';
  return '$hour:$minute $suffix';
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

List<Color> _actionColors(_TimelineActionType type) {
  switch (type) {
    case _TimelineActionType.meeting:
      return const [Color(0xFFE7F0FF), Color(0xFF3B82F6)];
    case _TimelineActionType.call:
      return const [Color(0xFFFDE8EE), Color(0xFFEC4899)];
    case _TimelineActionType.directions:
      return const [Color(0xFFFBF2E4), Color(0xFFBE7716)];
  }
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

// ─── Find a slot button ───────────────────────────────────────────────────────

class _FindSlotButton extends StatelessWidget {
  const _FindSlotButton({required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: const Color(0xFFFCF9F4),
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: const Color(0xFFE8DFD2)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(
              Icons.auto_awesome_rounded,
              size: 15,
              color: Color(0xFFBE7716),
            ),
            const SizedBox(width: 6),
            Text(
              'Find a slot',
              style: TextStyles.smallMedium.copyWith(
                color: const Color(0xFF37302A),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Schedule suggest bottom sheet ───────────────────────────────────────────

class _ScheduleSuggestSheet extends StatefulWidget {
  const _ScheduleSuggestSheet();

  @override
  State<_ScheduleSuggestSheet> createState() => _ScheduleSuggestSheetState();
}

class _ScheduleSuggestSheetState extends State<_ScheduleSuggestSheet> {
  final TextEditingController _controller = TextEditingController();
  final FocusNode _focus = FocusNode();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _focus.requestFocus());
  }

  @override
  void dispose() {
    _controller.dispose();
    _focus.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final query = _controller.text.trim();
    if (query.isEmpty) return;
    _focus.unfocus();
    await context.read<ScheduleProvider>().suggest(query);
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<ScheduleProvider>();
    final bottom = MediaQuery.viewInsetsOf(context).bottom;

    return Container(
      margin: const EdgeInsets.fromLTRB(12, 0, 12, 12),
      padding: EdgeInsets.fromLTRB(20, 20, 20, 20 + bottom),
      decoration: BoxDecoration(
        color: AppColors.bgElevated,
        borderRadius: BorderRadius.circular(28),
        boxShadow: const [
          BoxShadow(
            color: Color(0x22000000),
            blurRadius: 32,
            offset: Offset(0, -8),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Handle
          Center(
            child: Container(
              width: 36,
              height: 4,
              decoration: BoxDecoration(
                color: AppColors.border,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 16),
          Text('Find a free slot', style: TextStyles.heading2),
          const SizedBox(height: 4),
          Text(
            'Describe what you need — Toatre checks for clashes.',
            style: TextStyles.small.copyWith(color: AppColors.textSecondary),
          ),
          const SizedBox(height: 16),
          // Input row
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _controller,
                  focusNode: _focus,
                  style: TextStyles.bodyMedium,
                  textInputAction: TextInputAction.search,
                  onSubmitted: (_) => _submit(),
                  decoration: InputDecoration(
                    hintText: 'e.g. 1 hour Monday evening after 6',
                    hintStyle: TextStyles.bodyMedium.copyWith(
                      color: AppColors.textSecondary,
                    ),
                    filled: true,
                    fillColor: AppColors.bg,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(16),
                      borderSide: BorderSide.none,
                    ),
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 14,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              GestureDetector(
                onTap: provider.status == ScheduleSuggestStatus.loading
                    ? null
                    : _submit,
                child: Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: AppColors.primary,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: provider.status == ScheduleSuggestStatus.loading
                      ? const Center(
                          child: SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          ),
                        )
                      : const Icon(
                          Icons.arrow_forward_rounded,
                          color: Colors.white,
                          size: 22,
                        ),
                ),
              ),
            ],
          ),
          // Results
          if (provider.status == ScheduleSuggestStatus.error) ...[
            const SizedBox(height: 16),
            Text(
              provider.error ?? 'Something went wrong.',
              style: TextStyles.small.copyWith(color: AppColors.error),
            ),
          ] else if (provider.status == ScheduleSuggestStatus.success) ...[
            const SizedBox(height: 16),
            if (provider.slots.isEmpty)
              Text(
                'No free slots found in that window. '
                '${provider.busyCount > 0 ? 'You have ${provider.busyCount} clash${provider.busyCount == 1 ? '' : 'es'}.' : ''}',
                style: TextStyles.small.copyWith(
                  color: AppColors.textSecondary,
                ),
              )
            else ...[
              if (provider.busyCount > 0)
                Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: Text(
                    '${provider.busyCount} existing ${provider.busyCount == 1 ? 'toat' : 'toats'} checked — all slots below are clash-free.',
                    style: TextStyles.small.copyWith(
                      color: AppColors.textSecondary,
                    ),
                  ),
                ),
              ...provider.slots.map(
                (slot) => _SlotTile(
                  slot: slot,
                  durationMinutes: provider.durationMinutes,
                ),
              ),
            ],
          ],
        ],
      ),
    );
  }
}

class _SlotTile extends StatelessWidget {
  const _SlotTile({required this.slot, required this.durationMinutes});

  final SuggestedSlot slot;
  final int durationMinutes;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        color: AppColors.bg,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.10),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(
              Icons.schedule_rounded,
              size: 18,
              color: AppColors.primary,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(slot.label, style: TextStyles.bodyMedium),
                const SizedBox(height: 2),
                Text(
                  '$durationMinutes min · clash-free',
                  style: TextStyles.small.copyWith(
                    color: AppColors.textSecondary,
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
