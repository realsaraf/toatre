import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

import 'package:toatre/models/toat_summary.dart';
import 'package:toatre/providers/toats_provider.dart';
import 'package:toatre/services/analytics_service.dart';
import 'package:toatre/ui/toat/share_toat_screen.dart';
import 'package:toatre/utils/app_colors.dart';
import 'package:toatre/utils/text_styles.dart';

class ToatDetailScreen extends StatefulWidget {
  const ToatDetailScreen({super.key, required this.initialToat});

  final ToatSummary initialToat;

  @override
  State<ToatDetailScreen> createState() => _ToatDetailScreenState();
}

class _ToatDetailScreenState extends State<ToatDetailScreen> {
  late ToatSummary _toat;
  bool _loading = true;
  String? _error;
  String? _workingAction;

  @override
  void initState() {
    super.initState();
    _toat = widget.initialToat;
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
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
                    onTap: () => Navigator.of(context).pop(),
                  ),
                  const SizedBox(width: 12),
                  Expanded(child: Text('Toat', style: TextStyles.heading2)),
                  _IconCircleButton(
                    icon: Icons.ios_share_rounded,
                    onTap: _shareToat,
                  ),
                ],
              ),
            ),
            Expanded(
              child: ListView(
                padding: const EdgeInsets.fromLTRB(20, 20, 20, 28),
                children: [
                  if (_loading) ...[
                    const Padding(
                      padding: EdgeInsets.only(top: 80),
                      child: Center(child: CircularProgressIndicator()),
                    ),
                  ] else if (_error != null) ...[
                    Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: AppColors.bgElevated,
                        borderRadius: BorderRadius.circular(22),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Could not load this toat.',
                            style: TextStyles.bodyMedium,
                          ),
                          const SizedBox(height: 8),
                          Text(_error!, style: TextStyles.small),
                          const SizedBox(height: 16),
                          ElevatedButton(
                            onPressed: _load,
                            child: const Text('Try again'),
                          ),
                        ],
                      ),
                    ),
                  ] else ...[
                    _HeroSection(
                      toat: _toat,
                      primaryActionLabel: _primaryActionLabel(_toat),
                      onPrimaryAction: _primaryAction,
                    ),
                    const SizedBox(height: 16),
                    _SectionCard(
                      title: 'Quick actions',
                      child: Wrap(
                        spacing: 10,
                        runSpacing: 10,
                        children: [
                          _ActionChip(
                            label: _workingAction == 'done'
                                ? 'Saving…'
                                : 'Mark done',
                            onTap: _workingAction == null ? _markDone : null,
                          ),
                          _ActionChip(
                            label: _workingAction == 'snooze'
                                ? 'Saving…'
                                : 'Snooze 1h',
                            onTap:
                                _workingAction == null && _toat.datetime != null
                                ? _snooze
                                : null,
                          ),
                          _ActionChip(
                            label: _workingAction == 'duplicate'
                                ? 'Saving…'
                                : 'Duplicate',
                            onTap: _workingAction == null ? _duplicate : null,
                          ),
                          _ActionChip(
                            label: 'Share',
                            onTap: _workingAction == null ? _shareToat : null,
                          ),
                          _ActionChip(
                            label: _primaryActionLabel(_toat),
                            onTap: _workingAction == null
                                ? _primaryAction
                                : null,
                          ),
                          _ActionChip(
                            label: _workingAction == 'delete'
                                ? 'Deleting…'
                                : 'Delete',
                            destructive: true,
                            onTap: _workingAction == null ? _delete : null,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                    _SectionCard(
                      title: 'When & where',
                      child: Column(
                        children: [
                          _InfoRow(label: 'When', value: _formatWhen(_toat)),
                          if (_toat.location != null &&
                              _toat.location!.isNotEmpty)
                            _InfoRow(label: 'Where', value: _toat.location!),
                          if (_toat.people.isNotEmpty)
                            _InfoRow(
                              label: 'People',
                              value: _toat.people.join(', '),
                            ),
                          if (_toat.link != null && _toat.link!.isNotEmpty)
                            _InfoRow(label: 'Link', value: _toat.link!),
                        ],
                      ),
                    ),
                    if (_toat.notes != null && _toat.notes!.isNotEmpty) ...[
                      const SizedBox(height: 16),
                      _SectionCard(
                        title: 'About this toat',
                        child: Text(
                          _toat.notes!,
                          style: TextStyles.body.copyWith(height: 1.6),
                        ),
                      ),
                    ],
                    const SizedBox(height: 16),
                    _SectionCard(
                      title: 'Details',
                      child: Column(
                        children: [
                          _InfoRow(label: 'Kind', value: _toat.kind),
                          _InfoRow(label: 'Tier', value: _toat.tier),
                          _InfoRow(label: 'Status', value: _toat.status),
                          if (_toat.createdAt != null)
                            _InfoRow(
                              label: 'Captured',
                              value: DateFormat.yMMMd().add_jm().format(
                                _toat.createdAt!,
                              ),
                            ),
                        ],
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final toat = await context.read<ToatsProvider>().fetchToat(_toat.id);
      if (!mounted) {
        return;
      }
      setState(() {
        _toat = toat;
      });
    } catch (error) {
      if (!mounted) {
        return;
      }
      setState(() {
        _error = error.toString();
      });
    } finally {
      if (mounted) {
        setState(() {
          _loading = false;
        });
      }
    }
  }

  Future<void> _markDone() async {
    await _runAction('done', () async {
      final updated = await context.read<ToatsProvider>().updateToat(
        _toat.id,
        <String, Object?>{'status': 'done'},
      );
      await AnalyticsService.logToatCompleted(kind: updated.kind);
      if (!mounted) {
        return;
      }
      setState(() {
        _toat = updated;
      });
      _showMessage('Marked done.');
    });
  }

  Future<void> _snooze() async {
    final current = _toat.datetime;
    if (current == null) {
      return;
    }

    await _runAction('snooze', () async {
      final updated = await context.read<ToatsProvider>().updateToat(
        _toat.id,
        <String, Object?>{
          'datetime': current.add(const Duration(hours: 1)).toIso8601String(),
        },
      );
      if (!mounted) {
        return;
      }
      setState(() {
        _toat = updated;
      });
      _showMessage('Snoozed for 1 hour.');
    });
  }

  Future<void> _duplicate() async {
    await _runAction('duplicate', () async {
      final duplicated = await context.read<ToatsProvider>().duplicateToat(
        _toat,
      );
      if (!mounted) {
        return;
      }
      _showMessage('Duplicated ${duplicated.title}.');
    });
  }

  Future<void> _delete() async {
    final shouldDelete =
        await showDialog<bool>(
          context: context,
          builder: (context) {
            return AlertDialog(
              title: const Text('Delete this toat?'),
              content: const Text('This removes it from your timeline.'),
              actions: [
                TextButton(
                  onPressed: () => Navigator.of(context).pop(false),
                  child: const Text('Cancel'),
                ),
                TextButton(
                  onPressed: () => Navigator.of(context).pop(true),
                  child: const Text('Delete'),
                ),
              ],
            );
          },
        ) ??
        false;

    if (!shouldDelete) {
      return;
    }

    await _runAction('delete', () async {
      await context.read<ToatsProvider>().deleteToat(_toat);
      if (!mounted) {
        return;
      }
      Navigator.of(context).pop(true);
    });
  }

  Future<void> _primaryAction() async {
    final uri = _primaryActionUri(_toat);
    if (uri == null) {
      await Clipboard.setData(ClipboardData(text: _toat.title));
      _showMessage('Copied the toat title.');
      return;
    }

    final launched = await launchUrl(uri, mode: LaunchMode.externalApplication);
    if (!launched) {
      _showMessage(
        'Could not open ${_primaryActionLabel(_toat).toLowerCase()}.',
      );
    }
  }

  Future<void> _shareToat() async {
    await Navigator.of(context).push(
      MaterialPageRoute<void>(
        fullscreenDialog: true,
        builder: (context) => ShareToatScreen(toat: _toat),
      ),
    );
  }

  Future<void> _runAction(
    String action,
    Future<void> Function() callback,
  ) async {
    setState(() {
      _workingAction = action;
    });

    try {
      await callback();
    } catch (error) {
      _showMessage(error.toString());
    } finally {
      if (mounted) {
        setState(() {
          _workingAction = null;
        });
      }
    }
  }

  void _showMessage(String message) {
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text(message)));
  }

  String _formatWhen(ToatSummary toat) {
    if (toat.datetime == null) {
      return 'Any time';
    }

    final start = DateFormat.yMMMd().add_jm().format(toat.datetime!);
    if (toat.endDatetime == null) {
      return start;
    }

    return '$start → ${DateFormat.jm().format(toat.endDatetime!)}';
  }

  String _primaryActionLabel(ToatSummary toat) {
    if (_detailPhone(toat) != null) {
      return 'Call';
    }
    if (toat.template == 'meeting') {
      final joinUrl = toat.templateData['joinUrl'] as String?;
      final link = joinUrl?.isNotEmpty == true ? joinUrl : toat.link;
      if (link != null && link.isNotEmpty) return 'Join';
    }
    if (toat.location != null && toat.location!.isNotEmpty) {
      return 'Directions';
    }

    return 'Copy title';
  }

  Uri? _primaryActionUri(ToatSummary toat) {
    final phone = _detailPhone(toat);
    if (phone != null) {
      return Uri(scheme: 'tel', path: _normalizedPhone(phone));
    }

    if (toat.template == 'meeting') {
      final joinUrl = toat.templateData['joinUrl'] as String?;
      final link = joinUrl?.isNotEmpty == true ? joinUrl : toat.link;
      if (link != null && link.isNotEmpty) return _externalUri(link);
    }

    if (toat.location != null && toat.location!.isNotEmpty) {
      return Uri.https('www.google.com', '/maps/search/', <String, String>{
        'api': '1',
        'query': toat.location!,
      });
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
}

class _HeroSection extends StatelessWidget {
  const _HeroSection({
    required this.toat,
    required this.primaryActionLabel,
    required this.onPrimaryAction,
  });

  final ToatSummary toat;
  final String primaryActionLabel;
  final VoidCallback onPrimaryAction;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(22, 22, 22, 20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            _detailTemplateColors(toat.template).first.withValues(alpha: 0.10),
            _detailTemplateColors(toat.template).last.withValues(alpha: 0.05),
            Colors.white.withValues(alpha: 0.86),
          ],
        ),
        borderRadius: BorderRadius.circular(30),
        border: Border.all(
          color: _detailTemplateColors(
            toat.template,
          ).last.withValues(alpha: 0.12),
        ),
        boxShadow: const [
          BoxShadow(
            color: Color(0x16000000),
            blurRadius: 30,
            offset: Offset(0, 12),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 86,
                height: 86,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(24),
                  gradient: LinearGradient(
                    colors: _detailTemplateColors(toat.template),
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: _detailTemplateColors(
                        toat.template,
                      ).last.withValues(alpha: 0.24),
                      blurRadius: 20,
                      offset: const Offset(0, 10),
                    ),
                  ],
                ),
                child: Icon(
                  _detailTemplateIcon(toat.template),
                  color: Colors.white,
                  size: 42,
                ),
              ),
              const SizedBox(width: 18),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _Pill(
                      label: toat.template.toUpperCase(),
                      color: _detailTemplateColors(toat.template).last,
                    ),
                    const SizedBox(height: 12),
                    Text(
                      toat.title,
                      style: TextStyles.display.copyWith(fontSize: 34),
                    ),
                    const SizedBox(height: 10),
                    Text(
                      _detailSubtitle(toat),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyles.body.copyWith(
                        color: AppColors.textSecondary,
                        height: 1.35,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 22),
          Row(
            children: [
              if (toat.datetime != null)
                Expanded(
                  child: _MetaPill(
                    icon: Icons.schedule_rounded,
                    label: DateFormat.jm().format(toat.datetime!),
                  ),
                ),
              if (toat.datetime != null) const SizedBox(width: 10),
              Expanded(
                child: GestureDetector(
                  onTap: onPrimaryAction,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 14,
                    ),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: _detailActionColors(toat),
                      ),
                      borderRadius: BorderRadius.circular(18),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          _detailActionIcon(toat),
                          color: Colors.white,
                          size: 20,
                        ),
                        const SizedBox(width: 8),
                        Flexible(
                          child: Text(
                            primaryActionLabel,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyles.bodyMedium.copyWith(
                              color: Colors.white,
                              fontWeight: FontWeight.w700,
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
        ],
      ),
    );
  }
}

class _MetaPill extends StatelessWidget {
  const _MetaPill({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.80),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.softPurple),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, color: AppColors.textSecondary, size: 19),
          const SizedBox(width: 8),
          Flexible(
            child: Text(
              label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyles.smallMedium.copyWith(color: AppColors.text),
            ),
          ),
        ],
      ),
    );
  }
}

class _SectionCard extends StatelessWidget {
  const _SectionCard({required this.title, required this.child});

  final String title;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.bgElevated,
        borderRadius: BorderRadius.circular(24),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: TextStyles.heading3),
          const SizedBox(height: 14),
          child,
        ],
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 84,
            child: Text(
              label,
              style: TextStyles.smallMedium.copyWith(
                color: AppColors.textSecondary,
              ),
            ),
          ),
          Expanded(child: Text(value, style: TextStyles.body)),
        ],
      ),
    );
  }
}

class _ActionChip extends StatelessWidget {
  const _ActionChip({
    required this.label,
    required this.onTap,
    this.destructive = false,
  });

  final String label;
  final VoidCallback? onTap;
  final bool destructive;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: destructive
              ? const Color(0x22EF4444)
              : const Color(0x121C2540),
          borderRadius: BorderRadius.circular(18),
          border: Border.all(
            color: destructive ? const Color(0x44EF4444) : AppColors.border,
          ),
        ),
        child: Text(
          label,
          style: TextStyles.smallMedium.copyWith(
            color: destructive ? AppColors.error : AppColors.text,
          ),
        ),
      ),
    );
  }
}

class _Pill extends StatelessWidget {
  const _Pill({required this.label, required this.color});

  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.16),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Text(label, style: TextStyles.smallMedium.copyWith(color: color)),
    );
  }
}

class _IconCircleButton extends StatelessWidget {
  const _IconCircleButton({required this.icon, required this.onTap});

  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 44,
        height: 44,
        decoration: BoxDecoration(
          color: AppColors.bgElevated,
          shape: BoxShape.circle,
          border: Border.all(color: AppColors.border),
        ),
        child: Icon(icon, color: AppColors.text),
      ),
    );
  }
}

String _detailSubtitle(ToatSummary toat) {
  if (toat.location != null && toat.location!.isNotEmpty) {
    return toat.location!;
  }
  if (toat.link != null &&
      toat.link!.isNotEmpty &&
      toat.template == 'meeting') {
    return _meetingPlatform(toat.link!);
  }
  if (toat.people.isNotEmpty) {
    return toat.people.join(', ');
  }
  if (toat.datetime != null) {
    return DateFormat.yMMMMd().add_jm().format(toat.datetime!);
  }
  return 'Personal';
}

String _meetingPlatform(String link) {
  final lowerLink = link.toLowerCase();
  if (lowerLink.contains('zoom')) return 'Zoom meeting';
  if (lowerLink.contains('meet.google')) return 'Google Meet';
  if (lowerLink.contains('teams')) return 'Teams meeting';
  return 'Meeting link';
}

/// Returns phone from typed templateData — no regex.
String? _detailPhone(ToatSummary toat) {
  final td = toat.templateData;
  switch (toat.template) {
    case 'call':
    case 'appointment':
    case 'follow_up':
      final phone = td['phone'];
      if (phone is String && phone.isNotEmpty) return phone;
      break;
    default:
      break;
  }
  return null;
}

// Template-based color dispatch
List<Color> _detailTemplateColors(String template) {
  switch (template) {
    case 'meeting':
      return const [Color(0xFF60A5FA), Color(0xFF2563EB)];
    case 'call':
      return const [Color(0xFFF43F5E), Color(0xFFEC4899)];
    case 'appointment':
      return const [Color(0xFF7C3AED), Color(0xFF5B3DF5)];
    case 'event':
      return const [Color(0xFF7C3AED), Color(0xFF5B3DF5)];
    case 'deadline':
      return const [Color(0xFFEF4444), Color(0xFFDC2626)];
    case 'checklist':
      return const [Color(0xFF4ADE80), Color(0xFF16A34A)];
    case 'errand':
      return const [Color(0xFFA855F7), Color(0xFF8B5CF6)];
    case 'follow_up':
      return const [Color(0xFF06B6D4), Color(0xFF0891B2)];
    case 'idea':
      return const [Color(0xFFFBBF24), Color(0xFFF59E0B)];
    default: // task
      return const [Color(0xFF8B5CF6), Color(0xFF6D28D9)];
  }
}

// Template-based icon dispatch
IconData _detailTemplateIcon(String template) {
  switch (template) {
    case 'meeting':
      return Icons.videocam_rounded;
    case 'call':
      return Icons.call_rounded;
    case 'appointment':
      return Icons.medical_services_outlined;
    case 'event':
      return Icons.confirmation_number_outlined;
    case 'deadline':
      return Icons.timer_outlined;
    case 'checklist':
      return Icons.checklist_rounded;
    case 'errand':
      return Icons.shopping_cart_outlined;
    case 'follow_up':
      return Icons.replay_rounded;
    case 'idea':
      return Icons.lightbulb_outline_rounded;
    default: // task
      return Icons.mail_outline_rounded;
  }
}

IconData _detailActionIcon(ToatSummary toat) {
  if (_detailPhone(toat) != null) return Icons.call_rounded;
  if (toat.template == 'meeting') {
    final joinUrl = toat.templateData['joinUrl'] as String?;
    final link = joinUrl?.isNotEmpty == true ? joinUrl : toat.link;
    if (link != null && link.isNotEmpty) return Icons.videocam_rounded;
  }
  if (toat.location != null && toat.location!.isNotEmpty) {
    return Icons.navigation_rounded;
  }
  return Icons.content_copy_rounded;
}

List<Color> _detailActionColors(ToatSummary toat) {
  if (_detailPhone(toat) != null) {
    return const [Color(0xFFFB7185), Color(0xFFEC4899)];
  }
  if (toat.template == 'meeting') {
    final joinUrl = toat.templateData['joinUrl'] as String?;
    final link = joinUrl?.isNotEmpty == true ? joinUrl : toat.link;
    if (link != null && link.isNotEmpty) {
      return const [Color(0xFF3B82F6), Color(0xFF2563EB)];
    }
  }
  if (toat.location != null && toat.location!.isNotEmpty) {
    return const [Color(0xFF7C3AED), Color(0xFF6D28D9)];
  }
  return const [Color(0xFF8B5CF6), Color(0xFFEC4899)];
}
