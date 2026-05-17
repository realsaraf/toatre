import 'package:flutter/material.dart';

import 'package:toatre/services/api_service.dart';
import 'package:toatre/utils/app_colors.dart';
import 'package:toatre/utils/text_styles.dart';

// ──────────────────────────────────────────────────────────────────────────────
// Model
// ──────────────────────────────────────────────────────────────────────────────

class _Booking {
  const _Booking({
    required this.id,
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
        title: json['title'] as String? ?? '',
        name: json['name'] as String? ?? '',
        email: json['email'] as String? ?? '',
        phone: json['phone'] as String?,
        bookerHandle: json['bookerHandle'] as String?,
        message: json['message'] as String?,
        slotStart: DateTime.tryParse(json['slotStart'] as String? ?? '') ?? DateTime.now(),
        slotEnd: DateTime.tryParse(json['slotEnd'] as String? ?? '') ?? DateTime.now(),
        state: json['state'] as String? ?? 'accepted',
        location: json['location'] as String?,
        createdAt: DateTime.tryParse(json['createdAt'] as String? ?? '') ?? DateTime.now(),
      );
}

// ──────────────────────────────────────────────────────────────────────────────
// Screen
// ──────────────────────────────────────────────────────────────────────────────

enum _BookingFilter { upcoming, past }

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
    try {
      final serverFilter = _filter == _BookingFilter.upcoming ? 'upcoming' : 'past';
      final data = await ApiService.instance.getJson(
        '/api/booking/requests',
        authenticated: true,
        queryParameters: {
          'state': 'accepted',
          'range': serverFilter,
        },
      );
      final raw = data['requests'] as List<dynamic>? ?? [];
      setState(() {
        _bookings = raw
            .cast<Map<String, dynamic>>()
            .map(_Booking.fromJson)
            .toList()
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      body: SafeArea(
        child: RefreshIndicator(
          color: const Color(0xFFBE7716),
          backgroundColor: const Color(0xFFFCF9F4),
          onRefresh: _fetch,
          child: ListView(
            padding: EdgeInsets.fromLTRB(20, 14, 20, widget.asTab ? 120 : 40),
            children: [
              // Header
              Row(
                children: [
                  if (!widget.asTab) ...[  
                    _CircleButton(
                      icon: Icons.arrow_back_rounded,
                      onTap: () => Navigator.of(context).pop(),
                    ),
                    const SizedBox(width: 12),
                  ],
                  Expanded(
                    child: Text('Bookings', style: TextStyles.heading2),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              // Filter tabs
              _FilterBar(
                filter: _filter,
                onFilter: (f) {
                  setState(() => _filter = f);
                  _fetch();
                },
              ),
              const SizedBox(height: 20),
              if (_loading)
                const Padding(
                  padding: EdgeInsets.only(top: 60),
                  child: Center(child: CircularProgressIndicator()),
                )
              else if (_error != null)
                _ErrorCard(message: _error!)
              else if (_bookings.isEmpty)
                _EmptyCard(
                  filter: _filter,
                )
              else
                _BookingList(bookings: _bookings),
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
        color: const Color(0xFFF0EAE0),
        borderRadius: BorderRadius.circular(22),
      ),
      child: Row(
        children: [
          _FilterChip(
            label: 'Upcoming',
            active: filter == _BookingFilter.upcoming,
            onTap: () => onFilter(_BookingFilter.upcoming),
          ),
          _FilterChip(
            label: 'Past',
            active: filter == _BookingFilter.past,
            onTap: () => onFilter(_BookingFilter.past),
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
      child: GestureDetector(
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          decoration: BoxDecoration(
            color: active ? const Color(0xFFFCF9F4) : Colors.transparent,
            borderRadius: BorderRadius.circular(18),
            boxShadow: active
                ? const [
                    BoxShadow(
                      color: Color(0x14000000),
                      blurRadius: 8,
                      offset: Offset(0, 2),
                    ),
                  ]
                : null,
          ),
          alignment: Alignment.center,
          child: Text(
            label,
            style: TextStyles.smallMedium.copyWith(
              color: active ? const Color(0xFF171C27) : const Color(0xFF6A6159),
              fontWeight: active ? FontWeight.w700 : FontWeight.w500,
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

class _BookingList extends StatelessWidget {
  const _BookingList({required this.bookings});

  final List<_Booking> bookings;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        for (int i = 0; i < bookings.length; i++) ...[
          if (i == 0 || !_sameDay(bookings[i].slotStart, bookings[i - 1].slotStart)) ...[
            if (i > 0) const SizedBox(height: 10),
            Padding(
              padding: const EdgeInsets.only(bottom: 8, left: 4),
              child: Text(
                _dayLabel(bookings[i].slotStart),
                style: TextStyles.small.copyWith(
                  color: const Color(0xFFBE7716),
                  fontWeight: FontWeight.w700,
                  letterSpacing: 0.5,
                ),
              ),
            ),
          ],
          Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: _BookingCard(booking: bookings[i]),
          ),
        ],
      ],
    );
  }

  bool _sameDay(DateTime a, DateTime b) =>
      a.year == b.year && a.month == b.month && a.day == b.day;

  String _dayLabel(DateTime dt) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final d = DateTime(dt.year, dt.month, dt.day);
    final diff = d.difference(today).inDays;
    if (diff == 0) return 'TODAY';
    if (diff == 1) return 'TOMORROW';
    if (diff == -1) return 'YESTERDAY';
    const weekdays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return '${weekdays[dt.weekday - 1]}, ${months[dt.month - 1]} ${dt.day}';
  }
}

class _BookingCard extends StatelessWidget {
  const _BookingCard({required this.booking});

  final _Booking booking;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [Color(0xFFFEFBF6), Color(0xFFF8F1E8)],
        ),
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: const Color(0xFFE8DFD2)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x14000000),
            blurRadius: 20,
            offset: Offset(0, 8),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Color bar / time column
          SizedBox(
            width: 52,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _hourLabel(booking.slotStart),
                  style: TextStyles.smallMedium.copyWith(
                    color: const Color(0xFF1B202B),
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                Text(
                  _amPm(booking.slotStart),
                  style: TextStyles.tiny.copyWith(color: const Color(0xFF84786E)),
                ),
              ],
            ),
          ),
          // Icon
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(14),
              gradient: const LinearGradient(
                colors: [Color(0xFF7C3AED), Color(0xFF5B3DF5)],
              ),
            ),
            child: const Icon(Icons.event_available_rounded, color: Colors.white, size: 20),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  booking.title,
                  style: TextStyles.smallMedium.copyWith(
                    color: const Color(0xFF171C27),
                    fontWeight: FontWeight.w700,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Text(
                  booking.name,
                  style: TextStyles.small.copyWith(
                    color: const Color(0xFF6A6159),
                  ),
                ),
                if (booking.location != null && booking.location!.isNotEmpty) ...[
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      const Icon(
                        Icons.location_on_outlined,
                        size: 13,
                        color: Color(0xFF9C9289),
                      ),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          booking.location!,
                          style: TextStyles.tiny.copyWith(color: const Color(0xFF9C9289)),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ],
                const SizedBox(height: 6),
                Text(
                  '${_formatTime(booking.slotStart)} – ${_formatTime(booking.slotEnd)}',
                  style: TextStyles.tiny.copyWith(
                    color: const Color(0xFF9C9289),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _hourLabel(DateTime dt) {
    final h = dt.hour == 0 ? 12 : dt.hour > 12 ? dt.hour - 12 : dt.hour;
    return '$h:${dt.minute.toString().padLeft(2, '0')}';
  }

  String _amPm(DateTime dt) => dt.hour >= 12 ? 'PM' : 'AM';

  String _formatTime(DateTime dt) {
    final h = dt.hour == 0 ? 12 : dt.hour > 12 ? dt.hour - 12 : dt.hour;
    final m = dt.minute.toString().padLeft(2, '0');
    return '$h:$m ${dt.hour >= 12 ? "PM" : "AM"}';
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

class _EmptyCard extends StatelessWidget {
  const _EmptyCard({required this.filter});

  final _BookingFilter filter;

  @override
  Widget build(BuildContext context) {
    final isUpcoming = filter == _BookingFilter.upcoming;
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: AppColors.bgElevated,
        borderRadius: BorderRadius.circular(26),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
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
          Text(
            isUpcoming ? 'Nothing coming up.' : 'No past bookings.',
            style: TextStyles.heading1,
          ),
          const SizedBox(height: 10),
          Text(
            isUpcoming
                ? 'Accepted booking requests will appear here when you have upcoming sessions.'
                : 'Completed bookings will appear here.',
            style: TextStyles.body.copyWith(
              color: AppColors.textSecondary,
              height: 1.5,
            ),
          ),
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

class _CircleButton extends StatelessWidget {
  const _CircleButton({required this.icon, required this.onTap});

  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(22),
      child: Container(
        width: 44,
        height: 44,
        decoration: const BoxDecoration(
          color: AppColors.bgElevated,
          shape: BoxShape.circle,
        ),
        child: Icon(icon, color: AppColors.text),
      ),
    );
  }
}
