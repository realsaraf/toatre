import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import 'package:toatre/models/toat_summary.dart';
import 'package:toatre/providers/toats_provider.dart';
import 'package:toatre/services/analytics_service.dart';
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
                  Expanded(
                    child: Text('Toat', style: TextStyles.heading2),
                  ),
                  _IconCircleButton(
                    icon: Icons.copy_rounded,
                    onTap: _copyShareText,
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
                    _HeroSection(toat: _toat),
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
                            onTap: _workingAction == null && _toat.datetime != null
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
                            label: _primaryActionLabel(_toat),
                            onTap: _workingAction == null ? _copyPrimaryValue : null,
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
                          _InfoRow(
                            label: 'When',
                            value: _formatWhen(_toat),
                          ),
                          if (_toat.location != null && _toat.location!.isNotEmpty)
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
                              value: DateFormat.yMMMd().add_jm().format(_toat.createdAt!),
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
      final duplicated = await context.read<ToatsProvider>().duplicateToat(_toat);
      if (!mounted) {
        return;
      }
      _showMessage('Duplicated ${duplicated.title}.');
    });
  }

  Future<void> _delete() async {
    final shouldDelete = await showDialog<bool>(
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

  Future<void> _copyPrimaryValue() async {
    final value = _primaryValue(_toat);
    if (value == null) {
      await Clipboard.setData(ClipboardData(text: _toat.title));
      _showMessage('Copied the toat title.');
      return;
    }

    await Clipboard.setData(ClipboardData(text: value));
    _showMessage('${_primaryActionLabel(_toat)} copied.');
  }

  Future<void> _copyShareText() async {
    final buffer = StringBuffer()..writeln(_toat.title);
    if (_toat.datetime != null) {
      buffer.writeln(_formatWhen(_toat));
    }
    if (_toat.location != null && _toat.location!.isNotEmpty) {
      buffer.writeln(_toat.location);
    }
    if (_toat.notes != null && _toat.notes!.isNotEmpty) {
      buffer.writeln(_toat.notes);
    }

    await Clipboard.setData(ClipboardData(text: buffer.toString().trim()));
    _showMessage('Toat copied.');
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
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
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
    if (toat.link != null && toat.link!.isNotEmpty) {
      return 'Copy link';
    }
    if (_extractPhone(toat) != null) {
      return 'Copy phone';
    }
    if (toat.location != null && toat.location!.isNotEmpty) {
      return 'Copy location';
    }

    return 'Copy title';
  }

  String? _primaryValue(ToatSummary toat) {
    if (toat.link != null && toat.link!.isNotEmpty) {
      return toat.link!;
    }

    final phone = _extractPhone(toat);
    if (phone != null) {
      return phone;
    }

    if (toat.location != null && toat.location!.isNotEmpty) {
      return toat.location!;
    }

    return null;
  }

  String? _extractPhone(ToatSummary toat) {
    final match = RegExp(r'(\+?\d[\d\s().-]{7,}\d)').firstMatch(
      '${toat.title} ${toat.notes ?? ''}',
    );
    return match?.group(1);
  }
}

class _HeroSection extends StatelessWidget {
  const _HeroSection({required this.toat});

  final ToatSummary toat;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        color: AppColors.bgElevated,
        borderRadius: BorderRadius.circular(26),
        boxShadow: const [
          BoxShadow(
            color: Color(0x22000000),
            blurRadius: 28,
            offset: Offset(0, 10),
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
              _Pill(label: toat.kind.toUpperCase(), color: AppColors.primary),
              _Pill(label: toat.tier.toUpperCase(), color: AppColors.accent),
              _Pill(label: toat.status.toUpperCase(), color: AppColors.textMuted),
            ],
          ),
          const SizedBox(height: 18),
          Text(toat.title, style: TextStyles.heading1),
          const SizedBox(height: 12),
          if (toat.location != null && toat.location!.isNotEmpty)
            Text(
              toat.location!,
              style: TextStyles.body.copyWith(color: AppColors.textSecondary),
            ),
          if (toat.datetime != null) ...[
            const SizedBox(height: 8),
            Text(
              DateFormat.yMMMMd().add_jm().format(toat.datetime!),
              style: TextStyles.bodyMedium.copyWith(color: AppColors.primaryLight),
            ),
          ],
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
          color: destructive ? const Color(0x22EF4444) : const Color(0x121C2540),
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
      child: Text(
        label,
        style: TextStyles.smallMedium.copyWith(color: color),
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