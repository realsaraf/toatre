import 'package:flutter/material.dart';

/// BottomNav — shared v2 shell navigation styling.
class BottomNav extends StatelessWidget {
  final int currentIndex;
  final ValueChanged<int> onTap;

  const BottomNav({super.key, required this.currentIndex, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return NavigationBar(
      selectedIndex: currentIndex,
      onDestinationSelected: onTap,
      height: 78,
      backgroundColor: const Color(0xFF20182B),
      indicatorColor: Colors.white.withValues(alpha: 0.14),
      shadowColor: Colors.black.withValues(alpha: 0.38),
      surfaceTintColor: Colors.transparent,
      labelTextStyle: WidgetStateProperty.resolveWith((states) {
        final selected = states.contains(WidgetState.selected);
        return TextStyle(
          color: selected ? Colors.white : const Color(0xBFEDE7FF),
          fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
          fontSize: 11,
        );
      }),
      destinations: const [
        NavigationDestination(
          icon: Icon(
            Icons.auto_awesome_motion_outlined,
            color: Color(0xBFEDE7FF),
          ),
          selectedIcon: Icon(
            Icons.auto_awesome_motion_rounded,
            color: Colors.white,
          ),
          label: 'Timeline',
          tooltip: 'Timeline',
        ),
        NavigationDestination(
          icon: Icon(Icons.people_outline, color: Color(0xBFEDE7FF)),
          selectedIcon: Icon(Icons.people, color: Colors.white),
          label: 'People',
          tooltip: 'People',
        ),
        NavigationDestination(
          icon: Icon(Icons.settings_outlined, color: Color(0xBFEDE7FF)),
          selectedIcon: Icon(Icons.settings, color: Colors.white),
          label: 'Settings',
          tooltip: 'Settings',
        ),
      ],
    );
  }
}
