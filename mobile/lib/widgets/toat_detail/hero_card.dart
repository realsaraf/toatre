import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:toatre/models/toat_summary.dart';
import 'package:toatre/utils/app_colors.dart';
import 'package:toatre/utils/text_styles.dart';
import 'package:toatre/widgets/toat_detail/pill.dart';
import 'package:toatre/widgets/toat_detail/toat_detail_utils.dart';

/// The large hero card at the top of the toat detail screen.
class HeroCard extends StatelessWidget {
  const HeroCard({
    super.key,
    required this.toat,
    required this.primaryActionLabel,
    required this.onPrimaryAction,
  });

  final ToatSummary toat;
  final String primaryActionLabel;
  final VoidCallback onPrimaryAction;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(22, 22, 22, 20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            detailEnrichmentColors(toat).first.withValues(alpha: 0.10),
            detailEnrichmentColors(toat).last.withValues(alpha: 0.05),
            Colors.white.withValues(alpha: 0.86),
          ],
        ),
        borderRadius: BorderRadius.circular(30),
        border: Border.all(
          color: detailEnrichmentColors(toat).last.withValues(alpha: 0.12),
        ),
        boxShadow: const [
          BoxShadow(
            color: Color(0x16000000),
            blurRadius: 30,
            offset: Offset(0, 12),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 64,
                height: 64,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(18),
                  gradient: LinearGradient(
                    colors: detailEnrichmentColors(toat),
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: detailEnrichmentColors(
                        toat,
                      ).last.withValues(alpha: 0.24),
                      blurRadius: 20,
                      offset: const Offset(0, 10),
                    ),
                  ],
                ),
                child: Icon(
                  detailEnrichmentIcon(toat),
                  color: Colors.white,
                  size: 30,
                ),
              ),
              const SizedBox(width: 18),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Pill(
                      label: detailEnrichmentKey(toat).toUpperCase(),
                      color: detailEnrichmentColors(toat).last,
                    ),
                    const SizedBox(height: 12),
                    Text(
                      toat.title,
                      style: TextStyles.display.copyWith(fontSize: 24),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      detailSubtitle(toat),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyles.body.copyWith(
                        color: AppColors.textSecondary,
                        height: 1.35,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              if (toat.datetime != null)
                Expanded(
                  child: MetaPill(
                    icon: Icons.schedule_rounded,
                    label: DateFormat.jm().format(toat.datetime!),
                  ),
                ),
              if (toat.datetime != null) const SizedBox(width: 10),
              Expanded(
                child: GestureDetector(
                  onTap: onPrimaryAction,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 14,
                    ),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: detailActionColors(toat),
                      ),
                      borderRadius: BorderRadius.circular(18),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          detailActionIcon(toat),
                          color: Colors.white,
                          size: 20,
                        ),
                        const SizedBox(width: 8),
                        Flexible(
                          child: Text(
                            primaryActionLabel,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyles.bodyMedium.copyWith(
                              color: Colors.white,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

/// A time/meta chip inside the hero card bottom row.
class MetaPill extends StatelessWidget {
  const MetaPill({super.key, required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.80),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.softPurple),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, color: AppColors.textSecondary, size: 19),
          const SizedBox(width: 8),
          Flexible(
            child: Text(
              label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyles.smallMedium.copyWith(color: AppColors.text),
            ),
          ),
        ],
      ),
    );
  }
}

// MetaPill is also exported for use in other files if needed.
