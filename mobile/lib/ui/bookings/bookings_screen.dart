import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'package:toatre/providers/auth_provider.dart';
import 'package:toatre/providers/toats_provider.dart';
import 'package:toatre/services/api_service.dart';
import 'package:toatre/ui/inbox/inbox_screen.dart';
import 'package:toatre/ui/settings/settings_screen.dart';
import 'package:toatre/ui/toat/toat_detail_screen.dart';
import 'package:toatre/utils/app_colors.dart';
import 'package:toatre/utils/text_styles.dart';
import 'package:toatre/widgets/mobile_page_chrome.dart';

// ──────────────────────────────────────────────────────────────────────────────
// Model
// ──────────────────────────────────────────────────────────────────────────────

class _Booking {
  const _Booking({
    required this.id,
    required this.toatId,
    required this.title,
    required this.name,
    required this.email,
    this.phone,
    this.bookerHandle,
    this.message,
    required this.slotStart,
    required this.slotEnd,
    required this.state,
    this.location,
    required this.createdAt,
  });

  final String id;
  final String? toatId;
  final String title;
  final String name;
  final String email;
  final String? phone;
  final String? bookerHandle;
  final String? message;
  final DateTime slotStart;
  final DateTime slotEnd;
  final String state;
  final String? location;
  final DateTime createdAt;

  bool get isUpcoming => slotStart.isAfter(DateTime.now());
  bool get isAccepted => state == 'accepted';

  factory _Booking.fromJson(Map<String, dynamic> json) => _Booking(
    id: json['id'] as String? ?? '',
    toatId: json['toatId'] as String?,
    title: json['title'] as String? ?? '',
    name: json['name'] as String? ?? '',
    email: json['email'] as String? ?? '',
    phone: json['phone'] as String?,
    bookerHandle: json['bookerHandle'] as String?,
    message: json['message'] as String?,
    slotStart:
        DateTime.tryParse(json['slotStart'] as String? ?? '') ?? DateTime.now(),
    slotEnd:
        DateTime.tryParse(json['slotEnd'] as String? ?? '') ?? DateTime.now(),
    state: json['state'] as String? ?? 'accepted',
    location: json['location'] as String?,
    createdAt:
        DateTime.tryParse(json['createdAt'] as String? ?? '') ?? DateTime.now(),
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Screen
// ──────────────────────────────────────────────────────────────────────────────

enum _BookingFilter { all, upcoming, completed, canceled }

class BookingsScreen extends StatefulWidget {
  const BookingsScreen({super.key, this.asTab = false});

  final bool asTab;

  @override
  State<BookingsScreen> createState() => _BookingsScreenState();
}

class _BookingsScreenState extends State<BookingsScreen> {
  _BookingFilter _filter = _BookingFilter.upcoming;
  List<_Booking> _bookings = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _fetch();
  }

  Future<void> _fetch() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    if (_filter == _BookingFilter.canceled) {
      setState(() {
        _bookings = [];
        _loading = false;
      });
      return;
    }
    try {
      final serverFilter = switch (_filter) {
        _BookingFilter.upcoming => 'upcoming',
        _BookingFilter.completed => 'past',
        _BookingFilter.all => 'all',
        _BookingFilter.canceled => 'all',
      };
      final data = await ApiService.instance.getJson(
        '/api/booking/requests',
        authenticated: true,
        queryParameters: {'state': 'accepted', 'range': serverFilter},
      );
      final raw = data['requests'] as List<dynamic>? ?? [];
      setState(() {
        _bookings =
            raw.cast<Map<String, dynamic>>().map(_Booking.fromJson).toList()
              ..sort((a, b) => a.slotStart.compareTo(b.slotStart));
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Could not load bookings. Pull to refresh.';
        _loading = false;
      });
    }
  }

  Future<void> _openBooking(_Booking booking) async {
    final toatId = booking.toatId;
    if (toatId == null || toatId.isEmpty) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('This booking is not linked to a toat yet.'),
        ),
      );
      return;
    }

    try {
      final toat = await context.read<ToatsProvider>().fetchToat(toatId);
      if (!mounted) {
        return;
      }
      final changed = await Navigator.of(context).push<bool>(
        MaterialPageRoute<bool>(
          builder: (_) => ToatDetailScreen(initialToat: toat),
        ),
      );
      if (!mounted || changed != true) {
        return;
      }
      await _fetch();
    } catch (_) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Could not open that booked toat.')),
      );
    }
  }

  Future<void> _openSettings() async {
    await Navigator.of(
      context,
    ).push(MaterialPageRoute<void>(builder: (_) => const SettingsScreen()));
    if (!mounted) {
      return;
    }
    await _fetch();
  }

  Future<void> _openInbox() async {
    await Navigator.of(
      context,
    ).push(MaterialPageRoute<void>(builder: (_) => const InboxScreen()));
    if (!mounted) {
      return;
    }
    await _fetch();
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;
    final groups = _groupBookingsForDisplay(_bookings, _filter);
    final summary = _buildWeekSummary(_bookings);
    final visibleCount = _filter == _BookingFilter.canceled
        ? 0
        : _bookings.length;

    return Scaffold(
      backgroundColor: const Color(0xFFF7F1E8),
      body: SafeArea(
        child: RefreshIndicator(
          color: const Color(0xFFBE7716),
          backgroundColor: const Color(0xFFFCF9F4),
          onRefresh: _fetch,
          child: ListView(
            padding: EdgeInsets.fromLTRB(20, 12, 20, widget.asTab ? 120 : 40),
            children: [
              MobileShellTopRow(user: user, onAvatarTap: _openSettings),
              const SizedBox(height: 14),
              MobilePageIntro(
                title: 'Bookings',
                subtitle: 'Toats booked through your handle page',
                count: visibleCount,
                controls: _FilterBar(
                  filter: _filter,
                  onFilter: (f) {
                    setState(() => _filter = f);
                    if (f == _BookingFilter.canceled) {
                      setState(() {
                        _bookings = [];
                        _loading = false;
                        _error = null;
                      });
                      return;
                    }
                    _fetch();
                  },
                ),
              ),
              const SizedBox(height: 16),
              if (_loading)
                const Padding(
                  padding: EdgeInsets.only(top: 60),
                  child: Center(child: CircularProgressIndicator()),
                )
              else if (_error != null)
                _ErrorCard(message: _error!)
              else if (groups.isEmpty)
                _EmptyCard(
                  filter: _filter,
                  onOpenSettings: _openSettings,
                  onOpenInbox: _openInbox,
                )
              else
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (summary != null) ...[
                      _SummaryCard(summary: summary),
                      const SizedBox(height: 16),
                    ],
                    _BookingList(groups: groups, onOpen: _openBooking),
                  ],
                ),
            ],
          ),
        ),
      ),
    );
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Filter bar
// ──────────────────────────────────────────────────────────────────────────────

class _FilterBar extends StatelessWidget {
  const _FilterBar({required this.filter, required this.onFilter});

  final _BookingFilter filter;
  final ValueChanged<_BookingFilter> onFilter;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 48,
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [Color(0xFFFEFCF8), Color(0xFFF6F0E7)],
        ),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0x57C0B3FF)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0D1F2937),
            blurRadius: 24,
            offset: Offset(0, 8),
          ),
        ],
      ),
      child: Row(
        children: [
          _FilterChip(
            label: 'All',
            active: filter == _BookingFilter.all,
            onTap: () => onFilter(_BookingFilter.all),
          ),
          _FilterChip(
            label: 'Upcoming',
            active: filter == _BookingFilter.upcoming,
            onTap: () => onFilter(_BookingFilter.upcoming),
          ),
          _FilterChip(
            label: 'Completed',
            active: filter == _BookingFilter.completed,
            onTap: () => onFilter(_BookingFilter.completed),
          ),
          _FilterChip(
            label: 'Canceled',
            active: filter == _BookingFilter.canceled,
            onTap: () => onFilter(_BookingFilter.canceled),
          ),
        ],
      ),
    );
  }
}

class _FilterChip extends StatelessWidget {
  const _FilterChip({
    required this.label,
    required this.active,
    required this.onTap,
  });

  final String label;
  final bool active;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 1),
        child: GestureDetector(
          onTap: onTap,
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 180),
            decoration: BoxDecoration(
              color: active ? const Color(0xFFFDFCFA) : Colors.transparent,
              borderRadius: BorderRadius.circular(14),
              border: active
                  ? Border.all(color: const Color(0x14C4B5FD))
                  : null,
              boxShadow: active
                  ? const [
                      BoxShadow(
                        color: Color(0x12000000),
                        blurRadius: 10,
                        offset: Offset(0, 2),
                      ),
                    ]
                  : null,
            ),
            alignment: Alignment.center,
            child: Text(
              label,
              style: TextStyles.smallMedium.copyWith(
                color: active
                    ? const Color(0xFF5B3DF5)
                    : const Color(0xFF6A6159),
                fontWeight: active ? FontWeight.w700 : FontWeight.w500,
                fontSize: 12,
              ),
              textAlign: TextAlign.center,
            ),
          ),
        ),
      ),
    );
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Booking list
// ──────────────────────────────────────────────────────────────────────────────

class _BookingGroup {
  const _BookingGroup({required this.label, required this.items});

  final String label;
  final List<_Booking> items;
}

class _BookingList extends StatelessWidget {
  const _BookingList({required this.groups, required this.onOpen});

  final List<_BookingGroup> groups;
  final ValueChanged<_Booking> onOpen;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        for (int i = 0; i < groups.length; i++) ...[
          if (i > 0) const SizedBox(height: 16),
          Padding(
            padding: const EdgeInsets.only(bottom: 8, left: 4),
            child: Text(
              groups[i].label,
              style: TextStyles.small.copyWith(
                color: const Color(0xFF6A6159),
                fontWeight: FontWeight.w700,
                letterSpacing: 0.4,
              ),
            ),
          ),
          for (final booking in groups[i].items) ...[
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: _BookingCard(
                booking: booking,
                onOpen: () => onOpen(booking),
              ),
            ),
          ],
        ],
      ],
    );
  }
}

class _BookingCard extends StatelessWidget {
  const _BookingCard({required this.booking, required this.onOpen});

  final _Booking booking;
  final VoidCallback onOpen;

  @override
  Widget build(BuildContext context) {
    final visual = _bookingVisual(booking);
    final future = booking.slotStart.isAfter(DateTime.now());

    return InkWell(
      onTap: onOpen,
      borderRadius: BorderRadius.circular(28),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xFFFEFBF6), Color(0xFFF8F1E8)],
          ),
          borderRadius: BorderRadius.circular(28),
          border: Border.all(color: const Color(0xFFE8DFD2)),
          boxShadow: const [
            BoxShadow(
              color: Color(0x14000000),
              blurRadius: 20,
              offset: Offset(0, 8),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 64,
                  height: 64,
                  decoration: BoxDecoration(
                    color: visual.background,
                    borderRadius: BorderRadius.circular(22),
                  ),
                  alignment: Alignment.center,
                  child: Text(
                    visual.emoji,
                    style: const TextStyle(fontSize: 28),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        booking.message?.isNotEmpty == true
                            ? booking.message!
                            : booking.title,
                        style: TextStyles.heading3.copyWith(
                          color: const Color(0xFF171C27),
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'Booked by ${booking.name}',
                        style: TextStyles.body.copyWith(
                          color: const Color(0xFF6A6159),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 10),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: future
                        ? const Color(0x144F46E5)
                        : const Color(0x1A22C55E),
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Text(
                    future ? 'Upcoming' : 'Completed',
                    style: TextStyles.tiny.copyWith(
                      color: future
                          ? const Color(0xFF4F46E5)
                          : const Color(0xFF15803D),
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            _MetaRow(
              icon: Icons.schedule_rounded,
              label:
                  '${_formatDay(booking.slotStart)} · ${_formatTime(booking.slotStart)}',
            ),
            const SizedBox(height: 8),
            _MetaRow(
              icon: Icons.mail_outline_rounded,
              label: booking.email.isNotEmpty
                  ? booking.email
                  : booking.phone?.isNotEmpty == true
                  ? booking.phone!
                  : 'via Toatre Link',
            ),
            if (booking.location != null && booking.location!.isNotEmpty) ...[
              const SizedBox(height: 8),
              _MetaRow(
                icon: Icons.location_on_outlined,
                label: booking.location!,
              ),
            ],
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton(
                onPressed: onOpen,
                style: OutlinedButton.styleFrom(
                  minimumSize: const Size.fromHeight(50),
                  side: const BorderSide(color: Color(0x804F46E5)),
                  foregroundColor: const Color(0xFF4F46E5),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(18),
                  ),
                ),
                child: const Text('View'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

class _EmptyCard extends StatelessWidget {
  const _EmptyCard({
    required this.filter,
    required this.onOpenSettings,
    required this.onOpenInbox,
  });

  final _BookingFilter filter;
  final VoidCallback onOpenSettings;
  final VoidCallback onOpenInbox;

  @override
  Widget build(BuildContext context) {
    final title = switch (filter) {
      _BookingFilter.upcoming => 'Nothing coming up.',
      _BookingFilter.completed => 'No completed bookings.',
      _BookingFilter.canceled => 'No canceled bookings.',
      _BookingFilter.all => 'No bookings here.',
    };
    final subtitle = switch (filter) {
      _BookingFilter.upcoming =>
        'Accepted booking requests will appear here when you have upcoming sessions.',
      _BookingFilter.completed => 'Completed bookings will appear here.',
      _BookingFilter.canceled =>
        'Canceled bookings will live here once that state is available.',
      _BookingFilter.all =>
        'Accepted booking requests will appear here so your schedule stays easy to scan.',
    };
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: AppColors.bgElevated,
        borderRadius: BorderRadius.circular(26),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Container(
            width: 52,
            height: 52,
            decoration: BoxDecoration(
              color: const Color(0x1A7C3AED),
              borderRadius: BorderRadius.circular(22),
            ),
            child: const Icon(
              Icons.event_note_rounded,
              color: Color(0xFF7C3AED),
            ),
          ),
          const SizedBox(height: 18),
          Text(title, style: TextStyles.heading1, textAlign: TextAlign.center),
          const SizedBox(height: 10),
          Text(
            subtitle,
            style: TextStyles.body.copyWith(
              color: AppColors.textSecondary,
              height: 1.5,
            ),
            textAlign: TextAlign.center,
          ),
          if (filter != _BookingFilter.canceled) ...[
            const SizedBox(height: 18),
            ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 340),
              child: Row(
                children: [
                  Expanded(
                    child: ElevatedButton(
                      onPressed: onOpenSettings,
                      child: const Text('Handle settings'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: OutlinedButton(
                      onPressed: onOpenInbox,
                      child: const Text('Open Inbox'),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _ErrorCard extends StatelessWidget {
  const _ErrorCard({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFFFEF2F2),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFFECACA)),
      ),
      child: Text(
        message,
        style: TextStyles.body.copyWith(color: const Color(0xFFEF4444)),
      ),
    );
  }
}

class _SummaryCard extends StatelessWidget {
  const _SummaryCard({required this.summary});

  final ({int count, String rangeLabel}) summary;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.bgElevated,
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              color: const Color(0x144F46E5),
              borderRadius: BorderRadius.circular(20),
            ),
            child: const Icon(
              Icons.calendar_today_rounded,
              color: Color(0xFF4F46E5),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'This week: ${summary.count} booking${summary.count == 1 ? '' : 's'}',
                  style: TextStyles.bodyMedium.copyWith(
                    color: const Color(0xFF171C27),
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  summary.rangeLabel,
                  style: TextStyles.body.copyWith(
                    color: const Color(0xFF6A6159),
                  ),
                ),
              ],
            ),
          ),
          const Icon(Icons.chevron_right_rounded, color: Color(0xFF9C9289)),
        ],
      ),
    );
  }
}

class _MetaRow extends StatelessWidget {
  const _MetaRow({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 16, color: const Color(0xFF6A6159)),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            label,
            style: TextStyles.body.copyWith(color: const Color(0xFF6A6159)),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }
}

List<_BookingGroup> _groupBookingsForDisplay(
  List<_Booking> bookings,
  _BookingFilter filter,
) {
  if (filter == _BookingFilter.canceled || bookings.isEmpty) {
    return const <_BookingGroup>[];
  }
  if (filter == _BookingFilter.upcoming) {
    return <_BookingGroup>[_BookingGroup(label: 'Upcoming', items: bookings)];
  }
  if (filter == _BookingFilter.completed) {
    return <_BookingGroup>[_BookingGroup(label: 'Earlier', items: bookings)];
  }

  final now = DateTime.now();
  final upcoming = bookings
      .where((booking) => !booking.slotStart.isBefore(now))
      .toList();
  final earlier = bookings
      .where((booking) => booking.slotStart.isBefore(now))
      .toList();

  return <_BookingGroup>[
    if (upcoming.isNotEmpty) _BookingGroup(label: 'Upcoming', items: upcoming),
    if (earlier.isNotEmpty) _BookingGroup(label: 'Earlier', items: earlier),
  ];
}

({int count, String rangeLabel})? _buildWeekSummary(List<_Booking> bookings) {
  if (bookings.isEmpty) {
    return null;
  }
  final sorted = List<_Booking>.from(bookings)
    ..sort((a, b) => a.slotStart.compareTo(b.slotStart));
  final start = sorted.first.slotStart;
  final end = start.add(const Duration(days: 6));
  final count = sorted
      .where(
        (booking) =>
            !booking.slotStart.isBefore(start) &&
            !booking.slotStart.isAfter(end),
      )
      .length;
  return (
    count: count,
    rangeLabel: '${_formatRangeDate(start)} - ${_formatRangeDate(end)}',
  );
}

String _formatRangeDate(DateTime date) {
  return _formatDay(date);
}

String _formatDay(DateTime date) {
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  return '${months[date.month - 1]} ${date.day}';
}

String _formatTime(DateTime dt) {
  final hour = dt.hour == 0
      ? 12
      : dt.hour > 12
      ? dt.hour - 12
      : dt.hour;
  final minute = dt.minute.toString().padLeft(2, '0');
  final period = dt.hour >= 12 ? 'PM' : 'AM';
  return '$hour:$minute $period';
}

({Color background, String emoji}) _bookingVisual(_Booking booking) {
  final text = '${booking.title} ${booking.message ?? ''}'.toLowerCase();
  if (text.contains('coffee')) {
    return (background: const Color(0xFFEFE9FF), emoji: '☕');
  }
  if (text.contains('flight')) {
    return (background: const Color(0xFFE6F8EF), emoji: '✈');
  }
  if (text.contains('dinner')) {
    return (background: const Color(0xFFFFF0DB), emoji: '🍴');
  }
  if (text.contains('pick up') || text.contains('pickup')) {
    return (background: const Color(0xFFEAF1FF), emoji: '🚙');
  }
  return (background: const Color(0xFFEFE9FF), emoji: '📅');
}
