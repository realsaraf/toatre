import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:toatre/models/toat_summary.dart';
import 'package:toatre/widgets/toat_detail/info_row.dart';
import 'package:toatre/widgets/toat_detail/section_card.dart';

/// Shows meeting-specific details: join link, time, and participants.
class MeetingDetailsCard extends StatelessWidget {
  const MeetingDetailsCard({super.key, required this.toat});

  final ToatSummary toat;

  @override
  Widget build(BuildContext context) {
    final joinUrl = toat.communicationEnrichment?['joinUrl'] as String?;
    return SectionCard(
      title: 'Meeting details',
      child: Column(
        children: [
          if (toat.datetime != null)
            InfoRow(
              label: 'When',
              value: DateFormat.yMMMd().add_jm().format(toat.datetime!),
            ),
          if (joinUrl != null && joinUrl.isNotEmpty)
            InfoRow(
              label: 'Link',
              value: joinUrl.replaceFirst(RegExp(r'^https?://'), ''),
            ),
          if (toat.people.isNotEmpty)
            InfoRow(label: 'People', value: toat.people.join(', ')),
        ],
      ),
    );
  }
}
