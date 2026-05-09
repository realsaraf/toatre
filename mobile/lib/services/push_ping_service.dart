import 'dart:async';
import 'dart:io';

import 'package:firebase_messaging/firebase_messaging.dart';

import 'package:toatre/services/analytics_service.dart';
import 'package:toatre/services/api_service.dart';
import 'package:toatre/services/local_ping_service.dart';

class PushPingService {
  PushPingService._();

  static final PushPingService instance = PushPingService._();

  final FirebaseMessaging _messaging = FirebaseMessaging.instance;
  final StreamController<String> _tapController =
      StreamController<String>.broadcast();
  final StreamController<void> _syncController =
      StreamController<void>.broadcast();

  Future<void>? _initializing;
  StreamSubscription<RemoteMessage>? _foregroundMessageSubscription;
  StreamSubscription<RemoteMessage>? _openedMessageSubscription;
  StreamSubscription<String>? _tokenRefreshSubscription;
  bool _initialized = false;
  String? _initialPayload;
  String? _registeredToken;

  Stream<String> get tappedPayloads => _tapController.stream;

  /// Fires whenever a silent `type: toat-sync` FCM data message arrives
  /// while the app is in the foreground. Subscribers should refresh toats.
  Stream<void> get syncRequests => _syncController.stream;

  String? takeInitialPayload() {
    final payload = _initialPayload;
    _initialPayload = null;
    return payload;
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

  Future<void> ensureRegistered() async {
    await init();
    final token = await _messaging.getToken();
    if (token == null || token == _registeredToken) {
      return;
    }

    final registered = await _registerToken(token);
    if (registered) {
      _registeredToken = token;
    }
  }

  Future<void> unregisterDevice() async {
    await init();
    final token = _registeredToken ?? await _messaging.getToken();
    if (token == null) {
      return;
    }

    try {
      await ApiService.instance.deleteJson(
        '/api/device-tokens',
        body: <String, Object?>{'token': token},
        authenticated: true,
      );
      _registeredToken = null;
    } catch (_) {}
  }

  Future<void> _initInternal() async {
    await _messaging.requestPermission(alert: true, badge: true, sound: true);
    await _messaging.setForegroundNotificationPresentationOptions(
      alert: true,
      badge: true,
      sound: true,
    );

    _initialPayload = _payloadFromMessage(await _messaging.getInitialMessage());

    _foregroundMessageSubscription = FirebaseMessaging.onMessage.listen(
      _handleForegroundMessage,
      onError: (_) {},
    );
    _openedMessageSubscription = FirebaseMessaging.onMessageOpenedApp.listen(
      _handleOpenedMessage,
      onError: (_) {},
    );
    _tokenRefreshSubscription = _messaging.onTokenRefresh.listen((token) {
      _registeredToken = null;
      unawaited(
        _registerToken(token).then((registered) {
          if (registered) {
            _registeredToken = token;
          }
        }),
      );
    }, onError: (_) {});

    _initialized = true;
    _initializing = null;
  }

  Future<bool> _registerToken(String token) async {
    try {
      await ApiService.instance.postJson(
        '/api/device-tokens',
        body: <String, Object?>{
          'token': token,
          'platform': Platform.isIOS ? 'ios' : 'android',
        },
        authenticated: true,
      );
      return true;
    } catch (_) {
      return false;
    }
  }

  void _handleForegroundMessage(RemoteMessage message) {
    // Silent cross-device sync signal — ask providers to refresh.
    if (message.data['type'] == 'toat-sync') {
      _syncController.add(null);
      return;
    }

    final payload = _payloadFromMessage(message);
    if (payload == null) {
      return;
    }

    final title =
        message.notification?.title ??
        message.data['title'] as String? ??
        'Toatre Ping';
    final body =
        message.notification?.body ??
        message.data['body'] as String? ??
        'Reminder';

    unawaited(AnalyticsService.logPingFired(channel: 'push'));
    unawaited(
      LocalPingService.instance.showNow(
        title: title,
        body: body,
        payload: payload,
      ),
    );
  }

  void _handleOpenedMessage(RemoteMessage message) {
    final payload = _payloadFromMessage(message);
    if (payload == null) {
      return;
    }

    _tapController.add(payload);
  }

  String? _payloadFromMessage(RemoteMessage? message) {
    if (message == null) {
      return null;
    }

    final directPayload = message.data['payload'];
    if (directPayload is String && directPayload.isNotEmpty) {
      return directPayload;
    }

    final toatId = message.data['toatId'];
    if (toatId is! String || toatId.isEmpty) {
      return null;
    }

    final momentKey = message.data['momentKey'];
    return LocalPingService.payloadForToat(
      toatId: toatId,
      momentKey: momentKey is String && momentKey.isNotEmpty
          ? momentKey
          : 'push',
    );
  }

  void dispose() {
    _foregroundMessageSubscription?.cancel();
    _openedMessageSubscription?.cancel();
    _tokenRefreshSubscription?.cancel();
    _syncController.close();
  }
}
