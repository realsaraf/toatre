import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:toatre/models/toat_summary.dart';
import 'package:toatre/utils/app_colors.dart';
import 'package:toatre/utils/text_styles.dart';
import 'package:toatre/widgets/toat_detail/toat_detail_utils.dart';

/// The large hero card at the top of the toat detail screen.
/// Layout: icon + title → (time chip + action button) → address
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

  /// Returns null when there is no actionable target (no location, no join URL, no phone).
  String? get _actionLabel {
    final phone = detailPhone(toat);
    if (phone != null) return 'Call';
    final joinUrl = toat.communicationEnrichment?['joinUrl'] as String?;
    if (joinUrl != null && joinUrl.isNotEmpty) return 'Join';
    final loc = toat.location;
    if (loc != null && loc.isNotEmpty) return 'Directions';
    return null;
  }

  IconData get _actionIcon {
    final phone = detailPhone(toat);
    if (phone != null) return Icons.call_rounded;
    final joinUrl = toat.communicationEnrichment?['joinUrl'] as String?;
    if (joinUrl != null && joinUrl.isNotEmpty) return Icons.videocam_rounded;
    return Icons.navigation_rounded;
  }

  bool get _showActionLabel {
    // Join and Call show a label; Directions shows icon only
    final label = _actionLabel;
    return label == 'Join' || label == 'Call';
  }

  String? get _location {
    final loc = toat.location;
    return (loc != null && loc.isNotEmpty) ? loc : null;
  }

  /// Returns a relative label: "Today, 3:00 PM" / "Tomorrow, 3:00 PM" /
  /// "Thu, May 7 · 3:00 PM".
  static String _relativeTimeLabel(DateTime dt) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final dtDay = DateTime(dt.year, dt.month, dt.day);
    final diff = dtDay.difference(today).inDays;
    final time = DateFormat.jm().format(dt);
    if (diff == 0) return 'Today · $time';
    if (diff == 1) return 'Tomorrow · $time';
    if (diff == -1) return 'Yesterday · $time';
    return '${DateFormat('EEE, MMM d').format(dt)} · $time';
  }

  @override
  Widget build(BuildContext context) {
    final colors = detailEnrichmentColors(toat);
    final hasTime = toat.datetime != null;
    final actionLabel = _actionLabel;
    final location = _location;

    return Container(
      padding: const EdgeInsets.fromLTRB(16, 15, 16, 15),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            colors.first.withValues(alpha: 0.09),
            colors.last.withValues(alpha: 0.04),
            Colors.white.withValues(alpha: 0.86),
          ],
        ),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: colors.last.withValues(alpha: 0.12)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x16000000),
            blurRadius: 22,
            offset: Offset(0, 10),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Icon
          Container(
            width: 52,
            height: 52,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(15),
              gradient: LinearGradient(colors: colors),
              boxShadow: [
                BoxShadow(
                  color: colors.last.withValues(alpha: 0.24),
                  blurRadius: 12,
                  offset: const Offset(0, 5),
                ),
              ],
            ),
            child: Center(
              child: detailEnrichmentGlyph(toat, size: 23, color: Colors.white),
            ),
          ),
          const SizedBox(width: 12),
          // Content column
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Title
                Text(
                  toat.title,
                  maxLines: 3,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyles.display.copyWith(
                    fontSize: 18,
                    height: 1.14,
                  ),
                ),
                // Time + action row
                if (hasTime || actionLabel != null) ...[
                  const SizedBox(height: 9),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      if (hasTime)
                        _TimeChip(label: _relativeTimeLabel(toat.datetime!)),
                      if (actionLabel != null)
                        _ActionButton(
                          icon: _actionIcon,
                          label: _showActionLabel ? actionLabel : null,
                          colors: detailActionColors(toat),
                          onTap: onPrimaryAction,
                        ),
                    ],
                  ),
                ],
                // Address
                if (location != null) ...[
                  const SizedBox(height: 6),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Padding(
                        padding: EdgeInsets.only(top: 1),
                        child: Icon(
                          Icons.location_on_outlined,
                          size: 14,
                          color: AppColors.textSecondary,
                        ),
                      ),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          location,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyles.small.copyWith(
                            color: AppColors.textSecondary,
                            height: 1.35,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Compact time badge (glass-style).
class _TimeChip extends StatelessWidget {
  const _TimeChip({required this.label});
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 7),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.80),
        borderRadius: BorderRadius.circular(13),
        border: Border.all(color: AppColors.softPurple),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(
            Icons.schedule_rounded,
            size: 14,
            color: AppColors.textSecondary,
          ),
          const SizedBox(width: 4),
          Text(
            label,
            style: TextStyles.small.copyWith(
              color: AppColors.text,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}

/// Square or pill action button in the hero card.
/// Shows icon-only for Directions; icon + label for Join/Call.
class _ActionButton extends StatelessWidget {
  const _ActionButton({
    required this.icon,
    required this.colors,
    required this.onTap,
    this.label,
  });

  final IconData icon;
  final List<Color> colors;
  final VoidCallback onTap;
  final String? label; // null = icon only

  @override
  Widget build(BuildContext context) {
    final iconWidget = Icon(icon, color: Colors.white, size: 18);
    final decoration = BoxDecoration(
      gradient: LinearGradient(colors: colors),
      borderRadius: BorderRadius.circular(label != null ? 14 : 12),
    );

    if (label == null) {
      // Icon-only square (Directions)
      return GestureDetector(
        onTap: onTap,
        child: Container(
          width: 38,
          height: 38,
          decoration: decoration,
          child: Center(child: iconWidget),
        ),
      );
    }

    // Icon + label pill (Join / Call)
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: decoration,
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            iconWidget,
            const SizedBox(width: 6),
            Text(
              label!,
              style: TextStyles.small.copyWith(
                color: Colors.white,
                fontWeight: FontWeight.w700,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// MetaPill kept for potential external use.
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
