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
      return Icons.task_alt_rounded;
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
  return keywordEnrichmentKey(toat.title);
}

/// Title-keyword-based enrichment key when no structured enrichment matched.
/// Used by timeline, capture, and detail screens — single source of truth.
String keywordEnrichmentKey(String title) {
  final t = title.toLowerCase();
  bool has(List<String> kws) => kws.any(t.contains);
  if (has([
    'grocery',
    'groceries',
    'supermarket',
    'market',
    'shopping',
    'buy ',
    'pick up',
    'pickup',
    'get ',
    'order',
  ]))
    return 'errand';
  if (has(['call', 'phone', 'ring', 'dial'])) return 'call';
  if (has(['email', 'message', 'text', 'send', 'follow up', 'follow-up']))
    return 'follow_up';
  if (has(['meeting', 'standup', 'sync', 'zoom', 'meet '])) return 'meeting';
  // Pick-up / drop-off
  if (has([
    'bring son',
    'bring daughter',
    'bring kid',
    'drop son',
    'drop daughter',
    'pick son',
    'pick daughter',
    'drop off',
    'drive to',
  ]))
    return 'errand';
  // Medical
  if (has([
    'doctor',
    'physician',
    'hospital',
    'clinic',
    'dentist',
    'dental',
    'checkup',
    'pharmacy',
  ]))
    return 'appointment';
  // Events / occasions
  if (has([
    'party',
    'wedding',
    'concert',
    'ceremony',
    'festival',
    'birthday',
    'graduation',
    'game',
    'match',
    'tournament',
  ]))
    return 'event';
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

/// Keyword-aware icon selector — single source of truth for all screens.
/// Pass the enrichment key (from [detailEnrichmentKey]) and the toat title.
IconData toatSmartIcon(String template, String title) {
  final t = title.toLowerCase();
  bool has(List<String> kws) => kws.any(t.contains);

  // Sports
  if (has(['soccer', 'football', 'futbol'])) return Icons.sports_soccer_rounded;
  if (has(['basketball'])) return Icons.sports_basketball_rounded;
  if (has(['baseball', 'softball'])) return Icons.sports_baseball_rounded;
  if (has(['tennis', 'badminton'])) return Icons.sports_tennis_rounded;
  if (has(['golf'])) return Icons.golf_course_rounded;
  if (has(['volleyball'])) return Icons.sports_volleyball_rounded;
  if (has([
    'gym',
    'workout',
    'fitness',
    'exercise',
    'training',
    'yoga',
    'pilates',
  ])) {
    return Icons.fitness_center_rounded;
  }
  if (has(['swim', 'swimming', 'pool', 'diving'])) return Icons.pool_rounded;
  if (has(['cycling', 'bike', 'bicycle'])) return Icons.directions_bike_rounded;
  if (has(['run', 'jog', 'jogging', 'marathon']))
    return Icons.directions_run_rounded;
  if (has(['hike', 'hiking', 'trail'])) return Icons.hiking_rounded;
  if (has(['sport', 'game', 'match', 'tournament']))
    return Icons.sports_rounded;

  // Kids / school
  if (has(['sunday school', 'church school'])) return Icons.church_rounded;
  if (has([
    'school',
    'class',
    'study',
    'homework',
    'lesson',
    'tutor',
    'exam',
    'test',
  ])) {
    return Icons.school_rounded;
  }
  if (has(['university', 'college', 'campus']))
    return Icons.account_balance_rounded;
  if (has(['read', 'book', 'library', 'reading']))
    return Icons.menu_book_rounded;

  // Food & drink
  if (has(['coffee', 'cafe', 'starbucks', 'latte']))
    return Icons.local_cafe_rounded;
  if (has(['grocery', 'groceries', 'supermarket', 'market']))
    return Icons.shopping_cart_rounded;
  if (has([
    'restaurant',
    'dinner',
    'lunch',
    'breakfast',
    'brunch',
    'eat out',
    'food',
  ])) {
    return Icons.restaurant_rounded;
  }

  // Medical
  if (has([
    'pharmacy',
    'drugstore',
    'prescription',
    'medication',
    'medicine',
  ])) {
    return Icons.local_pharmacy_rounded;
  }
  if (has(['dentist', 'dental', 'teeth'])) return Icons.local_hospital_rounded;
  if (has([
    'doctor',
    'physician',
    'clinic',
    'hospital',
    'medical',
    'health',
    'checkup',
  ])) {
    return Icons.local_hospital_rounded;
  }
  if (has(['haircut', 'barber', 'salon', 'hair']))
    return Icons.content_cut_rounded;

  // Transport / travel
  if (has(['airport', 'fly', 'flight', 'plane', 'travel', 'trip']))
    return Icons.flight_rounded;
  if (has(['train', 'subway', 'metro', 'rail', 'transit', 'bus'])) {
    return Icons.directions_transit_rounded;
  }
  if (has([
    'drive',
    'driving',
    'drop son',
    'drop daughter',
    'pick son',
    'pick daughter',
    'pick up',
    'pickup',
    'drop off',
  ])) {
    return Icons.directions_car_rounded;
  }

  // Faith
  if (has([
    'church',
    'mosque',
    'temple',
    'worship',
    'prayer',
    'pray',
    'mass',
    'sermon',
  ])) {
    return Icons.church_rounded;
  }

  // Work & comms
  if (has([
    'zoom',
    'teams',
    'meet',
    'google meet',
    'virtual',
    'video call',
    'video meeting',
  ])) {
    return Icons.videocam_rounded;
  }
  if (has(['email', 'send email', 'reply to', 'respond to']))
    return Icons.email_rounded;
  if (has(['call', 'phone', 'ring', 'talk to', 'catch up with']))
    return Icons.call_rounded;
  if (has(['interview', 'hiring', 'recruiting'])) return Icons.work_rounded;
  if (has(['deadline', 'due date', 'submit', 'submission']))
    return Icons.timer_outlined;
  if (has(['presentation', 'present', 'deck', 'slides', 'keynote'])) {
    return Icons.present_to_all_rounded;
  }
  if (has(['document', 'report', 'write', 'draft', 'review', 'proposal'])) {
    return Icons.description_rounded;
  }
  if (has(['meeting', 'standup', 'sync', 'catchup', 'catch up', 'huddle'])) {
    return Icons.groups_rounded;
  }

  // Home & chores
  if (has(['clean', 'tidy', 'vacuum', 'laundry', 'wash', 'iron', 'mop'])) {
    return Icons.cleaning_services_rounded;
  }
  if (has(['cook', 'cooking', 'bake', 'baking', 'meal prep', 'prepare meal'])) {
    return Icons.restaurant_rounded;
  }
  if (has([
    'repair',
    'fix',
    'plumber',
    'electrician',
    'maintenance',
    'handyman',
  ])) {
    return Icons.build_rounded;
  }
  if (has(['buy', 'purchase', 'order', 'shop', 'store', 'mall'])) {
    return Icons.shopping_bag_rounded;
  }

  // People
  if (has(['baby', 'child', 'kid', 'toddler', 'infant']))
    return Icons.child_care_rounded;
  if (has(['pet', 'dog', 'cat', 'vet', 'puppy', 'kitten']))
    return Icons.pets_rounded;

  // Template defaults
  switch (template) {
    case 'meeting':
      return Icons.groups_rounded;
    case 'call':
      return Icons.call_rounded;
    case 'appointment':
      return Icons.event_rounded;
    case 'event':
      return Icons.confirmation_number_outlined;
    case 'deadline':
      return Icons.timer_outlined;
    case 'task':
      return Icons.task_alt_rounded;
    case 'checklist':
      return Icons.checklist_rounded;
    case 'errand':
      return Icons.pin_drop_rounded;
    case 'follow_up':
      return Icons.replay_rounded;
    case 'idea':
      return Icons.lightbulb_outline_rounded;
    default:
      return Icons.radio_button_unchecked_rounded;
  }
}
