import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'package:toatre/models/toat_summary.dart';
import 'package:toatre/providers/toats_provider.dart';
import 'package:toatre/ui/toat/toat_detail_screen.dart';
import 'package:toatre/utils/app_colors.dart';
import 'package:toatre/utils/text_styles.dart';

class PeopleScreen extends StatefulWidget {
  const PeopleScreen({super.key});

  @override
  State<PeopleScreen> createState() => _PeopleScreenState();
}

class _PeopleScreenState extends State<PeopleScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final provider = context.read<ToatsProvider>();
      if (provider.toats.isEmpty && provider.status != ToatsStatus.loading) {
        provider.fetchToats();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<ToatsProvider>();
    final people = _buildPeople(provider.toats);

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
                  Expanded(child: Text('People', style: TextStyles.heading2)),
                ],
              ),
            ),
            Expanded(
              child: RefreshIndicator(
                onRefresh: provider.fetchToats,
                child: ListView(
                  padding: const EdgeInsets.fromLTRB(20, 20, 20, 28),
                  children: [
                    _IntroCard(count: people.length),
                    const SizedBox(height: 16),
                    if (provider.status == ToatsStatus.loading)
                      const Padding(
                        padding: EdgeInsets.only(top: 64),
                        child: Center(child: CircularProgressIndicator()),
                      )
                    else if (provider.status == ToatsStatus.error)
                      _MessageCard(
                        title: 'Could not load people.',
                        subtitle: provider.error ?? 'Pull to try again.',
                      )
                    else if (people.isEmpty)
                      const _MessageCard(
                        title: 'No people yet.',
                        subtitle:
                            'Mention a person in a capture and they will show up here.',
                      )
                    else
                      ...people.map(
                        (person) => Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: _PersonCard(
                            person: person,
                            onTap: () => _openPerson(person),
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  List<_TimelinePerson> _buildPeople(List<ToatSummary> toats) {
    final buckets = <String, List<ToatSummary>>{};
    final displayNames = <String, String>{};

    for (final toat in toats) {
      for (final rawPerson in toat.people) {
        final person = rawPerson.trim();
        if (person.isEmpty) {
          continue;
        }
        final key = person.toLowerCase();
        displayNames.putIfAbsent(key, () => person);
        buckets.putIfAbsent(key, () => <ToatSummary>[]).add(toat);
      }
    }

    final people = buckets.entries.map((entry) {
      final personToats = List<ToatSummary>.from(entry.value)
        ..sort((left, right) {
          final leftDate = left.datetime ?? left.createdAt ?? DateTime(2100);
          final rightDate = right.datetime ?? right.createdAt ?? DateTime(2100);
          return leftDate.compareTo(rightDate);
        });
      return _TimelinePerson(
        name: displayNames[entry.key] ?? entry.key,
        toats: personToats,
      );
    }).toList();

    people.sort((left, right) => left.name.compareTo(right.name));
    return people;
  }

  Future<void> _openPerson(_TimelinePerson person) async {
    await showModalBottomSheet<void>(
      context: context,
      backgroundColor: AppColors.bgElevated,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      builder: (context) {
        return DraggableScrollableSheet(
          expand: false,
          initialChildSize: 0.72,
          minChildSize: 0.4,
          maxChildSize: 0.92,
          builder: (context, scrollController) {
            return ListView(
              controller: scrollController,
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 28),
              children: [
                Center(
                  child: Container(
                    width: 46,
                    height: 5,
                    decoration: BoxDecoration(
                      color: AppColors.textMuted.withValues(alpha: 0.35),
                      borderRadius: BorderRadius.circular(99),
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                Text(person.name, style: TextStyles.heading1),
                const SizedBox(height: 6),
                Text(
                  '${person.toats.length} shared timeline reference${person.toats.length == 1 ? '' : 's'}',
                  style: TextStyles.body.copyWith(
                    color: AppColors.textSecondary,
                  ),
                ),
                const SizedBox(height: 18),
                ...person.toats.map(
                  (toat) => Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: _ToatMiniCard(
                      toat: toat,
                      onTap: () async {
                        Navigator.of(context).pop();
                        await _openToat(toat);
                      },
                    ),
                  ),
                ),
              ],
            );
          },
        );
      },
    );
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

class _TimelinePerson {
  const _TimelinePerson({required this.name, required this.toats});

  final String name;
  final List<ToatSummary> toats;
}

class _IntroCard extends StatelessWidget {
  const _IntroCard({required this.count});

  final int count;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        color: AppColors.bgElevated,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          Container(
            width: 50,
            height: 50,
            decoration: BoxDecoration(
              gradient: AppColors.brandGradient,
              borderRadius: BorderRadius.circular(22),
            ),
            child: const Icon(Icons.people_rounded, color: Colors.white),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('$count people', style: TextStyles.heading3),
                const SizedBox(height: 6),
                Text(
                  'People mentioned in your toats, gathered from your timeline.',
                  style: TextStyles.small.copyWith(height: 1.4),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _PersonCard extends StatelessWidget {
  const _PersonCard({required this.person, required this.onTap});

  final _TimelinePerson person;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final next = person.toats.isEmpty ? null : person.toats.first;

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
            CircleAvatar(
              radius: 24,
              backgroundColor: AppColors.primary.withValues(alpha: 0.22),
              child: Text(
                person.name.characters.first.toUpperCase(),
                style: TextStyles.bodyMedium.copyWith(
                  color: AppColors.primaryLight,
                ),
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(person.name, style: TextStyles.bodyMedium),
                  const SizedBox(height: 6),
                  Text(
                    next == null
                        ? 'No active toats'
                        : '${person.toats.length} toat${person.toats.length == 1 ? '' : 's'} · ${next.title}',
                    style: TextStyles.small,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            const Icon(Icons.chevron_right_rounded, color: AppColors.textMuted),
          ],
        ),
      ),
    );
  }
}

class _ToatMiniCard extends StatelessWidget {
  const _ToatMiniCard({required this.toat, required this.onTap});

  final ToatSummary toat;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(18),
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.bg,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: AppColors.border),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(toat.title, style: TextStyles.bodyMedium),
            const SizedBox(height: 6),
            Text(
              '${_peopleEnrichmentKey(toat)} · ${toat.tier}',
              style: TextStyles.small,
            ),
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

String _peopleEnrichmentKey(ToatSummary toat) {
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
  }
  if (e['thought'] is Map<String, dynamic>) return 'idea';
  return 'task';
}
