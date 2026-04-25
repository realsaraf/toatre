import 'package:flutter/material.dart';
import '../utils/app_colors.dart';

/// BottomNav — three-tab navigation: Timeline, People, Settings.
/// The mic button (Capture) is a FAB on the Timeline tab, not a tab item.
class BottomNav extends StatelessWidget {
  final int currentIndex;
  final ValueChanged<int> onTap;

  const BottomNav({
    super.key,
    required this.currentIndex,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return NavigationBar(
      selectedIndex: currentIndex,
      onDestinationSelected: onTap,
      backgroundColor: AppColors.bgElevated,
      indicatorColor: AppColors.gradientStart.withValues(alpha: 0.15),
      destinations: const [
        NavigationDestination(
          icon: Icon(Icons.view_timeline_outlined),
          selectedIcon: Icon(Icons.view_timeline),
          label: 'Timeline',
          tooltip: 'Timeline',
        ),
        NavigationDestination(
          icon: Icon(Icons.people_outline),
          selectedIcon: Icon(Icons.people),
          label: 'People',
          tooltip: 'People',
        ),
        NavigationDestination(
          icon: Icon(Icons.settings_outlined),
          selectedIcon: Icon(Icons.settings),
          label: 'Settings',
          tooltip: 'Settings',
        ),
      ],
    );
  }
}
