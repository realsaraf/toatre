import 'dart:math' as math;

import 'package:flutter/material.dart';

int _lastConfettiMs = 0;

/// Fires a confetti burst from the bottom of the screen.
/// Throttled to one burst per 500 ms globally.
void showConfetti(BuildContext context) {
  showConfettiOnOverlay(
    overlay: Overlay.of(context, rootOverlay: true),
    size: MediaQuery.sizeOf(context),
  );
}

void showConfettiOnOverlay({
  required OverlayState overlay,
  required Size size,
}) {
  final nowMs = DateTime.now().millisecondsSinceEpoch;
  if (nowMs - _lastConfettiMs < 500) return;
  _lastConfettiMs = nowMs;

  // Origin near the bottom where the Done button lives.
  final origin = Offset(size.width / 2, size.height * 0.78);

  late OverlayEntry entry;
  entry = OverlayEntry(
    builder: (_) => Positioned.fill(
      child: IgnorePointer(
        child: _ConfettiBurst(origin: origin, onDone: entry.remove),
      ),
    ),
  );
  overlay.insert(entry);
}

class _ConfettiBurst extends StatefulWidget {
  const _ConfettiBurst({required this.origin, required this.onDone});

  final Offset origin;
  final VoidCallback onDone;

  @override
  State<_ConfettiBurst> createState() => _ConfettiBurstState();
}

class _ConfettiBurstState extends State<_ConfettiBurst>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;
  late final List<_Particle> _particles;

  static const _kColors = [
    Color(0xFFF59E0B),
    Color(0xFF10B981),
    Color(0xFF3B82F6),
    Color(0xFFEC4899),
    Color(0xFF8B5CF6),
    Color(0xFFEF4444),
    Color(0xFF06B6D4),
    Color(0xFFFBBF24),
  ];

  @override
  void initState() {
    super.initState();
    final rnd = math.Random();
    _particles = List.generate(32, (i) {
      final angle = (i / 32) * 2 * math.pi + rnd.nextDouble() * 0.5;
      final speed = 130.0 + rnd.nextDouble() * 180;
      return _Particle(
        dx: math.cos(angle) * speed,
        dy: math.sin(angle) * speed - 200,
        color: _kColors[i % _kColors.length],
        width: 6 + rnd.nextDouble() * 6,
        height: 4 + rnd.nextDouble() * 5,
        rotation: rnd.nextDouble() * 2 * math.pi,
      );
    });
    _ctrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..forward().whenComplete(widget.onDone);
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _ctrl,
      builder: (_, __) => CustomPaint(
        painter: _ConfettiPainter(_ctrl.value, widget.origin, _particles),
        size: Size.infinite,
      ),
    );
  }
}

class _Particle {
  const _Particle({
    required this.dx,
    required this.dy,
    required this.color,
    required this.width,
    required this.height,
    required this.rotation,
  });

  final double dx, dy;
  final Color color;
  final double width, height;
  final double rotation;
}

class _ConfettiPainter extends CustomPainter {
  _ConfettiPainter(this.progress, this.origin, this.particles);

  final double progress;
  final Offset origin;
  final List<_Particle> particles;

  @override
  void paint(Canvas canvas, Size size) {
    final alpha = progress > 0.65
        ? ((1.0 - progress) / 0.35).clamp(0.0, 1.0)
        : 1.0;
    final eased = Curves.easeOut.transform(progress);

    for (final p in particles) {
      final x = origin.dx + p.dx * eased;
      final y = origin.dy + p.dy * eased + 220 * eased * eased;

      final paint = Paint()
        ..color = p.color.withValues(alpha: alpha)
        ..style = PaintingStyle.fill;

      canvas.save();
      canvas.translate(x, y);
      canvas.rotate(p.rotation + progress * 7);
      canvas.drawRect(
        Rect.fromCenter(center: Offset.zero, width: p.width, height: p.height),
        paint,
      );
      canvas.restore();
    }
  }

  @override
  bool shouldRepaint(_ConfettiPainter old) => old.progress != progress;
}
