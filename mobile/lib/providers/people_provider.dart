import 'package:flutter/material.dart';

class PeopleProvider extends ChangeNotifier {
  List<Map<String, dynamic>> _people = [];

  List<Map<String, dynamic>> get people => _people;

  Future<void> fetchPeople() async {
    // TODO: implement
    _people = [];
    notifyListeners();
  }
}
