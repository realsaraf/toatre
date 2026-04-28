import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'package:toatre/models/toat_summary.dart';
import 'package:toatre/providers/capture_provider.dart';
import 'package:toatre/providers/toats_provider.dart';
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

class _ReviewState extends StatelessWidget {
  const _ReviewState({required this.capture});

  final CaptureProvider capture;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 24, 24, 28),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              IconButton(
                onPressed: () {
                  capture.reset();
                  Navigator.of(context).pop();
                },
                icon: const Icon(Icons.arrow_back_rounded),
              ),
              const Spacer(),
              Text('Captured', style: TextStyles.heading2),
              const Spacer(),
              const SizedBox(width: 48),
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
                );
              },
            ),
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: capture.selectedCount == 0
                  ? null
                  : () async {
                      await context.read<ToatsProvider>().fetchToats();
                      capture.reset();
                      if (!context.mounted) return;
                      Navigator.of(context).pushAndRemoveUntil(
                        MaterialPageRoute<void>(
                          builder: (_) => const TimelineScreen(),
                        ),
                        (_) => false,
                      );
                    },
              child: Text('Add to timeline (${capture.selectedCount})'),
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
  });

  final ToatSummary toat;
  final bool selected;
  final VoidCallback onToggle;

  @override
  Widget build(BuildContext context) {
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
        padding: const EdgeInsets.symmetric(horizontal: 18),
        decoration: BoxDecoration(
          color: active ? const Color(0xFFF2E7F6) : Colors.transparent,
          borderRadius: BorderRadius.circular(999),
        ),
        child: Text(
          label,
          style: TextStyles.smallMedium.copyWith(
            color: active ? Colors.white : AppColors.primary,
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
