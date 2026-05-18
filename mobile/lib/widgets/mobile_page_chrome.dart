import 'package:firebase_auth/firebase_auth.dart' show User;
import 'package:flutter/material.dart';

import 'package:toatre/utils/app_colors.dart';
import 'package:toatre/utils/text_styles.dart';
import 'package:toatre/widgets/toatre_mark.dart';

class MobileShellTopRow extends StatelessWidget {
  const MobileShellTopRow({
    super.key,
    required this.user,
    required this.onAvatarTap,
  });

  final User? user;
  final VoidCallback onAvatarTap;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 48,
          height: 48,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            boxShadow: const [
              BoxShadow(
                color: Color(0x22000000),
                blurRadius: 18,
                offset: Offset(0, 8),
              ),
            ],
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(16),
            child: Image.asset('assets/images/icon.png', fit: BoxFit.cover),
          ),
        ),
        const SizedBox(width: 12),
        const ToatreMark(fontSize: 30, color: Color(0xFF0F1B4C)),
        const Spacer(),
        MobileUserAvatarButton(user: user, onTap: onAvatarTap),
      ],
    );
  }
}

class MobileUserAvatarButton extends StatelessWidget {
  const MobileUserAvatarButton({
    super.key,
    required this.user,
    required this.onTap,
    this.size = 58,
    this.showStatusDot = true,
  });

  final User? user;
  final VoidCallback onTap;
  final double size;
  final bool showStatusDot;

  @override
  Widget build(BuildContext context) {
    final name = user?.displayName?.trim();
    final fallback =
        (name != null && name.isNotEmpty ? name : user?.email ?? 'T')
            .trim()
            .characters
            .first
            .toUpperCase();

    return GestureDetector(
      onTap: onTap,
      child: SizedBox(
        width: size,
        height: size,
        child: Stack(
          clipBehavior: Clip.none,
          children: [
            Positioned.fill(
              child: Container(
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white, width: 2),
                  boxShadow: const [
                    BoxShadow(
                      color: Color(0x18000000),
                      blurRadius: 22,
                      offset: Offset(0, 10),
                    ),
                  ],
                ),
                child: ClipOval(
                  child: user?.photoURL != null && user!.photoURL!.isNotEmpty
                      ? Image.network(user!.photoURL!, fit: BoxFit.cover)
                      : Container(
                          color: const Color(0xFFF3EAFD),
                          alignment: Alignment.center,
                          child: Text(
                            fallback,
                            style: TextStyles.heading3.copyWith(
                              color: const Color(0xFF6D28D9),
                            ),
                          ),
                        ),
                ),
              ),
            ),
            if (showStatusDot)
              Positioned(
                right: 2,
                bottom: 2,
                child: Container(
                  width: 12,
                  height: 12,
                  decoration: BoxDecoration(
                    color: const Color(0xFFDD982D),
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.white, width: 2),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class MobilePageIntro extends StatelessWidget {
  const MobilePageIntro({
    super.key,
    required this.title,
    required this.subtitle,
    this.count,
    this.controls,
  });

  final String title;
  final String subtitle;
  final int? count;
  final Widget? controls;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Flexible(
              child: Text(
                title,
                style: TextStyles.heading1.copyWith(
                  fontSize: 28,
                  color: const Color(0xFF0F1B4C),
                ),
              ),
            ),
            if (count != null) ...[
              const SizedBox(width: 10),
              Container(
                constraints: const BoxConstraints(minWidth: 30),
                height: 30,
                padding: const EdgeInsets.symmetric(horizontal: 10),
                decoration: BoxDecoration(
                  color: const Color(0x1A7C3AED),
                  borderRadius: BorderRadius.circular(999),
                ),
                alignment: Alignment.center,
                child: Text(
                  '$count',
                  style: TextStyles.bodyMedium.copyWith(
                    color: const Color(0xFF6D28D9),
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ],
          ],
        ),
        const SizedBox(height: 6),
        Text(
          subtitle,
          style: TextStyles.body.copyWith(color: AppColors.textSecondary),
        ),
        if (controls != null) ...[const SizedBox(height: 12), controls!],
      ],
    );
  }
}
