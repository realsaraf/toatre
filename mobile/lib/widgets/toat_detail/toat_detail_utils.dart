import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:toatre/models/toat_summary.dart';
import 'package:toatre/widgets/toat_glyph.dart';

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

/// Visual-key-to-gradient-colors map.
List<Color> detailTemplateColors(String template) {
  switch (template) {
    case 'communication_meeting':
    case 'meeting':
      return const [Color(0xFF3B82F6), Color(0xFF2563EB)];
    case 'communication_call':
    case 'call':
      return const [Color(0xFFF43F5E), Color(0xFFEC4899)];
    case 'communication_message':
    case 'follow_up':
      return const [Color(0xFF06B6D4), Color(0xFF0891B2)];
    case 'thought':
    case 'idea':
      return const [Color(0xFFF59E0B), Color(0xFFFBBF24)];
    case 'school':
      return const [Color(0xFF6366F1), Color(0xFF4F46E5)];
    case 'flight':
      return const [Color(0xFF38BDF8), Color(0xFF0284C7)];
    case 'transport':
      return const [Color(0xFF0EA5E9), Color(0xFF0284C7)];
    case 'dining':
      return const [Color(0xFFF97316), Color(0xFFEA580C)];
    case 'medical':
    case 'appointment':
      return const [Color(0xFFEF4444), Color(0xFFDC2626)];
    case 'sports':
      return const [Color(0xFF10B981), Color(0xFF059669)];
    case 'event':
      return const [Color(0xFF7C3AED), Color(0xFF5B3DF5)];
    case 'deadline':
      return const [Color(0xFFEF4444), Color(0xFFDC2626)];
    case 'checklist':
      return const [Color(0xFF22C55E), Color(0xFF16A34A)];
    case 'errand':
      return const [Color(0xFF8B5CF6), Color(0xFF7C3AED)];
    case 'task':
    default: // task
      return const [Color(0xFFF97316), Color(0xFFFB923C)];
  }
}

/// Accent color used for buttons, labels, and action affordances.
Color detailTemplateAccent(String template) {
  switch (template) {
    case 'communication_meeting':
    case 'meeting':
      return const Color(0xFF2563EB);
    case 'communication_call':
    case 'call':
      return const Color(0xFFDB2777);
    case 'communication_message':
    case 'follow_up':
      return const Color(0xFF0891B2);
    case 'thought':
    case 'idea':
      return const Color(0xFFD97706);
    case 'school':
      return const Color(0xFF4338CA);
    case 'flight':
      return const Color(0xFF0284C7);
    case 'transport':
      return const Color(0xFF0369A1);
    case 'dining':
      return const Color(0xFFC2410C);
    case 'medical':
    case 'appointment':
    case 'deadline':
      return const Color(0xFFB91C1C);
    case 'sports':
      return const Color(0xFF047857);
    case 'event':
    case 'errand':
      return const Color(0xFF6D28D9);
    case 'checklist':
      return const Color(0xFF16A34A);
    case 'task':
    default:
      return const Color(0xFFEA580C);
  }
}

/// Soft surface color paired with the accent color.
Color detailTemplateSoft(String template) {
  switch (template) {
    case 'communication_meeting':
    case 'meeting':
      return const Color(0x1F3B82F6);
    case 'communication_call':
    case 'call':
      return const Color(0x1FEC4899);
    case 'communication_message':
    case 'follow_up':
      return const Color(0x1F06B6D4);
    case 'thought':
    case 'idea':
      return const Color(0x1FF59E0B);
    case 'school':
      return const Color(0x1F6366F1);
    case 'flight':
      return const Color(0x1F38BDF8);
    case 'transport':
      return const Color(0x1F0EA5E9);
    case 'dining':
    case 'task':
      return const Color(0x1FF97316);
    case 'medical':
    case 'appointment':
    case 'deadline':
      return const Color(0x1FEF4444);
    case 'sports':
      return const Color(0x1F10B981);
    case 'event':
      return const Color(0x1F7C3AED);
    case 'checklist':
      return const Color(0x1F22C55E);
    case 'errand':
      return const Color(0x1F8B5CF6);
    default:
      return const Color(0x1FF97316);
  }
}

/// Visual-key-to-icon map.
IconData detailTemplateIcon(String template) {
  switch (template) {
    case 'communication_meeting':
    case 'meeting':
      return Icons.videocam_rounded;
    case 'communication_call':
    case 'call':
      return Icons.call_rounded;
    case 'communication_message':
    case 'follow_up':
      return Icons.email_rounded;
    case 'thought':
    case 'idea':
      return Icons.lightbulb_outline_rounded;
    case 'school':
      return Icons.school_rounded;
    case 'flight':
      return Icons.flight_rounded;
    case 'transport':
      return Icons.directions_car_rounded;
    case 'dining':
      return Icons.restaurant_rounded;
    case 'medical':
    case 'appointment':
      return Icons.local_hospital_rounded;
    case 'sports':
      return Icons.sports_soccer_rounded;
    case 'event':
      return Icons.confirmation_number_outlined;
    case 'deadline':
      return Icons.timer_outlined;
    case 'checklist':
      return Icons.checklist_rounded;
    case 'errand':
      return Icons.shopping_cart_outlined;
    case 'task':
    default: // task
      return Icons.task_alt_rounded;
  }
}

/// Derives the shared visual key from a toat's enrichments and title.
String detailEnrichmentKey(ToatSummary toat) {
  final title = toat.title.toLowerCase();
  bool has(List<String> kws) => kws.any(title.contains);

  if (has(['flight', 'flying', 'airplane', 'plane', 'airfare'])) {
    return 'flight';
  }

  final e = toat.enrichments;
  final comm = e['communication'];
  if (comm is Map<String, dynamic>) {
    final joinUrl = comm['joinUrl'];
    if (joinUrl is String && joinUrl.isNotEmpty) return 'communication_meeting';
    if (comm['channel'] == 'call' || comm['phone'] is String) {
      return 'communication_call';
    }
    return 'communication_message';
  }
  final event = e['event'];
  if (event is Map<String, dynamic>) return 'event';
  final action = e['action'];
  if (action is Map<String, dynamic>) {
    if (action['type'] == 'checklist') return 'checklist';
    if (action['type'] == 'errand') return 'errand';
  }
  final thought = e['thought'];
  if (thought is Map<String, dynamic>) return 'thought';
  // Keyword fallback for toats with empty/missing enrichments
  return keywordEnrichmentKey(toat.title);
}

/// Title-keyword-based visual key fallback used across Flutter surfaces.
String keywordEnrichmentKey(String title) {
  final t = title.toLowerCase();
  bool has(List<String> kws) => kws.any(t.contains);

  if (has(['flight', 'flying', 'airplane', ' plane', 'airfare'])) {
    return 'flight';
  }

  if (has(['call', 'phone', 'ring', 'dial'])) return 'communication_call';
  if (has([
    'zoom',
    'google meet',
    'teams',
    'webex',
    'standup',
    'stand-up',
    'video call',
    'video chat',
    'scrum',
    '1-on-1',
    '1 on 1',
    'meeting',
    'catch up',
    'check in',
    'sync',
  ])) {
    return 'communication_meeting';
  }
  if (has([
    'email',
    'text',
    'message',
    'reply',
    'send',
    'follow up',
    'follow-up',
    'dm',
  ])) {
    return 'communication_message';
  }

  if (has([
    'grocery',
    'groceries',
    'groceri',
    'supermarket',
    'market',
    'walmart',
    'target',
    'costco',
    'aldi',
    'trader joe',
    'whole foods',
  ])) {
    return 'checklist';
  }
  if (has([
    'errand',
    'drop off',
    'drop-off',
    'pharmacy',
    'drugstore',
    'hardware',
    'post office',
    'shopping',
    'buy ',
    'purchase',
    'shop',
    'store',
    'mall',
    'pick up',
    'pickup',
    'order',
  ])) {
    return 'errand';
  }

  if (has([
    'school',
    'class',
    'lesson',
    'tutor',
    'study',
    'homework',
    'exam',
    'test',
    'lecture',
    'college',
    'university',
    'campus',
    'bring son',
    'bring daughter',
    'bring kid',
    'bring child',
    'drop son',
    'drop daughter',
    'pick son',
    'pick daughter',
  ])) {
    return 'school';
  }

  if (has(['drive', 'driving', 'airport', 'plane', 'travel', 'trip'])) {
    return 'transport';
  }
  if (has([
    'train',
    'subway',
    'metro',
    'bus',
    'transit',
    'uber',
    'lyft',
    'cab',
    'taxi',
  ])) {
    return 'transport';
  }

  if (has([
    'restaurant',
    'dinner',
    'lunch',
    'breakfast',
    'brunch',
    'eat out',
    'dine',
    'cafe',
    'coffee',
    'starbucks',
  ])) {
    return 'dining';
  }

  if (has([
    'doctor',
    'physician',
    'hospital',
    'clinic',
    'dentist',
    'dental',
    'checkup',
    'appointment',
    'health',
    'medical',
  ])) {
    return 'medical';
  }

  if (has([
    'gym',
    'workout',
    'fitness',
    'exercise',
    'yoga',
    'pilates',
    'training',
    'run',
    'jog',
    'swim',
    'hike',
    'soccer',
    'football',
    'basketball',
    'baseball',
    'tennis',
    'golf',
    'volleyball',
    'hockey',
    'cricket',
    'rugby',
    'game',
    'match',
    'tournament',
    'practice',
    'rehearsal',
    'sport',
  ])) {
    return 'sports';
  }

  if (has([
    'party',
    'wedding',
    'concert',
    'ceremony',
    'gala',
    'festival',
    'show',
    'birthday',
    'graduation',
  ])) {
    return 'event';
  }

  if (has([
    'idea',
    'brainstorm',
    'thought',
    'note',
    'remember',
    'concept',
    'reflect',
    'insight',
  ])) {
    return 'thought';
  }

  return 'task';
}

/// Gradient colors derived from the toat's enrichment kind.
List<Color> detailEnrichmentColors(ToatSummary toat) =>
    detailTemplateColors(detailEnrichmentKey(toat));

/// Accent color derived from the toat's enrichment kind.
Color detailEnrichmentAccent(ToatSummary toat) =>
    detailTemplateAccent(detailEnrichmentKey(toat));

/// Soft surface color derived from the toat's enrichment kind.
Color detailEnrichmentSoft(ToatSummary toat) =>
    detailTemplateSoft(detailEnrichmentKey(toat));

/// Icon derived from the toat's enrichment kind.
IconData detailEnrichmentIcon(ToatSummary toat) =>
    detailTemplateIcon(detailEnrichmentKey(toat));

/// Exact web-matching glyph widget derived from the shared visual key.
Widget detailEnrichmentGlyph(
  ToatSummary toat, {
  double size = 24,
  Color color = Colors.white,
}) {
  return toatGlyphForVisualKey(
    detailEnrichmentKey(toat),
    size: size,
    color: color,
  );
}

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
  if (has(['swim', 'swimming', 'pool', 'diving'])) {
    return Icons.pool_rounded;
  }
  if (has(['cycling', 'bike', 'bicycle'])) {
    return Icons.directions_bike_rounded;
  }
  if (has(['run', 'jog', 'jogging', 'marathon'])) {
    return Icons.directions_run_rounded;
  }
  if (has(['hike', 'hiking', 'trail'])) {
    return Icons.hiking_rounded;
  }
  if (has(['sport', 'game', 'match', 'tournament'])) {
    return Icons.sports_rounded;
  }

  // Kids / school
  if (has(['sunday school', 'church school'])) {
    return Icons.church_rounded;
  }
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
  if (has(['university', 'college', 'campus'])) {
    return Icons.account_balance_rounded;
  }
  if (has(['read', 'book', 'library', 'reading'])) {
    return Icons.menu_book_rounded;
  }

  // Food & drink
  if (has(['coffee', 'cafe', 'starbucks', 'latte'])) {
    return Icons.local_cafe_rounded;
  }
  if (has(['grocery', 'groceries', 'supermarket', 'market'])) {
    return Icons.shopping_cart_rounded;
  }
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
  if (has(['dentist', 'dental', 'teeth'])) {
    return Icons.local_hospital_rounded;
  }
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
  if (has(['haircut', 'barber', 'salon', 'hair'])) {
    return Icons.content_cut_rounded;
  }

  // Transport / travel
  if (has(['airport', 'fly', 'flight', 'plane', 'travel', 'trip'])) {
    return Icons.flight_rounded;
  }
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
  if (has(['email', 'send email', 'reply to', 'respond to'])) {
    return Icons.email_rounded;
  }
  if (has(['call', 'phone', 'ring', 'talk to', 'catch up with'])) {
    return Icons.call_rounded;
  }
  if (has(['interview', 'hiring', 'recruiting'])) {
    return Icons.work_rounded;
  }
  if (has(['deadline', 'due date', 'submit', 'submission'])) {
    return Icons.timer_outlined;
  }
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
  if (has(['baby', 'child', 'kid', 'toddler', 'infant'])) {
    return Icons.child_care_rounded;
  }
  if (has(['pet', 'dog', 'cat', 'vet', 'puppy', 'kitten'])) {
    return Icons.pets_rounded;
  }

  // Template defaults
  switch (template) {
    case 'communication_meeting':
    case 'meeting':
      return Icons.groups_rounded;
    case 'communication_call':
    case 'call':
      return Icons.call_rounded;
    case 'communication_message':
      return Icons.email_rounded;
    case 'school':
      return Icons.school_rounded;
    case 'flight':
      return Icons.flight_rounded;
    case 'transport':
      return Icons.directions_car_rounded;
    case 'dining':
      return Icons.restaurant_rounded;
    case 'medical':
      return Icons.local_hospital_rounded;
    case 'sports':
      return Icons.sports_rounded;
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
    case 'thought':
    case 'idea':
      return Icons.lightbulb_outline_rounded;
    default:
      return Icons.radio_button_unchecked_rounded;
  }
}
