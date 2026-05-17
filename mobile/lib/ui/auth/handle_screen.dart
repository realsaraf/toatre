import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'package:toatre/providers/auth_provider.dart';
import 'package:toatre/ui/shell/main_shell.dart';
import 'package:toatre/utils/app_colors.dart';
import 'package:toatre/utils/text_styles.dart';
import 'package:toatre/widgets/toatre_mark.dart';

class HandleScreen extends StatefulWidget {
  const HandleScreen({super.key});

  @override
  State<HandleScreen> createState() => _HandleScreenState();
}

class _HandleScreenState extends State<HandleScreen> {
  late final TextEditingController _handleController;
  AuthStatus? _lastStatus;

  @override
  void initState() {
    super.initState();
    _handleController = TextEditingController();
  }

  @override
  void dispose() {
    _handleController.dispose();
    super.dispose();
  }

  void _routeIfReady(AuthStatus status) {
    if (status != AuthStatus.authenticated || !mounted) {
      return;
    }

    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      Navigator.of(context).pushReplacement(
        MaterialPageRoute<void>(builder: (_) => const MainShell()),
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

    if (_lastStatus != auth.status) {
      _lastStatus = auth.status;
      _routeIfReady(auth.status);
    }

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
                    ClipRRect(
                      borderRadius: BorderRadius.circular(24),
                      child: Image.asset(
                        'assets/images/icon.png',
                        width: 78,
                        height: 78,
                        fit: BoxFit.cover,
                      ),
                    ),
                    const SizedBox(height: 18),
                    const Center(child: ToatreMark(fontSize: 40)),
                    const SizedBox(height: 28),
                    Text(
                      'Pick your handle',
                      textAlign: TextAlign.center,
                      style: TextStyles.heading1,
                    ),
                    const SizedBox(height: 12),
                    Text(
                      'This is how people will find you when they share a toat.',
                      textAlign: TextAlign.center,
                      style: TextStyles.body.copyWith(
                        color: AppColors.textSecondary,
                        height: 1.5,
                      ),
                    ),
                    const SizedBox(height: 28),
                    TextField(
                      controller: _handleController,
                      textInputAction: TextInputAction.done,
                      autocorrect: false,
                      textCapitalization: TextCapitalization.none,
                      onSubmitted: auth.isBusy ? null : (_) => _submit(auth),
                      decoration: const InputDecoration(
                        prefixText: '@',
                        hintText: 'yourname',
                      ),
                    ),
                    const SizedBox(height: 14),
                    Text(
                      'Use 2–20 letters, numbers, or underscores.',
                      textAlign: TextAlign.center,
                      style: TextStyles.small,
                    ),
                    if (auth.errorMessage != null) ...[
                      const SizedBox(height: 14),
                      Text(
                        auth.errorMessage!,
                        textAlign: TextAlign.center,
                        style: TextStyles.smallMedium.copyWith(
                          color: AppColors.error,
                        ),
                      ),
                    ],
                    const SizedBox(height: 24),
                    ElevatedButton(
                      onPressed: auth.isBusy ? null : () => _submit(auth),
                      child: auth.isBusy
                          ? const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.white,
                              ),
                            )
                          : const Text('Save handle'),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  void _submit(AuthProvider auth) {
    auth.submitHandle(_handleController.text);
  }
}
