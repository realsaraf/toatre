import 'dart:async';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

import 'package:toatre/models/toat_summary.dart';
import 'package:toatre/providers/toats_provider.dart';
import 'package:toatre/services/analytics_service.dart';
import 'package:toatre/ui/toat/share_toat_screen.dart';
import 'package:toatre/utils/app_colors.dart';
import 'package:toatre/utils/text_styles.dart';
import 'package:toatre/widgets/toat_detail/action_strip_card.dart';
import 'package:toatre/widgets/toat_detail/checklist_card.dart';
import 'package:toatre/widgets/toat_detail/details_card.dart';
import 'package:toatre/widgets/toat_detail/hero_card.dart';
import 'package:toatre/widgets/toat_detail/location_search_content.dart';
import 'package:toatre/widgets/toat_detail/location_section.dart';
import 'package:toatre/widgets/toat_detail/meeting_details_card.dart';
import 'package:toatre/widgets/toat_detail/notes_card.dart';
import 'package:toatre/widgets/toat_detail/pill.dart';
import 'package:toatre/widgets/toat_detail/toat_detail_utils.dart';
import 'package:toatre/widgets/toat_detail/when_where_card.dart';

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
                  IconCircleButton(
                    icon: Icons.arrow_back_rounded,
                    onTap: () => Navigator.of(context).pop(),
                  ),
                  const SizedBox(width: 12),
                  Expanded(child: Text('Toat', style: TextStyles.heading2)),
                  IconCircleButton(
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
          child: LocationSearchContent(
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
    final isMeeting =
        (_toat.communicationEnrichment?['joinUrl'] as String?)?.isNotEmpty ==
        true;
    final isChecklist = _toat.actionEnrichment?['type'] == 'checklist';
    final hasLocation = _toat.location?.isNotEmpty == true;
    final hasNotes = (_toat.notes?.isNotEmpty == true) || _showNotesField;
    final hasChecklist = isChecklist && _checklistItems.isNotEmpty;

    return [
      HeroCard(
        toat: _toat,
        primaryActionLabel: _primaryActionLabel(_toat),
        onPrimaryAction: _primaryAction,
      ),
      const SizedBox(height: 16),
      ActionStripCard(
        toat: _toat,
        workingAction: _workingAction,
        onMarkDone: _workingAction == null ? _markDone : null,
        onAddOneDay: (_workingAction == null && _toat.datetime != null)
            ? _addOneDay
            : null,
        onReschedule: _workingAction == null ? _reschedule : null,
        onDuplicate: _workingAction == null ? _duplicate : null,
        onDelete: _workingAction == null ? _delete : null,
      ),
      const SizedBox(height: 16),
      if (isMeeting) ...[
        MeetingDetailsCard(toat: _toat),
        const SizedBox(height: 16),
      ] else ...[
        WhenWhereCard(
          toat: _toat,
          onChangeLocation: _workingAction == null ? _openLocationSearch : null,
          onRemoveLocation: _workingAction == null ? _removeLocation : null,
        ),
        const SizedBox(height: 16),
      ],
      if (hasLocation) ...[
        LocationSection(
          location: _toat.location!,
          actionLabel: _primaryActionLabel(_toat),
          actionColors: detailActionColors(_toat),
          actionIcon: detailActionIcon(_toat),
          onChangeLocation: _workingAction == null ? _openLocationSearch : null,
          onRemoveLocation: _workingAction == null ? _removeLocation : null,
          onPrimaryAction: _workingAction == null ? _primaryAction : null,
        ),
        const SizedBox(height: 16),
      ] else ...[
        AddLocationButton(
          onTap: _workingAction == null ? _openLocationSearch : null,
        ),
        const SizedBox(height: 16),
      ],
      if (hasChecklist) ...[
        ChecklistCard(
          items: _checklistItems,
          saving: _savingChecklist,
          onReorder: (items) {
            setState(() => _checklistItems = items);
            _saveChecklist(items);
          },
          onToggle: (index) {
            final item = Map<String, dynamic>.from(_checklistItems[index]);
            item['done'] = !(item['done'] as bool? ?? false);
            final updated = List<Map<String, dynamic>>.from(_checklistItems);
            updated[index] = item;
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
            final item = Map<String, dynamic>.from(_checklistItems[index]);
            item['text'] = text;
            final updated = List<Map<String, dynamic>>.from(_checklistItems);
            updated[index] = item;
            setState(() => _checklistItems = updated);
            _saveChecklist(updated);
          },
          onDelete: (index) {
            final updated = List<Map<String, dynamic>>.from(_checklistItems)
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
        NotesCard(
          controller: _notesCtrl,
          onChanged: (_) {
            _notesSaveTimer?.cancel();
            _notesSaveTimer = Timer(const Duration(seconds: 2), _saveNotes);
          },
        ),
        const SizedBox(height: 16),
      ] else ...[
        AddNotesButton(onTap: () => setState(() => _showNotesField = true)),
        const SizedBox(height: 16),
      ],
      DetailsCard(toat: _toat),
    ];
  }

  String _primaryActionLabel(ToatSummary toat) {
    if (detailPhone(toat) != null) {
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
    final phone = detailPhone(toat);
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
