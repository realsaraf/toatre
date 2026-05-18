import 'package:flutter/material.dart';
import 'package:toatre/utils/app_colors.dart';
import 'package:toatre/utils/text_styles.dart';

/// A titled card container used across all detail sections.
class SectionCard extends StatelessWidget {
  const SectionCard({
    super.key,
    required this.title,
    required this.child,
    this.action,
  });

  final String title;
  final Widget child;
  final Widget? action;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.bgElevated,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFE8DFD2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Text(
                  title.toUpperCase(),
                  style: TextStyles.smallMedium.copyWith(
                    color: const Color(0xFF6B7280),
                    fontWeight: FontWeight.w800,
                    letterSpacing: 0.3,
                  ),
                ),
              ),
              if (action != null) ...[const SizedBox(width: 12), action!],
            ],
          ),
          const SizedBox(height: 14),
          const Divider(height: 1, thickness: 1, color: Color(0xFFE5E7EB)),
          const SizedBox(height: 14),
          child,
        ],
      ),
    );
  }
}
