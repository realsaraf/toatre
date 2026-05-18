import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:toatre/models/toat_summary.dart';
import 'package:toatre/utils/app_colors.dart';
import 'package:toatre/utils/text_styles.dart';
import 'package:toatre/widgets/toat_detail/map_card.dart';
import 'package:toatre/widgets/toat_detail/section_card.dart';

/// Shows the "When & where" section for non-meeting toats.
class WhenWhereCard extends StatelessWidget {
  const WhenWhereCard({
    super.key,
    required this.toat,
    this.onChangeDuration,
    this.onChangeLocation,
    this.onRemoveLocation,
  });

  final ToatSummary toat;
  final VoidCallback? onChangeDuration;
  final VoidCallback? onChangeLocation;
  final VoidCallback? onRemoveLocation;

  String _formatDate(ToatSummary t) {
    if (t.datetime == null) return 'Any time';
    return DateFormat('EEEE, MMM d').format(t.datetime!);
  }

  String _formatTimeRange(ToatSummary t) {
    if (t.datetime == null) return 'Any time';
    final start = DateFormat.jm().format(t.datetime!);
    if (t.endDatetime == null) return start;
    return '$start - ${DateFormat.jm().format(t.endDatetime!)}';
  }

  String _formatDuration(int minutes) {
    if (minutes < 60) return '$minutes min';
    final h = minutes ~/ 60;
    final m = minutes % 60;
    return m == 0 ? '${h}h' : '${h}h ${m}m';
  }

  @override
  Widget build(BuildContext context) {
    final hasTime = toat.datetime != null;
    final location = toat.location?.trim();
    final hasLocation = location != null && location.isNotEmpty;

    return SectionCard(
      title: 'When & where',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (hasTime)
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Padding(
                  padding: EdgeInsets.only(top: 2),
                  child: Icon(
                    Icons.schedule_rounded,
                    size: 22,
                    color: Color(0xFF6B7280),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'WHEN',
                        style: TextStyles.smallMedium.copyWith(
                          color: const Color(0xFF6B7280),
                          fontWeight: FontWeight.w800,
                          letterSpacing: 0.3,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        _formatDate(toat),
                        style: TextStyles.bodyMedium.copyWith(
                          color: const Color(0xFF101A44),
                          fontSize: 16,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        _formatTimeRange(toat),
                        style: TextStyles.small.copyWith(
                          color: const Color(0xFF6B7280),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            )
          else
            Text(
              'No time yet.',
              style: TextStyles.body.copyWith(color: const Color(0xFF6B7280)),
            ),
          if (hasTime)
            Padding(
              padding: const EdgeInsets.only(left: 34, top: 12, bottom: 10),
              child: Row(
                children: [
                  SizedBox(
                    width: 72,
                    child: Text(
                      'Duration',
                      style: TextStyles.smallMedium.copyWith(
                        color: const Color(0xFF6B7280),
                      ),
                    ),
                  ),
                  Text(
                    _formatDuration(toat.duration ?? 60),
                    style: TextStyles.small.copyWith(
                      color: const Color(0xFF52607E),
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const Spacer(),
                  GestureDetector(
                    onTap: onChangeDuration,
                    child: Text(
                      'Edit',
                      style: TextStyles.small.copyWith(
                        color: AppColors.primary,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          if (hasLocation) ...[
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.05),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(
                  color: AppColors.primary.withValues(alpha: 0.15),
                ),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Padding(
                    padding: EdgeInsets.only(top: 1),
                    child: Icon(
                      Icons.location_on_rounded,
                      size: 16,
                      color: AppColors.primary,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      location,
                      style: TextStyles.small.copyWith(color: AppColors.text),
                    ),
                  ),
                  if (onChangeLocation != null)
                    GestureDetector(
                      onTap: onChangeLocation,
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 4),
                        child: Text(
                          'Change',
                          style: TextStyles.small.copyWith(
                            color: AppColors.primary,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ),
                  if (onRemoveLocation != null)
                    GestureDetector(
                      onTap: onRemoveLocation,
                      child: const Padding(
                        padding: EdgeInsets.symmetric(horizontal: 2),
                        child: Text(
                          '×',
                          style: TextStyle(
                            fontSize: 20,
                            color: AppColors.textMuted,
                            height: 1,
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),
            const SizedBox(height: 12),
            MapCard(location: location),
          ],
        ],
      ),
    );
  }
}
