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
import 'package:toatre/ui/splash/splash_screen.dart';

class ToatreApp extends StatelessWidget {
  const ToatreApp({super.key});

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
      ],
      child: MaterialApp(
        title: 'Toatre',
        debugShowCheckedModeBanner: false,
        theme: ThemeConfig.darkTheme,
        home: const SplashScreen(),
      ),
    );
  }
}
