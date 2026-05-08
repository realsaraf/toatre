import 'dart:async';

import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:flutter_timezone/flutter_timezone.dart';
import 'package:intl/intl.dart';
import 'package:timezone/data/latest_all.dart' as tz;
import 'package:timezone/timezone.dart' as tz;

import 'package:toatre/models/toat_summary.dart';
import 'package:toatre/models/user_settings.dart';
import 'package:toatre/services/analytics_service.dart';

class ToatPingMoment {
  const ToatPingMoment({
    required this.key,
    required this.scheduledAt,
    required this.title,
    required this.subtitle,
  });

  final String key;
  final DateTime scheduledAt;
  final String title;
  final String subtitle;
}

List<ToatPingMoment> buildToatPingMoments(
  ToatSummary toat, {
  DateTime? now,
  bool includePast = false,
}) {
  if (toat.state != 'open') {
    return const <ToatPingMoment>[];
  }

  final referenceTime = now ?? DateTime.now();
  final primaryDateTime = toat.datetime;
  final reminderAt = _parseReminderAt(toat.timeEnrichment?['reminderAt']);

  if (primaryDateTime == null && reminderAt == null) {
    return const <ToatPingMoment>[];
  }

  final timeFmt = DateFormat.jm();
  final dateFmt = DateFormat('EEE, MMM d');
  final candidates = <ToatPingMoment>[
    if (reminderAt != null)
      ToatPingMoment(
        key: 'custom',
        scheduledAt: reminderAt,
        title: 'Reminder',
        subtitle:
            '${dateFmt.format(reminderAt)} at ${timeFmt.format(reminderAt)}',
      ),
    if (primaryDateTime != null)
      ToatPingMoment(
        key: 'leave-by',
        scheduledAt: primaryDateTime.subtract(const Duration(minutes: 10)),
        title:
            'Leave by ${timeFmt.format(primaryDateTime.subtract(const Duration(minutes: 10)))}',
        subtitle: '10 minutes before',
      ),
    if (primaryDateTime != null)
      ToatPingMoment(
        key: 'day-before',
        scheduledAt: primaryDateTime.subtract(const Duration(days: 1)),
        title: 'Day before reminder',
        subtitle:
            '${dateFmt.format(primaryDateTime.subtract(const Duration(days: 1)))} at ${timeFmt.format(primaryDateTime.subtract(const Duration(days: 1)))}',
      ),
  ];

  final results = <ToatPingMoment>[];
  final seenMinutes = <int>{};

  for (final moment
      in candidates..sort(
        (left, right) => left.scheduledAt.compareTo(right.scheduledAt),
      )) {
    if (!includePast && !moment.scheduledAt.isAfter(referenceTime)) {
      continue;
    }

    final minuteKey = moment.scheduledAt.millisecondsSinceEpoch ~/ 60000;
    if (!seenMinutes.add(minuteKey)) {
      continue;
    }

    results.add(moment);
  }

  return results;
}

class LocalPingService {
  LocalPingService._();

  static final LocalPingService instance = LocalPingService._();

  static const String _payloadPrefix = 'toat:';
  static const String _channelId = 'toatre_pings';
  static const String _channelName = 'Toatre Pings';
  static const String _channelDescription =
      'Reminder pings for scheduled toats.';

  final FlutterLocalNotificationsPlugin _plugin =
      FlutterLocalNotificationsPlugin();
  final StreamController<String> _tapController =
      StreamController<String>.broadcast();

  Future<void>? _initializing;
  Future<void> _syncChain = Future<void>.value();
  bool _initialized = false;
  String? _initialPayload;
  NotificationPreferences _notificationPreferences =
      createDefaultNotificationPreferences();
  List<ToatSummary> _latestToats = const <ToatSummary>[];

  Stream<String> get tappedPayloads => _tapController.stream;

  String? takeInitialPayload() {
    final payload = _initialPayload;
    _initialPayload = null;
    return payload;
  }

  static String? toatIdFromPayload(String? payload) {
    if (payload == null || !payload.startsWith(_payloadPrefix)) {
      return null;
    }

    final parts = payload.split(':');
    if (parts.length < 3 || parts[1].isEmpty) {
      return null;
    }

    return parts[1];
  }

  static String payloadForToat({
    required String toatId,
    required String momentKey,
  }) {
    return '$_payloadPrefix$toatId:$momentKey';
  }

  Future<void> init() async {
    if (_initialized) {
      return;
    }

    final initializing = _initializing;
    if (initializing != null) {
      await initializing;
      return;
    }

    _initializing = _initInternal();
    try {
      await _initializing;
    } finally {
      if (!_initialized) {
        _initializing = null;
      }
    }
  }

  Future<void> syncToats(List<ToatSummary> toats) {
    final snapshot = List<ToatSummary>.from(toats);
    _latestToats = snapshot;
    _syncChain = _syncChain
        .catchError((Object _, StackTrace __) {})
        .then((_) => _syncToatsInternal(snapshot));
    return _syncChain;
  }

  Future<void> updateNotificationPreferences(
    NotificationPreferences preferences,
  ) {
    _notificationPreferences = <String, NotificationChannels>{
      for (final entry in preferences.entries)
        entry.key: entry.value.copyWith(),
    };
    return syncToats(_latestToats);
  }

  Future<void> resetNotificationPreferences() {
    _notificationPreferences = createDefaultNotificationPreferences();
    return syncToats(_latestToats);
  }

  Future<void> _initInternal() async {
    tz.initializeTimeZones();
    await _configureLocalTimezone();

    const initializationSettings = InitializationSettings(
      android: AndroidInitializationSettings('@mipmap/ic_launcher'),
      iOS: DarwinInitializationSettings(
        requestAlertPermission: false,
        requestBadgePermission: false,
        requestSoundPermission: false,
      ),
    );

    await _plugin.initialize(
      initializationSettings,
      onDidReceiveNotificationResponse: _handleNotificationResponse,
    );

    final launchDetails = await _plugin.getNotificationAppLaunchDetails();
    _initialPayload = launchDetails?.didNotificationLaunchApp == true
        ? launchDetails?.notificationResponse?.payload
        : null;

    await _requestPermissions();
    _initialized = true;
    _initializing = null;
  }

  Future<void> _syncToatsInternal(List<ToatSummary> toats) async {
    await init();

    final pending = await _plugin.pendingNotificationRequests();
    for (final request in pending) {
      if (toatIdFromPayload(request.payload) != null) {
        await _plugin.cancel(request.id);
      }
    }

    for (final toat in toats) {
      if (!_pushEnabledFor(toat)) {
        continue;
      }

      final moments = buildToatPingMoments(toat);
      for (final moment in moments) {
        await _plugin.zonedSchedule(
          _notificationIdFor(toat: toat, moment: moment),
          toat.title.isEmpty ? 'Toatre Ping' : toat.title,
          moment.title,
          tz.TZDateTime.from(moment.scheduledAt, tz.local),
          _notificationDetails,
          androidScheduleMode: AndroidScheduleMode.inexactAllowWhileIdle,
          uiLocalNotificationDateInterpretation:
              UILocalNotificationDateInterpretation.absoluteTime,
          payload: _payloadFor(toat: toat, moment: moment),
        );
      }
    }
  }

  Future<void> showNow({
    required String title,
    required String body,
    String? payload,
  }) async {
    await init();
    await _plugin.show(
      Object.hash(title, body, payload, DateTime.now().millisecondsSinceEpoch) &
          0x7fffffff,
      title,
      body,
      _notificationDetails,
      payload: payload,
    );
  }

  Future<void> _configureLocalTimezone() async {
    try {
      final timezoneInfo = await FlutterTimezone.getLocalTimezone();
      tz.setLocalLocation(tz.getLocation(timezoneInfo.identifier));
    } catch (_) {}
  }

  Future<void> _requestPermissions() async {
    await _plugin
        .resolvePlatformSpecificImplementation<
          AndroidFlutterLocalNotificationsPlugin
        >()
        ?.requestNotificationsPermission();
    await _plugin
        .resolvePlatformSpecificImplementation<
          IOSFlutterLocalNotificationsPlugin
        >()
        ?.requestPermissions(alert: true, badge: true, sound: true);
  }

  void _handleNotificationResponse(NotificationResponse response) {
    final payload = response.payload;
    if (toatIdFromPayload(payload) == null) {
      return;
    }

    unawaited(AnalyticsService.logPingTapped());
    _tapController.add(payload!);
  }

  static int _notificationIdFor({
    required ToatSummary toat,
    required ToatPingMoment moment,
  }) {
    return Object.hash(
          toat.id,
          moment.key,
          moment.scheduledAt.millisecondsSinceEpoch,
        ) &
        0x7fffffff;
  }

  static String _payloadFor({
    required ToatSummary toat,
    required ToatPingMoment moment,
  }) {
    return payloadForToat(toatId: toat.id, momentKey: moment.key);
  }

  bool _pushEnabledFor(ToatSummary toat) {
    final kind = _notificationKindFor(toat);
    return _notificationPreferences[kind]?.push ?? true;
  }

  static const NotificationDetails _notificationDetails = NotificationDetails(
    android: AndroidNotificationDetails(
      _channelId,
      _channelName,
      channelDescription: _channelDescription,
      importance: Importance.high,
      priority: Priority.high,
    ),
    iOS: DarwinNotificationDetails(threadIdentifier: _channelId),
  );
}

DateTime? _parseReminderAt(Object? value) {
  if (value is! String || value.isEmpty) {
    return null;
  }

  return DateTime.tryParse(value)?.toLocal();
}

String _notificationKindFor(ToatSummary toat) {
  final communication = toat.communicationEnrichment;
  if (communication?['joinUrl'] is String) {
    return 'meeting';
  }

  if (toat.eventEnrichment != null) {
    return 'event';
  }

  final action = toat.actionEnrichment;
  if (action?['type'] == 'errand') {
    return 'errand';
  }

  if (toat.enrichments['thought'] is Map<String, dynamic>) {
    return 'idea';
  }

  final time = toat.timeEnrichment;
  if (time?['dueAt'] is String &&
      time?['at'] == null &&
      time?['startAt'] == null) {
    return 'deadline';
  }

  final title = toat.title.toLowerCase();
  bool hasAny(List<String> values) => values.any(title.contains);

  if (hasAny(const <String>['deadline', 'due', 'submit', 'submission'])) {
    return 'deadline';
  }
  if (hasAny(const <String>['meeting', 'standup', 'sync', 'zoom', 'meet '])) {
    return 'meeting';
  }
  if (hasAny(const <String>[
    'party',
    'wedding',
    'concert',
    'ceremony',
    'festival',
    'birthday',
    'graduation',
    'game',
    'match',
    'tournament',
  ])) {
    return 'event';
  }
  if (hasAny(const <String>[
    'grocery',
    'groceries',
    'supermarket',
    'market',
    'shopping',
    'buy ',
    'pick up',
    'pickup',
    'drop off',
    'drive to',
    'errand',
  ])) {
    return 'errand';
  }
  if (hasAny(const <String>['idea', 'thought', 'note', 'remember'])) {
    return 'idea';
  }

  return 'task';
}
