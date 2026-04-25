import 'package:flutter/material.dart';
import '../utils/app_colors.dart';

/// LoadingWidget — a centred circular progress indicator in brand colour.
class LoadingWidget extends StatelessWidget {
  final double size;

  const LoadingWidget({super.key, this.size = 32});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: SizedBox(
        width: size,
        height: size,
        child: CircularProgressIndicator(
          strokeWidth: 2.5,
          valueColor: AlwaysStoppedAnimation<Color>(AppColors.gradientStart),
        ),
      ),
    );
  }
}
