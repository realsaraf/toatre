import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'package:toatre/models/toat_summary.dart';
import 'package:toatre/providers/capture_provider.dart';
import 'package:toatre/providers/toats_provider.dart';
import 'package:toatre/ui/timeline/timeline_screen.dart';
import 'package:toatre/utils/app_colors.dart';
import 'package:toatre/utils/text_styles.dart';

class CaptureScreen extends StatelessWidget {
  const CaptureScreen({super.key});

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

            return _ListeningState(capture: capture);
          },
        ),
      ),
    );
  }
}

class _ListeningState extends StatelessWidget {
  const _ListeningState({required this.capture});

  final CaptureProvider capture;

  @override
  Widget build(BuildContext context) {
    final isRecording = capture.isRecording;
    final isProcessing = capture.isProcessing;

    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(24, 18, 24, 28),
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
                radius: 22,
                backgroundColor: const Color(0xFFF2F4F8),
                child: Icon(
                  Icons.person_rounded,
                  color: AppColors.textSecondary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 30),
          Text('Capture', style: TextStyles.display.copyWith(fontSize: 42)),
          const SizedBox(height: 10),
          Text(
            'Tap the mic and tell me what\'s on your mind.',
            style: TextStyles.heading3.copyWith(
              color: AppColors.textSecondary,
              height: 1.4,
            ),
          ),
          const SizedBox(height: 18),
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
          const SizedBox(height: 34),
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
          const SizedBox(height: 22),
          _WaveMeter(waveform: capture.waveform),
          const SizedBox(height: 18),
          Center(
            child: Container(
              width: 260,
              height: 260,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(color: const Color(0x1AA855F7)),
                boxShadow: const [
                  BoxShadow(
                    color: Color(0x11A855F7),
                    blurRadius: 40,
                    spreadRadius: 18,
                  ),
                ],
              ),
              child: Center(
                child: Container(
                  width: 188,
                  height: 188,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: const Color(0x33A855F7),
                      width: 4,
                    ),
                  ),
                  child: Center(
                    child: Container(
                      width: 142,
                      height: 142,
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
                          size: 62,
                          color: AppColors.primary,
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(height: 22),
          Center(
            child: Text(
              _formatElapsed(capture.elapsedSeconds),
              style: TextStyles.heading1.copyWith(color: AppColors.primary),
            ),
          ),
          const SizedBox(height: 22),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(22),
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
                  style: TextStyles.heading2.copyWith(
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
                      width: 112,
                      height: 112,
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
                        size: 44,
                      ),
                    ),
                  ),
                ),
              ),
              const Expanded(
                child: _CircleAction(
                  icon: Icons.keyboard_alt_outlined,
                  label: 'Type instead',
                ),
              ),
            ],
          ),
          const SizedBox(height: 18),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 18),
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
              onPressed: () async {
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
                width: 4,
                height: 80 * heightFactor,
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
            width: 72,
            height: 72,
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
            child: Icon(icon, color: const Color(0xFF6B7280), size: 30),
          ),
          const SizedBox(height: 8),
          Text(label, style: TextStyles.smallMedium),
        ],
      ),
    );
  }
}
