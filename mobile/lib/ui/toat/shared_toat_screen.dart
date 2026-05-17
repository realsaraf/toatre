import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';

import 'package:toatre/config/app_config.dart';
import 'package:toatre/models/toat_summary.dart';
import 'package:toatre/services/api_service.dart';
import 'package:toatre/utils/app_colors.dart';
import 'package:toatre/utils/text_styles.dart';

class SharedToatScreen extends StatefulWidget {
  const SharedToatScreen({required this.token, super.key});

  final String token;

  @override
  State<SharedToatScreen> createState() => _SharedToatScreenState();
}

class _SharedToatScreenState extends State<SharedToatScreen> {
  late final Future<_SharedToatPayload> _payloadFuture = _loadSharedToat();

  Future<_SharedToatPayload> _loadSharedToat() async {
    final response = await ApiService.instance.getJson(
      '/api/shares/${Uri.encodeComponent(widget.token)}',
    );
    final toatJson = response['toat'];
    final shareJson = response['share'];

    if (toatJson is! Map<String, dynamic>) {
      throw const ApiServiceException(
        statusCode: 500,
        message: 'Shared toat is unavailable.',
      );
    }

    return _SharedToatPayload(
      toat: ToatSummary.fromJson(toatJson),
      role: shareJson is Map<String, dynamic>
          ? shareJson['role'] as String? ?? 'view'
          : 'view',
      scope: shareJson is Map<String, dynamic>
          ? shareJson['scope'] as String? ?? 'link'
          : 'link',
    );
  }

  Future<void> _openInBrowser() async {
    final opened = await launchUrl(
      AppConfig.apiUri('/s/${widget.token}'),
      mode: LaunchMode.externalApplication,
    );

    if (!opened && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Could not open this shared toat in the browser.'),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 14, 20, 0),
              child: Row(
                children: [
                  _IconCircleButton(
                    icon: Icons.arrow_back_rounded,
                    onTap: () => Navigator.of(context).maybePop(),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text('Shared toat', style: TextStyles.heading2),
                  ),
                ],
              ),
            ),
            Expanded(
              child: FutureBuilder<_SharedToatPayload>(
                future: _payloadFuture,
                builder: (context, snapshot) {
                  if (snapshot.connectionState != ConnectionState.done) {
                    return const Center(
                      child: CircularProgressIndicator(
                        color: AppColors.primary,
                      ),
                    );
                  }

                  if (snapshot.hasError || !snapshot.hasData) {
                    final message = snapshot.error is ApiServiceException
                        ? (snapshot.error as ApiServiceException).message
                        : 'This shared toat is unavailable right now.';
                    return _ErrorState(
                      message: message,
                      onOpenInBrowser: _openInBrowser,
                    );
                  }

                  return _SharedToatView(
                    payload: snapshot.data!,
                    onOpenInBrowser: _openInBrowser,
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SharedToatView extends StatelessWidget {
  const _SharedToatView({required this.payload, required this.onOpenInBrowser});

  final _SharedToatPayload payload;
  final Future<void> Function() onOpenInBrowser;

  @override
  Widget build(BuildContext context) {
    final toat = payload.toat;
    final datetimeLabel = _datetimeLabel(toat);
    final location = toat.location;
    final notes = toat.notes?.trim();
    final people = toat.people;

    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 28),
      children: [
        // ── Hero card ─────────────────────────────────────────────────────
        Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            gradient: AppColors.brandGradient,
            borderRadius: BorderRadius.circular(30),
            boxShadow: [
              BoxShadow(
                color: AppColors.primary.withValues(alpha: 0.16),
                blurRadius: 24,
                offset: const Offset(0, 16),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Wrap(
                spacing: 10,
                runSpacing: 10,
                children: [
                  _Pill(
                    label: _tierLabel(toat.tier),
                    color: _tierColor(toat.tier),
                    foreground: Colors.white,
                  ),
                  _Pill(
                    label: payload.role == 'edit' ? 'Can edit' : 'View only',
                    color: Colors.white.withValues(alpha: 0.2),
                    foreground: Colors.white,
                  ),
                  if (payload.scope == 'connection')
                    _Pill(
                      label: 'Shared with you',
                      color: Colors.white.withValues(alpha: 0.16),
                      foreground: Colors.white,
                    ),
                ],
              ),
              const SizedBox(height: 18),
              Text(
                toat.title.isEmpty ? 'Untitled toat' : toat.title,
                style: TextStyles.heading1.copyWith(
                  fontSize: 30,
                  height: 1.08,
                  color: Colors.white,
                ),
              ),
              if (datetimeLabel != null || location != null) ...[
                const SizedBox(height: 18),
                Wrap(
                  spacing: 14,
                  runSpacing: 12,
                  children: [
                    if (datetimeLabel != null)
                      _MetaItem(
                        icon: Icons.schedule_rounded,
                        text: datetimeLabel,
                        color: Colors.white,
                      ),
                    if (location != null)
                      _MetaItem(
                        icon: Icons.place_rounded,
                        text: location,
                        color: Colors.white,
                      ),
                  ],
                ),
              ],
            ],
          ),
        ),
        // ── Detail rows ───────────────────────────────────────────────────
        if (people.isNotEmpty) ...[
          const SizedBox(height: 18),
          _DetailCard(
            title: 'People',
            child: Wrap(
              spacing: 8,
              runSpacing: 8,
              children: people
                  .map(
                    (name) => Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 7,
                      ),
                      decoration: BoxDecoration(
                        color: const Color(0x0C4F46E5),
                        borderRadius: BorderRadius.circular(999),
                        border: Border.all(
                          color: const Color(0x1A4F46E5),
                        ),
                      ),
                      child: Text(
                        name,
                        style: TextStyles.smallMedium.copyWith(
                          color: const Color(0xFF4F46E5),
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  )
                  .toList(),
            ),
          ),
        ],
        if (notes != null && notes.isNotEmpty) ...[
          const SizedBox(height: 18),
          _DetailCard(
            title: 'Notes',
            child: Text(
              notes,
              style: TextStyles.body.copyWith(
                color: AppColors.textSecondary,
                height: 1.55,
              ),
            ),
          ),
        ],
        // ── Open in browser CTA ───────────────────────────────────────────
        const SizedBox(height: 24),
        GestureDetector(
          onTap: onOpenInBrowser,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
            decoration: BoxDecoration(
              color: const Color(0xFFF9F9FB),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0x12000000)),
            ),
            child: Row(
              children: [
                Container(
                  width: 38,
                  height: 38,
                  decoration: BoxDecoration(
                    color: const Color(0x177C3AED),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  alignment: Alignment.center,
                  child: const Icon(
                    Icons.open_in_browser_rounded,
                    color: Color(0xFF7C3AED),
                    size: 20,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Open in browser',
                        style: TextStyles.bodyMedium.copyWith(
                          color: const Color(0xFF111827),
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'View the full page on toatre.com',
                        style: TextStyles.small.copyWith(
                          color: AppColors.textMuted,
                        ),
                      ),
                    ],
                  ),
                ),
                const Icon(
                  Icons.chevron_right_rounded,
                  color: Color(0xFFD1D5DB),
                  size: 22,
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _ErrorState extends StatelessWidget {
  const _ErrorState({required this.message, required this.onOpenInBrowser});

  final String message;
  final Future<void> Function() onOpenInBrowser;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 28),
      children: [
        Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: AppColors.bgElevated,
            borderRadius: BorderRadius.circular(28),
            border: Border.all(color: AppColors.border),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 52,
                height: 52,
                decoration: BoxDecoration(
                  color: AppColors.warning.withValues(alpha: 0.16),
                  borderRadius: BorderRadius.circular(22),
                ),
                child: const Icon(
                  Icons.link_off_rounded,
                  color: AppColors.warning,
                ),
              ),
              const SizedBox(height: 18),
              Text(
                'Could not open that shared toat.',
                style: TextStyles.heading1,
              ),
              const SizedBox(height: 10),
              Text(
                message,
                style: TextStyles.body.copyWith(
                  color: AppColors.textSecondary,
                  height: 1.5,
                ),
              ),
              const SizedBox(height: 16),
              FilledButton.tonal(
                onPressed: onOpenInBrowser,
                style: FilledButton.styleFrom(
                  backgroundColor: AppColors.softPurple,
                  foregroundColor: AppColors.primaryDark,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 14,
                  ),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(18),
                  ),
                ),
                child: const Text('Try in browser'),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _DetailCard extends StatelessWidget {
  const _DetailCard({required this.title, required this.child});

  final String title;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        color: AppColors.bgElevated,
        borderRadius: BorderRadius.circular(26),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: TextStyles.label.copyWith(color: AppColors.textSecondary),
          ),
          const SizedBox(height: 12),
          child,
        ],
      ),
    );
  }
}

class _MetaItem extends StatelessWidget {
  const _MetaItem({
    required this.icon,
    required this.text,
    required this.color,
  });

  final IconData icon;
  final String text;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 18, color: color.withValues(alpha: 0.92)),
        const SizedBox(width: 8),
        Flexible(
          child: Text(
            text,
            style: TextStyles.bodyMedium.copyWith(
              color: color.withValues(alpha: 0.96),
            ),
          ),
        ),
      ],
    );
  }
}

class _Pill extends StatelessWidget {
  const _Pill({
    required this.label,
    required this.color,
    required this.foreground,
  });

  final String label;
  final Color color;
  final Color foreground;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: TextStyles.smallMedium.copyWith(color: foreground),
      ),
    );
  }
}

class _IconCircleButton extends StatelessWidget {
  const _IconCircleButton({required this.icon, required this.onTap});

  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(22),
      child: Container(
        width: 44,
        height: 44,
        decoration: const BoxDecoration(
          color: AppColors.bgElevated,
          shape: BoxShape.circle,
        ),
        child: Icon(icon, color: AppColors.text),
      ),
    );
  }
}

class _SharedToatPayload {
  const _SharedToatPayload({
    required this.toat,
    required this.role,
    required this.scope,
  });

  final ToatSummary toat;
  final String role;
  final String scope;
}

String? _datetimeLabel(ToatSummary toat) {
  final datetime = toat.datetime;
  if (datetime == null) {
    return null;
  }

  final endDatetime = toat.endDatetime;
  final dayLabel = DateFormat('EEE, MMM d').format(datetime);
  final startTimeLabel = DateFormat('h:mm a').format(datetime);

  if (endDatetime != null) {
    return '$dayLabel • $startTimeLabel - ${DateFormat('h:mm a').format(endDatetime)}';
  }

  return '$dayLabel • $startTimeLabel';
}

String _tierLabel(String tier) {
  switch (tier) {
    case 'urgent':
      return 'Urgent';
    case 'important':
      return 'Important';
    default:
      return 'Regular';
  }
}

Color _tierColor(String tier) {
  switch (tier) {
    case 'urgent':
      return AppColors.tierUrgent;
    case 'important':
      return AppColors.tierImportant;
    default:
      return AppColors.tierRegular;
  }
}
