import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'package:toatre/models/toat_summary.dart';
import 'package:toatre/providers/capture_provider.dart';
import 'package:toatre/providers/toats_provider.dart';
import 'package:toatre/services/analytics_service.dart';
import 'package:toatre/ui/capture/capture_screen.dart';
import 'package:toatre/ui/settings/settings_screen.dart';
import 'package:toatre/ui/toat/toat_detail_screen.dart';
import 'package:toatre/utils/app_colors.dart';
import 'package:toatre/utils/text_styles.dart';

class TimelineScreen extends StatefulWidget {
  const TimelineScreen({super.key});

  @override
  State<TimelineScreen> createState() => _TimelineScreenState();
}

class _TimelineScreenState extends State<TimelineScreen> {
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
    final toatsProvider = context.watch<ToatsProvider>();
    final toats = toatsProvider.toats;
    final grouped = _groupToats(toats);
    final upNext = _findUpNext(toats);

    return Scaffold(
      backgroundColor: AppColors.bg,
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: context.read<ToatsProvider>().fetchToats,
          child: ListView(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 140),
            children: [
              Row(
                children: [
                  ShaderMask(
                    shaderCallback: AppColors.brandGradient.createShader,
                    blendMode: BlendMode.srcIn,
                    child: Text(
                      'toatre',
                      style: TextStyles.heading2.copyWith(
                        color: Colors.white,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                  const Spacer(),
                  GestureDetector(
                    onTap: _openSettings,
                    child: Container(
                      width: 44,
                      height: 44,
                      decoration: const BoxDecoration(
                        shape: BoxShape.circle,
                        color: AppColors.bgElevated,
                      ),
                      child: const Icon(Icons.person_rounded),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 30),
              Row(
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Today',
                        style: TextStyles.display.copyWith(fontSize: 40),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        _formatToday(),
                        style: TextStyles.heading3.copyWith(
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                  const Spacer(),
                  _HeaderIcon(icon: Icons.calendar_today_outlined),
                  const SizedBox(width: 12),
                  _HeaderIcon(icon: Icons.tune_rounded),
                ],
              ),
              const SizedBox(height: 28),
              if (toatsProvider.status == ToatsStatus.loading)
                const Padding(
                  padding: EdgeInsets.only(top: 80),
                  child: Center(child: CircularProgressIndicator()),
                )
              else if (toatsProvider.status == ToatsStatus.error)
                _TimelineMessage(
                  title: 'Could not load your timeline.',
                  subtitle: toatsProvider.error ?? 'Try pulling to refresh.',
                )
              else if (toats.isEmpty)
                _EmptyState(
                  onCapture: _openVoiceCapture,
                  onTextCapture: _openTextCapture,
                )
              else ...[
                if (upNext != null) ...[
                  _UpNextCard(toat: upNext, onTap: () => _openToat(upNext)),
                  const SizedBox(height: 26),
                ],
                for (final entry in grouped.entries) ...[
                  Padding(
                    padding: const EdgeInsets.only(left: 54, bottom: 12),
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
                    ),
                  ),
                  const SizedBox(height: 14),
                ],
                _TimelineMessage(
                  title: 'You\'re all clear after ${_latestTime(toats)}',
                  subtitle: 'Enjoy your evening.',
                ),
              ],
            ],
          ),
        ),
      ),
      floatingActionButton: _MicFab(
        onTap: _openVoiceCapture,
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.centerDocked,
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
            const _BottomItem(icon: Icons.search_rounded, label: 'Search'),
            SizedBox(width: 52),
            const _BottomItem(icon: Icons.people_outline_rounded, label: 'People'),
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
    final capture = context.read<CaptureProvider>();
    capture.reset();
    capture.setMode(CaptureInputMode.voice);
    await Navigator.of(context).push(
      MaterialPageRoute<void>(builder: (_) => const CaptureScreen()),
    );
    if (!mounted) {
      return;
    }
    await context.read<ToatsProvider>().fetchToats();
  }

  Future<void> _openTextCapture() async {
    final capture = context.read<CaptureProvider>();
    capture.reset();
    capture.setMode(CaptureInputMode.text);
    await Navigator.of(context).push(
      MaterialPageRoute<void>(builder: (_) => const CaptureScreen()),
    );
    if (!mounted) {
      return;
    }
    await context.read<ToatsProvider>().fetchToats();
  }

  Future<void> _openSettings() async {
    await Navigator.of(context).push(
      MaterialPageRoute<void>(builder: (_) => const SettingsScreen()),
    );
    if (!mounted) {
      return;
    }
    await context.read<ToatsProvider>().fetchToats();
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

  Map<String, List<ToatSummary>> _groupToats(List<ToatSummary> toats) {
    final groups = <String, List<ToatSummary>>{};

    for (final toat in toats) {
      final label = _timeBucket(toat.datetime);
      groups.putIfAbsent(label, () => <ToatSummary>[]).add(toat);
    }

    return groups;
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

  String _formatToday() {
    final now = DateTime.now();
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

    return '${weekdays[now.weekday - 1]}, ${months[now.month - 1]} ${now.day}';
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
        width: 82,
        height: 82,
        decoration: const BoxDecoration(
          gradient: AppColors.brandGradient,
          shape: BoxShape.circle,
          boxShadow: [
            BoxShadow(
              color: Color(0x554F46E5),
              blurRadius: 20,
              offset: Offset(0, 6),
            ),
          ],
        ),
        child: const Icon(
          Icons.mic_rounded,
          color: Colors.white,
          size: 36,
          semanticLabel: 'Capture a toat',
        ),
      ),
    );
  }
}

class _HeaderIcon extends StatelessWidget {
  const _HeaderIcon({required this.icon});

  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 52,
      height: 52,
      decoration: BoxDecoration(
        color: AppColors.bgElevated,
        borderRadius: BorderRadius.circular(18),
      ),
      child: Icon(icon, color: AppColors.primary),
    );
  }
}

class _UpNextCard extends StatelessWidget {
  const _UpNextCard({required this.toat, required this.onTap});

  final ToatSummary toat;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [Color(0x1A8B5CF6), Color(0x11EC4899)],
          ),
          borderRadius: BorderRadius.circular(26),
          border: Border.all(color: const Color(0x22EC4899)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: const Color(0xFFF5EEFF),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                'UP NEXT',
                style: TextStyles.label.copyWith(color: AppColors.primary),
              ),
            ),
            const SizedBox(height: 14),
            Text(toat.title, style: TextStyles.heading1),
            const SizedBox(height: 10),
            if (toat.location != null)
              Text(
                toat.location!,
                style: TextStyles.body.copyWith(color: AppColors.textSecondary),
              ),
            if (toat.datetime != null) ...[
              const SizedBox(height: 8),
              Text(
                _timeToGo(toat.datetime!),
                style: TextStyles.bodyMedium.copyWith(color: AppColors.primary),
              ),
            ],
            const SizedBox(height: 18),
            Align(
              alignment: Alignment.centerRight,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  gradient: AppColors.brandGradient,
                  borderRadius: BorderRadius.circular(18),
                ),
                child: Text(
                  _actionLabel(toat),
                  style: TextStyles.bodyMedium.copyWith(color: Colors.white),
                ),
              ),
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
  const _TimelineRow({required this.toat, required this.onTap});

  final ToatSummary toat;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 62,
            child: Column(
              children: [
                Text(
                  toat.datetime == null ? '--' : _hourLabel(toat.datetime!),
                  style: TextStyles.heading3,
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
            height: 104,
          ),
          const SizedBox(width: 14),
          Expanded(
            child: GestureDetector(
              onTap: onTap,
              child: Container(
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: AppColors.bgElevated,
                  borderRadius: BorderRadius.circular(24),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 64,
                      height: 64,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(20),
                        gradient: LinearGradient(colors: _kindColors(toat.kind)),
                      ),
                      child: Icon(
                        _kindIcon(toat.kind),
                        color: Colors.white,
                        size: 30,
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(toat.title, style: TextStyles.heading3),
                          const SizedBox(height: 8),
                          Text(
                            toat.location ??
                                (toat.people.isNotEmpty
                                    ? toat.people.first
                                    : 'Personal'),
                            style: TextStyles.body.copyWith(
                              color: AppColors.textSecondary,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 14,
                        vertical: 10,
                      ),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF5EEFF),
                        borderRadius: BorderRadius.circular(18),
                      ),
                      child: Text(
                        _actionLabel(toat),
                        style: TextStyles.smallMedium.copyWith(
                          color: AppColors.primary,
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

String _actionLabel(ToatSummary toat) {
  switch (toat.kind) {
    case 'meeting':
      return 'Join';
    case 'errand':
      return 'Directions';
    case 'deadline':
      return 'Call';
    case 'task':
      return toat.people.isNotEmpty ? 'Message' : 'Open';
    case 'idea':
      return 'Open';
    case 'event':
      return 'Open';
    default:
      return 'Open';
  }
}
