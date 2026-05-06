import 'package:flutter/material.dart';
import 'package:toatre/config/app_config.dart';
import 'package:toatre/utils/app_colors.dart';

/// Displays a static map image for a given [location] string.
class MapCard extends StatelessWidget {
  const MapCard({super.key, required this.location});

  final String location;

  @override
  Widget build(BuildContext context) {
    final mapUrl = AppConfig.apiUri(
      '/api/places/staticmap',
      queryParameters: {'q': location},
    ).toString();
    return ClipRRect(
      borderRadius: BorderRadius.circular(20),
      child: SizedBox(
        height: 160,
        width: double.infinity,
        child: Image.network(
          mapUrl,
          fit: BoxFit.cover,
          loadingBuilder: (_, child, progress) {
            if (progress == null) return child;
            return Container(
              color: AppColors.bgElevated,
              child: const Center(
                child: CircularProgressIndicator(strokeWidth: 2),
              ),
            );
          },
          errorBuilder: (_, __, ___) => Container(
            color: AppColors.bgElevated,
            child: const Center(
              child: Icon(
                Icons.map_outlined,
                color: AppColors.textMuted,
                size: 32,
              ),
            ),
          ),
        ),
      ),
    );
  }
}
