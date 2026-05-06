import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:toatre/utils/app_colors.dart';
import 'package:toatre/utils/text_styles.dart';
import 'package:toatre/widgets/toat_detail/map_card.dart';

/// Shows the confirmed location: address chip, map thumbnail, and primary CTA.
class LocationSection extends StatelessWidget {
  const LocationSection({
    super.key,
    required this.location,
    required this.onChangeLocation,
    required this.onRemoveLocation,
  });

  final String location;
  final VoidCallback? onChangeLocation;
  final VoidCallback? onRemoveLocation;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
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
            children: [
              const Icon(
                Icons.location_on_rounded,
                size: 16,
                color: AppColors.primary,
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  location,
                  style: TextStyles.small.copyWith(color: AppColors.text),
                ),
              ),
              GestureDetector(
                onTap: () {
                  Clipboard.setData(ClipboardData(text: location));
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Address copied'),
                      duration: Duration(seconds: 2),
                    ),
                  );
                },
                child: const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 4),
                  child: Icon(
                    Icons.copy_rounded,
                    size: 15,
                    color: AppColors.textMuted,
                  ),
                ),
              ),
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
        const SizedBox(height: 10),
        MapCard(location: location),
      ],
    );
  }
}

/// A dashed-border button shown when no location has been set yet.
class AddLocationButton extends StatelessWidget {
  const AddLocationButton({super.key, required this.onTap});

  final VoidCallback? onTap;

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
            const Icon(
              Icons.add_location_alt_outlined,
              size: 20,
              color: AppColors.primary,
            ),
            const SizedBox(width: 8),
            Text(
              'Add location',
              style: TextStyles.bodyMedium.copyWith(color: AppColors.primary),
            ),
          ],
        ),
      ),
    );
  }
}
