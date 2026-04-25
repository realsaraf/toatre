import 'package:flutter/material.dart';

class PingsProvider extends ChangeNotifier {
  List<Map<String, dynamic>> _pings = [];

  List<Map<String, dynamic>> get pings => _pings;

  Future<void> fetchPings() async {
    // TODO: implement
    _pings = [];
    notifyListeners();
  }
}
