import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart' show User;
import 'package:permission_handler/permission_handler.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

import 'package:toatre/models/toat_summary.dart';
import 'package:toatre/providers/auth_provider.dart';
import 'package:toatre/providers/capture_provider.dart';
import 'package:toatre/providers/toats_provider.dart';
import 'package:toatre/services/analytics_service.dart';
import 'package:toatre/ui/capture/capture_screen.dart';
import 'package:toatre/ui/inbox/inbox_screen.dart';
import 'package:toatre/ui/people/people_screen.dart';
import 'package:toatre/ui/search/search_screen.dart';
import 'package:toatre/ui/settings/settings_screen.dart';
import 'package:toatre/ui/toat/toat_detail_screen.dart';
import 'package:toatre/utils/app_colors.dart';
import 'package:toatre/utils/text_styles.dart';
import 'package:toatre/widgets/toatre_mark.dart';

class TimelineScreen extends StatefulWidget {
  const TimelineScreen({super.key});

  @override
  State<TimelineScreen> createState() => _TimelineScreenState();
}

class _TimelineScreenState extends State<TimelineScreen> {
  _TimelineRange _selectedRange = _TimelineRange.today;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      await context.read<ToatsProvider>().fetchToats();
      await AnalyticsService.logTimelineViewed();
    });
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final toatsProvider = context.watch<ToatsProvider>();
    final toats = toatsProvider.toats;
    final rangeCounts = _rangeCounts(toats);
    final visibleToats = _filterToats(toats, _selectedRange);
    final grouped = _groupToats(visibleToats);
    final upNext = _findUpNext(visibleToats);

    return Scaffold(
      backgroundColor: AppColors.bg,
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xFFFBFAFF), Color(0xFFF7F5FF), Color(0xFFFBFAFF)],
            stops: [0, 0.52, 1],
          ),
        ),
        child: Stack(
          children: [
            const _BackgroundHalo(
              alignment: Alignment(-1.25, -0.85),
              color: Color(0x33F9A8D4),
              size: 260,
            ),
            const _BackgroundHalo(
              alignment: Alignment(1.25, -0.2),
              color: Color(0x38BFDBFE),
              size: 300,
            ),
            SafeArea(
              child: RefreshIndicator(
                onRefresh: context.read<ToatsProvider>().fetchToats,
                child: ListView(
                  padding: const EdgeInsets.fromLTRB(18, 14, 18, 128),
                  children: [
                    Row(
                      children: [
                        const _AppBrand(),
                        const Spacer(),
                        _ProfileButton(user: auth.user, onTap: _openSettings),
                      ],
                    ),
                    const SizedBox(height: 20),
                    Row(
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            InkWell(
                              onTap: () => _openRangePicker(rangeCounts),
                              borderRadius: BorderRadius.circular(16),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Text(
                                    _rangeTitle(_selectedRange),
                                    style: TextStyles.display.copyWith(
                                      fontSize: 34,
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  const Icon(
                                    Icons.keyboard_arrow_down_rounded,
                                    color: AppColors.primary,
                                    size: 30,
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              _rangeSubtitle(_selectedRange),
                              style: TextStyles.heading3.copyWith(
                                color: AppColors.textSecondary,
                              ),
                            ),
                          ],
                        ),
                        const Spacer(),
                        _HeaderIcon(
                          icon: Icons.calendar_today_outlined,
                          onTap: () => _openCalendarPicker(grouped),
                        ),
                        const SizedBox(width: 12),
                        _HeaderIcon(
                          icon: Icons.tune_rounded,
                          onTap: _openSearch,
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),
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
                        _UpNextCard(
                          toat: upNext,
                          onTap: () => _openToat(upNext),
                          onAction: () => _runPrimaryAction(upNext),
                          onDone: () => _markDone(upNext),
                        ),
                        const SizedBox(height: 18),
                      ],
                      for (final entry in grouped.entries) ...[
                        Padding(
                          padding: const EdgeInsets.only(left: 50, bottom: 10),
                          child: Text(
                            entry.key,
                            style: TextStyles.bodyMedium.copyWith(
                              color: AppColors.textSecondary,
                            ),
                          ),
                        ),
                        ...entry.value.map(
                          (toat) => _TimelineRow(
                            toat: toat,
                            onTap: () => _openToat(toat),
                            onAction: () => _runPrimaryAction(toat),
                            onDone: () => _markDone(toat),
                          ),
                        ),
                        const SizedBox(height: 14),
                      ],
                      _TimelineMessage(
                        title:
                            'You\'re all clear after ${_latestTime(visibleToats)}',
                        subtitle: _selectedRange == _TimelineRange.today
                            ? 'Enjoy your evening.'
                            : 'Nothing else in this range.',
                      ),
                    ],
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
      floatingActionButton: _CaptureDock(
        onTextTap: _openTextCapture,
        onVoiceTap: _openVoiceCapture,
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.endFloat,
      bottomNavigationBar: Container(
        margin: const EdgeInsets.fromLTRB(20, 0, 20, 18),
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
        decoration: BoxDecoration(
          color: AppColors.bgElevated,
          borderRadius: BorderRadius.circular(28),
          boxShadow: const [
            BoxShadow(
              color: Color(0x22000000),
              blurRadius: 24,
              offset: Offset(0, 8),
            ),
          ],
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const _BottomItem(
              icon: Icons.today_outlined,
              label: 'Timeline',
              active: true,
            ),
            _BottomItem(
              icon: Icons.search_rounded,
              label: 'Search',
              onTap: _openSearch,
            ),
            _BottomItem(
              icon: Icons.people_outline_rounded,
              label: 'People',
              onTap: _openPeople,
            ),
            _BottomItem(
              icon: Icons.inbox_outlined,
              label: 'Inbox',
              onTap: _openInbox,
            ),
            _BottomItem(
              icon: Icons.settings_outlined,
              label: 'Settings',
              onTap: _openSettings,
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _openVoiceCapture() async {
    final permission = await Permission.microphone.request();
    if (!mounted) {
      return;
    }

    if (!permission.isGranted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Microphone permission is required.')),
      );
      return;
    }

    final capture = context.read<CaptureProvider>();
    capture.reset();
    capture.setMode(CaptureInputMode.voice);
    await Navigator.of(
      context,
    ).push(MaterialPageRoute<void>(builder: (_) => const CaptureScreen()));
    if (!mounted) {
      return;
    }
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
    await Navigator.of(
      context,
    ).push(MaterialPageRoute<void>(builder: (_) => const SettingsScreen()));
    if (!mounted) {
      return;
    }
    await context.read<ToatsProvider>().fetchToats();
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

  Future<void> _openPeople() async {
    final changed = await Navigator.of(
      context,
    ).push<bool>(MaterialPageRoute<bool>(builder: (_) => const PeopleScreen()));
    if (!mounted || changed != true) {
      return;
    }
    await context.read<ToatsProvider>().fetchToats();
  }

  Future<void> _openInbox() async {
    await Navigator.of(
      context,
    ).push(MaterialPageRoute<void>(builder: (_) => const InboxScreen()));
  }

  Future<void> _openCalendarPicker(
    Map<String, List<ToatSummary>> grouped,
  ) async {
    if (grouped.isEmpty) {
      return;
    }

    await showModalBottomSheet<void>(
      context: context,
      backgroundColor: AppColors.bgElevated,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      builder: (context) {
        return SafeArea(
          child: ListView(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 28),
            shrinkWrap: true,
            children: [
              Center(
                child: Container(
                  width: 46,
                  height: 5,
                  decoration: BoxDecoration(
                    color: AppColors.textMuted.withValues(alpha: 0.35),
                    borderRadius: BorderRadius.circular(99),
                  ),
                ),
              ),
              const SizedBox(height: 20),
              Text('Calendar', style: TextStyles.heading1),
              const SizedBox(height: 14),
              ...grouped.entries.map(
                (entry) => Container(
                  margin: const EdgeInsets.only(bottom: 10),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppColors.bg,
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: Text(entry.key, style: TextStyles.bodyMedium),
                      ),
                      Text(
                        '${entry.value.length}',
                        style: TextStyles.smallMedium.copyWith(
                          color: AppColors.primaryLight,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        );
      },
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
      _selectedRange = selected;
    });
  }

  Future<void> _openToat(ToatSummary toat) async {
    final changed = await Navigator.of(context).push<bool>(
      MaterialPageRoute<bool>(
        builder: (_) => ToatDetailScreen(initialToat: toat),
      ),
    );
    if (!mounted || changed != true) {
      return;
    }
    await context.read<ToatsProvider>().fetchToats();
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
    if (toat.status == 'done') {
      return;
    }

    try {
      final updated = await context.read<ToatsProvider>().updateToat(
        toat.id,
        <String, Object?>{'status': 'done'},
      );
      await AnalyticsService.logToatCompleted(kind: updated.kind);
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Marked done.')));
    } catch (error) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(error.toString())));
    }
  }

  Map<String, List<ToatSummary>> _groupToats(List<ToatSummary> toats) {
    final groups = <String, List<ToatSummary>>{};

    for (final toat in toats) {
      final label = _timeBucket(toat.datetime);
      groups.putIfAbsent(label, () => <ToatSummary>[]).add(toat);
    }

    return groups;
  }

  Map<_TimelineRange, int> _rangeCounts(List<ToatSummary> toats) {
    return <_TimelineRange, int>{
      _TimelineRange.today: _filterToats(toats, _TimelineRange.today).length,
      _TimelineRange.tomorrow: _filterToats(
        toats,
        _TimelineRange.tomorrow,
      ).length,
      _TimelineRange.someday: _filterToats(
        toats,
        _TimelineRange.someday,
      ).length,
    };
  }

  List<ToatSummary> _filterToats(
    List<ToatSummary> toats,
    _TimelineRange range,
  ) {
    return toats.where((toat) => _rangeForToat(toat) == range).toList();
  }

  _TimelineRange _rangeForToat(ToatSummary toat) {
    final dateTime = toat.datetime;
    if (dateTime == null) {
      return _TimelineRange.someday;
    }

    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final toatDay = DateTime(dateTime.year, dateTime.month, dateTime.day);
    final tomorrow = today.add(const Duration(days: 1));

    if (toatDay == today) {
      return _TimelineRange.today;
    }
    if (toatDay == tomorrow) {
      return _TimelineRange.tomorrow;
    }
    return _TimelineRange.someday;
  }

  String _rangeTitle(_TimelineRange range) {
    switch (range) {
      case _TimelineRange.today:
        return 'Today';
      case _TimelineRange.tomorrow:
        return 'Tomorrow';
      case _TimelineRange.someday:
        return 'Someday';
    }
  }

  String _rangeSubtitle(_TimelineRange range) {
    final now = DateTime.now();
    switch (range) {
      case _TimelineRange.today:
        return _formatDateLabel(now);
      case _TimelineRange.tomorrow:
        return _formatDateLabel(now.add(const Duration(days: 1)));
      case _TimelineRange.someday:
        return 'Whenever you get to it';
    }
  }

  ToatSummary? _findUpNext(List<ToatSummary> toats) {
    final now = DateTime.now();
    final futureToats =
        toats.where((toat) {
            final date = toat.datetime;
            return date != null && date.isAfter(now);
          }).toList()
          ..sort((a, b) => (a.datetime ?? now).compareTo(b.datetime ?? now));

    if (futureToats.isNotEmpty) {
      return futureToats.first;
    }

    return toats.isEmpty ? null : toats.first;
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

  String _timeBucket(DateTime? dateTime) {
    if (dateTime == null) return 'Later';
    if (dateTime.hour < 12) return 'Morning';
    if (dateTime.hour < 17) return 'Afternoon';
    return 'Evening';
  }

  String _latestTime(List<ToatSummary> toats) {
    final dated = toats.where((toat) => toat.datetime != null).toList();
    if (dated.isEmpty) return 'today';
    dated.sort((a, b) => a.datetime!.compareTo(b.datetime!));
    return _formatTime(dated.last.datetime!);
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

class _BackgroundHalo extends StatelessWidget {
  const _BackgroundHalo({
    required this.alignment,
    required this.color,
    required this.size,
  });

  final Alignment alignment;
  final Color color;
  final double size;

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: alignment,
      child: IgnorePointer(
        child: Container(
          width: size,
          height: size,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            boxShadow: [BoxShadow(color: color, blurRadius: size / 2)],
          ),
        ),
      ),
    );
  }
}

enum _TimelineRange { today, tomorrow, someday }

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
                    range: _TimelineRange.today,
                    title: 'Today',
                    subtitle: _dateLabel(DateTime.now()),
                    count: counts[_TimelineRange.today] ?? 0,
                    selected: selectedRange == _TimelineRange.today,
                  ),
                  const SizedBox(height: 8),
                  _TimelineRangeOption(
                    range: _TimelineRange.tomorrow,
                    title: 'Tomorrow',
                    subtitle: _dateLabel(
                      DateTime.now().add(const Duration(days: 1)),
                    ),
                    count: counts[_TimelineRange.tomorrow] ?? 0,
                    selected: selectedRange == _TimelineRange.tomorrow,
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
          color: selected ? const Color(0xFFEDE9FE) : Colors.transparent,
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
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
            Container(
              width: 50,
              height: 50,
              decoration: const BoxDecoration(
                color: Color(0xFFE8E1FF),
                shape: BoxShape.circle,
              ),
              child: Center(
                child: Text(
                  '$count',
                  style: TextStyles.heading3.copyWith(color: AppColors.primary),
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
          borderRadius: BorderRadius.circular(14),
          child: Image.asset(
            'assets/images/icon.png',
            width: 36,
            height: 36,
            fit: BoxFit.cover,
          ),
        ),
        const SizedBox(width: 8),
        const ToatreMark(fontSize: 24),
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
        width: 48,
        height: 48,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: AppColors.border),
          color: AppColors.bgElevated,
          boxShadow: const [
            BoxShadow(
              color: Color(0x1F1F2937),
              blurRadius: 34,
              offset: Offset(0, 14),
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

class _EmptyState extends StatelessWidget {
  const _EmptyState({required this.onCapture, required this.onTextCapture});

  final VoidCallback onCapture;
  final VoidCallback onTextCapture;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        color: AppColors.bgElevated,
        borderRadius: BorderRadius.circular(28),
        boxShadow: const [
          BoxShadow(
            color: Color(0x22000000),
            blurRadius: 26,
            offset: Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: const Color(0x1A8B5CF6),
              borderRadius: BorderRadius.circular(20),
            ),
            child: const Icon(
              Icons.auto_awesome_rounded,
              color: AppColors.primaryLight,
            ),
          ),
          const SizedBox(height: 16),
          Text('You\'re all clear.', style: TextStyles.heading1),
          const SizedBox(height: 10),
          Text(
            'Tap the mic and say what needs to happen next. Toatre will turn it into toats and drop them into your timeline.',
            style: TextStyles.body.copyWith(
              color: AppColors.textSecondary,
              height: 1.5,
            ),
          ),
          const SizedBox(height: 18),
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: [
              GestureDetector(
                onTap: onCapture,
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 18,
                    vertical: 14,
                  ),
                  decoration: BoxDecoration(
                    gradient: AppColors.brandGradient,
                    borderRadius: BorderRadius.circular(18),
                  ),
                  child: Text(
                    'Start capture',
                    style: TextStyles.bodyMedium.copyWith(color: Colors.white),
                  ),
                ),
              ),
              GestureDetector(
                onTap: onTextCapture,
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 18,
                    vertical: 14,
                  ),
                  decoration: BoxDecoration(
                    color: const Color(0x121C2540),
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: Text('Type capture', style: TextStyles.bodyMedium),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _MicFab extends StatelessWidget {
  const _MicFab({required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 72,
        height: 72,
        decoration: const BoxDecoration(
          shape: BoxShape.circle,
          boxShadow: [
            BoxShadow(
              color: Color(0x477C3AED),
              blurRadius: 34,
              offset: Offset(0, 18),
            ),
          ],
        ),
        child: Semantics(
          label: 'Capture a toat',
          button: true,
          child: Image.asset(
            'assets/images/micicon.png',
            width: 72,
            height: 72,
            fit: BoxFit.cover,
          ),
        ),
      ),
    );
  }
}

class _CaptureDock extends StatelessWidget {
  const _CaptureDock({required this.onTextTap, required this.onVoiceTap});

  final VoidCallback onTextTap;
  final VoidCallback onVoiceTap;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(10, 8, 8, 8),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.88),
        borderRadius: BorderRadius.circular(44),
        border: Border.all(color: const Color(0x33FFFFFF)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x220F172A),
            blurRadius: 28,
            offset: Offset(0, 12),
          ),
        ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Tooltip(
            message: 'Type capture',
            child: InkWell(
              onTap: onTextTap,
              borderRadius: BorderRadius.circular(30),
              child: Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: Colors.white,
                  shape: BoxShape.circle,
                  boxShadow: const [
                    BoxShadow(
                      color: Color(0x140F172A),
                      blurRadius: 18,
                      offset: Offset(0, 8),
                    ),
                  ],
                ),
                child: const Icon(
                  Icons.keyboard_alt_outlined,
                  color: AppColors.primary,
                ),
              ),
            ),
          ),
          const SizedBox(width: 8),
          _MicFab(onTap: onVoiceTap),
        ],
      ),
    );
  }
}

class _HeaderIcon extends StatelessWidget {
  const _HeaderIcon({required this.icon, this.onTap});

  final IconData icon;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(18),
      child: Container(
        width: 52,
        height: 52,
        decoration: BoxDecoration(
          color: AppColors.bgElevated,
          borderRadius: BorderRadius.circular(18),
        ),
        child: Icon(icon, color: AppColors.primary),
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
  });

  final ToatSummary toat;
  final VoidCallback onTap;
  final VoidCallback onAction;
  final VoidCallback onDone;

  @override
  Widget build(BuildContext context) {
    final action = _primaryAction(toat);

    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.fromLTRB(14, 14, 14, 14),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              _kindColors(toat.kind).first.withValues(alpha: 0.10),
              _kindColors(toat.kind).last.withValues(alpha: 0.06),
            ],
          ),
          borderRadius: BorderRadius.circular(22),
          border: Border.all(
            color: _kindColors(toat.kind).last.withValues(alpha: 0.18),
          ),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Container(
              width: 52,
              height: 52,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(16),
                gradient: LinearGradient(colors: _kindColors(toat.kind)),
              ),
              child: Icon(_kindIcon(toat.kind), color: Colors.white, size: 25),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 5,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.82),
                          borderRadius: BorderRadius.circular(18),
                          border: Border.all(color: AppColors.softPurple),
                        ),
                        child: Text(
                          'UP NEXT',
                          style: TextStyles.tiny.copyWith(
                            color: AppColors.primary,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                      const Spacer(),
                      if (toat.datetime != null)
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 5,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.88),
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: Text(
                            _formatCompactTime(toat.datetime!),
                            style: TextStyles.smallMedium.copyWith(
                              color: AppColors.text,
                            ),
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 9),
                  Text(
                    toat.title,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyles.bodyMedium.copyWith(
                      fontSize: 15,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 5),
                  Text(
                    _supportingText(toat),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyles.smallMedium,
                  ),
                  if (toat.datetime != null) ...[
                    const SizedBox(height: 4),
                    Text(
                      _timeToGo(toat.datetime!),
                      style: TextStyles.smallMedium.copyWith(
                        color: _kindColors(toat.kind).last,
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
                  _ActionButton(action: action, filled: true, onTap: onAction),
                  const SizedBox(height: 8),
                ],
                _DoneButton(done: toat.status == 'done', onTap: onDone),
              ],
            ),
          ],
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
  });

  final ToatSummary toat;
  final VoidCallback onTap;
  final VoidCallback onAction;
  final VoidCallback onDone;

  @override
  Widget build(BuildContext context) {
    final action = _primaryAction(toat);

    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 48,
            child: Column(
              children: [
                Text(
                  toat.datetime == null ? '--' : _hourLabel(toat.datetime!),
                  style: TextStyles.bodyMedium.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
                ),
                Text(
                  toat.datetime == null ? '' : _minuteSuffix(toat.datetime!),
                  style: TextStyles.small,
                ),
              ],
            ),
          ),
          Container(
            width: 2,
            margin: const EdgeInsets.only(top: 6),
            color: const Color(0x22374151),
            height: 74,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: GestureDetector(
              onTap: onTap,
              child: Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: AppColors.bgElevated,
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: const [
                    BoxShadow(
                      color: Color(0x12000000),
                      blurRadius: 18,
                      offset: Offset(0, 8),
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(14),
                        gradient: LinearGradient(
                          colors: _kindColors(toat.kind),
                        ),
                      ),
                      child: Icon(
                        _kindIcon(toat.kind),
                        color: Colors.white,
                        size: 23,
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            toat.title,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyles.bodyMedium.copyWith(
                              fontSize: 14,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            _supportingText(toat),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyles.smallMedium,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 8),
                    if (action != null) ...[
                      _ActionButton(action: action, onTap: onAction),
                      const SizedBox(width: 5),
                    ],
                    _DoneButton(done: toat.status == 'done', onTap: onDone),
                    const SizedBox(width: 4),
                    const Icon(
                      Icons.chevron_right_rounded,
                      color: AppColors.textMuted,
                      size: 20,
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
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

class _DoneButton extends StatelessWidget {
  const _DoneButton({required this.done, required this.onTap});

  final bool done;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: done ? null : onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 8),
          decoration: BoxDecoration(
            color: const Color(0xFFEFF1F5),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFE4E7EC)),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                done ? Icons.check_circle_rounded : Icons.check_circle_outline,
                size: 15,
                color: AppColors.textMuted,
              ),
              const SizedBox(width: 4),
              Text(
                'Done',
                style: TextStyles.smallMedium.copyWith(
                  color: AppColors.textSecondary,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ActionButton extends StatelessWidget {
  const _ActionButton({
    required this.action,
    required this.onTap,
    this.filled = false,
  });

  final _TimelineAction action;
  final VoidCallback onTap;
  final bool filled;

  @override
  Widget build(BuildContext context) {
    final colors = _actionColors(action.type);
    final child = Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(action.icon, size: 15, color: filled ? Colors.white : colors.last),
        const SizedBox(width: 5),
        Flexible(
          child: Text(
            action.label,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyles.smallMedium.copyWith(
              color: filled ? Colors.white : colors.last,
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
          constraints: BoxConstraints(maxWidth: filled ? 124 : 82),
          padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 8),
          decoration: BoxDecoration(
            gradient: filled ? LinearGradient(colors: colors) : null,
            color: filled ? null : colors.first.withValues(alpha: 0.11),
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: colors.last.withValues(alpha: 0.14)),
          ),
          child: child,
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
        color: AppColors.bgElevated,
        borderRadius: BorderRadius.circular(24),
      ),
      child: Row(
        children: [
          const Icon(Icons.auto_awesome_rounded, color: AppColors.primary),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: TextStyles.bodyMedium),
                const SizedBox(height: 4),
                Text(subtitle, style: TextStyles.small),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _BottomItem extends StatelessWidget {
  const _BottomItem({
    required this.icon,
    required this.label,
    this.active = false,
    this.onTap,
  });

  final IconData icon;
  final String label;
  final bool active;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final color = active ? AppColors.primary : AppColors.textMuted;
    return GestureDetector(
      onTap: onTap,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: color),
          const SizedBox(height: 6),
          Text(label, style: TextStyles.tiny.copyWith(color: color)),
        ],
      ),
    );
  }
}

List<Color> _kindColors(String kind) {
  switch (kind) {
    case 'meeting':
      return const [Color(0xFF3B82F6), Color(0xFF2563EB)];
    case 'errand':
      return const [Color(0xFFA855F7), Color(0xFF8B5CF6)];
    case 'idea':
      return const [Color(0xFFFBBF24), Color(0xFFF59E0B)];
    case 'deadline':
      return const [Color(0xFFFB7185), Color(0xFFEC4899)];
    default:
      return const [Color(0xFFF97316), Color(0xFFF59E0B)];
  }
}

IconData _kindIcon(String kind) {
  switch (kind) {
    case 'meeting':
      return Icons.videocam_rounded;
    case 'errand':
      return Icons.shopping_cart_outlined;
    case 'idea':
      return Icons.lightbulb_outline_rounded;
    case 'deadline':
      return Icons.call_rounded;
    default:
      return Icons.mail_outline_rounded;
  }
}

String _supportingText(ToatSummary toat) {
  final phone = _extractPhone(toat);
  if (phone != null) {
    return phone;
  }
  if (toat.link != null && toat.link!.isNotEmpty && toat.kind == 'meeting') {
    return _meetingPlatform(toat.link!);
  }
  if (toat.location != null && toat.location!.isNotEmpty) {
    return toat.location!;
  }
  if (toat.people.isNotEmpty) {
    return toat.people.first;
  }
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

String? _extractPhone(ToatSummary toat) {
  final haystack = <String?>[
    toat.title,
    toat.notes,
    toat.location,
    toat.link,
    ...toat.people,
  ].whereType<String>().join(' ');
  final match = RegExp(r'(\+?\d[\d\s().-]{7,}\d)').firstMatch(haystack);
  return match?.group(1);
}

_TimelineAction? _primaryAction(ToatSummary toat) {
  final phone = _extractPhone(toat);
  if (phone != null) {
    return _TimelineAction(
      label: 'Call',
      icon: Icons.call_rounded,
      uri: Uri(scheme: 'tel', path: _normalizedPhone(phone)),
      type: _TimelineActionType.call,
    );
  }

  if (toat.kind == 'meeting' && toat.link != null && toat.link!.isNotEmpty) {
    return _TimelineAction(
      label: 'Join',
      icon: Icons.videocam_rounded,
      uri: _externalUri(toat.link!),
      type: _TimelineActionType.meeting,
    );
  }

  if ((toat.kind == 'errand' || toat.location != null) &&
      toat.location != null &&
      toat.location!.isNotEmpty) {
    return _TimelineAction(
      label: 'Directions',
      icon: Icons.navigation_rounded,
      uri: Uri.https('www.google.com', '/maps/search/', <String, String>{
        'api': '1',
        'query': toat.location!,
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
      return const [Color(0xFF3B82F6), Color(0xFF2563EB)];
    case _TimelineActionType.call:
      return const [Color(0xFFFB7185), Color(0xFFEC4899)];
    case _TimelineActionType.directions:
      return const [Color(0xFF7C3AED), Color(0xFF6D28D9)];
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
