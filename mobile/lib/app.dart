import 'dart:async';

import 'package:app_links/app_links.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'package:toatre/config/theme_config.dart';
import 'package:toatre/providers/auth_provider.dart';
import 'package:toatre/providers/toats_provider.dart';
import 'package:toatre/providers/capture_provider.dart';
import 'package:toatre/providers/pings_provider.dart';
import 'package:toatre/providers/people_provider.dart';
import 'package:toatre/providers/share_provider.dart';
import 'package:toatre/providers/settings_provider.dart';
import 'package:toatre/providers/connectivity_provider.dart';
import 'package:toatre/providers/revenue_cat_provider.dart';
import 'package:toatre/ui/splash/splash_screen.dart';
import 'package:toatre/ui/toat/shared_toat_screen.dart';

class ToatreApp extends StatefulWidget {
  const ToatreApp({super.key});

  @override
  State<ToatreApp> createState() => _ToatreAppState();
}

class _ToatreAppState extends State<ToatreApp> {
  final AppLinks _appLinks = AppLinks();
  final GlobalKey<NavigatorState> _navigatorKey = GlobalKey<NavigatorState>();

  StreamSubscription<Uri>? _deepLinkSubscription;
  String? _lastHandledSharedToken;
  String? _pendingSharedToken;

  @override
  void initState() {
    super.initState();
    unawaited(_configureDeepLinks());
  }

  Future<void> _configureDeepLinks() async {
    try {
      _queueSharedToat(await _appLinks.getInitialLink());
    } catch (_) {}

    _deepLinkSubscription = _appLinks.uriLinkStream.listen(
      _queueSharedToat,
      onError: (_) {},
    );
  }

  void _queueSharedToat(Uri? uri) {
    final token = _sharedTokenFromUri(uri);
    if (token == null ||
        token == _lastHandledSharedToken ||
        token == _pendingSharedToken) {
      return;
    }

    _pendingSharedToken = token;
    WidgetsBinding.instance.addPostFrameCallback(
      (_) => _showPendingSharedToat(),
    );
  }

  void _showPendingSharedToat() {
    final token = _pendingSharedToken;
    final navigator = _navigatorKey.currentState;

    if (token == null || navigator == null) {
      return;
    }

    _pendingSharedToken = null;
    _lastHandledSharedToken = token;
    navigator.push(
      MaterialPageRoute<void>(builder: (_) => SharedToatScreen(token: token)),
    );
  }

  String? _sharedTokenFromUri(Uri? uri) {
    if (uri == null) {
      return null;
    }

    if (uri.scheme == 'toatre') {
      if (uri.host == 'j' && uri.pathSegments.isNotEmpty) {
        return uri.pathSegments.first;
      }

      if (uri.pathSegments.length >= 2 && uri.pathSegments.first == 'j') {
        return uri.pathSegments[1];
      }
    }

    if ((uri.scheme == 'https' || uri.scheme == 'http') &&
        uri.pathSegments.length >= 2 &&
        uri.pathSegments.first == 'j') {
      return uri.pathSegments[1];
    }

    return null;
  }

  @override
  void dispose() {
    _deepLinkSubscription?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => ToatsProvider()),
        ChangeNotifierProvider(create: (_) => CaptureProvider()),
        ChangeNotifierProvider(create: (_) => PingsProvider()),
        ChangeNotifierProvider(create: (_) => PeopleProvider()),
        ChangeNotifierProvider(create: (_) => ShareProvider()),
        ChangeNotifierProvider(create: (_) => SettingsProvider()),
        ChangeNotifierProvider(create: (_) => ConnectivityProvider()),
        ChangeNotifierProvider(create: (_) => RevenueCatProvider()),
      ],
      child: MaterialApp(
        title: 'Toatre',
        debugShowCheckedModeBanner: false,
        navigatorKey: _navigatorKey,
        theme: ThemeConfig.darkTheme,
        home: const SplashScreen(),
      ),
    );
  }
}
