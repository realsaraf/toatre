import 'package:flutter/material.dart';

enum ToatsStatus { idle, loading, loaded, error }

class ToatsProvider extends ChangeNotifier {
  ToatsStatus _status = ToatsStatus.idle;
  List<Map<String, dynamic>> _toats = [];
  String? _error;

  ToatsStatus get status => _status;
  List<Map<String, dynamic>> get toats => _toats;
  String? get error => _error;

  Future<void> fetchToats() async {
    _status = ToatsStatus.loading;
    notifyListeners();
    // TODO: implement API fetch
    _toats = [];
    _status = ToatsStatus.loaded;
    notifyListeners();
  }
}
