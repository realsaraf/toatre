import 'package:flutter/material.dart';
import 'package:toatre/utils/app_colors.dart';
import 'package:toatre/utils/text_styles.dart';

class ToatreMark extends StatelessWidget {
  final double fontSize;
  final Color? color;

  const ToatreMark({super.key, this.fontSize = 28, this.color});

  @override
  Widget build(BuildContext context) {
    final text = Text(
      'toatre',
      style: TextStyles.heading1.copyWith(
        fontSize: fontSize,
        fontWeight: FontWeight.w600,
        letterSpacing: 0,
        color: color ?? Colors.white,
      ),
    );

    if (color != null) {
      return text;
    }

    return ShaderMask(
      shaderCallback: (bounds) => AppColors.brandGradient.createShader(bounds),
      blendMode: BlendMode.srcIn,
      child: text,
    );
  }
}
