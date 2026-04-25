import 'package:flutter/material.dart';

import 'package:toatre/utils/app_colors.dart';
import 'package:toatre/utils/text_styles.dart';

class TimelineScreen extends StatefulWidget {
  const TimelineScreen({super.key});

  @override
  State<TimelineScreen> createState() => _TimelineScreenState();
}

class _TimelineScreenState extends State<TimelineScreen> {
  @override
  void initState() {
    super.initState();
    // TODO: Phase 2 — fetch toats on mount
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        title: ShaderMask(
          shaderCallback: (bounds) =>
              AppColors.brandGradient.createShader(bounds),
          blendMode: BlendMode.srcIn,
          child: const Text(
            'toatre',
            style: TextStyle(
              fontWeight: FontWeight.w700,
              fontSize: 20,
              color: Colors.white,
            ),
          ),
        ),
        actions: [
          IconButton(
            onPressed: () {
              // TODO: Phase 3 — navigate to settings
            },
            icon: const Icon(Icons.person_outline_rounded),
            tooltip: 'Profile',
          ),
        ],
      ),
      body: const _EmptyState(),
      floatingActionButton: _MicFab(
        onTap: () {
          // TODO: Phase 2 — trigger capture sheet
        },
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.centerFloat,
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(
            Icons.mic_none_rounded,
            size: 64,
            color: AppColors.textMuted,
          ),
          const SizedBox(height: 16),
          Text(
            'Tap the mic to capture your first toat',
            style: TextStyles.body.copyWith(color: AppColors.textSecondary),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          Text(
            'Just speak — Toatre handles the rest.',
            style: TextStyles.small,
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}

class _MicFab extends StatelessWidget {
  const _MicFab({required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 72,
        height: 72,
        decoration: const BoxDecoration(
          gradient: AppColors.brandGradient,
          shape: BoxShape.circle,
          boxShadow: [
            BoxShadow(
              color: Color(0x554F46E5),
              blurRadius: 20,
              offset: Offset(0, 6),
            ),
          ],
        ),
        child: const Icon(
          Icons.mic_rounded,
          color: Colors.white,
          size: 32,
          semanticLabel: 'Capture a toat',
        ),
      ),
    );
  }
}
