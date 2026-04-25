import 'package:flutter/material.dart';

class SettingsProvider extends ChangeNotifier {
  bool _voiceRetention = false;
  bool _smsEnabled = false;
  final String _reminderPhone = '';

  bool get voiceRetention => _voiceRetention;
  bool get smsEnabled => _smsEnabled;
  String get reminderPhone => _reminderPhone;

  void setVoiceRetention(bool value) {
    _voiceRetention = value;
    notifyListeners();
  }

  void setSmsEnabled(bool value) {
    _smsEnabled = value;
    notifyListeners();
  }
}
