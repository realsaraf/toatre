import 'package:flutter/material.dart';

enum ConnectivityStatus { online, offline }

class ConnectivityProvider extends ChangeNotifier {
  ConnectivityStatus _status = ConnectivityStatus.online;

  ConnectivityStatus get status => _status;
  bool get isOnline => _status == ConnectivityStatus.online;

  void setStatus(ConnectivityStatus status) {
    if (_status != status) {
      _status = status;
      notifyListeners();
    }
  }
}
