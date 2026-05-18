import 'dart:async';

import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import 'package:toatre/config/app_config.dart';
import 'package:toatre/services/api_service.dart';
import 'package:toatre/ui/bookings/bookings_screen.dart';
import 'package:toatre/utils/app_colors.dart';
import 'package:toatre/utils/text_styles.dart';

// ──────────────────────────────────────────────────────────────────────────────
// Models
// ──────────────────────────────────────────────────────────────────────────────

class _SharedSender {
  const _SharedSender({required this.name, this.handle, this.photoUrl});

  final String name;
  final String? handle;
  final String? photoUrl;

  factory _SharedSender.fromJson(Map<String, dynamic> json) => _SharedSender(
    name: (json['name'] as String?) ?? 'Someone',
    handle: json['handle'] as String?,
    photoUrl: json['photoUrl'] as String?,
  );
}

class _SharedToat {
  const _SharedToat({
    required this.id,
    required this.token,
    required this.role,
    required this.createdAt,
    required this.sender,
    required this.title,
    this.timeLabel,
    this.location,
    this.relationship,
  });

  final String id;
  final String token;
  final String role;
  final DateTime createdAt;
  final _SharedSender sender;
  final String title;
  final String? timeLabel;
  final String? location;
  final String? relationship;

  factory _SharedToat.fromJson(Map<String, dynamic> json) {
    final toat = json['toat'] as Map<String, dynamic>? ?? {};
    final recipient = json['recipient'] as Map<String, dynamic>? ?? {};
    return _SharedToat(
      id: json['id'] as String? ?? '',
      token: json['token'] as String? ?? '',
      role: json['role'] as String? ?? 'viewer',
      createdAt:
          DateTime.tryParse(json['createdAt'] as String? ?? '') ??
          DateTime.now(),
      sender: _SharedSender.fromJson(
        json['sender'] as Map<String, dynamic>? ?? {},
      ),
      title: toat['title'] as String? ?? 'Shared toat',
      timeLabel: _shareTimeLabelFromToatJson(toat),
      location: _shareLocationFromToatJson(toat),
      relationship: recipient['relationship'] as String?,
    );
  }
}

class _BookingRequest {
  const _BookingRequest({
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

  factory _BookingRequest.fromJson(
    Map<String, dynamic> json,
  ) => _BookingRequest(
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
    state: json['state'] as String? ?? 'pending',
    location: json['location'] as String?,
    createdAt:
        DateTime.tryParse(json['createdAt'] as String? ?? '') ?? DateTime.now(),
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Screen
// ──────────────────────────────────────────────────────────────────────────────

enum _InboxFilter { all, requests, shared }

class InboxScreen extends StatefulWidget {
  const InboxScreen({super.key, this.asTab = false, this.onOpenBookingsTab});

  final bool asTab;
  final VoidCallback? onOpenBookingsTab;

  @override
  State<InboxScreen> createState() => _InboxScreenState();
}

class _InboxScreenState extends State<InboxScreen> {
  _InboxFilter _filter = _InboxFilter.all;
  List<_SharedToat> _sharedToats = [];
  List<_BookingRequest> _bookingRequests = [];
  int _acceptedBookingsCount = 0;
  bool _loading = true;
  String? _error;
  String? _actioningId;

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
      final responses = await Future.wait<Map<String, dynamic>>([
        ApiService.instance.getJson('/api/inbox', authenticated: true),
        ApiService.instance.getJson(
          '/api/booking/requests',
          authenticated: true,
          queryParameters: const <String, String>{
            'state': 'accepted',
            'range': 'all',
          },
        ),
      ]);
      final data = responses[0];
      final bookings = responses[1];
      final rawShared = data['sharedToats'] as List<dynamic>? ?? [];
      final rawBookings = data['bookingRequests'] as List<dynamic>? ?? [];
      final acceptedRequests = bookings['requests'] as List<dynamic>? ?? [];
      if (!mounted) {
        return;
      }
      setState(() {
        _sharedToats = rawShared
            .cast<Map<String, dynamic>>()
            .map(_SharedToat.fromJson)
            .toList();
        _bookingRequests =
            rawBookings
                .cast<Map<String, dynamic>>()
                .map(_BookingRequest.fromJson)
                .where((r) => r.state == 'pending')
                .toList()
              ..sort((a, b) => a.slotStart.compareTo(b.slotStart));
        _acceptedBookingsCount = acceptedRequests.length;
        _loading = false;
      });
    } catch (_) {
      if (!mounted) {
        return;
      }
      setState(() {
        _error = 'Could not load inbox. Pull to refresh.';
        _loading = false;
      });
    }
  }

  Future<void> _openBookings() async {
    if (widget.asTab) {
      widget.onOpenBookingsTab?.call();
      return;
    }
    await Navigator.of(
      context,
    ).push(MaterialPageRoute<void>(builder: (_) => const BookingsScreen()));
    if (!mounted) {
      return;
    }
    await _fetch();
  }

  Future<void> _actOnBooking(String id, String state) async {
    setState(() => _actioningId = id);
    try {
      await ApiService.instance.patchJson(
        '/api/booking/requests/$id',
        body: {'state': state},
        authenticated: true,
      );
      setState(() {
        _bookingRequests.removeWhere((r) => r.id == id);
        _actioningId = null;
      });
    } catch (_) {
      setState(() => _actioningId = null);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not update. Try again.')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final requestBadge = _bookingRequests
        .where((r) => r.state == 'pending')
        .length;
    final totalCount = requestBadge + _sharedToats.length;
    final visibleRequests = _filter == _InboxFilter.shared
        ? const <_BookingRequest>[]
        : _bookingRequests;
    final visibleShared = _filter == _InboxFilter.requests
        ? const <_SharedToat>[]
        : _sharedToats;
    final showAcceptedShortcut =
        _filter == _InboxFilter.all && _acceptedBookingsCount > 0;
    final hasVisibleContent =
        visibleRequests.isNotEmpty ||
        visibleShared.isNotEmpty ||
        showAcceptedShortcut;

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
                    _IconCircleButton(
                      icon: Icons.arrow_back_rounded,
                      onTap: () => Navigator.of(context).pop(),
                    ),
                    const SizedBox(width: 12),
                  ],
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Inbox', style: TextStyles.heading2),
                        const SizedBox(height: 2),
                        Text(
                          'Requests and shared toats',
                          style: TextStyles.small.copyWith(
                            color: AppColors.textSecondary,
                          ),
                        ),
                      ],
                    ),
                  ),
                  if (totalCount > 0)
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        color: const Color(0x144F46E5),
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: Text(
                        '$totalCount',
                        style: TextStyles.smallMedium.copyWith(
                          color: const Color(0xFF4F46E5),
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 20),
              // Segmented tab
              _SegmentedTab(
                filter: _filter,
                requestCount: requestBadge,
                sharedCount: _sharedToats.length,
                acceptedCount: _acceptedBookingsCount,
                onFilter: (filter) => setState(() => _filter = filter),
                onOpenAccepted: _openBookings,
              ),
              const SizedBox(height: 20),
              if (_loading)
                const Padding(
                  padding: EdgeInsets.only(top: 60),
                  child: Center(child: CircularProgressIndicator()),
                )
              else if (_error != null)
                _InlineMessage(message: _error!)
              else if (!hasVisibleContent)
                _EmptyCard(
                  icon: Icons.inbox_outlined,
                  title: showAcceptedShortcut
                      ? 'Nothing waiting here.'
                      : 'Inbox is clear.',
                  subtitle: _acceptedBookingsCount > 0
                      ? 'Accepted bookings have moved into Bookings. New booking requests and shared toats will appear here.'
                      : 'Booking requests from your handle page and toats shared by your connections will appear here.',
                )
              else ...[
                if (visibleShared.isNotEmpty)
                  _SharedList(
                    sharedToats: visibleShared,
                    onOpen: (token) => unawaited(
                      launchUrl(
                        AppConfig.apiUri('/s/$token'),
                        mode: LaunchMode.externalApplication,
                      ),
                    ),
                  ),
                if (visibleShared.isNotEmpty && visibleRequests.isNotEmpty)
                  const SizedBox(height: 16),
                if (visibleRequests.isNotEmpty)
                  _RequestsList(
                    requests: visibleRequests,
                    actioningId: _actioningId,
                    onAct: _actOnBooking,
                  ),
                if (showAcceptedShortcut) ...[
                  const SizedBox(height: 16),
                  _AcceptedBookingsCard(
                    count: _acceptedBookingsCount,
                    onTap: _openBookings,
                  ),
                ],
              ],
            ],
          ),
        ),
      ),
    );
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Segmented control
// ──────────────────────────────────────────────────────────────────────────────

class _SegmentedTab extends StatelessWidget {
  const _SegmentedTab({
    required this.filter,
    required this.requestCount,
    required this.sharedCount,
    required this.acceptedCount,
    required this.onFilter,
    required this.onOpenAccepted,
  });

  final _InboxFilter filter;
  final int requestCount;
  final int sharedCount;
  final int acceptedCount;
  final ValueChanged<_InboxFilter> onFilter;
  final VoidCallback onOpenAccepted;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 50,
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: const Color(0xFFF0EAE0),
        borderRadius: BorderRadius.circular(22),
      ),
      child: Row(
        children: [
          _Segment(
            label: 'All',
            badge: requestCount + sharedCount,
            active: filter == _InboxFilter.all,
            onTap: () => onFilter(_InboxFilter.all),
          ),
          _Segment(
            label: 'Requests',
            badge: requestCount,
            active: filter == _InboxFilter.requests,
            onTap: () => onFilter(_InboxFilter.requests),
          ),
          _Segment(
            label: 'Shared',
            badge: sharedCount,
            active: filter == _InboxFilter.shared,
            onTap: () => onFilter(_InboxFilter.shared),
          ),
          _Segment(
            label: 'Accepted',
            badge: acceptedCount,
            active: false,
            onTap: onOpenAccepted,
          ),
        ],
      ),
    );
  }
}

class _Segment extends StatelessWidget {
  const _Segment({
    required this.label,
    required this.badge,
    required this.active,
    required this.onTap,
  });

  final String label;
  final int badge;
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
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                label,
                style: TextStyles.smallMedium.copyWith(
                  color: active
                      ? const Color(0xFF171C27)
                      : const Color(0xFF6A6159),
                  fontWeight: active ? FontWeight.w700 : FontWeight.w500,
                ),
              ),
              if (badge > 0) ...[
                const SizedBox(width: 6),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 7,
                    vertical: 2,
                  ),
                  decoration: BoxDecoration(
                    color: const Color(0xFF4F46E5),
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Text(
                    '$badge',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 10,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Requests list
// ──────────────────────────────────────────────────────────────────────────────

class _RequestsList extends StatelessWidget {
  const _RequestsList({
    required this.requests,
    required this.actioningId,
    required this.onAct,
  });

  final List<_BookingRequest> requests;
  final String? actioningId;
  final void Function(String id, String state) onAct;

  @override
  Widget build(BuildContext context) {
    if (requests.isEmpty) {
      return const _EmptyCard(
        icon: Icons.calendar_month_outlined,
        title: 'No pending requests.',
        subtitle: 'Booking requests from your public page will appear here.',
      );
    }
    return Column(
      children: [
        for (final request in requests)
          Padding(
            padding: const EdgeInsets.only(bottom: 14),
            child: _BookingRequestCard(
              request: request,
              actioning: actioningId == request.id,
              onAct: (state) => onAct(request.id, state),
            ),
          ),
      ],
    );
  }
}

class _BookingRequestCard extends StatelessWidget {
  const _BookingRequestCard({
    required this.request,
    required this.actioning,
    required this.onAct,
  });

  final _BookingRequest request;
  final bool actioning;
  final ValueChanged<String> onAct;

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
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              // Avatar
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(16),
                  gradient: const LinearGradient(
                    colors: [Color(0xFF7C3AED), Color(0xFFEC4899)],
                  ),
                ),
                alignment: Alignment.center,
                child: Text(
                  request.name.isNotEmpty ? request.name[0].toUpperCase() : '?',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 20,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      request.name,
                      style: TextStyles.bodyMedium.copyWith(
                        color: const Color(0xFF171C27),
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    if (request.bookerHandle != null)
                      Text(
                        '@${request.bookerHandle}',
                        style: TextStyles.small.copyWith(
                          color: const Color(0xFF4F46E5),
                        ),
                      ),
                  ],
                ),
              ),
              _timeAgoText(request.createdAt),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            request.title,
            style: TextStyles.bodyMedium.copyWith(
              color: const Color(0xFF171C27),
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 6),
          Row(
            children: [
              const Icon(
                Icons.calendar_today_rounded,
                size: 13,
                color: Color(0xFF6A6159),
              ),
              const SizedBox(width: 5),
              Expanded(
                child: Text(
                  _formatSlot(request.slotStart, request.slotEnd),
                  style: TextStyles.small.copyWith(
                    color: const Color(0xFF6A6159),
                  ),
                ),
              ),
            ],
          ),
          if (request.location != null && request.location!.isNotEmpty) ...[
            const SizedBox(height: 4),
            Row(
              children: [
                const Icon(
                  Icons.location_on_outlined,
                  size: 13,
                  color: Color(0xFF6A6159),
                ),
                const SizedBox(width: 5),
                Expanded(
                  child: Text(
                    request.location!,
                    style: TextStyles.small.copyWith(
                      color: const Color(0xFF6A6159),
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
          ],
          if (request.message != null && request.message!.isNotEmpty) ...[
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0x0C4F46E5),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Text(
                request.message!,
                style: TextStyles.small.copyWith(
                  color: const Color(0xFF37302A),
                  fontStyle: FontStyle.italic,
                ),
                maxLines: 3,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
          const SizedBox(height: 14),
          if (actioning)
            const Center(child: CircularProgressIndicator())
          else
            Row(
              children: [
                Expanded(
                  child: _ActionButton(
                    label: 'Deny',
                    color: const Color(0xFFEF4444),
                    bgColor: const Color(0xFFFEF2F2),
                    borderColor: const Color(0xFFFECACA),
                    onTap: () => onAct('denied'),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _ActionButton(
                    label: 'Accept',
                    color: Colors.white,
                    bgColor: const Color(0xFF4F46E5),
                    borderColor: const Color(0xFF4F46E5),
                    onTap: () => onAct('accepted'),
                  ),
                ),
              ],
            ),
        ],
      ),
    );
  }

  Widget _timeAgoText(DateTime dt) {
    final diff = DateTime.now().difference(dt);
    final String label;
    if (diff.inMinutes < 60) {
      label = '${diff.inMinutes}m ago';
    } else if (diff.inHours < 24) {
      label = '${diff.inHours}h ago';
    } else {
      label = '${diff.inDays}d ago';
    }
    return Text(
      label,
      style: TextStyles.tiny.copyWith(color: const Color(0xFF9C9289)),
    );
  }

  String _formatSlot(DateTime start, DateTime end) {
    final months = [
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
    final date = '${months[start.month - 1]} ${start.day}';
    String formatTime(DateTime d) {
      final h = d.hour == 0
          ? 12
          : d.hour > 12
          ? d.hour - 12
          : d.hour;
      final m = d.minute.toString().padLeft(2, '0');
      return '$h:$m ${d.hour >= 12 ? "PM" : "AM"}';
    }

    return '$date · ${formatTime(start)} – ${formatTime(end)}';
  }
}

class _ActionButton extends StatelessWidget {
  const _ActionButton({
    required this.label,
    required this.color,
    required this.bgColor,
    required this.borderColor,
    required this.onTap,
  });

  final String label;
  final Color color;
  final Color bgColor;
  final Color borderColor;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: 44,
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: borderColor),
        ),
        alignment: Alignment.center,
        child: Text(
          label,
          style: TextStyles.bodyMedium.copyWith(
            color: color,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
    );
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Shared toats list
// ──────────────────────────────────────────────────────────────────────────────

class _SharedList extends StatelessWidget {
  const _SharedList({required this.sharedToats, required this.onOpen});

  final List<_SharedToat> sharedToats;
  final ValueChanged<String> onOpen;

  @override
  Widget build(BuildContext context) {
    if (sharedToats.isEmpty) {
      return const _EmptyCard(
        icon: Icons.share_outlined,
        title: 'Nothing shared with you yet.',
        subtitle: 'When someone shares a toat with you, it will appear here.',
      );
    }
    return Column(
      children: [
        for (final share in sharedToats)
          Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: _SharedToatCard(
              share: share,
              onOpen: () => onOpen(share.token),
            ),
          ),
      ],
    );
  }
}

class _SharedToatCard extends StatelessWidget {
  const _SharedToatCard({required this.share, required this.onOpen});

  final _SharedToat share;
  final VoidCallback onOpen;

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
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(16),
                  gradient: const LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [Color(0xFF818CF8), Color(0xFFF59E0B)],
                  ),
                ),
                alignment: Alignment.center,
                child: share.sender.photoUrl != null
                    ? ClipRRect(
                        borderRadius: BorderRadius.circular(16),
                        child: Image.network(
                          share.sender.photoUrl!,
                          width: 48,
                          height: 48,
                          fit: BoxFit.cover,
                          errorBuilder: (_, __, ___) =>
                              _avatarInitial(share.sender.name),
                        ),
                      )
                    : _avatarInitial(share.sender.name),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            share.sender.name,
                            style: TextStyles.smallMedium.copyWith(
                              color: const Color(0xFF37302A),
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: const Color(0x144F46E5),
                            borderRadius: BorderRadius.circular(999),
                          ),
                          child: Text(
                            'Shared toat',
                            style: TextStyles.tiny.copyWith(
                              color: const Color(0xFF4F46E5),
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      share.title,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyles.body.copyWith(
                        color: const Color(0xFF171C27),
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      share.relationship != null &&
                              share.relationship!.isNotEmpty
                          ? '${_firstName(share.sender.name)} shared this toat with you as ${share.relationship}.'
                          : '${_firstName(share.sender.name)} shared this toat with you.',
                      style: TextStyles.small.copyWith(
                        color: const Color(0xFF6A6159),
                        height: 1.4,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Wrap(
            spacing: 10,
            runSpacing: 8,
            children: [
              if (share.timeLabel != null && share.timeLabel!.isNotEmpty)
                _MetaPill(
                  icon: Icons.calendar_today_rounded,
                  label: share.timeLabel!,
                ),
              if (share.location != null && share.location!.isNotEmpty)
                _MetaPill(
                  icon: Icons.location_on_outlined,
                  label: share.location!,
                ),
              _MetaPill(
                icon: Icons.lock_open_rounded,
                label: share.role == 'edit' ? 'Can edit' : 'Can view',
              ),
            ],
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              Text(
                _timeAgo(share.createdAt),
                style: TextStyles.tiny.copyWith(color: const Color(0xFF9C9289)),
              ),
              const Spacer(),
              _ActionButton(
                label: 'Open',
                color: const Color(0xFF4F46E5),
                bgColor: Colors.white,
                borderColor: const Color(0x804F46E5),
                onTap: onOpen,
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _avatarInitial(String name) {
    return Text(
      name.isNotEmpty ? name[0].toUpperCase() : '?',
      style: const TextStyle(
        color: Colors.white,
        fontSize: 20,
        fontWeight: FontWeight.w800,
      ),
    );
  }

  String _timeAgo(DateTime dt) {
    final diff = DateTime.now().difference(dt);
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    return '${diff.inDays}d ago';
  }

  String _firstName(String name) {
    final trimmed = name.trim();
    if (trimmed.isEmpty) {
      return 'Someone';
    }
    return trimmed.split(RegExp(r'\s+')).first;
  }
}

class _AcceptedBookingsCard extends StatelessWidget {
  const _AcceptedBookingsCard({required this.count, required this.onTap});

  final int count;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppColors.bgElevated,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 46,
                height: 46,
                decoration: BoxDecoration(
                  color: const Color(0x1A22C55E),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: const Icon(
                  Icons.event_available_rounded,
                  color: Color(0xFF15803D),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Accepted bookings',
                      style: TextStyles.bodyMedium.copyWith(
                        color: const Color(0xFF171C27),
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '$count booking${count == 1 ? '' : 's'} moved into Bookings.',
                      style: TextStyles.small.copyWith(
                        color: const Color(0xFF6A6159),
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0x1A22C55E),
                  borderRadius: BorderRadius.circular(999),
                ),
                child: Text(
                  'Accepted',
                  style: TextStyles.tiny.copyWith(
                    color: const Color(0xFF15803D),
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: _ActionButton(
              label: 'Open Bookings',
              color: const Color(0xFF4F46E5),
              bgColor: Colors.white,
              borderColor: const Color(0x804F46E5),
              onTap: onTap,
            ),
          ),
        ],
      ),
    );
  }
}

class _MetaPill extends StatelessWidget {
  const _MetaPill({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: const Color(0x0C4F46E5),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: const Color(0xFF6A6159)),
          const SizedBox(width: 6),
          ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 220),
            child: Text(
              label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyles.tiny.copyWith(color: const Color(0xFF6A6159)),
            ),
          ),
        ],
      ),
    );
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

class _EmptyCard extends StatelessWidget {
  const _EmptyCard({
    required this.icon,
    required this.title,
    required this.subtitle,
  });

  final IconData icon;
  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
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
              color: const Color(0x1A4F46E5),
              borderRadius: BorderRadius.circular(22),
            ),
            child: Icon(icon, color: const Color(0xFF4F46E5)),
          ),
          const SizedBox(height: 18),
          Text(title, style: TextStyles.heading1),
          const SizedBox(height: 10),
          Text(
            subtitle,
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

class _InlineMessage extends StatelessWidget {
  const _InlineMessage({required this.message});

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

class _IconCircleButton extends StatelessWidget {
  const _IconCircleButton({required this.icon, required this.onTap});

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

String? _shareTimeLabelFromToatJson(Map<String, dynamic> toat) {
  final enrichments = toat['enrichments'] as Map<String, dynamic>? ?? const {};
  final time = enrichments['time'] as Map<String, dynamic>? ?? const {};
  final value =
      time['at'] as String? ??
      time['startAt'] as String? ??
      time['dueAt'] as String?;
  if (value == null || value.isEmpty) {
    return null;
  }
  final parsed = DateTime.tryParse(value);
  if (parsed == null) {
    return null;
  }

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
  final hour = parsed.hour == 0
      ? 12
      : parsed.hour > 12
      ? parsed.hour - 12
      : parsed.hour;
  final minute = parsed.minute.toString().padLeft(2, '0');
  final period = parsed.hour >= 12 ? 'PM' : 'AM';
  return '${months[parsed.month - 1]} ${parsed.day} · $hour:$minute $period';
}

String? _shareLocationFromToatJson(Map<String, dynamic> toat) {
  final enrichments = toat['enrichments'] as Map<String, dynamic>? ?? const {};
  final place = enrichments['place'] as Map<String, dynamic>? ?? const {};
  final event = enrichments['event'] as Map<String, dynamic>? ?? const {};
  return place['address'] as String? ??
      place['placeName'] as String? ??
      event['venueName'] as String? ??
      event['address'] as String?;
}
