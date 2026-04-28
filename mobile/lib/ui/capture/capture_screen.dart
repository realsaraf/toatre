import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'package:toatre/models/toat_summary.dart';
import 'package:toatre/providers/capture_provider.dart';
import 'package:toatre/providers/toats_provider.dart';
import 'package:toatre/ui/timeline/timeline_screen.dart';
import 'package:toatre/utils/app_colors.dart';
import 'package:toatre/utils/text_styles.dart';

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
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Consumer<CaptureProvider>(
          builder: (context, capture, _) {
            if (capture.isReviewing) {
              return _ReviewState(capture: capture);
            }

            if (capture.isTextMode) {
              return _TextCaptureState(
                capture: capture,
                controller: _textController,
                onOpenVoiceMode: () => capture.setMode(CaptureInputMode.voice),
              );
            }

            return _ListeningState(
              capture: capture,
              onOpenTextMode: () => capture.setMode(CaptureInputMode.text),
            );
          },
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
      padding: const EdgeInsets.fromLTRB(22, 16, 22, 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
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
              CircleAvatar(
                radius: 20,
                backgroundColor: const Color(0xFFF2F4F8),
                child: Icon(
                  Icons.person_rounded,
                  color: AppColors.textSecondary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          Text('Capture', style: TextStyles.display.copyWith(fontSize: 36)),
          const SizedBox(height: 10),
          Text(
            'Tap the mic and tell me what\'s on your mind.',
            style: TextStyles.heading3.copyWith(
              color: AppColors.textSecondary,
              height: 1.4,
            ),
          ),
          const SizedBox(height: 14),
          Align(
            alignment: Alignment.centerRight,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              decoration: BoxDecoration(
                color: const Color(0xFFF8F5FF),
                borderRadius: BorderRadius.circular(22),
                border: Border.all(color: const Color(0x22A855F7)),
              ),
              child: Text(
                'Toatre listens, you live.',
                style: TextStyles.smallMedium.copyWith(
                  color: AppColors.primary,
                ),
              ),
            ),
          ),
          const SizedBox(height: 14),
          _ModeToggle(
            activeMode: CaptureInputMode.voice,
            onVoiceTap: () => capture.setMode(CaptureInputMode.voice),
            onTextTap: onOpenTextMode,
          ),
          const SizedBox(height: 24),
          Center(
            child: Text(
              isProcessing
                  ? 'Thinking…'
                  : isRecording
                  ? 'Listening…'
                  : 'Ready when you are',
              style: TextStyles.heading2.copyWith(color: AppColors.primary),
            ),
          ),
          const SizedBox(height: 16),
          _WaveMeter(waveform: capture.waveform),
          const SizedBox(height: 18),
          Center(
            child: Container(
              width: 218,
              height: 218,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(color: const Color(0x1AA855F7)),
                boxShadow: const [
                  BoxShadow(
                    color: Color(0x11A855F7),
                    blurRadius: 40,
                    spreadRadius: 12,
                  ),
                ],
              ),
              child: Center(
                child: Container(
                  width: 158,
                  height: 158,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: const Color(0x33A855F7),
                      width: 4,
                    ),
                  ),
                  child: Center(
                    child: Container(
                      width: 118,
                      height: 118,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: Colors.white,
                        boxShadow: const [
                          BoxShadow(
                            color: Color(0x1F4F46E5),
                            blurRadius: 30,
                            offset: Offset(0, 12),
                          ),
                        ],
                      ),
                      child: Center(
                        child: Icon(
                          isRecording
                              ? Icons.mic_rounded
                              : Icons.mic_none_rounded,
                          size: 50,
                          color: AppColors.primary,
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(height: 16),
          Center(
            child: Text(
              _formatElapsed(capture.elapsedSeconds),
              style: TextStyles.heading2.copyWith(color: AppColors.primary),
            ),
          ),
          const SizedBox(height: 16),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: const Color(0x1AE879F9)),
              boxShadow: const [
                BoxShadow(
                  color: Color(0x120F172A),
                  blurRadius: 24,
                  offset: Offset(0, 10),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  isProcessing ? 'Transcribing…' : 'On-device transcription',
                  style: TextStyles.label.copyWith(color: AppColors.primary),
                ),
                const SizedBox(height: 14),
                Text(
                  capture.transcript.isNotEmpty
                      ? capture.transcript
                      : isRecording
                      ? 'I\'m listening for multiple toats in one capture.'
                      : 'You can say multiple things. I\'ll organise them for you.',
                  style: TextStyles.bodyMedium.copyWith(
                    color: const Color(0xFF111827),
                    height: 1.45,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 18),
          if (capture.error != null)
            Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: Text(
                capture.error!,
                style: TextStyles.smallMedium.copyWith(color: AppColors.error),
              ),
            ),
          Row(
            children: [
              Expanded(
                child: _CircleAction(
                  icon: Icons.close_rounded,
                  label: 'Cancel',
                  onTap: () {
                    capture.reset();
                    Navigator.of(context).pop();
                  },
                ),
              ),
              Expanded(
                child: Center(
                  child: GestureDetector(
                    onTap: isProcessing
                        ? null
                        : isRecording
                        ? capture.stopRecording
                        : capture.startRecording,
                    child: Container(
                      width: 92,
                      height: 92,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: const LinearGradient(
                          colors: [
                            Color(0xFF7C3AED),
                            Color(0xFF6366F1),
                            Color(0xFFEC4899),
                            Color(0xFFF59E0B),
                          ],
                        ),
                        boxShadow: const [
                          BoxShadow(
                            color: Color(0x224F46E5),
                            blurRadius: 30,
                            offset: Offset(0, 12),
                          ),
                        ],
                      ),
                      child: Icon(
                        isProcessing
                            ? Icons.hourglass_top_rounded
                            : isRecording
                            ? Icons.stop_rounded
                            : Icons.mic_rounded,
                        color: Colors.white,
                        size: 36,
                      ),
                    ),
                  ),
                ),
              ),
              Expanded(
                child: _CircleAction(
                  icon: Icons.keyboard_alt_outlined,
                  label: 'Type instead',
                  onTap: onOpenTextMode,
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 15),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(22),
              boxShadow: const [
                BoxShadow(
                  color: Color(0x120F172A),
                  blurRadius: 20,
                  offset: Offset(0, 8),
                ),
              ],
            ),
            child: Row(
              children: [
                Icon(Icons.lightbulb_outline_rounded, color: AppColors.primary),
                const SizedBox(width: 14),
                Expanded(
                  child: Text(
                    'Tip: You can say multiple things. I\'ll organise them for you.',
                    style: TextStyles.body.copyWith(
                      color: AppColors.textSecondary,
                      height: 1.5,
                    ),
                  ),
                ),
                const Icon(
                  Icons.chevron_right_rounded,
                  color: AppColors.textMuted,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _formatElapsed(int seconds) {
    final minutes = (seconds ~/ 60).toString().padLeft(2, '0');
    final remainingSeconds = (seconds % 60).toString().padLeft(2, '0');
    return '$minutes:$remainingSeconds';
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
      padding: const EdgeInsets.fromLTRB(22, 16, 22, 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
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
              CircleAvatar(
                radius: 20,
                backgroundColor: const Color(0xFFF2F4F8),
                child: Icon(
                  Icons.person_rounded,
                  color: AppColors.textSecondary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          Text(
            'Type a capture',
            style: TextStyles.display.copyWith(fontSize: 34),
          ),
          const SizedBox(height: 10),
          Text(
            'Write what needs to happen next and Toatre will turn it into toats.',
            style: TextStyles.heading3.copyWith(
              color: AppColors.textSecondary,
              height: 1.4,
            ),
          ),
          const SizedBox(height: 14),
          _ModeToggle(
            activeMode: CaptureInputMode.text,
            onVoiceTap: onOpenVoiceMode,
            onTextTap: () {},
          ),
          const SizedBox(height: 18),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(24),
              boxShadow: const [
                BoxShadow(
                  color: Color(0x120F172A),
                  blurRadius: 24,
                  offset: Offset(0, 10),
                ),
              ],
            ),
            child: TextField(
              controller: controller,
              maxLines: 7,
              minLines: 7,
              textInputAction: TextInputAction.newline,
              decoration: InputDecoration(
                hintText:
                    'Call the dentist tomorrow, send Priya the deck, and remind me to buy groceries on the way home.',
                hintStyle: TextStyles.body.copyWith(color: AppColors.textMuted),
                border: InputBorder.none,
              ),
              style: TextStyles.body.copyWith(
                color: const Color(0xFF111827),
                height: 1.5,
              ),
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
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: capture.isProcessing
                      ? null
                      : () {
                          capture.reset();
                          Navigator.of(context).pop();
                        },
                  child: const Text('Cancel'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: ElevatedButton(
                  onPressed: capture.isProcessing
                      ? null
                      : () => capture.submitTextCapture(controller.text),
                  child: Text(
                    capture.isProcessing ? 'Thinking…' : 'Add text capture',
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 15),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(22),
              boxShadow: const [
                BoxShadow(
                  color: Color(0x120F172A),
                  blurRadius: 20,
                  offset: Offset(0, 8),
                ),
              ],
            ),
            child: Row(
              children: [
                Icon(Icons.lightbulb_outline_rounded, color: AppColors.primary),
                const SizedBox(width: 14),
                Expanded(
                  child: Text(
                    'Tip: one typed capture can hold multiple toats, just like voice.',
                    style: TextStyles.body.copyWith(
                      color: AppColors.textSecondary,
                      height: 1.5,
                    ),
                  ),
                ),
              ],
            ),
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
        color: const Color(0xFFF4F1FF),
        borderRadius: BorderRadius.circular(18),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          _ModeButton(
            label: 'Voice',
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
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          gradient: active ? AppColors.brandGradient : null,
          borderRadius: BorderRadius.circular(16),
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

class _CircleAction extends StatelessWidget {
  const _CircleAction({required this.icon, required this.label, this.onTap});

  final IconData icon;
  final String label;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        children: [
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              color: Colors.white,
              shape: BoxShape.circle,
              boxShadow: const [
                BoxShadow(
                  color: Color(0x120F172A),
                  blurRadius: 18,
                  offset: Offset(0, 8),
                ),
              ],
            ),
            child: Icon(icon, color: const Color(0xFF6B7280), size: 24),
          ),
          const SizedBox(height: 6),
          Text(label, style: TextStyles.smallMedium),
        ],
      ),
    );
  }
}
