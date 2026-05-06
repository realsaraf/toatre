import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:toatre/models/toat_summary.dart';
import 'package:toatre/widgets/toat_detail/info_row.dart';
import 'package:toatre/widgets/toat_detail/section_card.dart';

/// Shows immutable metadata: tier, state, and captured timestamp.
class DetailsCard extends StatelessWidget {
  const DetailsCard({super.key, required this.toat});

  final ToatSummary toat;

  @override
  Widget build(BuildContext context) {
    return SectionCard(
      title: 'Details',
      child: Column(
        children: [
          InfoRow(label: 'Tier', value: toat.tier),
          InfoRow(label: 'State', value: toat.state),
          if (toat.createdAt != null)
            InfoRow(
              label: 'Captured',
              value: DateFormat.yMMMd().add_jm().format(toat.createdAt!),
            ),
        ],
      ),
    );
  }
}
