import 'package:flutter/material.dart';

import 'package:toatre/models/toat_summary.dart';
import 'package:toatre/services/analytics_service.dart';
import 'package:toatre/services/api_service.dart';

enum ToatsStatus { idle, loading, loaded, error }

class ToatsProvider extends ChangeNotifier {
  final ApiService _api = ApiService.instance;

  ToatsStatus _status = ToatsStatus.idle;
  List<ToatSummary> _toats = <ToatSummary>[];
  String? _error;

  ToatsStatus get status => _status;
  List<ToatSummary> get toats => _toats;
  String? get error => _error;

  Future<void> fetchToats() async {
    _status = ToatsStatus.loading;
    _error = null;
    notifyListeners();

    try {
      final response = await _api.getJson(
        '/api/toats',
        authenticated: true,
        queryParameters: const <String, String>{'range': 'all'},
      );
      final toatsJson = response['toats'];
      final list = toatsJson is List<dynamic> ? toatsJson : const <dynamic>[];
      _toats = list
          .whereType<Map<String, dynamic>>()
          .map(ToatSummary.fromJson)
          .toList();
      _status = ToatsStatus.loaded;
    } on ApiServiceException catch (error) {
      _error = error.message;
      _status = ToatsStatus.error;
    } catch (_) {
      _error = 'Could not load your timeline.';
      _status = ToatsStatus.error;
    }

    notifyListeners();
  }

  Future<ToatSummary> fetchToat(String id) async {
    final response = await _api.getJson('/api/toats/$id', authenticated: true);
    final toatJson = response['toat'];
    if (toatJson is! Map<String, dynamic>) {
      throw const ApiServiceException(
        statusCode: 500,
        message: 'Could not load this toat.',
      );
    }

    return ToatSummary.fromJson(toatJson);
  }

  Future<ToatSummary> updateToat(
    String id,
    Map<String, Object?> body,
  ) async {
    final response = await _api.patchJson(
      '/api/toats/$id',
      body: body,
      authenticated: true,
    );
    final toatJson = response['toat'];
    if (toatJson is! Map<String, dynamic>) {
      throw const ApiServiceException(
        statusCode: 500,
        message: 'Could not update this toat.',
      );
    }

    final updated = ToatSummary.fromJson(toatJson);
    _replaceToat(updated);
    notifyListeners();
    return updated;
  }

  Future<void> deleteToat(ToatSummary toat) async {
    await _api.deleteJson('/api/toats/${toat.id}', authenticated: true);
    _toats = _toats.where((entry) => entry.id != toat.id).toList();
    notifyListeners();
    await AnalyticsService.logToatDeleted(kind: toat.kind);
  }

  Future<ToatSummary> duplicateToat(ToatSummary toat) async {
    final response = await _api.postJson(
      '/api/toats',
      body: <String, Object?>{
        'kind': toat.kind,
        'tier': toat.tier,
        'title': '${toat.title} copy',
        'datetime': toat.datetime?.toIso8601String(),
        'endDatetime': toat.endDatetime?.toIso8601String(),
        'location': toat.location,
        'link': toat.link,
        'people': toat.people,
        'notes': toat.notes,
      },
      authenticated: true,
    );

    final toatJson = response['toat'];
    if (toatJson is! Map<String, dynamic>) {
      throw const ApiServiceException(
        statusCode: 500,
        message: 'Could not duplicate this toat.',
      );
    }

    final duplicated = ToatSummary.fromJson(toatJson);
    _toats = <ToatSummary>[duplicated, ..._toats]
      ..sort(
        (left, right) =>
            (left.datetime ?? DateTime.fromMillisecondsSinceEpoch(0)).compareTo(
              right.datetime ?? DateTime.fromMillisecondsSinceEpoch(0),
            ),
      );
    notifyListeners();
    return duplicated;
  }

  void _replaceToat(ToatSummary updated) {
    final index = _toats.indexWhere((entry) => entry.id == updated.id);
    if (index == -1) {
      _toats = <ToatSummary>[updated, ..._toats];
      return;
    }

    final next = List<ToatSummary>.from(_toats);
    next[index] = updated;
    _toats = next;
  }
}
