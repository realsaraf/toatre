import 'package:flutter/material.dart';
import 'package:toatre/models/toat_summary.dart';
import 'package:toatre/utils/app_colors.dart';
import 'package:toatre/utils/text_styles.dart';

/// The horizontal row of quick-action buttons below the hero card.
class ActionStripCard extends StatelessWidget {
  const ActionStripCard({
    super.key,
    required this.toat,
    required this.workingAction,
    required this.onMarkDone,
    required this.onAddOneDay,
    required this.onReschedule,
    required this.onDuplicate,
  });

  final ToatSummary toat;
  final String? workingAction;
  final VoidCallback? onMarkDone;
  final VoidCallback? onAddOneDay;
  final VoidCallback? onReschedule;
  final VoidCallback? onDuplicate;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 6),
      decoration: BoxDecoration(
        color: AppColors.bgElevated,
        borderRadius: BorderRadius.circular(24),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          StripAction(
            icon: Icons.check_circle_outline_rounded,
            label: workingAction == 'done' ? '…' : 'Mark done',
            tint: const Color(0xFF16A34A),
            onTap: onMarkDone,
          ),
          StripAction(
            icon: Icons.update_rounded,
            label: workingAction == 'add1d' ? '…' : '+1 Day',
            tint: const Color(0xFF2563EB),
            onTap: onAddOneDay,
          ),
          StripAction(
            icon: Icons.schedule_rounded,
            label: workingAction == 'reschedule' ? '…' : 'Reschedule',
            tint: const Color(0xFF7C3AED),
            onTap: onReschedule,
          ),
          StripAction(
            icon: Icons.copy_all_rounded,
            label: workingAction == 'duplicate' ? '…' : 'Duplicate',
            tint: AppColors.textMuted,
            onTap: onDuplicate,
          ),
        ],
      ),
    );
  }
}

/// A single tappable icon + label column inside [ActionStripCard].
class StripAction extends StatelessWidget {
  const StripAction({
    super.key,
    required this.icon,
    required this.label,
    required this.tint,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final Color tint;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Opacity(
        opacity: onTap == null ? 0.45 : 1,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: tint.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Icon(icon, color: tint, size: 22),
            ),
            const SizedBox(height: 5),
            Text(
              label,
              style: TextStyles.small.copyWith(
                fontWeight: FontWeight.w600,
                color: tint,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
