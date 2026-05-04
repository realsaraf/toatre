import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:http/http.dart' as http;
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
                            label: _workingAction == 'add1d'
                                ? 'Saving…'
                                : '+1 Day',
                            onTap:
                                _workingAction == null && _toat.datetime != null
                                ? _addOneDay
                                : null,
                          ),
                          _ActionChip(
                            label: _workingAction == 'reschedule'
                                ? 'Saving…'
                                : 'Reschedule',
                            onTap: _workingAction == null ? _reschedule : null,
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
                          if (!_showNotesField &&
                              (_toat.notes == null || _toat.notes!.isEmpty))
                            _ActionChip(
                              label: 'Add notes',
                              onTap: () =>
                                  setState(() => _showNotesField = true),
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
                                  Expanded(
                                    child: Text(
                                      _toat.location!,
                                      style: TextStyles.body,
                                    ),
                                  ),
                                  GestureDetector(
                                    onTap: _workingAction == null
                                        ? _openLocationSearch
                                        : null,
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
                                      Clipboard.setData(
                                        ClipboardData(text: _toat.location!),
                                      );
                                      ScaffoldMessenger.of(
                                        context,
                                      ).showSnackBar(
                                        const SnackBar(
                                          content: Text('Address copied'),
                                          duration: Duration(seconds: 2),
                                        ),
                                      );
                                    },
                                    child: const Padding(
                                      padding: EdgeInsets.symmetric(
                                        horizontal: 4,
                                        vertical: 2,
                                      ),
                                      child: Icon(
                                        Icons.copy_rounded,
                                        size: 15,
                                        color: AppColors.textMuted,
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 4),
                                  GestureDetector(
                                    onTap: _workingAction == null
                                        ? _removeLocation
                                        : null,
                                    child: const Text(
                                      '×',
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
                    if (_toat.location != null &&
                        _toat.location!.isNotEmpty) ...[
                      const SizedBox(height: 10),
                      // Decorative map preview
                      ClipRRect(
                        borderRadius: BorderRadius.circular(20),
                        child: Container(
                          height: 150,
                          width: double.infinity,
                          decoration: const BoxDecoration(
                            gradient: LinearGradient(
                              begin: Alignment.topCenter,
                              end: Alignment.bottomCenter,
                              colors: [Color(0xFFF8FAFC), Color(0xFFF3F4F6)],
                            ),
                          ),
                          child: Stack(
                            children: [
                              // Grid lines
                              CustomPaint(
                                size: Size.infinite,
                                painter: _MapGridPainter(),
                              ),
                              // Pin
                              Positioned(
                                left: MediaQuery.of(context).size.width * 0.46,
                                top: 42,
                                child: Transform.rotate(
                                  angle: -0.785,
                                  child: Container(
                                    width: 22,
                                    height: 22,
                                    decoration: const BoxDecoration(
                                      gradient: LinearGradient(
                                        colors: [
                                          Color(0xFF7C3AED),
                                          Color(0xFF5B3DF5),
                                        ],
                                      ),
                                      borderRadius: BorderRadius.only(
                                        topLeft: Radius.circular(11),
                                        topRight: Radius.circular(11),
                                        bottomLeft: Radius.circular(0),
                                        bottomRight: Radius.circular(11),
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                              // Address label
                              Positioned(
                                bottom: 10,
                                left: 10,
                                right: 10,
                                child: Text(
                                  _toat.location!,
                                  style: const TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w700,
                                    color: Color(0xFF6D28D9),
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  textAlign: TextAlign.center,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 10),
                      SizedBox(
                        width: double.infinity,
                        child: Material(
                          color: AppColors.primary,
                          borderRadius: BorderRadius.circular(16),
                          child: InkWell(
                            borderRadius: BorderRadius.circular(16),
                            onTap: () async {
                              final uri = _primaryActionUri(_toat);
                              if (uri != null) {
                                await launchUrl(
                                  uri,
                                  mode: LaunchMode.externalApplication,
                                );
                              }
                            },
                            child: const Padding(
                              padding: EdgeInsets.symmetric(vertical: 14),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(
                                    Icons.directions_rounded,
                                    color: Colors.white,
                                    size: 20,
                                  ),
                                  SizedBox(width: 8),
                                  Text(
                                    'Directions',
                                    style: TextStyle(
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
                    ],
                    if ((_toat.notes != null && _toat.notes!.isNotEmpty) ||
                        _showNotesField) ...[
                      const SizedBox(height: 16),
                      _SectionCard(
                        title: 'About this toat',
                        child: TextField(
                          controller: _notesCtrl,
                          maxLines: null,
                          style: TextStyles.body.copyWith(
                            color: AppColors.text,
                            height: 1.6,
                          ),
                          decoration: const InputDecoration(
                            isDense: true,
                            contentPadding: EdgeInsets.zero,
                            border: InputBorder.none,
                          ),
                          onChanged: (_) {
                            _notesSaveTimer?.cancel();
                            _notesSaveTimer = Timer(
                              const Duration(seconds: 2),
                              _saveNotes,
                            );
                          },
                        ),
                      ),
                    ],
                    if (_toat.template == 'checklist' &&
                        _checklistItems.isNotEmpty) ...[
                      const SizedBox(height: 16),
                      _ChecklistSection(
                        items: _checklistItems,
                        saving: _savingChecklist,
                        onReorder: (items) {
                          setState(() => _checklistItems = items);
                          _saveChecklist(items);
                        },
                        onToggle: (index) {
                          final item = Map<String, dynamic>.from(
                            _checklistItems[index],
                          );
                          item['done'] = !(item['done'] as bool? ?? false);
                          final updated = [..._checklistItems];
                          updated[index] = item;
                          // Move done items to bottom
                          final pending = updated
                              .where((x) => !(x['done'] as bool? ?? false))
                              .toList();
                          final done = updated
                              .where((x) => x['done'] as bool? ?? false)
                              .toList();
                          final sorted = [...pending, ...done];
                          setState(() => _checklistItems = sorted);
                          _saveChecklist(sorted);
                        },
                        onTextChanged: (index, text) {
                          final item = Map<String, dynamic>.from(
                            _checklistItems[index],
                          );
                          item['text'] = text;
                          final updated = [..._checklistItems];
                          updated[index] = item;
                          setState(() => _checklistItems = updated);
                          _saveChecklist(updated);
                        },
                        onDelete: (index) {
                          final updated = [..._checklistItems]..removeAt(index);
                          setState(() => _checklistItems = updated);
                          _saveChecklist(updated);
                        },
                        onAdd: () {
                          final newItem = <String, dynamic>{
                            'id': DateTime.now().millisecondsSinceEpoch
                                .toString(),
                            'text': '',
                            'done': false,
                          };
                          final updated = [..._checklistItems, newItem];
                          setState(() => _checklistItems = updated);
                          _saveChecklist(updated);
                        },
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
      // Sync checklist items from templateData
      List<Map<String, dynamic>> items = [];
      if (toat.template == 'checklist') {
        final raw = toat.templateData['items'];
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
          'templateData': <String, Object?>{
            ..._toat.templateData,
            'items': items,
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

  Future<void> _addOneDay() async {
    final current = _toat.datetime;
    if (current == null) {
      return;
    }

    await _runAction('add1d', () async {
      final updated = await context.read<ToatsProvider>().updateToat(
        _toat.id,
        <String, Object?>{
          'datetime': current.add(const Duration(hours: 24)).toIso8601String(),
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
        <String, Object?>{'datetime': combined.toIso8601String()},
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

    return 'Add location';
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
    return Icons.drive_eta_rounded;
  }
  return Icons.add_location_alt_outlined;
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

// ---------------------------------------------------------------------------
// Checklist section — interactive, drag-reorderable
// ---------------------------------------------------------------------------

class _ChecklistSection extends StatefulWidget {
  const _ChecklistSection({
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
  State<_ChecklistSection> createState() => _ChecklistSectionState();
}

class _ChecklistSectionState extends State<_ChecklistSection> {
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
      const apiKey = String.fromEnvironment('GOOGLE_MAPS_API_KEY');
      if (apiKey.isEmpty) {
        setState(() {
          _searching = false;
          _suggestions = [];
        });
        return;
      }
      final uri = Uri.parse(
        'https://maps.googleapis.com/maps/api/place/autocomplete/json'
        '?input=${Uri.encodeComponent(q)}&key=$apiKey&types=geocode|establishment',
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

class _MapGridPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = const Color(0xFF94A3B8).withValues(alpha: 0.18)
      ..strokeWidth = 1;
    const step = 44.0;
    for (double y = 0; y < size.height; y += step) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), paint);
    }
    for (double x = 0; x < size.width; x += step) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), paint);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
