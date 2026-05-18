import 'dart:async';

import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import 'package:toatre/models/toat_summary.dart';
import 'package:toatre/utils/app_colors.dart';
import 'package:toatre/utils/text_styles.dart';
import 'package:toatre/widgets/toat_detail/section_card.dart';

class LinksCard extends StatelessWidget {
  const LinksCard({super.key, required this.links});

  final List<ToatLink> links;

  @override
  Widget build(BuildContext context) {
    return SectionCard(
      title: 'Links',
      child: Column(
        children: [
          for (var index = 0; index < links.length; index++) ...[
            _LinkTile(link: links[index]),
            if (index != links.length - 1) const SizedBox(height: 12),
          ],
        ],
      ),
    );
  }
}

class _LinkTile extends StatelessWidget {
  const _LinkTile({required this.link});

  final ToatLink link;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(18),
      onTap: () {
        final uri = Uri.tryParse(link.url);
        if (uri == null) {
          return;
        }
        unawaited(launchUrl(uri, mode: LaunchMode.externalApplication));
      },
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: const Color(0xFFE7DED0)),
        ),
        child: Row(
          children: [
            _LinkThumb(link: link),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: 14,
                  vertical: 12,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      (link.ogTitle?.trim().isNotEmpty ?? false)
                          ? link.ogTitle!.trim()
                          : link.label,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyles.bodyMedium.copyWith(
                        color: AppColors.text,
                        height: 1.35,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      link.hostLabel ?? link.label,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyles.small.copyWith(
                        color: AppColors.textMuted,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const Padding(
              padding: EdgeInsets.only(right: 14),
              child: Icon(
                Icons.chevron_right_rounded,
                color: AppColors.textMuted,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _LinkThumb extends StatelessWidget {
  const _LinkThumb({required this.link});

  final ToatLink link;

  @override
  Widget build(BuildContext context) {
    final imageUrl = link.ogImage?.trim();
    if (imageUrl == null || imageUrl.isEmpty) {
      return Container(
        width: 72,
        height: 72,
        decoration: const BoxDecoration(
          color: Color(0xFFF4EFE8),
          borderRadius: BorderRadius.horizontal(left: Radius.circular(18)),
        ),
        alignment: Alignment.center,
        child: const Icon(
          Icons.link_rounded,
          color: AppColors.primary,
          size: 28,
        ),
      );
    }

    return ClipRRect(
      borderRadius: const BorderRadius.horizontal(left: Radius.circular(18)),
      child: SizedBox(
        width: 72,
        height: 72,
        child: Image.network(
          imageUrl,
          fit: BoxFit.cover,
          errorBuilder: (_, __, ___) => Container(
            color: const Color(0xFFF4EFE8),
            alignment: Alignment.center,
            child: const Icon(
              Icons.link_rounded,
              color: AppColors.primary,
              size: 28,
            ),
          ),
        ),
      ),
    );
  }
}
