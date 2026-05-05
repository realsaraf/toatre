import 'dart:math' as math;

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
  String? _removingToatId;

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
                                    style: TextStyles.heading1.copyWith(
                                      fontSize: 29,
                                      fontWeight: FontWeight.w800,
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  const Icon(
                                    Icons.keyboard_arrow_down_rounded,
                                    color: AppColors.primary,
                                    size: 22,
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              _rangeSubtitle(_selectedRange),
                              style: TextStyles.smallMedium.copyWith(
                                color: AppColors.textSecondary,
                              ),
                            ),
                          ],
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
                          removing: _removingToatId == upNext.id,
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
                            removing: _removingToatId == toat.id,
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
    if (toat.state == 'done') {
      return;
    }

    try {
      final updated = await context.read<ToatsProvider>().updateToat(
        toat.id,
        <String, Object?>{'state': 'done'},
      );
      await AnalyticsService.logToatCompleted(kind: updated.tier);
      if (!mounted) {
        return;
      }
      // Start exit animation
      setState(() => _removingToatId = toat.id);
      // Delay confetti by 800ms
      Future<void>.delayed(const Duration(milliseconds: 800), () {
        if (mounted) {
          _showConfetti(context);
        }
      });
      // Refresh list after animation completes (400ms)
      Future<void>.delayed(const Duration(milliseconds: 400), () {
        if (!mounted) {
          return;
        }
        setState(() => _removingToatId = null);
        context.read<ToatsProvider>().fetchToats();
      });
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
    return Padding(
      padding: const EdgeInsets.only(top: 32),
      child: Column(
        children: [
          // Icon glow blob
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
                color: AppColors.textSecondary,
                height: 1.55,
              ),
              textAlign: TextAlign.center,
            ),
          ),
          const SizedBox(height: 32),
          // CTA row
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
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: AppColors.softBorder),
                    boxShadow: const [
                      BoxShadow(
                        color: Color(0x12000000),
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
                        color: AppColors.textSecondary,
                        size: 18,
                      ),
                      const SizedBox(width: 8),
                      Text('Type', style: TextStyles.bodyMedium),
                    ],
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 40),
          // Hint chips
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
        border: Border.all(color: const Color(0x1A4F46E5)),
      ),
      child: Text(
        text,
        style: TextStyles.small.copyWith(
          color: AppColors.primary,
          fontStyle: FontStyle.italic,
        ),
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
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  _toatColors(toat).first.withValues(alpha: 0.10),
                  _toatColors(toat).last.withValues(alpha: 0.06),
                ],
              ),
              borderRadius: BorderRadius.circular(18),
              border: Border.all(
                color: _toatColors(
                  toat,
                ).last.withValues(alpha: 0.18),
              ),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(14),
                    gradient: LinearGradient(
                      colors: _toatColors(toat),
                    ),
                  ),
                  child: Icon(
                    _toatIcon(toat),
                    color: Colors.white,
                    size: 21,
                  ),
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
                          color: AppColors.textSecondary,
                        ),
                      ),
                      if (toat.datetime != null) ...[
                        const SizedBox(height: 4),
                        Text(
                          _timeToGo(toat.datetime!),
                          style: TextStyles.tiny.copyWith(
                            color: _toatColors(toat).last,
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
        child: Padding(
          padding: const EdgeInsets.only(bottom: 14),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SizedBox(
                width: 44,
                child: Column(
                  children: [
                    Text(
                      toat.datetime == null ? '--' : _hourLabel(toat.datetime!),
                      style: TextStyles.smallMedium.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    Text(
                      toat.datetime == null
                          ? ''
                          : _minuteSuffix(toat.datetime!),
                      style: TextStyles.small,
                    ),
                  ],
                ),
              ),
              Container(
                width: 2,
                margin: const EdgeInsets.only(top: 6),
                color: const Color(0x22374151),
                height: 66,
              ),
              const SizedBox(width: 8),
              Expanded(
                child: GestureDetector(
                  onTap: onTap,
                  child: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: AppColors.bgElevated,
                      borderRadius: BorderRadius.circular(16),
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
                          width: 38,
                          height: 38,
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(12),
                            gradient: LinearGradient(
                              colors: _toatColors(toat),
                            ),
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
                                  fontSize: 13,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                _supportingText(toat),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: TextStyles.tiny.copyWith(
                                  color: AppColors.textSecondary,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 6),
                        if (action != null) ...[
                          _ActionButton(action: action, onTap: onAction),
                          const SizedBox(width: 5),
                        ],
                        _DoneButton(done: toat.state == 'done', onTap: onDone),
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
          padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 6),
          decoration: BoxDecoration(
            color: const Color(0xFFEFF1F5),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFE4E7EC)),
          ),
          child: Icon(
            done ? Icons.check_circle_rounded : Icons.check_circle_outline,
            size: 16,
            color: AppColors.textMuted,
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
        Icon(action.icon, size: 13, color: filled ? Colors.white : colors.last),
        const SizedBox(width: 4),
        Flexible(
          child: Text(
            action.label,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyles.tiny.copyWith(
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
          constraints: BoxConstraints(maxWidth: filled ? 108 : 72),
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
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

/// Derives a "kind key" from enrichments for color/icon dispatch.
String _enrichmentKey(ToatSummary toat) {
  final e = toat.enrichments;
  final comm = e['communication'];
  if (comm is Map<String, dynamic>) {
    if (comm['joinUrl'] is String) return 'meeting';
    if (comm['channel'] == 'call' || comm['phone'] is String) return 'call';
    return 'follow_up';
  }
  final event = e['event'];
  if (event is Map<String, dynamic>) return 'event';
  final action = e['action'];
  if (action is Map<String, dynamic>) {
    if (action['type'] == 'checklist') return 'checklist';
    if (action['type'] == 'errand') return 'errand';
  }
  final thought = e['thought'];
  if (thought is Map<String, dynamic>) return 'idea';
  return 'task';
}

List<Color> _toatColors(ToatSummary toat) => _templateColors(_enrichmentKey(toat));

IconData _toatIcon(ToatSummary toat) => _smartIcon(_enrichmentKey(toat), toat.title);

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

// Keyword-aware icon selector — also used by capture screen.
IconData _smartIcon(String template, String title) {
  final t = title.toLowerCase();
  bool has(List<String> kws) => kws.any(t.contains);

  // Sports
  if (has(['soccer', 'football', 'futbol'])) return Icons.sports_soccer_rounded;
  if (has(['basketball'])) return Icons.sports_basketball_rounded;
  if (has(['baseball', 'softball'])) return Icons.sports_baseball_rounded;
  if (has(['tennis', 'badminton'])) return Icons.sports_tennis_rounded;
  if (has(['golf'])) return Icons.golf_course_rounded;
  if (has(['volleyball'])) return Icons.sports_volleyball_rounded;
  if (has([
    'gym',
    'workout',
    'fitness',
    'exercise',
    'training',
    'yoga',
    'pilates',
  ])) {
    return Icons.fitness_center_rounded;
  }
  if (has(['swim', 'swimming', 'pool', 'diving'])) return Icons.pool_rounded;
  if (has(['cycling', 'bike', 'bicycle'])) return Icons.directions_bike_rounded;
  if (has(['run', 'jog', 'jogging', 'marathon']))
    return Icons.directions_run_rounded;
  if (has(['hike', 'hiking', 'trail'])) return Icons.hiking_rounded;
  if (has(['sport', 'game', 'match', 'tournament']))
    return Icons.sports_rounded;

  // Kids / school
  if (has(['sunday school', 'church school'])) return Icons.church_rounded;
  if (has([
    'school',
    'class',
    'study',
    'homework',
    'lesson',
    'tutor',
    'exam',
    'test',
  ])) {
    return Icons.school_rounded;
  }
  if (has(['university', 'college', 'campus']))
    return Icons.account_balance_rounded;
  if (has(['read', 'book', 'library', 'reading']))
    return Icons.menu_book_rounded;

  // Food & drink
  if (has(['coffee', 'cafe', 'starbucks', 'latte']))
    return Icons.local_cafe_rounded;
  if (has(['grocery', 'groceries', 'supermarket', 'market']))
    return Icons.shopping_cart_rounded;
  if (has([
    'restaurant',
    'dinner',
    'lunch',
    'breakfast',
    'brunch',
    'eat out',
    'food',
  ])) {
    return Icons.restaurant_rounded;
  }

  // Medical
  if (has([
    'pharmacy',
    'drugstore',
    'prescription',
    'medication',
    'medicine',
  ])) {
    return Icons.local_pharmacy_rounded;
  }
  if (has(['dentist', 'dental', 'teeth'])) return Icons.local_hospital_rounded;
  if (has([
    'doctor',
    'physician',
    'clinic',
    'hospital',
    'medical',
    'health',
    'checkup',
  ])) {
    return Icons.local_hospital_rounded;
  }
  if (has(['haircut', 'barber', 'salon', 'hair']))
    return Icons.content_cut_rounded;

  // Transport / travel
  if (has(['airport', 'fly', 'flight', 'plane', 'travel', 'trip']))
    return Icons.flight_rounded;
  if (has(['train', 'subway', 'metro', 'rail', 'transit', 'bus'])) {
    return Icons.directions_transit_rounded;
  }
  if (has([
    'drive',
    'driving',
    'drop son',
    'drop daughter',
    'pick son',
    'pick daughter',
    'pick up',
    'pickup',
    'drop off',
  ])) {
    return Icons.directions_car_rounded;
  }

  // Faith
  if (has([
    'church',
    'mosque',
    'temple',
    'worship',
    'prayer',
    'pray',
    'mass',
    'sermon',
  ])) {
    return Icons.church_rounded;
  }

  // Work & comms
  if (has([
    'zoom',
    'teams',
    'meet',
    'google meet',
    'virtual',
    'video call',
    'video meeting',
  ])) {
    return Icons.videocam_rounded;
  }
  if (has(['email', 'send email', 'reply to', 'respond to']))
    return Icons.email_rounded;
  if (has(['call', 'phone', 'ring', 'talk to', 'catch up with']))
    return Icons.call_rounded;
  if (has(['interview', 'hiring', 'recruiting'])) return Icons.work_rounded;
  if (has(['deadline', 'due date', 'submit', 'submission']))
    return Icons.timer_outlined;
  if (has(['presentation', 'present', 'deck', 'slides', 'keynote'])) {
    return Icons.present_to_all_rounded;
  }
  if (has(['document', 'report', 'write', 'draft', 'review', 'proposal'])) {
    return Icons.description_rounded;
  }
  if (has(['meeting', 'standup', 'sync', 'catchup', 'catch up', 'huddle'])) {
    return Icons.groups_rounded;
  }

  // Home & chores
  if (has(['clean', 'tidy', 'vacuum', 'laundry', 'wash', 'iron', 'mop'])) {
    return Icons.cleaning_services_rounded;
  }
  if (has(['cook', 'cooking', 'bake', 'baking', 'meal prep', 'prepare meal'])) {
    return Icons.restaurant_rounded;
  }
  if (has([
    'repair',
    'fix',
    'plumber',
    'electrician',
    'maintenance',
    'handyman',
  ])) {
    return Icons.build_rounded;
  }
  if (has(['buy', 'purchase', 'order', 'shop', 'store', 'mall'])) {
    return Icons.shopping_bag_rounded;
  }

  // People
  if (has(['baby', 'child', 'kid', 'toddler', 'infant']))
    return Icons.child_care_rounded;
  if (has(['pet', 'dog', 'cat', 'vet', 'puppy', 'kitten']))
    return Icons.pets_rounded;

  // Template defaults
  switch (template) {
    case 'meeting':
      return Icons.groups_rounded;
    case 'call':
      return Icons.call_rounded;
    case 'appointment':
      return Icons.event_rounded;
    case 'event':
      return Icons.confirmation_number_outlined;
    case 'deadline':
      return Icons.timer_outlined;
    case 'task':
      return Icons.task_alt_rounded;
    case 'checklist':
      return Icons.checklist_rounded;
    case 'errand':
      return Icons.pin_drop_rounded;
    case 'follow_up':
      return Icons.replay_rounded;
    case 'idea':
      return Icons.lightbulb_outline_rounded;
    default:
      return Icons.radio_button_unchecked_rounded;
  }
}

// ---------------------------------------------------------------------------
// Confetti system — throttled to once per 2 seconds
// ---------------------------------------------------------------------------

int _lastConfettiMs = 0;

void _showConfetti(BuildContext context) {
  final nowMs = DateTime.now().millisecondsSinceEpoch;
  if (nowMs - _lastConfettiMs < 500) return;
  _lastConfettiMs = nowMs;

  final size = MediaQuery.sizeOf(context);
  final origin = Offset(size.width / 2, size.height * 0.35);

  final overlay = Overlay.of(context, rootOverlay: true);
  late OverlayEntry entry;
  entry = OverlayEntry(
    builder: (_) => Positioned.fill(
      child: IgnorePointer(
        child: _ConfettiBurst(origin: origin, onDone: entry.remove),
      ),
    ),
  );
  overlay.insert(entry);
}

class _ConfettiBurst extends StatefulWidget {
  const _ConfettiBurst({required this.origin, required this.onDone});
  final Offset origin;
  final VoidCallback onDone;

  @override
  State<_ConfettiBurst> createState() => _ConfettiBurstState();
}

class _ConfettiBurstState extends State<_ConfettiBurst>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;
  late final List<_Particle> _particles;

  static const _kColors = [
    Color(0xFFF59E0B),
    Color(0xFF10B981),
    Color(0xFF3B82F6),
    Color(0xFFEC4899),
    Color(0xFF8B5CF6),
    Color(0xFFEF4444),
    Color(0xFF06B6D4),
    Color(0xFFFBBF24),
  ];

  @override
  void initState() {
    super.initState();
    final rnd = math.Random();
    _particles = List.generate(32, (i) {
      final angle = (i / 32) * 2 * math.pi + rnd.nextDouble() * 0.5;
      final speed = 130.0 + rnd.nextDouble() * 180;
      return _Particle(
        dx: math.cos(angle) * speed,
        dy: math.sin(angle) * speed - 80,
        color: _kColors[i % _kColors.length],
        width: 6 + rnd.nextDouble() * 6,
        height: 4 + rnd.nextDouble() * 5,
        rotation: rnd.nextDouble() * 2 * math.pi,
      );
    });
    _ctrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..forward().whenComplete(widget.onDone);
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _ctrl,
      builder: (_, __) => CustomPaint(
        painter: _ConfettiPainter(_ctrl.value, widget.origin, _particles),
        size: Size.infinite,
      ),
    );
  }
}

class _Particle {
  const _Particle({
    required this.dx,
    required this.dy,
    required this.color,
    required this.width,
    required this.height,
    required this.rotation,
  });
  final double dx, dy;
  final Color color;
  final double width, height;
  final double rotation;
}

class _ConfettiPainter extends CustomPainter {
  _ConfettiPainter(this.progress, this.origin, this.particles);
  final double progress;
  final Offset origin;
  final List<_Particle> particles;

  @override
  void paint(Canvas canvas, Size size) {
    final alpha = progress > 0.65
        ? ((1.0 - progress) / 0.35).clamp(0.0, 1.0)
        : 1.0;
    final eased = Curves.easeOut.transform(progress);

    for (final p in particles) {
      final x = origin.dx + p.dx * eased;
      final y = origin.dy + p.dy * eased + 220 * eased * eased; // gravity

      final paint = Paint()
        ..color = p.color.withValues(alpha: alpha)
        ..style = PaintingStyle.fill;

      canvas.save();
      canvas.translate(x, y);
      canvas.rotate(p.rotation + progress * 7);
      canvas.drawRect(
        Rect.fromCenter(center: Offset.zero, width: p.width, height: p.height),
        paint,
      );
      canvas.restore();
    }
  }

  @override
  bool shouldRepaint(_ConfettiPainter old) => old.progress != progress;
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
