import 'package:flutter/material.dart';
import '../utils/app_colors.dart';
import '../utils/text_styles.dart';

/// ToatreMark — the brand wordmark rendered as a gradient text widget.
///
/// Usage:
/// ```dart
/// const ToatreMark()                  // default: fontSize 28
/// const ToatreMark(fontSize: 36)      // larger display size
/// ```
class ToatreMark extends StatelessWidget {
  final double fontSize;

  const ToatreMark({super.key, this.fontSize = 28});

  @override
  Widget build(BuildContext context) {
    return ShaderMask(
      shaderCallback: (bounds) => AppColors.brandGradient.createShader(bounds),
      blendMode: BlendMode.srcIn,
      child: Text(
        'toatre',
        style: TextStyles.heading1.copyWith(
          fontSize: fontSize,
          fontWeight: FontWeight.w600,
          letterSpacing: -0.5,
          color: Colors.white, // overridden by ShaderMask
        ),
      ),
    );
  }
}
