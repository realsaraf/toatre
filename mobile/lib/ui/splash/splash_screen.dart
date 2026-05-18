import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'package:toatre/providers/auth_provider.dart';
import 'package:toatre/providers/settings_provider.dart';
import 'package:toatre/ui/auth/handle_screen.dart';
import 'package:toatre/utils/app_colors.dart';
import 'package:toatre/utils/text_styles.dart';
import 'package:toatre/ui/auth/login_screen.dart';
import 'package:toatre/ui/shell/main_shell.dart';
import 'package:toatre/widgets/toatre_mark.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with SingleTickerProviderStateMixin {
  late final AnimationController _animController;
  late final Animation<double> _fadeAnim;

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    );
    _fadeAnim = CurvedAnimation(parent: _animController, curve: Curves.easeIn);
    _animController.forward();
    _initApp();
  }

  Future<void> _initApp() async {
    await Future.delayed(const Duration(milliseconds: 1400));
    if (!mounted) return;

    final auth = context.read<AuthProvider>();
    final settingsProvider = context.read<SettingsProvider>();

    // Wait for auth to fully resolve — not just unknown, but also while
    // Firebase is restoring a cached session (authenticating).
    var waited = 0;
    while (mounted &&
        (auth.status == AuthStatus.unknown ||
            auth.status == AuthStatus.authenticating) &&
        waited < 8000) {
      await Future.delayed(const Duration(milliseconds: 100));
      waited += 100;
    }
    if (!mounted) return;

    final Widget dest;
    switch (auth.status) {
      case AuthStatus.authenticated:
        try {
          await settingsProvider.loadSettings();
        } catch (_) {}
        if (!mounted) return;
        dest = const MainShell();
        break;
      case AuthStatus.blocked:
        dest = const LoginScreen();
        break;
      case AuthStatus.needsHandle:
        dest = const HandleScreen();
        break;
      case AuthStatus.unauthenticated:
      case AuthStatus.error:
      case AuthStatus.authenticating:
      case AuthStatus.unknown:
        dest = const LoginScreen();
        break;
    }

    Navigator.of(context).pushReplacement(
      PageRouteBuilder(
        pageBuilder: (_, __, ___) => dest,
        transitionsBuilder: (_, anim, __, child) =>
            FadeTransition(opacity: anim, child: child),
        transitionDuration: const Duration(milliseconds: 400),
      ),
    );
  }

  @override
  void dispose() {
    _animController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
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
        child: Center(
          child: FadeTransition(
            opacity: _fadeAnim,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(26),
                  child: Image.asset(
                    'assets/images/icon.png',
                    width: 86,
                    height: 86,
                    fit: BoxFit.cover,
                  ),
                ),
                const SizedBox(height: 18),
                const ToatreMark(fontSize: 42),
                const SizedBox(height: 8),
                Text('your mic-first timeline', style: TextStyles.small),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
