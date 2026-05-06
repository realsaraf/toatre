import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import 'package:toatre/models/toat_summary.dart';
import 'package:toatre/utils/app_colors.dart';
import 'package:toatre/utils/text_styles.dart';
import 'package:toatre/widgets/toat_detail/info_row.dart';
import 'package:toatre/widgets/toat_detail/section_card.dart';

/// Shows the "When & where" section for non-meeting toats.
class WhenWhereCard extends StatelessWidget {
  const WhenWhereCard({
    super.key,
    required this.toat,
    required this.onChangeLocation,
    required this.onRemoveLocation,
  });

  final ToatSummary toat;
  final VoidCallback? onChangeLocation;
  final VoidCallback? onRemoveLocation;

  String _formatWhen(ToatSummary t) {
    if (t.datetime == null) return 'Any time';
    final start = DateFormat.yMMMd().add_jm().format(t.datetime!);
    if (t.endDatetime == null) return start;
    return '$start → ${DateFormat.jm().format(t.endDatetime!)}';
  }

  @override
  Widget build(BuildContext context) {
    final loc = toat.location;
    final hasLocation = loc != null && loc.isNotEmpty;
    return SectionCard(
      title: 'When & where',
      child: Column(
        children: [
          InfoRow(label: 'When', value: _formatWhen(toat)),
          if (hasLocation)
            Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  SizedBox(
                    width: 84,
                    child: Text(
                      'Where',
                      style: TextStyles.smallMedium.copyWith(
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ),
                  Expanded(child: Text(loc, style: TextStyles.body)),
                  GestureDetector(
                    onTap: onChangeLocation,
                    child: Text(
                      'Change',
                      style: TextStyles.small.copyWith(
                        color: AppColors.primary,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                  const SizedBox(width: 4),
                  GestureDetector(
                    onTap: () {
                      Clipboard.setData(ClipboardData(text: loc));
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Address copied'),
                          duration: Duration(seconds: 2),
                        ),
                      );
                    },
                    child: const Padding(
                      padding: EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                      child: Icon(
                        Icons.copy_rounded,
                        size: 15,
                        color: AppColors.textMuted,
                      ),
                    ),
                  ),
                  const SizedBox(width: 4),
                  GestureDetector(
                    onTap: onRemoveLocation,
                    child: const Text(
                      '×',
                      style: TextStyle(
                        fontSize: 20,
                        color: AppColors.textMuted,
                        height: 1,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          if (toat.people.isNotEmpty)
            InfoRow(label: 'People', value: toat.people.join(', ')),
        ],
      ),
    );
  }
}
