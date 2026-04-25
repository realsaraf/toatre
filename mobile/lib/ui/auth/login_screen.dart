import 'package:flutter/material.dart';

import 'package:toatre/utils/app_colors.dart';
import 'package:toatre/utils/text_styles.dart';

class LoginScreen extends StatelessWidget {
  const LoginScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              ShaderMask(
                shaderCallback: (bounds) =>
                    AppColors.brandGradient.createShader(bounds),
                blendMode: BlendMode.srcIn,
                child: Text(
                  'toatre',
                  textAlign: TextAlign.center,
                  style: TextStyles.display.copyWith(
                    fontWeight: FontWeight.w700,
                    letterSpacing: -1,
                    color: Colors.white,
                  ),
                ),
              ),
              const SizedBox(height: 12),
              Text(
                'your mic-first personal timeline',
                textAlign: TextAlign.center,
                style: TextStyles.body.copyWith(color: AppColors.textSecondary),
              ),
              const SizedBox(height: 64),
              // TODO: Phase 1 — implement Google sign-in
              _SignInButton(label: 'Continue with Google', onTap: () {}),
              const SizedBox(height: 12),
              // TODO: Phase 1 — implement Apple sign-in
              _SignInButton(label: 'Continue with Apple', onTap: () {}),
              const SizedBox(height: 12),
              // TODO: Phase 1 — implement email magic link
              _SignInButton(label: 'Continue with Email', onTap: () {}),
            ],
          ),
        ),
      ),
    );
  }
}

class _SignInButton extends StatelessWidget {
  const _SignInButton({required this.label, required this.onTap});

  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16),
        decoration: BoxDecoration(
          color: AppColors.bgElevated,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.border),
        ),
        child: Text(
          label,
          textAlign: TextAlign.center,
          style: TextStyles.bodyMedium,
        ),
      ),
    );
  }
}
