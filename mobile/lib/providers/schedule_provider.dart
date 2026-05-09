import 'package:flutter/material.dart';

import 'package:toatre/services/api_service.dart';

class SuggestedSlot {
  const SuggestedSlot({
    required this.startIso,
    required this.endIso,
    required this.label,
  });

  factory SuggestedSlot.fromJson(Map<String, Object?> json) => SuggestedSlot(
        startIso: (json['startIso'] as String?) ?? '',
        endIso: (json['endIso'] as String?) ?? '',
        label: (json['label'] as String?) ?? '',
      );

  final String startIso;
  final String endIso;
  final String label;
}

enum ScheduleSuggestStatus { idle, loading, success, error }

class ScheduleProvider extends ChangeNotifier {
  ScheduleSuggestStatus _status = ScheduleSuggestStatus.idle;
  List<SuggestedSlot> _slots = [];
  int _busyCount = 0;
  int _durationMinutes = 60;
  String? _error;

  ScheduleSuggestStatus get status => _status;
  List<SuggestedSlot> get slots => _slots;
  int get busyCount => _busyCount;
  int get durationMinutes => _durationMinutes;
  String? get error => _error;

  final ApiService _api = ApiService.instance;

  void reset() {
    _status = ScheduleSuggestStatus.idle;
    _slots = [];
    _busyCount = 0;
    _durationMinutes = 60;
    _error = null;
    notifyListeners();
  }

  Future<void> suggest(String query) async {
    if (query.trim().isEmpty) return;

    _status = ScheduleSuggestStatus.loading;
    _slots = [];
    _error = null;
    notifyListeners();

    try {
      final result = await _api.postJson(
        '/api/schedule/suggest',
        body: {'query': query.trim()},
        authenticated: true,
      );

      final rawSlots = result['slots'];
      if (rawSlots is List) {
        _slots = rawSlots
            .whereType<Map<String, Object?>>()
            .map(SuggestedSlot.fromJson)
            .toList();
      }

      _busyCount = (result['busyCount'] as int?) ?? 0;
      _durationMinutes = (result['durationMinutes'] as int?) ?? 60;
      _status = ScheduleSuggestStatus.success;
    } on ApiServiceException catch (e) {
      _error = e.message;
      _status = ScheduleSuggestStatus.error;
    } catch (_) {
      _error = 'Could not fetch scheduling suggestions.';
      _status = ScheduleSuggestStatus.error;
    }

    notifyListeners();
  }
}
