import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'package:toatre/providers/auth_provider.dart';
import 'package:toatre/ui/auth/handle_screen.dart';
import 'package:toatre/ui/shell/main_shell.dart';
import 'package:toatre/utils/app_colors.dart';
import 'package:toatre/utils/text_styles.dart';
import 'package:toatre/widgets/toatre_mark.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  AuthStatus? _lastStatus;

  void _routeForStatus(AuthStatus status) {
    if (!mounted) return;

    final Widget? destination = switch (status) {
      AuthStatus.needsHandle => const HandleScreen(),
      AuthStatus.authenticated => const MainShell(),
      _ => null,
    };

    if (destination == null) return;

    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      Navigator.of(
        context,
      ).pushReplacement(MaterialPageRoute<void>(builder: (_) => destination));
    });
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

    if (_lastStatus != auth.status) {
      _lastStatus = auth.status;
      _routeForStatus(auth.status);
    }

    final showApple = Theme.of(context).platform == TargetPlatform.iOS;

    return Scaffold(
      backgroundColor: AppColors.bg,
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xFFFBFAFF), Color(0xFFF7F5FF), Color(0xFFFBFAFF)],
            stops: [0, 0.52, 1],
          ),
        ),
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 32),
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 420),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const SizedBox(height: 12),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(26),
                      child: Image.asset(
                        'assets/images/icon.png',
                        width: 88,
                        height: 88,
                        fit: BoxFit.cover,
                      ),
                    ),
                    const SizedBox(height: 28),
                    const Center(child: ToatreMark(fontSize: 48)),
                    const SizedBox(height: 12),
                    Text(
                      'Hey. Sign in and start turning what\'s on your mind into toats.',
                      textAlign: TextAlign.center,
                      style: TextStyles.body.copyWith(
                        color: AppColors.textSecondary,
                        height: 1.5,
                      ),
                    ),
                    const SizedBox(height: 40),
                    _SignInButton(
                      label: auth.isBusy
                          ? 'Connecting to Google…'
                          : 'Continue with Google',
                      icon: Icons.g_mobiledata_rounded,
                      onTap: auth.isBusy ? null : auth.signInWithGoogle,
                    ),
                    if (showApple) ...[
                      const SizedBox(height: 12),
                      _SignInButton(
                        label: auth.isBusy
                            ? 'Connecting to Apple…'
                            : 'Continue with Apple',
                        icon: Icons.apple_rounded,
                        onTap: auth.isBusy ? null : auth.signInWithApple,
                      ),
                    ],
                    const SizedBox(height: 12),
                    _SignInButton(
                      label: 'Email magic link is next',
                      icon: Icons.mail_outline_rounded,
                      onTap: null,
                    ),
                    const SizedBox(height: 18),
                    Text(
                      'Your voice is private. Audio is not stored by default.',
                      textAlign: TextAlign.center,
                      style: TextStyles.small,
                    ),
                    if (auth.errorMessage != null) ...[
                      const SizedBox(height: 18),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 14,
                          vertical: 12,
                        ),
                        decoration: BoxDecoration(
                          color: const Color(0x22EF4444),
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: const Color(0x44EF4444)),
                        ),
                        child: Text(
                          auth.errorMessage!,
                          textAlign: TextAlign.center,
                          style: TextStyles.smallMedium.copyWith(
                            color: AppColors.error,
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _SignInButton extends StatelessWidget {
  const _SignInButton({
    required this.label,
    required this.icon,
    required this.onTap,
  });

  final String label;
  final IconData icon;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return Opacity(
      opacity: onTap == null ? 0.55 : 1,
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
          decoration: BoxDecoration(
            color: AppColors.bgElevated,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.border),
            boxShadow: const [
              BoxShadow(
                color: Color(0x141F2937),
                blurRadius: 28,
                offset: Offset(0, 12),
              ),
            ],
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, color: AppColors.primary, size: 24),
              const SizedBox(width: 12),
              Text(
                label,
                textAlign: TextAlign.center,
                style: TextStyles.bodyMedium,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
