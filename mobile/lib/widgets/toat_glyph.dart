import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

class ToatGlyph extends StatelessWidget {
  const ToatGlyph({
    super.key,
    required this.visualKey,
    this.size = 24,
    this.color = Colors.white,
  });

  final String visualKey;
  final double size;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return SvgPicture.string(
      _glyphMarkupForKey(visualKey),
      width: size,
      height: size,
      fit: BoxFit.contain,
      colorFilter: ColorFilter.mode(color, BlendMode.srcIn),
    );
  }
}

Widget toatGlyphForVisualKey(
  String visualKey, {
  double size = 24,
  Color color = Colors.white,
}) {
  return ToatGlyph(visualKey: visualKey, size: size, color: color);
}

String _glyphMarkupForKey(String visualKey) {
  switch (_normalizeVisualKey(visualKey)) {
    case 'communication_call':
      return _phoneSvg;
    case 'communication_message':
      return _messageSvg;
    case 'communication_meeting':
      return _videoSvg;
    case 'event':
      return _ticketSvg;
    case 'checklist':
    case 'errand':
      return _cartSvg;
    case 'thought':
      return _bulbSvg;
    case 'school':
      return _schoolSvg;
    case 'flight':
      return _flightSvg;
    case 'transport':
      return _carSvg;
    case 'dining':
      return _forkSvg;
    case 'medical':
      return _medSvg;
    case 'sports':
      return _sportSvg;
    case 'task':
    default:
      return _checkSvg;
  }
}

String _normalizeVisualKey(String visualKey) {
  switch (visualKey) {
    case 'meeting':
      return 'communication_meeting';
    case 'call':
      return 'communication_call';
    case 'follow_up':
      return 'communication_message';
    case 'idea':
      return 'thought';
    case 'appointment':
      return 'medical';
    default:
      return visualKey;
  }
}

const String _phoneSvg = '''
<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none">
  <path d="M7.2 4.6c.5-.5 1.2-.6 1.8-.3l2 1c.7.3 1 .9.8 1.6l-.7 2.4c-.1.5 0 1 .4 1.4l2 2c.4.4 1 .5 1.4.4l2.4-.7c.7-.2 1.3.1 1.6.8l1 2c.3.6.2 1.3-.3 1.8l-1 1c-1 1-2.5 1.3-3.9.9-2.9-.8-5.6-3-7.7-6s-3.2-6.1-3-8.8c.1-1 .5-2 1.2-2.7l1-1Z" stroke="#000000" stroke-width="1.8" stroke-linejoin="round"/>
</svg>
''';

const String _messageSvg = '''
<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none">
  <path d="M7 18.5 4.5 20v-4.3A7.5 7.5 0 1 1 12 19.5H7Z" stroke="#000000" stroke-width="1.8" stroke-linejoin="round"/>
  <circle cx="9" cy="12" r="1" fill="#000000"/>
  <circle cx="12" cy="12" r="1" fill="#000000"/>
  <circle cx="15" cy="12" r="1" fill="#000000"/>
</svg>
''';

const String _videoSvg = '''
<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none">
  <rect x="4" y="7" width="10" height="10" rx="2.5" fill="#000000" fill-opacity="0.18" stroke="#000000" stroke-width="1.8"/>
  <path d="m14 10 5-2v8l-5-2v-4Z" fill="#000000"/>
</svg>
''';

const String _ticketSvg = '''
<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none">
  <path d="M6 6h12a2 2 0 0 1 2 2v2a2.5 2.5 0 0 0 0 4V16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2.5 2.5 0 0 0 0-4V8a2 2 0 0 1 2-2Z" stroke="#000000" stroke-width="1.8" stroke-linejoin="round"/>
  <path d="M12 8.5v7" stroke="#000000" stroke-width="1.8" stroke-linecap="round" stroke-dasharray="1.8 2.2"/>
</svg>
''';

const String _cartSvg = '''
<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none">
  <path d="M3 4h2l2 10h9.5l2.2-7H7" stroke="#000000" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="10" cy="19" r="1.6" fill="#000000"/>
  <circle cx="17" cy="19" r="1.6" fill="#000000"/>
</svg>
''';

const String _bulbSvg = '''
<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none">
  <path d="M8 14c-1.4-1.1-2.3-2.9-2.3-4.8A6.3 6.3 0 0 1 12 3a6.3 6.3 0 0 1 6.3 6.2c0 2-.9 3.7-2.3 4.8-.9.7-1.4 1.7-1.4 2.8H9.4c0-1.1-.5-2.1-1.4-2.8Z" stroke="#000000" stroke-width="1.8" stroke-linejoin="round"/>
  <path d="M9.5 19h5M10.4 22h3.2" stroke="#000000" stroke-width="1.8" stroke-linecap="round"/>
</svg>
''';

const String _checkSvg = '''
<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none">
  <circle cx="12" cy="12" r="9" stroke="#000000" stroke-width="1.8"/>
  <path d="M8 12.5l2.5 2.5 5-5" stroke="#000000" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
''';

const String _schoolSvg = '''
<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none">
  <path d="M12 3L2 8l10 5 10-5-10-5Z" fill="#000000"/>
  <path d="M6 10.5V16c1.5 1.5 8.5 1.5 12 0v-5.5" stroke="#000000" stroke-width="1.8" stroke-linecap="round"/>
  <path d="M20 8v5" stroke="#000000" stroke-width="1.8" stroke-linecap="round"/>
</svg>
''';

const String _flightSvg = '''
<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none">
  <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5L21 16Z" fill="#000000"/>
</svg>
''';

const String _carSvg = '''
<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none">
  <path d="M5 12l1.5-4h11L19 12" stroke="#000000" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
  <rect x="3" y="12" width="18" height="6" rx="2" stroke="#000000" stroke-width="1.8"/>
  <circle cx="8" cy="18" r="1.5" fill="#000000"/>
  <circle cx="16" cy="18" r="1.5" fill="#000000"/>
</svg>
''';

const String _forkSvg = '''
<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none">
  <path d="M8 3v5a3 3 0 0 0 3 3v8" stroke="#000000" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M16 3v14" stroke="#000000" stroke-width="1.8" stroke-linecap="round"/>
  <path d="M6 3v3M10 3v3" stroke="#000000" stroke-width="1.8" stroke-linecap="round"/>
</svg>
''';

const String _medSvg = '''
<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none">
  <rect x="4" y="4" width="16" height="16" rx="4" stroke="#000000" stroke-width="1.8"/>
  <path d="M12 8v8M8 12h8" stroke="#000000" stroke-width="2.2" stroke-linecap="round"/>
</svg>
''';

const String _sportSvg = '''
<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none">
  <circle cx="12" cy="12" r="9" stroke="#000000" stroke-width="1.8"/>
  <path d="M12 3c0 4-3.5 7-9 7M12 3c0 4 3.5 7 9 7M12 21c0-4-3.5-7-9-7M12 21c0-4 3.5-7 9-7" stroke="#000000" stroke-width="1.3"/>
</svg>
''';
