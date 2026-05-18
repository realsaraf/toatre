import 'package:flutter/material.dart';
import 'package:toatre/utils/app_colors.dart';
import 'package:toatre/utils/text_styles.dart';

/// A small coloured badge label used throughout the detail screen.
class Pill extends StatelessWidget {
  const Pill({super.key, required this.label, required this.color});

  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.16),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Text(label, style: TextStyles.smallMedium.copyWith(color: color)),
    );
  }
}

/// A circular icon button used in the top bar.
class IconCircleButton extends StatelessWidget {
  const IconCircleButton({
    super.key,
    required this.icon,
    required this.onTap,
    this.size = 46,
    this.iconSize = 20,
  });

  final IconData icon;
  final VoidCallback onTap;
  final double size;
  final double iconSize;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          color: const Color(0xFFFCF9F4),
          shape: BoxShape.circle,
          border: Border.all(color: const Color(0xFFE9E0D5)),
          boxShadow: const [
            BoxShadow(
              color: Color(0x14000000),
              blurRadius: 16,
              offset: Offset(0, 6),
            ),
          ],
        ),
        alignment: Alignment.center,
        child: Icon(icon, size: iconSize, color: AppColors.text),
      ),
    );
  }
}
