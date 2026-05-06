import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:toatre/models/toat_summary.dart';

/// Derives the subtitle line shown under the title in the hero card.
String detailSubtitle(ToatSummary toat) {
  if (toat.location != null && toat.location!.isNotEmpty) {
    return toat.location!;
  }
  final joinUrl = toat.communicationEnrichment?['joinUrl'] as String?;
  if (joinUrl != null && joinUrl.isNotEmpty) {
    return meetingPlatform(joinUrl);
  }
  if (toat.people.isNotEmpty) {
    return toat.people.join(', ');
  }
  if (toat.datetime != null) {
    return DateFormat.yMMMMd().add_jm().format(toat.datetime!);
  }
  return 'Personal';
}

/// Derives a human-readable meeting platform label from a join URL.
String meetingPlatform(String link) {
  final lowerLink = link.toLowerCase();
  if (lowerLink.contains('zoom')) return 'Zoom meeting';
  if (lowerLink.contains('meet.google')) return 'Google Meet';
  if (lowerLink.contains('teams')) return 'Teams meeting';
  return 'Meeting link';
}

/// Returns phone from communication enrichment, or null.
String? detailPhone(ToatSummary toat) {
  final phone = toat.communicationEnrichment?['phone'];
  if (phone is String && phone.isNotEmpty) return phone;
  return null;
}

/// Template-to-gradient-colors map (template key → [start, end]).
List<Color> detailTemplateColors(String template) {
  switch (template) {
    case 'meeting':
      return const [Color(0xFF60A5FA), Color(0xFF2563EB)];
    case 'call':
      return const [Color(0xFFF43F5E), Color(0xFFEC4899)];
    case 'appointment':
      return const [Color(0xFF7C3AED), Color(0xFF5B3DF5)];
    case 'event':
      return const [Color(0xFF7C3AED), Color(0xFF5B3DF5)];
    case 'deadline':
      return const [Color(0xFFEF4444), Color(0xFFDC2626)];
    case 'checklist':
      return const [Color(0xFF4ADE80), Color(0xFF16A34A)];
    case 'errand':
      return const [Color(0xFFA855F7), Color(0xFF8B5CF6)];
    case 'follow_up':
      return const [Color(0xFF06B6D4), Color(0xFF0891B2)];
    case 'idea':
      return const [Color(0xFFFBBF24), Color(0xFFF59E0B)];
    default: // task
      return const [Color(0xFF8B5CF6), Color(0xFF6D28D9)];
  }
}

/// Template-to-icon map.
IconData detailTemplateIcon(String template) {
  switch (template) {
    case 'meeting':
      return Icons.videocam_rounded;
    case 'call':
      return Icons.call_rounded;
    case 'appointment':
      return Icons.medical_services_outlined;
    case 'event':
      return Icons.confirmation_number_outlined;
    case 'deadline':
      return Icons.timer_outlined;
    case 'checklist':
      return Icons.checklist_rounded;
    case 'errand':
      return Icons.shopping_cart_outlined;
    case 'follow_up':
      return Icons.replay_rounded;
    case 'idea':
      return Icons.lightbulb_outline_rounded;
    default: // task
      return Icons.mail_outline_rounded;
  }
}

/// Derives the enrichment key (template slug) from a toat's enrichments map.
String detailEnrichmentKey(ToatSummary toat) {
  final e = toat.enrichments;
  final comm = e['communication'];
  if (comm is Map<String, dynamic>) {
    if (comm['joinUrl'] is String) return 'meeting';
    if (comm['channel'] == 'call' || comm['phone'] is String) return 'call';
    return 'follow_up';
  }
  final event = e['event'];
  if (event is Map<String, dynamic>) return 'event';
  final action = e['action'];
  if (action is Map<String, dynamic>) {
    if (action['type'] == 'checklist') return 'checklist';
    if (action['type'] == 'errand') return 'errand';
  }
  final thought = e['thought'];
  if (thought is Map<String, dynamic>) return 'idea';
  // Keyword fallback for toats with empty/missing enrichments
  return _keywordEnrichmentKey(toat.title);
}

/// Title-keyword-based enrichment key when no structured enrichment matched.
String _keywordEnrichmentKey(String title) {
  final t = title.toLowerCase();
  bool has(List<String> kws) => kws.any(t.contains);
  if (has(['grocery', 'groceries', 'supermarket', 'market', 'shopping', 'buy ', 'pick up', 'pickup', 'get ', 'order'])) return 'errand';
  if (has(['call', 'phone', 'ring', 'dial'])) return 'call';
  if (has(['email', 'message', 'text', 'send', 'follow up', 'follow-up'])) return 'follow_up';
  if (has(['meeting', 'standup', 'sync', 'zoom', 'meet '])) return 'meeting';
  if (has(['idea', 'thought', 'note', 'remember'])) return 'idea';
  return 'task';
}

/// Gradient colors derived from the toat's enrichment kind.
List<Color> detailEnrichmentColors(ToatSummary toat) =>
    detailTemplateColors(detailEnrichmentKey(toat));

/// Icon derived from the toat's enrichment kind.
IconData detailEnrichmentIcon(ToatSummary toat) =>
    detailTemplateIcon(detailEnrichmentKey(toat));

/// Icon for the primary CTA button in the hero card.
IconData detailActionIcon(ToatSummary toat) {
  if (detailPhone(toat) != null) return Icons.call_rounded;
  final joinUrl = toat.communicationEnrichment?['joinUrl'] as String?;
  if (joinUrl != null && joinUrl.isNotEmpty) return Icons.videocam_rounded;
  if (toat.location != null && toat.location!.isNotEmpty) {
    return Icons.drive_eta_rounded;
  }
  return Icons.add_location_alt_outlined;
}

/// Gradient colors for the primary CTA button in the hero card.
List<Color> detailActionColors(ToatSummary toat) {
  if (detailPhone(toat) != null) {
    return const [Color(0xFFFB7185), Color(0xFFEC4899)];
  }
  final joinUrl = toat.communicationEnrichment?['joinUrl'] as String?;
  if (joinUrl != null && joinUrl.isNotEmpty) {
    return const [Color(0xFF3B82F6), Color(0xFF2563EB)];
  }
  if (toat.location != null && toat.location!.isNotEmpty) {
    return const [Color(0xFF7C3AED), Color(0xFF6D28D9)];
  }
  return const [Color(0xFF8B5CF6), Color(0xFFEC4899)];
}
