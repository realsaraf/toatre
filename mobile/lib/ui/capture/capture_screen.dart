import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'package:toatre/models/toat_summary.dart';
import 'package:toatre/providers/capture_provider.dart';
import 'package:toatre/providers/toats_provider.dart';
import 'package:toatre/services/api_service.dart';
import 'package:toatre/ui/timeline/timeline_screen.dart';
import 'package:toatre/utils/app_colors.dart';
import 'package:toatre/utils/text_styles.dart';
import 'package:toatre/widgets/toatre_mark.dart';

class CaptureScreen extends StatefulWidget {
  const CaptureScreen({super.key});

  @override
  State<CaptureScreen> createState() => _CaptureScreenState();
}

class _CaptureScreenState extends State<CaptureScreen> {
  late final TextEditingController _textController;

  @override
  void initState() {
    super.initState();
    _textController = TextEditingController();
  }

  @override
  void dispose() {
    _textController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      body: SafeArea(
        child: Column(
          children: [
            const _CaptureTopNav(),
            Expanded(
              child: Consumer<CaptureProvider>(
                builder: (context, capture, _) {
                  if (capture.isReviewing) {
                    return _ReviewState(capture: capture);
                  }

                  if (capture.isTextMode) {
                    return _TextCaptureState(
                      capture: capture,
                      controller: _textController,
                      onOpenVoiceMode: () =>
                          capture.setMode(CaptureInputMode.voice),
                    );
                  }

                  return _ListeningState(
                    capture: capture,
                    onOpenTextMode: () =>
                        capture.setMode(CaptureInputMode.text),
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

class _ListeningState extends StatelessWidget {
  const _ListeningState({required this.capture, required this.onOpenTextMode});

  final CaptureProvider capture;
  final VoidCallback onOpenTextMode;

  @override
  Widget build(BuildContext context) {
    final isRecording = capture.isRecording;
    final isProcessing = capture.isProcessing;

    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(28, 34, 28, 28),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Capture', style: TextStyles.display.copyWith(fontSize: 34)),
          const SizedBox(height: 10),
          Text(
            isRecording
                ? 'Tap the mic to stop when you\'re done.'
                : 'Tap the mic and tell me what\'s on your mind.',
            style: TextStyles.heading3.copyWith(
              color: AppColors.textSecondary,
              height: 1.35,
            ),
          ),
          const SizedBox(height: 12),
          const _LiveBadge(),
          const SizedBox(height: 28),
          _ModeToggle(
            activeMode: CaptureInputMode.voice,
            onVoiceTap: () => capture.setMode(CaptureInputMode.voice),
            onTextTap: onOpenTextMode,
          ),
          const SizedBox(height: 30),
          Center(
            child: Text(
              isProcessing
                  ? 'Thinking...'
                  : isRecording
                  ? 'Listening...'
                  : 'Ready when you are',
              style: TextStyles.bodyMedium.copyWith(
                color: isRecording || isProcessing
                    ? AppColors.primary
                    : AppColors.textMuted,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          const SizedBox(height: 8),
          _VoiceControl(
            waveform: capture.waveform,
            isRecording: isRecording,
            isProcessing: isProcessing,
            onTap: isProcessing
                ? null
                : isRecording
                ? capture.stopRecording
                : capture.startRecording,
          ),
          if (isRecording) ...[
            const SizedBox(height: 8),
            Center(
              child: Text(
                _formatElapsed(capture.elapsedSeconds),
                style: TextStyles.heading2.copyWith(color: AppColors.primary),
              ),
            ),
          ],
          const SizedBox(height: 18),
          _TranscriptCard(
            text: capture.transcript.isNotEmpty
                ? capture.transcript
                : isRecording
                ? 'I\'m listening for multiple toats in one capture.'
                : 'You can say multiple things - I\'ll organise them for you.',
            hasTranscript: capture.transcript.isNotEmpty,
          ),
          if (capture.error != null) ...[
            const SizedBox(height: 12),
            Text(
              capture.error!,
              style: TextStyles.smallMedium.copyWith(color: AppColors.error),
            ),
          ],
          if (isRecording || isProcessing) ...[
            const SizedBox(height: 14),
            Center(
              child: TextButton.icon(
                onPressed: isProcessing
                    ? null
                    : () {
                        capture.reset();
                        Navigator.of(context).pop();
                      },
                icon: const Icon(Icons.close_rounded),
                label: const Text('Cancel'),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _TextCaptureState extends StatelessWidget {
  const _TextCaptureState({
    required this.capture,
    required this.controller,
    required this.onOpenVoiceMode,
  });

  final CaptureProvider capture;
  final TextEditingController controller;
  final VoidCallback onOpenVoiceMode;

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(28, 34, 28, 28),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Capture', style: TextStyles.display.copyWith(fontSize: 34)),
          const SizedBox(height: 10),
          Text(
            'Type whatever is on your mind. Toatre will split it into toats for you.',
            style: TextStyles.heading3.copyWith(
              color: AppColors.textSecondary,
              height: 1.4,
            ),
          ),
          const SizedBox(height: 12),
          const _LiveBadge(),
          const SizedBox(height: 28),
          _ModeToggle(
            activeMode: CaptureInputMode.text,
            onVoiceTap: onOpenVoiceMode,
            onTextTap: () {},
          ),
          const SizedBox(height: 22),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.94),
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: const Color(0xE6FFFFFF)),
              boxShadow: const [
                BoxShadow(
                  color: Color(0x120F172A),
                  blurRadius: 42,
                  offset: Offset(0, 18),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  capture.isProcessing
                      ? 'Capturing your note...'
                      : 'Paste a brain dump or type a quick note',
                  style: TextStyles.small.copyWith(color: AppColors.textMuted),
                ),
                const SizedBox(height: 14),
                Container(
                  decoration: BoxDecoration(
                    color: const Color(0xFFFBFAFF),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: const Color(0xFFE6E0FF)),
                  ),
                  child: TextField(
                    controller: controller,
                    maxLines: 7,
                    minLines: 7,
                    textInputAction: TextInputAction.newline,
                    decoration: InputDecoration(
                      hintText:
                          'Try: Pick up son from Sunday school at 1, join the 2 p.m. team meeting, and remind me to send the deck tonight.',
                      contentPadding: const EdgeInsets.all(16),
                      hintStyle: TextStyles.body.copyWith(
                        color: AppColors.textMuted,
                      ),
                      border: InputBorder.none,
                    ),
                    style: TextStyles.body.copyWith(
                      color: const Color(0xFF111827),
                      height: 1.5,
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  'Toatre can split one typed note into multiple toats.',
                  style: TextStyles.small.copyWith(color: AppColors.textMuted),
                ),
                const SizedBox(height: 14),
                SizedBox(
                  height: 52,
                  child: ElevatedButton(
                    onPressed: capture.isProcessing
                        ? null
                        : () => capture.submitTextCapture(controller.text),
                    child: Text(
                      capture.isProcessing
                          ? 'Capturing...'
                          : 'Capture from text',
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          if (capture.error != null)
            Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: Text(
                capture.error!,
                style: TextStyles.smallMedium.copyWith(color: AppColors.error),
              ),
            ),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              SizedBox(
                width: 128,
                child: TextButton(
                  onPressed: capture.isProcessing
                      ? null
                      : () {
                          capture.reset();
                          Navigator.of(context).pop();
                        },
                  child: const Text('Cancel'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _ReviewState extends StatefulWidget {
  const _ReviewState({required this.capture});

  final CaptureProvider capture;

  @override
  State<_ReviewState> createState() => _ReviewStateState();
}

class _ReviewStateState extends State<_ReviewState> {
  bool _committing = false;

  Future<void> _handleCommit() async {
    if (widget.capture.selectedCount == 0) return;
    setState(() => _committing = true);
    try {
      await widget.capture.commitCapture();
      if (!mounted) return;
      await context.read<ToatsProvider>().fetchToats();
      widget.capture.reset();
      if (!mounted) return;
      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute<void>(builder: (_) => const TimelineScreen()),
        (_) => false,
      );
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(e.toString())));
      }
    } finally {
      if (mounted) setState(() => _committing = false);
    }
  }

  void _handleCancel() {
    widget.capture.reset();
    Navigator.of(context).pop();
  }

  void _openEditModal(ToatSummary toat) {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _EditCaptureToatModal(
        toat: toat,
        onSave: (updated) {
          widget.capture.updateToatLocally(updated);
          // Also patch the server
          final api = ApiService.instance;
          api.patchJson(
            '/api/toats/${toat.id}',
            body: <String, Object?>{
              'title': updated.title,
              'datetime': updated.datetime?.toIso8601String(),
              'location': updated.location,
            },
            authenticated: true,
          );
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final capture = widget.capture;
    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 24, 24, 28),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              IconButton(
                onPressed: _handleCancel,
                icon: const Icon(Icons.arrow_back_rounded),
              ),
              const Spacer(),
              Text('Captured', style: TextStyles.heading2),
              const Spacer(),
              TextButton(onPressed: _handleCancel, child: const Text('Cancel')),
            ],
          ),
          const SizedBox(height: 18),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(22),
              boxShadow: const [
                BoxShadow(
                  color: Color(0x120F172A),
                  blurRadius: 22,
                  offset: Offset(0, 10),
                ),
              ],
            ),
            child: Text(
              capture.transcript,
              style: TextStyles.body.copyWith(
                color: const Color(0xFF111827),
                height: 1.6,
              ),
            ),
          ),
          const SizedBox(height: 18),
          Text(
            '${capture.toats.length} toats found',
            style: TextStyles.bodyMedium.copyWith(
              color: AppColors.textSecondary,
            ),
          ),
          const SizedBox(height: 10),
          Align(
            alignment: Alignment.centerRight,
            child: TextButton.icon(
              onPressed: capture.toats.isEmpty
                  ? null
                  : capture.toggleAllSelections,
              icon: Icon(
                capture.selectedCount == capture.toats.length
                    ? Icons.check_circle_rounded
                    : Icons.radio_button_unchecked_rounded,
              ),
              label: Text(
                capture.selectedCount == capture.toats.length
                    ? 'All selected'
                    : 'Select all',
              ),
            ),
          ),
          const SizedBox(height: 12),
          Expanded(
            child: ListView.separated(
              itemCount: capture.toats.length,
              separatorBuilder: (_, __) => const SizedBox(height: 12),
              itemBuilder: (context, index) {
                final toat = capture.toats[index];
                return _CaptureToatCard(
                  toat: toat,
                  selected: capture.isSelected(toat.id),
                  onToggle: () => capture.toggleSelection(toat.id),
                  onEdit: () => _openEditModal(toat),
                );
              },
            ),
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: (capture.selectedCount == 0 || _committing)
                  ? null
                  : _handleCommit,
              child: Text(
                _committing
                    ? 'Adding…'
                    : 'Add to timeline (${capture.selectedCount})',
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _CaptureTopNav extends StatelessWidget {
  const _CaptureTopNav();

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 64,
      padding: const EdgeInsets.symmetric(horizontal: 24),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.76),
        border: const Border(bottom: BorderSide(color: Color(0xFFE6E0FF))),
      ),
      child: Row(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(11),
            child: Image.asset(
              'assets/images/icon.png',
              width: 32,
              height: 32,
              fit: BoxFit.cover,
            ),
          ),
          const SizedBox(width: 8),
          const ToatreMark(fontSize: 22),
          const Spacer(),
          Text(
            'Timeline',
            style: TextStyles.bodyMedium.copyWith(
              color: AppColors.textSecondary,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(width: 22),
          CircleAvatar(
            radius: 18,
            backgroundColor: const Color(0xFFF2F4F8),
            child: Icon(Icons.person_rounded, color: AppColors.textSecondary),
          ),
        ],
      ),
    );
  }
}

class _LiveBadge extends StatelessWidget {
  const _LiveBadge();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      decoration: BoxDecoration(
        color: const Color(0xFFF8F5FF),
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: const Color(0x22A855F7)),
      ),
      child: Text(
        'Toatre listens, you live.',
        style: TextStyles.smallMedium.copyWith(color: AppColors.primary),
      ),
    );
  }
}

class _VoiceControl extends StatelessWidget {
  const _VoiceControl({
    required this.waveform,
    required this.isRecording,
    required this.isProcessing,
    required this.onTap,
  });

  final List<double> waveform;
  final bool isRecording;
  final bool isProcessing;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      height: 178,
      child: Stack(
        alignment: Alignment.center,
        children: [
          Positioned.fill(
            child: Center(child: _WaveMeter(waveform: waveform)),
          ),
          GestureDetector(
            onTap: onTap,
            child: Container(
              width: 154,
              height: 154,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(color: const Color(0x1AA855F7)),
                boxShadow: const [
                  BoxShadow(
                    color: Color(0x11A855F7),
                    blurRadius: 36,
                    spreadRadius: 8,
                  ),
                ],
              ),
              child: Center(
                child: Container(
                  width: 144,
                  height: 144,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: const Color(0x33A855F7),
                      width: 4,
                    ),
                  ),
                  child: Center(
                    child: Container(
                      width: 112,
                      height: 112,
                      decoration: const BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: LinearGradient(
                          colors: [
                            Color(0xFF7C3AED),
                            Color(0xFF6366F1),
                            Color(0xFFEC4899),
                            Color(0xFFF59E0B),
                          ],
                        ),
                      ),
                      child: Icon(
                        isProcessing
                            ? Icons.hourglass_top_rounded
                            : isRecording
                            ? Icons.stop_rounded
                            : Icons.mic_rounded,
                        size: 44,
                        color: Colors.white,
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _TranscriptCard extends StatelessWidget {
  const _TranscriptCard({required this.text, required this.hasTranscript});

  final String text;
  final bool hasTranscript;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE6E0FF)),
        boxShadow: const [BoxShadow(color: Color(0x080F172A), blurRadius: 18)],
      ),
      child: Row(
        children: [
          Icon(
            hasTranscript
                ? Icons.notes_rounded
                : Icons.lightbulb_outline_rounded,
            color: AppColors.primary,
            size: 22,
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Text(
              text,
              textAlign: TextAlign.center,
              style: TextStyles.body.copyWith(
                color: const Color(0xFF111827),
                height: 1.45,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _CaptureToatCard extends StatelessWidget {
  const _CaptureToatCard({
    required this.toat,
    required this.selected,
    required this.onToggle,
    required this.onEdit,
  });

  final ToatSummary toat;
  final bool selected;
  final VoidCallback onToggle;
  final VoidCallback onEdit;

  @override
  Widget build(BuildContext context) {
    final icon = _captureSmartIcon(toat.template, toat.title);
    return GestureDetector(
      onTap: onToggle,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(
            color: selected ? AppColors.primary : const Color(0xFFE5E7EB),
          ),
          boxShadow: const [
            BoxShadow(
              color: Color(0x120F172A),
              blurRadius: 18,
              offset: Offset(0, 8),
            ),
          ],
        ),
        child: Row(
          children: [
            Icon(
              selected
                  ? Icons.check_circle_rounded
                  : Icons.radio_button_unchecked_rounded,
              color: selected ? AppColors.primary : AppColors.textMuted,
            ),
            const SizedBox(width: 12),
            Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(icon, size: 17, color: AppColors.primary),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    toat.title,
                    style: TextStyles.bodyMedium.copyWith(
                      color: const Color(0xFF111827),
                    ),
                  ),
                  const SizedBox(height: 6),
                  if (toat.datetime != null)
                    Text(
                      _formatDateTime(toat.datetime!),
                      style: TextStyles.smallMedium.copyWith(
                        color: AppColors.primary,
                      ),
                    ),
                  if (toat.location != null && toat.location!.isNotEmpty)
                    Text(toat.location!, style: TextStyles.small),
                ],
              ),
            ),
            GestureDetector(
              onTap: onEdit,
              behavior: HitTestBehavior.opaque,
              child: Padding(
                padding: const EdgeInsets.all(8),
                child: Icon(
                  Icons.edit_outlined,
                  size: 18,
                  color: AppColors.textMuted,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _formatDateTime(DateTime dateTime) {
    final hour = dateTime.hour == 0
        ? 12
        : dateTime.hour > 12
        ? dateTime.hour - 12
        : dateTime.hour;
    final minute = dateTime.minute.toString().padLeft(2, '0');
    final suffix = dateTime.hour >= 12 ? 'PM' : 'AM';
    return '${dateTime.month}/${dateTime.day} · $hour:$minute $suffix';
  }
}

class _WaveMeter extends StatelessWidget {
  const _WaveMeter({required this.waveform});

  final List<double> waveform;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: waveform
          .map(
            (heightFactor) => Padding(
              padding: const EdgeInsets.symmetric(horizontal: 3),
              child: Container(
                width: 3,
                height: 58 * heightFactor,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(8),
                  gradient: const LinearGradient(
                    begin: Alignment.bottomCenter,
                    end: Alignment.topCenter,
                    colors: [Color(0xFF8B5CF6), Color(0xFFF59E0B)],
                  ),
                ),
              ),
            ),
          )
          .toList(),
    );
  }
}

class _ModeToggle extends StatelessWidget {
  const _ModeToggle({
    required this.activeMode,
    required this.onVoiceTap,
    required this.onTextTap,
  });

  final CaptureInputMode activeMode;
  final VoidCallback onVoiceTap;
  final VoidCallback onTextTap;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.92),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: const Color(0xFFE6E0FF)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x140F172A),
            blurRadius: 24,
            offset: Offset(0, 12),
          ),
        ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          _ModeButton(
            label: 'Talk',
            active: activeMode == CaptureInputMode.voice,
            onTap: onVoiceTap,
          ),
          _ModeButton(
            label: 'Text',
            active: activeMode == CaptureInputMode.text,
            onTap: onTextTap,
          ),
        ],
      ),
    );
  }
}

class _ModeButton extends StatelessWidget {
  const _ModeButton({
    required this.label,
    required this.active,
    required this.onTap,
  });

  final String label;
  final bool active;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        constraints: const BoxConstraints(minWidth: 88, minHeight: 42),
        alignment: Alignment.center,
        padding: const EdgeInsets.symmetric(horizontal: 18),
        decoration: BoxDecoration(
          color: active ? const Color(0xFFF2E7F6) : Colors.transparent,
          borderRadius: BorderRadius.circular(999),
        ),
        child: Text(
          label,
          style: TextStyles.smallMedium.copyWith(
            color: active ? AppColors.primary : AppColors.textSecondary,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
    );
  }
}

String _formatElapsed(int seconds) {
  final minutes = (seconds ~/ 60).toString().padLeft(2, '0');
  final remainingSeconds = (seconds % 60).toString().padLeft(2, '0');
  return '$minutes:$remainingSeconds';
}

// ---------------------------------------------------------------------------
// Edit modal — shown when user taps the pencil icon on a capture card
// ---------------------------------------------------------------------------

class _EditCaptureToatModal extends StatefulWidget {
  const _EditCaptureToatModal({required this.toat, required this.onSave});

  final ToatSummary toat;
  final void Function(ToatSummary updated) onSave;

  @override
  State<_EditCaptureToatModal> createState() => _EditCaptureToatModalState();
}

class _EditCaptureToatModalState extends State<_EditCaptureToatModal> {
  late final TextEditingController _titleCtrl;
  late final TextEditingController _locationCtrl;

  @override
  void initState() {
    super.initState();
    _titleCtrl = TextEditingController(text: widget.toat.title);
    _locationCtrl = TextEditingController(text: widget.toat.location ?? '');
  }

  @override
  void dispose() {
    _titleCtrl.dispose();
    _locationCtrl.dispose();
    super.dispose();
  }

  void _save() {
    final updated = widget.toat.copyWith(
      title: _titleCtrl.text.trim(),
      location: _locationCtrl.text.trim().isEmpty
          ? null
          : _locationCtrl.text.trim(),
    );
    widget.onSave(updated);
    Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.of(context).viewInsets.bottom;
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: EdgeInsets.fromLTRB(24, 24, 24, 24 + bottom),
      decoration: const BoxDecoration(
        color: Color(0xFF1C1F2E),
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text('Edit toat', style: TextStyles.heading3),
              const Spacer(),
              IconButton(
                icon: const Icon(Icons.close_rounded, color: Colors.white70),
                onPressed: () => Navigator.of(context).pop(),
              ),
            ],
          ),
          const SizedBox(height: 20),
          Text(
            'Title',
            style: TextStyles.smallMedium.copyWith(
              color: AppColors.textSecondary,
            ),
          ),
          const SizedBox(height: 6),
          TextField(
            controller: _titleCtrl,
            autofocus: true,
            style: TextStyles.body.copyWith(color: AppColors.text),
            decoration: InputDecoration(
              filled: true,
              fillColor: AppColors.bgElevated,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide.none,
              ),
            ),
          ),
          const SizedBox(height: 16),
          Text(
            'Location',
            style: TextStyles.smallMedium.copyWith(
              color: AppColors.textSecondary,
            ),
          ),
          const SizedBox(height: 6),
          TextField(
            controller: _locationCtrl,
            style: TextStyles.body.copyWith(color: AppColors.text),
            decoration: InputDecoration(
              filled: true,
              fillColor: AppColors.bgElevated,
              hintText: 'Optional',
              hintStyle: TextStyle(color: AppColors.textMuted),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide.none,
              ),
            ),
          ),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(onPressed: _save, child: const Text('Save')),
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Smart icon — keyword-aware template icon selector (shared with timeline)
// ---------------------------------------------------------------------------

IconData _captureSmartIcon(String template, String title) {
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
