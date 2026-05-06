import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:http/http.dart' as http;
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

import 'package:toatre/config/app_config.dart';
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

  // Notes editing state
  late TextEditingController _notesCtrl;
  Timer? _notesSaveTimer;

  // Checklist state (only used when template == 'checklist')
  List<Map<String, dynamic>> _checklistItems = [];
  bool _savingChecklist = false;
  bool _showNotesField = false;

  @override
  void initState() {
    super.initState();
    _toat = widget.initialToat;
    _notesCtrl = TextEditingController(text: _toat.notes ?? '');
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  @override
  void dispose() {
    _notesCtrl.dispose();
    _notesSaveTimer?.cancel();
    super.dispose();
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
                    ..._buildCards(),
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
      // Sync checklist items from enrichments
      List<Map<String, dynamic>> items = [];
      if (toat.actionEnrichment?['type'] == 'checklist') {
        final raw = toat.actionEnrichment?['checklist'];
        if (raw is List<dynamic>) {
          items = raw
              .whereType<Map<String, dynamic>>()
              .map((e) => Map<String, dynamic>.from(e))
              .toList();
        }
      }
      setState(() {
        _toat = toat;
        _checklistItems = items;
        _notesCtrl.text = toat.notes ?? '';
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

  Future<void> _saveNotes() async {
    final notes = _notesCtrl.text.trim();
    try {
      final updated = await context.read<ToatsProvider>().updateToat(
        _toat.id,
        <String, Object?>{'notes': notes},
      );
      if (mounted) setState(() => _toat = updated);
    } catch (_) {
      // best-effort save — don't block the user
    }
  }

  Future<void> _saveChecklist(List<Map<String, dynamic>> items) async {
    if (_savingChecklist) return;
    setState(() => _savingChecklist = true);
    try {
      final updated = await context.read<ToatsProvider>().updateToat(
        _toat.id,
        <String, Object?>{
          'enrichments.action': <String, Object?>{
            'type': 'checklist',
            'checklist': items,
          },
        },
      );
      if (mounted) setState(() => _toat = updated);
    } catch (_) {
      // best-effort save
    } finally {
      if (mounted) setState(() => _savingChecklist = false);
    }
  }

  Future<void> _markDone() async {
    await _runAction('done', () async {
      final updated = await context.read<ToatsProvider>().updateToat(
        _toat.id,
        <String, Object?>{'state': 'done'},
      );
      await AnalyticsService.logToatCompleted(kind: updated.tier);
      if (!mounted) {
        return;
      }
      setState(() {
        _toat = updated;
      });
      _showMessage('Marked done.');
    });
  }

  Future<void> _addOneDay() async {
    final current = _toat.datetime;
    if (current == null) {
      return;
    }

    await _runAction('add1d', () async {
      final updated = await context.read<ToatsProvider>().updateToat(
        _toat.id,
        <String, Object?>{
          'enrichments.time': <String, Object?>{
            ..._toat.timeEnrichment ?? {},
            'at': current.add(const Duration(hours: 24)).toIso8601String(),
          },
        },
      );
      if (!mounted) {
        return;
      }
      setState(() {
        _toat = updated;
      });
      _showMessage('+1 day.');
    });
  }

  Future<void> _reschedule() async {
    final initial = _toat.datetime ?? DateTime.now();
    final date = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: DateTime.now().subtract(const Duration(days: 1)),
      lastDate: DateTime.now().add(const Duration(days: 365 * 2)),
    );
    if (date == null || !mounted) {
      return;
    }
    final time = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.fromDateTime(initial),
    );
    if (time == null || !mounted) {
      return;
    }
    final combined = DateTime(
      date.year,
      date.month,
      date.day,
      time.hour,
      time.minute,
    );
    await _runAction('reschedule', () async {
      final updated = await context.read<ToatsProvider>().updateToat(
        _toat.id,
        <String, Object?>{
          'enrichments.time': <String, Object?>{
            ..._toat.timeEnrichment ?? {},
            'at': combined.toIso8601String(),
          },
        },
      );
      if (!mounted) {
        return;
      }
      setState(() {
        _toat = updated;
      });
      _showMessage('Rescheduled.');
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
      // No location set — open location search instead
      _openLocationSearch();
      return;
    }

    final launched = await launchUrl(uri, mode: LaunchMode.externalApplication);
    if (!launched) {
      _showMessage(
        'Could not open ${_primaryActionLabel(_toat).toLowerCase()}.',
      );
    }
  }

  void _openLocationSearch() {
    showDialog<void>(
      context: context,
      barrierDismissible: true,
      builder: (dialogCtx) => Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        insetPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 60),
        clipBehavior: Clip.hardEdge,
        child: SizedBox(
          height: MediaQuery.of(dialogCtx).size.height * 0.6,
          child: _LocationSearchContent(
            onSelect: (description) async {
              Navigator.of(dialogCtx).pop();
              await _runAction('location', () async {
                final updated = await context.read<ToatsProvider>().updateToat(
                  _toat.id,
                  <String, Object?>{'location': description},
                );
                if (!mounted) return;
                setState(() => _toat = updated);
                _showMessage('Location saved.');
              });
            },
          ),
        ),
      ),
    );
  }

  Future<void> _removeLocation() async {
    await _runAction('rm-location', () async {
      final updated = await context.read<ToatsProvider>().updateToat(
        _toat.id,
        <String, Object?>{'location': null},
      );
      if (!mounted) return;
      setState(() => _toat = updated);
      _showMessage('Location removed.');
    });
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

  // \u2500\u2500 Layout hook \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  // Single place that decides which cards to render and in what order.
  // All logic lives here; card widgets are pure presentational components.
  List<Widget> _buildCards() {
    final isMeeting = (_toat.communicationEnrichment?['joinUrl'] as String?)
            ?.isNotEmpty ==
        true;
    final isChecklist = _toat.actionEnrichment?['type'] == 'checklist';
    final hasLocation = _toat.location?.isNotEmpty == true;
    final hasNotes = (_toat.notes?.isNotEmpty == true) || _showNotesField;
    final hasChecklist = isChecklist && _checklistItems.isNotEmpty;

    return [
      _HeroCard(
        toat: _toat,
        primaryActionLabel: _primaryActionLabel(_toat),
        onPrimaryAction: _primaryAction,
      ),
      const SizedBox(height: 16),
      _ActionStripCard(
        toat: _toat,
        workingAction: _workingAction,
        onMarkDone: _workingAction == null ? _markDone : null,
        onAddOneDay:
            (_workingAction == null && _toat.datetime != null)
                ? _addOneDay
                : null,
        onReschedule: _workingAction == null ? _reschedule : null,
        onDuplicate: _workingAction == null ? _duplicate : null,
        onDelete: _workingAction == null ? _delete : null,
      ),
      const SizedBox(height: 16),
      if (isMeeting) ...[
        _MeetingDetailsCard(toat: _toat),
        const SizedBox(height: 16),
      ] else ...[
        _WhenWhereCard(
          toat: _toat,
          onChangeLocation: _workingAction == null ? _openLocationSearch : null,
          onRemoveLocation: _workingAction == null ? _removeLocation : null,
        ),
        const SizedBox(height: 16),
      ],
      if (hasLocation) ...[
        _LocationSection(
          location: _toat.location!,
          actionLabel: _primaryActionLabel(_toat),
          actionColors: _detailActionColors(_toat),
          actionIcon: _detailActionIcon(_toat),
          onChangeLocation: _workingAction == null ? _openLocationSearch : null,
          onRemoveLocation: _workingAction == null ? _removeLocation : null,
          onPrimaryAction: _workingAction == null ? _primaryAction : null,
        ),
        const SizedBox(height: 16),
      ] else ...[
        _AddLocationButton(
          onTap: _workingAction == null ? _openLocationSearch : null,
        ),
        const SizedBox(height: 16),
      ],
      if (hasChecklist) ...[
        _ChecklistCard(
          items: _checklistItems,
          saving: _savingChecklist,
          onReorder: (items) {
            setState(() => _checklistItems = items);
            _saveChecklist(items);
          },
          onToggle: (index) {
            final item =
                Map<String, dynamic>.from(_checklistItems[index]);
            item['done'] = !(item['done'] as bool? ?? false);
            final updated =
                List<Map<String, dynamic>>.from(_checklistItems);
            updated[index] = item;
            final pending =
                updated.where((x) => !(x['done'] as bool? ?? false)).toList();
            final done =
                updated.where((x) => x['done'] as bool? ?? false).toList();
            final sorted = [...pending, ...done];
            setState(() => _checklistItems = sorted);
            _saveChecklist(sorted);
          },
          onTextChanged: (index, text) {
            final item =
                Map<String, dynamic>.from(_checklistItems[index]);
            item['text'] = text;
            final updated =
                List<Map<String, dynamic>>.from(_checklistItems);
            updated[index] = item;
            setState(() => _checklistItems = updated);
            _saveChecklist(updated);
          },
          onDelete: (index) {
            final updated =
                List<Map<String, dynamic>>.from(_checklistItems)
                  ..removeAt(index);
            setState(() => _checklistItems = updated);
            _saveChecklist(updated);
          },
          onAdd: () {
            final newItem = <String, dynamic>{
              'id': DateTime.now().millisecondsSinceEpoch.toString(),
              'text': '',
              'done': false,
            };
            setState(() => _checklistItems = [..._checklistItems, newItem]);
            _saveChecklist(_checklistItems);
          },
        ),
        const SizedBox(height: 16),
      ],
      if (hasNotes) ...[
        _NotesCard(
          controller: _notesCtrl,
          onChanged: (_) {
            _notesSaveTimer?.cancel();
            _notesSaveTimer = Timer(const Duration(seconds: 2), _saveNotes);
          },
        ),
        const SizedBox(height: 16),
      ] else ...[
        _AddNotesButton(
          onTap: () => setState(() => _showNotesField = true),
        ),
        const SizedBox(height: 16),
      ],
      _DetailsCard(toat: _toat),
    ];
  }

  String _primaryActionLabel(ToatSummary toat) {
    if (_detailPhone(toat) != null) {
      return 'Call';
    }
    final joinUrl = toat.communicationEnrichment?['joinUrl'] as String?;
    if (joinUrl != null && joinUrl.isNotEmpty) return 'Join';
    if (toat.location != null && toat.location!.isNotEmpty) {
      return 'Directions';
    }

    return 'Add location';
  }

  Uri? _primaryActionUri(ToatSummary toat) {
    final phone = _detailPhone(toat);
    if (phone != null) {
      return Uri(scheme: 'tel', path: _normalizedPhone(phone));
    }

    final joinUrl = toat.communicationEnrichment?['joinUrl'] as String?;
    if (joinUrl != null && joinUrl.isNotEmpty) return _externalUri(joinUrl);

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

class _HeroCard extends StatelessWidget {
  const _HeroCard({
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
            _detailEnrichmentColors(toat).first.withValues(alpha: 0.10),
            _detailEnrichmentColors(toat).last.withValues(alpha: 0.05),
            Colors.white.withValues(alpha: 0.86),
          ],
        ),
        borderRadius: BorderRadius.circular(30),
        border: Border.all(
          color: _detailEnrichmentColors(toat).last.withValues(alpha: 0.12),
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
                    colors: _detailEnrichmentColors(toat),
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: _detailEnrichmentColors(
                        toat,
                      ).last.withValues(alpha: 0.24),
                      blurRadius: 20,
                      offset: const Offset(0, 10),
                    ),
                  ],
                ),
                child: Icon(
                  _detailEnrichmentIcon(toat),
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
                      label: _detailEnrichmentKey(toat).toUpperCase(),
                      color: _detailEnrichmentColors(toat).last,
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

class _ActionStripCard extends StatelessWidget {
  const _ActionStripCard({
    required this.toat,
    required this.workingAction,
    required this.onMarkDone,
    required this.onAddOneDay,
    required this.onReschedule,
    required this.onDuplicate,
    required this.onDelete,
  });

  final ToatSummary toat;
  final String? workingAction;
  final VoidCallback? onMarkDone;
  final VoidCallback? onAddOneDay;
  final VoidCallback? onReschedule;
  final VoidCallback? onDuplicate;
  final VoidCallback? onDelete;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 6),
      decoration: BoxDecoration(
        color: AppColors.bgElevated,
        borderRadius: BorderRadius.circular(24),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _StripAction(
            icon: Icons.check_circle_outline_rounded,
            label: workingAction == 'done' ? '\u2026' : 'Mark done',
            tint: const Color(0xFF16A34A),
            onTap: onMarkDone,
          ),
          _StripAction(
            icon: Icons.update_rounded,
            label: workingAction == 'add1d' ? '\u2026' : '+1 Day',
            tint: const Color(0xFF2563EB),
            onTap: onAddOneDay,
          ),
          _StripAction(
            icon: Icons.schedule_rounded,
            label: workingAction == 'reschedule' ? '\u2026' : 'Reschedule',
            tint: const Color(0xFF7C3AED),
            onTap: onReschedule,
          ),
          _StripAction(
            icon: Icons.copy_all_rounded,
            label: workingAction == 'duplicate' ? '\u2026' : 'Duplicate',
            tint: const Color(0xFF6B7280),
            onTap: onDuplicate,
          ),
          _StripAction(
            icon: Icons.delete_outline_rounded,
            label: workingAction == 'delete' ? '\u2026' : 'Delete',
            tint: const Color(0xFFDC2626),
            onTap: onDelete,
          ),
        ],
      ),
    );
  }
}

class _StripAction extends StatelessWidget {
  const _StripAction({
    required this.icon,
    required this.label,
    required this.tint,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final Color tint;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Opacity(
        opacity: onTap == null ? 0.45 : 1,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: tint.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Icon(icon, color: tint, size: 22),
            ),
            const SizedBox(height: 5),
            Text(
              label,
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: tint,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _WhenWhereCard extends StatelessWidget {
  const _WhenWhereCard({
    required this.toat,
    required this.onChangeLocation,
    required this.onRemoveLocation,
  });

  final ToatSummary toat;
  final VoidCallback? onChangeLocation;
  final VoidCallback? onRemoveLocation;

  String _formatWhen(ToatSummary t) {
    if (t.datetime == null) return 'Any time';
    final start = DateFormat.yMMMd().add_jm().format(t.datetime!);
    if (t.endDatetime == null) return start;
    return '$start \u2192 ${DateFormat.jm().format(t.endDatetime!)}';
  }

  @override
  Widget build(BuildContext context) {
    final loc = toat.location;
    final hasLocation = loc != null && loc.isNotEmpty;
    return _SectionCard(
      title: 'When & where',
      child: Column(
        children: [
          _InfoRow(label: 'When', value: _formatWhen(toat)),
          if (hasLocation)
            Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  SizedBox(
                    width: 84,
                    child: Text(
                      'Where',
                      style: TextStyles.smallMedium.copyWith(
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ),
                  Expanded(child: Text(loc, style: TextStyles.body)),
                  GestureDetector(
                    onTap: onChangeLocation,
                    child: Text(
                      'Change',
                      style: TextStyles.small.copyWith(
                        color: AppColors.primary,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                  const SizedBox(width: 4),
                  GestureDetector(
                    onTap: () {
                      Clipboard.setData(ClipboardData(text: loc));
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Address copied'),
                          duration: Duration(seconds: 2),
                        ),
                      );
                    },
                    child: const Padding(
                      padding: EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                      child: Icon(
                        Icons.copy_rounded,
                        size: 15,
                        color: AppColors.textMuted,
                      ),
                    ),
                  ),
                  const SizedBox(width: 4),
                  GestureDetector(
                    onTap: onRemoveLocation,
                    child: const Text(
                      '\u00d7',
                      style: TextStyle(
                        fontSize: 20,
                        color: AppColors.textMuted,
                        height: 1,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          if (toat.people.isNotEmpty)
            _InfoRow(label: 'People', value: toat.people.join(', ')),
        ],
      ),
    );
  }
}

class _MeetingDetailsCard extends StatelessWidget {
  const _MeetingDetailsCard({required this.toat});

  final ToatSummary toat;

  @override
  Widget build(BuildContext context) {
    final joinUrl =
        toat.communicationEnrichment?['joinUrl'] as String?;
    return _SectionCard(
      title: 'Meeting details',
      child: Column(
        children: [
          if (toat.datetime != null)
            _InfoRow(
              label: 'When',
              value: DateFormat.yMMMd().add_jm().format(toat.datetime!),
            ),
          if (joinUrl != null && joinUrl.isNotEmpty)
            _InfoRow(
              label: 'Link',
              value: joinUrl.replaceFirst(RegExp(r'^https?://'), ''),
            ),
          if (toat.people.isNotEmpty)
            _InfoRow(label: 'People', value: toat.people.join(', ')),
        ],
      ),
    );
  }
}

class _MapCard extends StatelessWidget {
  const _MapCard({required this.location});

  final String location;

  @override
  Widget build(BuildContext context) {
    final mapUrl = AppConfig.apiUri(
      '/api/places/staticmap',
      queryParameters: {'q': location},
    ).toString();
    return ClipRRect(
      borderRadius: BorderRadius.circular(20),
      child: SizedBox(
        height: 160,
        width: double.infinity,
        child: Image.network(
          mapUrl,
          fit: BoxFit.cover,
          loadingBuilder: (_, child, progress) {
            if (progress == null) return child;
            return Container(
              color: AppColors.bgElevated,
              child: const Center(
                child: CircularProgressIndicator(strokeWidth: 2),
              ),
            );
          },
          errorBuilder: (_, __, ___) => Container(
            color: AppColors.bgElevated,
            child: const Center(
              child: Icon(
                Icons.map_outlined,
                color: AppColors.textMuted,
                size: 32,
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _LocationSection extends StatelessWidget {
  const _LocationSection({
    required this.location,
    required this.actionLabel,
    required this.actionColors,
    required this.actionIcon,
    required this.onChangeLocation,
    required this.onRemoveLocation,
    required this.onPrimaryAction,
  });

  final String location;
  final String actionLabel;
  final List<Color> actionColors;
  final IconData actionIcon;
  final VoidCallback? onChangeLocation;
  final VoidCallback? onRemoveLocation;
  final VoidCallback? onPrimaryAction;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          decoration: BoxDecoration(
            color: AppColors.primary.withValues(alpha: 0.05),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: AppColors.primary.withValues(alpha: 0.15),
            ),
          ),
          child: Row(
            children: [
              const Icon(
                Icons.location_on_rounded,
                size: 16,
                color: AppColors.primary,
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  location,
                  style: TextStyles.small.copyWith(color: AppColors.text),
                ),
              ),
              GestureDetector(
                onTap: () {
                  Clipboard.setData(ClipboardData(text: location));
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Address copied'),
                      duration: Duration(seconds: 2),
                    ),
                  );
                },
                child: const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 4),
                  child: Icon(
                    Icons.copy_rounded,
                    size: 15,
                    color: AppColors.textMuted,
                  ),
                ),
              ),
              GestureDetector(
                onTap: onChangeLocation,
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 4),
                  child: Text(
                    'Change',
                    style: TextStyles.small.copyWith(
                      color: AppColors.primary,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ),
              GestureDetector(
                onTap: onRemoveLocation,
                child: const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 2),
                  child: Text(
                    '\u00d7',
                    style: TextStyle(
                      fontSize: 20,
                      color: AppColors.textMuted,
                      height: 1,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 10),
        _MapCard(location: location),
        const SizedBox(height: 10),
        SizedBox(
          width: double.infinity,
          child: Material(
            color: Colors.transparent,
            borderRadius: BorderRadius.circular(16),
            child: InkWell(
              borderRadius: BorderRadius.circular(16),
              onTap: onPrimaryAction,
              child: Ink(
                decoration: BoxDecoration(
                  gradient: LinearGradient(colors: actionColors),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(actionIcon, color: Colors.white, size: 20),
                      const SizedBox(width: 8),
                      Text(
                        actionLabel,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _AddLocationButton extends StatelessWidget {
  const _AddLocationButton({required this.onTap});

  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          border: Border.all(
            color: AppColors.primary.withValues(alpha: 0.25),
          ),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Row(
          children: [
            const Icon(
              Icons.add_location_alt_outlined,
              size: 20,
              color: AppColors.primary,
            ),
            const SizedBox(width: 8),
            Text(
              'Add location',
              style:
                  TextStyles.bodyMedium.copyWith(color: AppColors.primary),
            ),
          ],
        ),
      ),
    );
  }
}

class _NotesCard extends StatelessWidget {
  const _NotesCard({required this.controller, required this.onChanged});

  final TextEditingController controller;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    return _SectionCard(
      title: 'Notes',
      child: TextField(
        controller: controller,
        maxLines: null,
        style: TextStyles.body.copyWith(color: AppColors.text, height: 1.6),
        decoration: const InputDecoration(
          isDense: true,
          contentPadding: EdgeInsets.zero,
          border: InputBorder.none,
          hintText: 'Add a note\u2026',
        ),
        onChanged: onChanged,
      ),
    );
  }
}

class _AddNotesButton extends StatelessWidget {
  const _AddNotesButton({required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          border: Border.all(
            color: AppColors.primary.withValues(alpha: 0.25),
          ),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Row(
          children: [
            const Icon(Icons.add_rounded, size: 20, color: AppColors.primary),
            const SizedBox(width: 8),
            Text(
              'Add notes',
              style:
                  TextStyles.bodyMedium.copyWith(color: AppColors.primary),
            ),
          ],
        ),
      ),
    );
  }
}

class _DetailsCard extends StatelessWidget {
  const _DetailsCard({required this.toat});

  final ToatSummary toat;

  @override
  Widget build(BuildContext context) {
    return _SectionCard(
      title: 'Details',
      child: Column(
        children: [
          _InfoRow(label: 'Tier', value: toat.tier),
          _InfoRow(label: 'State', value: toat.state),
          if (toat.createdAt != null)
            _InfoRow(
              label: 'Captured',
              value: DateFormat.yMMMd().add_jm().format(toat.createdAt!),
            ),
        ],
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
  final joinUrl = toat.communicationEnrichment?['joinUrl'] as String?;
  if (joinUrl != null && joinUrl.isNotEmpty) {
    return _meetingPlatform(joinUrl);
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

/// Returns phone from communication enrichment.
String? _detailPhone(ToatSummary toat) {
  final phone = toat.communicationEnrichment?['phone'];
  if (phone is String && phone.isNotEmpty) return phone;
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

/// Derives a "kind key" from enrichments for color/icon dispatch.
String _detailEnrichmentKey(ToatSummary toat) {
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

List<Color> _detailEnrichmentColors(ToatSummary toat) =>
    _detailTemplateColors(_detailEnrichmentKey(toat));

IconData _detailEnrichmentIcon(ToatSummary toat) =>
    _detailTemplateIcon(_detailEnrichmentKey(toat));

IconData _detailActionIcon(ToatSummary toat) {
  if (_detailPhone(toat) != null) return Icons.call_rounded;
  final joinUrl = toat.communicationEnrichment?['joinUrl'] as String?;
  if (joinUrl != null && joinUrl.isNotEmpty) return Icons.videocam_rounded;
  if (toat.location != null && toat.location!.isNotEmpty) {
    return Icons.drive_eta_rounded;
  }
  return Icons.add_location_alt_outlined;
}

List<Color> _detailActionColors(ToatSummary toat) {
  if (_detailPhone(toat) != null) {
    return const [Color(0xFFFB7185), Color(0xFFEC4899)];
  }
  final joinUrl = toat.communicationEnrichment?['joinUrl'] as String?;
  if (joinUrl != null && joinUrl.isNotEmpty) {
    return const [Color(0xFF3B82F6), Color(0xFF2563EB)];
  }
  if (toat.location != null && toat.location!.isNotEmpty) {
    return const [Color(0xFF7C3AED), Color(0xFF6D28D9)];
  }
  return const [Color(0xFF8B5CF6), Color(0xFFEC4899)];
}

// ---------------------------------------------------------------------------
// Checklist section — interactive, drag-reorderable
// ---------------------------------------------------------------------------

class _ChecklistCard extends StatefulWidget {
  const _ChecklistCard({
    required this.items,
    required this.saving,
    required this.onReorder,
    required this.onToggle,
    required this.onTextChanged,
    required this.onDelete,
    required this.onAdd,
  });

  final List<Map<String, dynamic>> items;
  final bool saving;
  final void Function(List<Map<String, dynamic>> items) onReorder;
  final void Function(int index) onToggle;
  final void Function(int index, String text) onTextChanged;
  final void Function(int index) onDelete;
  final VoidCallback onAdd;

  @override
  State<_ChecklistCard> createState() => _ChecklistCardState();
}

class _ChecklistCardState extends State<_ChecklistCard> {
  final Map<int, TextEditingController> _controllers = {};
  final Map<int, FocusNode> _focusNodes = {};

  @override
  void dispose() {
    for (final c in _controllers.values) {
      c.dispose();
    }
    for (final f in _focusNodes.values) {
      f.dispose();
    }
    super.dispose();
  }

  TextEditingController _ctrl(int index, String text) {
    return _controllers.putIfAbsent(
      index,
      () => TextEditingController(text: text),
    );
  }

  FocusNode _focus(int index) {
    return _focusNodes.putIfAbsent(index, () => FocusNode());
  }

  @override
  Widget build(BuildContext context) {
    final items = widget.items;
    final doneCount = items.where((x) => x['done'] as bool? ?? false).length;

    return Container(
      decoration: BoxDecoration(
        color: AppColors.bgElevated,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(18, 16, 18, 10),
            child: Row(
              children: [
                Text(
                  'Checklist',
                  style: TextStyles.bodyMedium.copyWith(
                    color: AppColors.textSecondary,
                  ),
                ),
                const Spacer(),
                if (widget.saving)
                  const SizedBox(
                    width: 14,
                    height: 14,
                    child: CircularProgressIndicator(strokeWidth: 1.5),
                  )
                else
                  Text(
                    '$doneCount/${items.length}',
                    style: TextStyles.small.copyWith(
                      color: AppColors.textMuted,
                    ),
                  ),
              ],
            ),
          ),
          ReorderableListView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: items.length,
            onReorder: (oldIndex, newIndex) {
              final updated = [...items];
              if (newIndex > oldIndex) newIndex -= 1;
              final item = updated.removeAt(oldIndex);
              updated.insert(newIndex, item);
              // Rebuild controllers map to match new order
              _controllers.clear();
              _focusNodes.clear();
              widget.onReorder(updated);
            },
            itemBuilder: (context, index) {
              final item = items[index];
              final done = item['done'] as bool? ?? false;
              final text = item['text'] as String? ?? '';
              final ctrl = _ctrl(index, text);
              final focus = _focus(index);

              // Keep controller text in sync when items reorder
              if (ctrl.text != text && !focus.hasFocus) {
                ctrl.text = text;
              }

              return KeyedSubtree(
                key: ValueKey(item['id'] ?? index),
                child: Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 3,
                  ),
                  child: Row(
                    children: [
                      // Drag handle
                      const Icon(
                        Icons.drag_handle_rounded,
                        size: 18,
                        color: AppColors.textMuted,
                      ),
                      const SizedBox(width: 4),
                      // Checkbox
                      SizedBox(
                        width: 32,
                        height: 32,
                        child: Checkbox(
                          value: done,
                          onChanged: (_) => widget.onToggle(index),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(6),
                          ),
                        ),
                      ),
                      // Text field
                      Expanded(
                        child: TextField(
                          controller: ctrl,
                          focusNode: focus,
                          style: TextStyles.body.copyWith(
                            color: done ? AppColors.textMuted : AppColors.text,
                            decoration: done
                                ? TextDecoration.lineThrough
                                : TextDecoration.none,
                          ),
                          decoration: const InputDecoration(
                            isDense: true,
                            contentPadding: EdgeInsets.zero,
                            border: InputBorder.none,
                          ),
                          onChanged: (v) => widget.onTextChanged(index, v),
                        ),
                      ),
                      // Delete button
                      GestureDetector(
                        onTap: () => widget.onDelete(index),
                        child: const Padding(
                          padding: EdgeInsets.all(8),
                          child: Icon(
                            Icons.close_rounded,
                            size: 16,
                            color: AppColors.textMuted,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
          // Add item button
          Padding(
            padding: const EdgeInsets.fromLTRB(12, 4, 12, 14),
            child: TextButton.icon(
              onPressed: widget.onAdd,
              icon: const Icon(Icons.add_rounded, size: 18),
              label: const Text('Add item'),
              style: TextButton.styleFrom(
                foregroundColor: AppColors.primary,
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Location search dialog content — uses Google Places Autocomplete REST API
// ---------------------------------------------------------------------------

class _LocationSearchContent extends StatefulWidget {
  const _LocationSearchContent({required this.onSelect});

  final void Function(String description) onSelect;

  @override
  State<_LocationSearchContent> createState() => _LocationSearchContentState();
}

class _LocationSearchContentState extends State<_LocationSearchContent> {
  final _ctrl = TextEditingController();
  Timer? _debounce;
  List<Map<String, String>> _suggestions = [];
  bool _searching = false;

  @override
  void dispose() {
    _ctrl.dispose();
    _debounce?.cancel();
    super.dispose();
  }

  void _onQueryChanged(String q) {
    _debounce?.cancel();
    if (q.trim().isEmpty) {
      setState(() => _suggestions = []);
      return;
    }
    _debounce = Timer(
      const Duration(milliseconds: 300),
      () => _fetchSuggestions(q),
    );
  }

  Future<void> _fetchSuggestions(String q) async {
    setState(() => _searching = true);
    try {
      final uri = AppConfig.apiUri(
        '/api/places/autocomplete',
        queryParameters: {'q': q},
      );
      final response = await http.get(uri);
      if (!mounted) return;
      final body = jsonDecode(response.body) as Map<String, dynamic>;
      final predictions = (body['predictions'] as List<dynamic>? ?? [])
          .map(
            (p) => <String, String>{
              'placeId':
                  (p as Map<String, dynamic>)['place_id'] as String? ?? '',
              'description': p['description'] as String? ?? '',
            },
          )
          .where((p) => p['description']!.isNotEmpty)
          .toList();
      setState(() {
        _suggestions = predictions;
        _searching = false;
      });
    } catch (_) {
      if (mounted) {
        setState(() {
          _searching = false;
          _suggestions = [];
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 20, 8, 0),
          child: Row(
            children: [
              Text('Add location', style: TextStyles.heading3),
              const Spacer(),
              IconButton(
                icon: const Icon(Icons.close_rounded),
                onPressed: () => Navigator.of(context).pop(),
              ),
            ],
          ),
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: TextField(
            controller: _ctrl,
            autofocus: true,
            onChanged: _onQueryChanged,
            decoration: InputDecoration(
              hintText: 'Search for a place or address…',
              prefixIcon: const Icon(Icons.search_rounded, size: 20),
              suffixIcon: _searching
                  ? const Padding(
                      padding: EdgeInsets.all(12),
                      child: SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      ),
                    )
                  : null,
              filled: true,
              fillColor: AppColors.bgSecondary,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide.none,
              ),
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 14,
                vertical: 12,
              ),
            ),
          ),
        ),
        Flexible(
          child: ListView.builder(
            shrinkWrap: true,
            itemCount: _suggestions.length,
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            itemBuilder: (context, index) {
              final s = _suggestions[index];
              return ListTile(
                leading: const Icon(
                  Icons.location_on_rounded,
                  color: AppColors.primary,
                ),
                title: Text(s['description'] ?? '', style: TextStyles.body),
                onTap: () => widget.onSelect(s['description'] ?? ''),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10),
                ),
              );
            },
          ),
        ),
        const SizedBox(height: 8),
      ],
    );
  }
}
