import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'package:toatre/models/toat_summary.dart';
import 'package:toatre/providers/toats_provider.dart';
import 'package:toatre/ui/toat/toat_detail_screen.dart';
import 'package:toatre/utils/app_colors.dart';
import 'package:toatre/utils/text_styles.dart';

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  late final TextEditingController _controller;
  String _query = '';

  @override
  void initState() {
    super.initState();
    _controller = TextEditingController();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final provider = context.read<ToatsProvider>();
      if (provider.toats.isEmpty && provider.status != ToatsStatus.loading) {
        provider.fetchToats();
      }
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<ToatsProvider>();
    final results = _filter(provider.toats, _query);

    return Scaffold(
      backgroundColor: AppColors.bg,
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 14, 20, 0),
              child: Row(
                children: [
                  _IconCircleButton(
                    icon: Icons.arrow_back_rounded,
                    onTap: () => Navigator.of(context).pop(),
                  ),
                  const SizedBox(width: 12),
                  Expanded(child: Text('Search', style: TextStyles.heading2)),
                ],
              ),
            ),
            Expanded(
              child: RefreshIndicator(
                onRefresh: provider.fetchToats,
                child: ListView(
                  padding: const EdgeInsets.fromLTRB(20, 20, 20, 28),
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        color: AppColors.bgElevated,
                        borderRadius: BorderRadius.circular(22),
                        border: Border.all(color: AppColors.border),
                      ),
                      child: Row(
                        children: [
                          const Icon(
                            Icons.search_rounded,
                            color: AppColors.textMuted,
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: TextField(
                              controller: _controller,
                              autofocus: true,
                              onChanged: (value) =>
                                  setState(() => _query = value),
                              style: TextStyles.body,
                              cursorColor: AppColors.primaryLight,
                              decoration: InputDecoration(
                                hintText: 'Search toats, people, places',
                                hintStyle: TextStyles.body.copyWith(
                                  color: AppColors.textMuted,
                                ),
                                border: InputBorder.none,
                              ),
                            ),
                          ),
                          if (_query.isNotEmpty)
                            IconButton(
                              onPressed: () {
                                _controller.clear();
                                setState(() => _query = '');
                              },
                              icon: const Icon(Icons.close_rounded),
                              color: AppColors.textMuted,
                            ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 18),
                    if (provider.status == ToatsStatus.loading)
                      const Padding(
                        padding: EdgeInsets.only(top: 80),
                        child: Center(child: CircularProgressIndicator()),
                      )
                    else if (provider.status == ToatsStatus.error)
                      _MessageCard(
                        title: 'Could not search your timeline.',
                        subtitle: provider.error ?? 'Pull to try again.',
                      )
                    else if (_query.trim().isEmpty)
                      _MessageCard(
                        title: 'Find anything you saved.',
                        subtitle:
                            'Search by title, notes, kind, tier, place, or person.',
                      )
                    else if (results.isEmpty)
                      const _MessageCard(
                        title: 'No matching toats.',
                        subtitle: 'Try a different word or handle.',
                      )
                    else ...[
                      Text(
                        '${results.length} result${results.length == 1 ? '' : 's'}',
                        style: TextStyles.smallMedium,
                      ),
                      const SizedBox(height: 12),
                      ...results.map(
                        (toat) => Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: _ResultCard(
                            toat: toat,
                            onTap: () => _openToat(toat),
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  List<ToatSummary> _filter(List<ToatSummary> toats, String query) {
    final needle = query.trim().toLowerCase();
    if (needle.isEmpty) {
      return const <ToatSummary>[];
    }

    return toats.where((toat) {
      final haystack = <String>[
        toat.title,
        _searchEnrichmentKey(toat),
        toat.tier,
        toat.state,
        toat.location ?? '',
        toat.notes ?? '',
        ...toat.people,
      ].join(' ').toLowerCase();
      return haystack.contains(needle);
    }).toList();
  }

  Future<void> _openToat(ToatSummary toat) async {
    final changed = await Navigator.of(context).push<bool>(
      MaterialPageRoute<bool>(
        builder: (_) => ToatDetailScreen(initialToat: toat),
      ),
    );
    if (!mounted || changed != true) {
      return;
    }
    await context.read<ToatsProvider>().fetchToats();
  }
}

class _ResultCard extends StatelessWidget {
  const _ResultCard({required this.toat, required this.onTap});

  final ToatSummary toat;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(22),
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          color: AppColors.bgElevated,
          borderRadius: BorderRadius.circular(22),
          border: Border.all(color: AppColors.border),
        ),
        child: Row(
          children: [
            Container(
              width: 42,
              height: 42,
              decoration: BoxDecoration(
                color: _kindColor(
                  _searchEnrichmentKey(toat),
                ).withValues(alpha: 0.16),
                borderRadius: BorderRadius.circular(18),
              ),
              child: Icon(
                _kindIcon(_searchEnrichmentKey(toat)),
                color: _kindColor(_searchEnrichmentKey(toat)),
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(toat.title, style: TextStyles.bodyMedium),
                  const SizedBox(height: 6),
                  Text(
                    [
                      _searchEnrichmentKey(toat),
                      toat.tier,
                      if (toat.location != null && toat.location!.isNotEmpty)
                        toat.location!,
                    ].join(' · '),
                    style: TextStyles.small,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            const SizedBox(width: 12),
            const Icon(Icons.chevron_right_rounded, color: AppColors.textMuted),
          ],
        ),
      ),
    );
  }
}

class _MessageCard extends StatelessWidget {
  const _MessageCard({required this.title, required this.subtitle});

  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        color: AppColors.bgElevated,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: TextStyles.heading3),
          const SizedBox(height: 8),
          Text(
            subtitle,
            style: TextStyles.body.copyWith(
              color: AppColors.textSecondary,
              height: 1.5,
            ),
          ),
        ],
      ),
    );
  }
}

class _IconCircleButton extends StatelessWidget {
  const _IconCircleButton({required this.icon, required this.onTap});

  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(22),
      child: Container(
        width: 44,
        height: 44,
        decoration: const BoxDecoration(
          color: AppColors.bgElevated,
          shape: BoxShape.circle,
        ),
        child: Icon(icon, color: AppColors.text),
      ),
    );
  }
}

IconData _kindIcon(String kind) {
  switch (kind) {
    case 'meeting':
      return Icons.videocam_outlined;
    case 'event':
      return Icons.confirmation_number_outlined;
    case 'idea':
      return Icons.lightbulb_outline_rounded;
    case 'errand':
      return Icons.location_on_outlined;
    case 'deadline':
      return Icons.bolt_rounded;
    default:
      return Icons.check_rounded;
  }
}

Color _kindColor(String kind) {
  switch (kind) {
    case 'meeting':
      return AppColors.info;
    case 'event':
      return AppColors.primaryLight;
    case 'idea':
      return AppColors.accent;
    case 'errand':
      return AppColors.warning;
    case 'deadline':
      return AppColors.error;
    default:
      return AppColors.success;
  }
}

String _searchEnrichmentKey(ToatSummary toat) {
  final e = toat.enrichments;
  final comm = e['communication'];
  if (comm is Map<String, dynamic>) {
    if (comm['joinUrl'] is String) return 'meeting';
    if (comm['channel'] == 'call' || comm['phone'] is String) return 'call';
    return 'message';
  }
  final event = e['event'];
  if (event is Map<String, dynamic>) return 'event';
  final action = e['action'];
  if (action is Map<String, dynamic>) {
    if (action['type'] == 'checklist') return 'checklist';
    if (action['type'] == 'errand') return 'errand';
    if (action['type'] == 'deadline') return 'deadline';
  }
  if (e['thought'] is Map<String, dynamic>) return 'idea';
  return 'task';
}
