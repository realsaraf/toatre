import 'package:flutter/material.dart';

/// Single source of truth for all brand colours — dark theme only.
///
/// Brand gradient: Indigo #4F46E5 → Amber #F59E0B
/// NEVER hardcode these hex values anywhere else in the codebase.
class AppColors {
  AppColors._();

  // ── Brand gradient ──────────────────────────────────────────────────────
  static const Color gradientStart = Color(0xFF4F46E5); // Indigo
  static const Color gradientEnd = Color(0xFFF59E0B); // Amber

  static const LinearGradient brandGradient = LinearGradient(
    begin: Alignment.centerLeft,
    end: Alignment.centerRight,
    colors: [gradientStart, gradientEnd],
  );

  // ── Primary (Indigo) ────────────────────────────────────────────────────
  static const Color primary = gradientStart;
  static const Color primaryLight = Color(0xFF818CF8);
  static const Color primaryDark = Color(0xFF3730A3);

  // ── Accent (Amber) ──────────────────────────────────────────────────────
  static const Color accent = gradientEnd;
  static const Color accentLight = Color(0xFFFBBF24);

  // ── Backgrounds ─────────────────────────────────────────────────────────
  static const Color bg = Color(0xFF0A0A0F);
  static const Color bgPrimary = bg;
  static const Color bgElevated = Color(0xFF13131A);
  static const Color bgSecondary = bgElevated;
  static const Color card = Color(0xB313131A); // 70% opacity
  static const Color glass = Color(0x9913131A); // 60% opacity

  // ── Text ────────────────────────────────────────────────────────────────
  static const Color text = Color(0xFFE8EDF5);
  static const Color textPrimary = text;
  static const Color textSecondary = Color(0xFF94A3B8);
  static const Color textMuted = Color(0xFF6B7A94);

  // ── Border ──────────────────────────────────────────────────────────────
  static const Color border = Color(0x1A949BA8);

  // ── Status ──────────────────────────────────────────────────────────────
  static const Color success = Color(0xFF22C55E);
  static const Color error = Color(0xFFEF4444);
  static const Color warning = Color(0xFFF59E0B);
  static const Color info = Color(0xFF3B82F6);

  // ── Tier colours ────────────────────────────────────────────────────────
  static const Color tierUrgent = Color(0xFFEF4444);
  static const Color tierImportant = Color(0xFFF59E0B);
  static const Color tierRegular = Color(0xFF6B7A94);

  // ── Mic button ──────────────────────────────────────────────────────────
  static const Color micIdle = gradientStart;
  static const Color micRecording = Color(0xFFEF4444);
}
