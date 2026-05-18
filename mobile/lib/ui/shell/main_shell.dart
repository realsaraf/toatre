import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'package:toatre/providers/capture_provider.dart';
import 'package:toatre/providers/toats_provider.dart';
import 'package:toatre/ui/bookings/bookings_screen.dart';
import 'package:toatre/ui/capture/capture_screen.dart';
import 'package:toatre/ui/inbox/inbox_screen.dart';
import 'package:toatre/ui/settings/settings_screen.dart';
import 'package:toatre/ui/timeline/timeline_screen.dart';
import 'package:toatre/utils/text_styles.dart';

// ──────────────────────────────────────────────────────────────────────────────
// Main Shell — tab-based navigation for Timeline / Inbox / Bookings / Settings
// ──────────────────────────────────────────────────────────────────────────────

class MainShell extends StatefulWidget {
  const MainShell({super.key});

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int _tab = 0;

  void _switchTab(int index) {
    setState(() => _tab = index);
  }

  Future<void> _openCapture() async {
    final capture = context.read<CaptureProvider>();
    capture.reset();
    capture.setMode(CaptureInputMode.voice);
    await Navigator.of(
      context,
    ).push(MaterialPageRoute<void>(builder: (_) => const CaptureScreen()));
    if (!mounted) return;
    await context.read<ToatsProvider>().fetchToats();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF7F1E8),
      extendBody: true,
      body: IndexedStack(
        index: _tab,
        children: [
          TimelineScreen(onSwitchToSettings: () => _switchTab(3)),
          InboxScreen(asTab: true, onOpenBookingsTab: () => _switchTab(2)),
          const BookingsScreen(asTab: true),
          const SettingsScreen(asTab: true),
        ],
      ),
      bottomNavigationBar: _AppTabBar(
        selectedIndex: _tab,
        onTimelineTap: () => _switchTab(0),
        onInboxTap: () => _switchTab(1),
        onVoiceTap: _openCapture,
        onBookingsTap: () => _switchTab(2),
        onSettingsTap: () => _switchTab(3),
      ),
    );
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// App tab bar (cream pill with mic FAB centred above)
// ──────────────────────────────────────────────────────────────────────────────

class _AppTabBar extends StatelessWidget {
  const _AppTabBar({
    required this.selectedIndex,
    required this.onTimelineTap,
    required this.onInboxTap,
    required this.onVoiceTap,
    required this.onBookingsTap,
    required this.onSettingsTap,
  });

  final int selectedIndex;
  final VoidCallback onTimelineTap;
  final VoidCallback onInboxTap;
  final VoidCallback onVoiceTap;
  final VoidCallback onBookingsTap;
  final VoidCallback onSettingsTap;

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      minimum: const EdgeInsets.fromLTRB(14, 0, 14, 8),
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          Container(
            height: 76,
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
            decoration: BoxDecoration(
              color: const Color(0xFFFCF9F4),
              borderRadius: BorderRadius.circular(28),
              border: Border.all(color: const Color(0xFFE8DFD2)),
              boxShadow: const [
                BoxShadow(
                  color: Color(0x14000000),
                  blurRadius: 20,
                  offset: Offset(0, 6),
                ),
              ],
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                _TabItem(
                  icon: Icons.schedule_rounded,
                  label: 'Timeline',
                  active: selectedIndex == 0,
                  onTap: onTimelineTap,
                ),
                _TabItem(
                  icon: Icons.inbox_outlined,
                  label: 'Inbox',
                  active: selectedIndex == 1,
                  onTap: onInboxTap,
                ),
                const SizedBox(width: 68),
                _TabItem(
                  icon: Icons.calendar_today_outlined,
                  label: 'Bookings',
                  active: selectedIndex == 2,
                  onTap: onBookingsTap,
                ),
                _TabItem(
                  icon: Icons.settings_outlined,
                  label: 'Settings',
                  active: selectedIndex == 3,
                  onTap: onSettingsTap,
                ),
              ],
            ),
          ),
          Positioned(
            top: -12,
            left: 0,
            right: 0,
            child: Center(child: _MicButton(onTap: onVoiceTap)),
          ),
        ],
      ),
    );
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Tab item — no underline indicator; active state via color only
// ──────────────────────────────────────────────────────────────────────────────

class _TabItem extends StatelessWidget {
  const _TabItem({
    required this.icon,
    required this.label,
    required this.active,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final bool active;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final color = active ? const Color(0xFFBE7716) : const Color(0xFF7F746A);
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          SizedBox(
            width: 42,
            height: 32,
            child: Icon(icon, color: color, size: 23),
          ),
          const SizedBox(height: 1),
          Text(
            label,
            style: TextStyles.tiny.copyWith(
              color: color,
              fontSize: 10,
              fontWeight: active ? FontWeight.w700 : FontWeight.w500,
            ),
          ),
          const SizedBox(height: 2),
        ],
      ),
    );
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Mic capture button (gradient circle, centred above tab bar)
// ──────────────────────────────────────────────────────────────────────────────

class _MicButton extends StatelessWidget {
  const _MicButton({required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 74,
        height: 74,
        decoration: const BoxDecoration(
          shape: BoxShape.circle,
          boxShadow: [
            BoxShadow(
              color: Color(0x0FBE7716),
              blurRadius: 8,
              offset: Offset(0, 8),
            ),
          ],
        ),
        child: Semantics(
          label: 'Capture a toat',
          button: true,
          child: ClipOval(
            child: Image.asset('assets/images/micicon.png', fit: BoxFit.cover),
          ),
        ),
      ),
    );
  }
}
