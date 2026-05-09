import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:http/http.dart' as http;
import 'package:sentry_flutter/sentry_flutter.dart';

import 'package:toatre/app.dart';
import 'package:toatre/config/app_config.dart';
import 'package:toatre/firebase_options.dart';
import 'package:toatre/models/toat_summary.dart';
import 'package:toatre/services/analytics_service.dart';
import 'package:toatre/services/revenue_cat_service.dart';
import 'package:toatre/services/widget_service.dart';

/// Top-level background message handler — runs in a separate isolate.
/// Fetches the latest toats and updates the home-screen widget so the
/// user sees fresh data without ever opening the app.
@pragma('vm:entry-point')
Future<void> _fcmBackgroundHandler(RemoteMessage message) async {
  if (message.data['type'] != 'toat-sync') return;
  try {
    WidgetsFlutterBinding.ensureInitialized();
    await Firebase.initializeApp(
      options: DefaultFirebaseOptions.currentPlatform,
    );
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return;
    final token = await user.getIdToken();
    if (token == null) return;

    final uri = AppConfig.apiUri(
      '/api/toats',
      queryParameters: const <String, String>{'range': 'all'},
    );
    final response = await http.get(
      uri,
      headers: <String, String>{
        'Accept': 'application/json',
        'Authorization': 'Bearer $token',
      },
    );
    if (response.statusCode < 200 || response.statusCode >= 300) return;

    final dynamic decoded = jsonDecode(response.body);
    if (decoded is! Map<String, dynamic>) return;
    final dynamic toatsJson = decoded['toats'];
    if (toatsJson is! List<dynamic>) return;

    final List<ToatSummary> toats = toatsJson
        .whereType<Map<String, dynamic>>()
        .map(ToatSummary.fromJson)
        .toList();
    await WidgetService.update(toats);
  } catch (_) {
    // Best-effort — never crash the background isolate.
  }
}

// Injected at build time via --dart-define or Codemagic env vars
const _kMixpanelToken = String.fromEnvironment(
  'MIXPANEL_TOKEN',
  defaultValue: '67d3cdd399f801648bac2de0777878ae',
);
const _kPosthogApiKey = String.fromEnvironment('POSTHOG_API_KEY');
const _kPosthogHost = String.fromEnvironment(
  'POSTHOG_HOST',
  defaultValue: 'https://us.i.posthog.com',
);
const _kRevenueCatApiKeyIos = String.fromEnvironment(
  'REVENUECAT_API_KEY_IOS',
  defaultValue: 'test_AzbpYFmaFgTYqareCKANNuJDWqX',
);

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);

  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
      systemNavigationBarColor: Color(0xFFFBFAFF),
      systemNavigationBarIconBrightness: Brightness.dark,
    ),
  );

  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
  FirebaseMessaging.onBackgroundMessage(_fcmBackgroundHandler);

  // Analytics (Firebase Analytics + Mixpanel + PostHog)
  await AnalyticsService.init(
    mixpanelToken: _kMixpanelToken,
    posthogApiKey: _kPosthogApiKey.isNotEmpty ? _kPosthogApiKey : null,
    posthogHost: _kPosthogHost,
  );

  // RevenueCat
  await RevenueCatService.instance.init(apiKey: _kRevenueCatApiKeyIos);

  const sentryDsn = String.fromEnvironment('SENTRY_DSN', defaultValue: '');

  if (sentryDsn.isNotEmpty) {
    await SentryFlutter.init((options) {
      options.dsn = sentryDsn;
      options.tracesSampleRate = 0.2;
      options.environment = const String.fromEnvironment(
        'TOATRE_ENV',
        defaultValue: 'development',
      );
    }, appRunner: () => runApp(const ToatreApp()));
  } else {
    runApp(const ToatreApp());
  }
}
