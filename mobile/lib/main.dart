import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:sentry_flutter/sentry_flutter.dart';

import 'package:toatre/app.dart';
import 'package:toatre/firebase_options.dart';
import 'package:toatre/services/analytics_service.dart';
import 'package:toatre/services/revenue_cat_service.dart';

// Injected at build time via --dart-define or Codemagic env vars
const _kMixpanelToken = String.fromEnvironment(
  'MIXPANEL_TOKEN',
  defaultValue: '67d3cdd399f801648bac2de0777878ae',
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
      statusBarIconBrightness: Brightness.light,
      systemNavigationBarColor: Color(0xFF0A0A0F),
      systemNavigationBarIconBrightness: Brightness.light,
    ),
  );

  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);

  // Analytics (Firebase Analytics + Mixpanel)
  await AnalyticsService.init(mixpanelToken: _kMixpanelToken);

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
