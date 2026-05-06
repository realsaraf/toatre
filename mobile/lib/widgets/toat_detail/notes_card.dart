import 'package:flutter/material.dart';
import 'package:toatre/utils/app_colors.dart';
import 'package:toatre/utils/text_styles.dart';
import 'package:toatre/widgets/toat_detail/section_card.dart';

/// An editable notes text field wrapped in a [SectionCard].
class NotesCard extends StatelessWidget {
  const NotesCard({
    super.key,
    required this.controller,
    required this.onChanged,
  });

  final TextEditingController controller;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    return SectionCard(
      title: 'Notes',
      child: TextField(
        controller: controller,
        maxLines: null,
        style: TextStyles.body.copyWith(color: AppColors.text, height: 1.6),
        decoration: const InputDecoration(
          isDense: true,
          contentPadding: EdgeInsets.zero,
          border: InputBorder.none,
          hintText: 'Add a note…',
        ),
        onChanged: onChanged,
      ),
    );
  }
}

/// A dashed-border button shown when notes have not yet been added.
class AddNotesButton extends StatelessWidget {
  const AddNotesButton({super.key, required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          border: Border.all(color: AppColors.primary.withValues(alpha: 0.25)),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Row(
          children: [
            const Icon(Icons.add_rounded, size: 20, color: AppColors.primary),
            const SizedBox(width: 8),
            Text(
              'Add notes',
              style: TextStyles.bodyMedium.copyWith(color: AppColors.primary),
            ),
          ],
        ),
      ),
    );
  }
}
