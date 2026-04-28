import 'package:flutter/material.dart';
import 'package:toatre/utils/app_colors.dart';

/// Typography system — Inter for all UI text.
class TextStyles {
  TextStyles._();

  static const String fontFamilyInter = 'Inter';

  // ── Size scale ──────────────────────────────────────────────────────────
  static const double sizeDisplay = 32.0;
  static const double sizeH1 = 24.0;
  static const double sizeH2 = 20.0;
  static const double sizeH3 = 16.0;
  static const double sizeBody = 14.0;
  static const double sizeSmall = 12.0;
  static const double sizeTiny = 10.0;

  // ── Styles ──────────────────────────────────────────────────────────────
  static TextStyle get display => const TextStyle(
    fontFamily: fontFamilyInter,
    fontSize: sizeDisplay,
    fontWeight: FontWeight.w700,
    color: AppColors.text,
    letterSpacing: 0,
  );

  static TextStyle get heading1 => const TextStyle(
    fontFamily: fontFamilyInter,
    fontSize: sizeH1,
    fontWeight: FontWeight.w700,
    color: AppColors.text,
    letterSpacing: 0,
  );

  static TextStyle get heading2 => const TextStyle(
    fontFamily: fontFamilyInter,
    fontSize: sizeH2,
    fontWeight: FontWeight.w600,
    color: AppColors.text,
  );

  static TextStyle get heading3 => const TextStyle(
    fontFamily: fontFamilyInter,
    fontSize: sizeH3,
    fontWeight: FontWeight.w600,
    color: AppColors.text,
  );

  static TextStyle get body => const TextStyle(
    fontFamily: fontFamilyInter,
    fontSize: sizeBody,
    fontWeight: FontWeight.w400,
    color: AppColors.text,
  );

  static TextStyle get bodyMedium => const TextStyle(
    fontFamily: fontFamilyInter,
    fontSize: sizeBody,
    fontWeight: FontWeight.w500,
    color: AppColors.text,
  );

  static TextStyle get small => const TextStyle(
    fontFamily: fontFamilyInter,
    fontSize: sizeSmall,
    fontWeight: FontWeight.w400,
    color: AppColors.textMuted,
  );

  static TextStyle get smallMedium => const TextStyle(
    fontFamily: fontFamilyInter,
    fontSize: sizeSmall,
    fontWeight: FontWeight.w500,
    color: AppColors.textSecondary,
  );

  static TextStyle get tiny => const TextStyle(
    fontFamily: fontFamilyInter,
    fontSize: sizeTiny,
    fontWeight: FontWeight.w400,
    color: AppColors.textMuted,
  );

  static TextStyle get label => const TextStyle(
    fontFamily: fontFamilyInter,
    fontSize: sizeSmall,
    fontWeight: FontWeight.w600,
    color: AppColors.text,
    letterSpacing: 0.3,
  );
}
