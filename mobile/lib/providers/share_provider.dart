import 'package:flutter/material.dart';

import 'package:toatre/models/connection.dart';
import 'package:toatre/services/api_service.dart';

class ShareProvider extends ChangeNotifier {
  final ApiService _api = ApiService.instance;

  bool _loading = false;
  bool _saving = false;
  String? _error;
  List<ToatreConnection> _connections = const <ToatreConnection>[];

  bool get loading => _loading;
  bool get saving => _saving;
  String? get error => _error;
  List<ToatreConnection> get connections => _connections;

  Future<void> loadConnections() async {
    _loading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _api.getJson(
        '/api/connections',
        authenticated: true,
      );
      final list = response['connections'];
      _connections = list is List<dynamic>
          ? list
                .whereType<Map<String, dynamic>>()
                .map(ToatreConnection.fromJson)
                .toList()
          : const <ToatreConnection>[];
    } on ApiServiceException catch (error) {
      _error = error.message;
    } catch (_) {
      _error = 'Could not load your connections.';
    }

    _loading = false;
    notifyListeners();
  }

  Future<void> saveConnection({
    String? id,
    required String name,
    required String relationship,
    String? phone,
    String? email,
    String? handle,
    String? notes,
  }) async {
    _saving = true;
    _error = null;
    notifyListeners();

    final body = <String, Object?>{
      'name': name,
      'relationship': relationship,
      'phone': _emptyToNull(phone),
      'email': _emptyToNull(email),
      'handle': _emptyToNull(handle?.replaceFirst(RegExp(r'^@+'), '')),
      'notes': _emptyToNull(notes),
    };

    try {
      if (id == null) {
        await _api.postJson(
          '/api/connections',
          body: body,
          authenticated: true,
        );
      } else {
        await _api.patchJson(
          '/api/connections/$id',
          body: body,
          authenticated: true,
        );
      }
      await loadConnections();
    } on ApiServiceException catch (error) {
      _error = error.message;
      rethrow;
    } catch (_) {
      _error = 'Could not save that connection.';
      rethrow;
    } finally {
      _saving = false;
      notifyListeners();
    }
  }

  Future<void> deleteConnection(String id) async {
    _saving = true;
    _error = null;
    notifyListeners();

    try {
      await _api.deleteJson('/api/connections/$id', authenticated: true);
      await loadConnections();
    } on ApiServiceException catch (error) {
      _error = error.message;
      rethrow;
    } catch (_) {
      _error = 'Could not remove that connection.';
      rethrow;
    } finally {
      _saving = false;
      notifyListeners();
    }
  }

  Future<ShareToatResult> shareToat({
    required String toatId,
    required List<String> connectionIds,
    required String permission,
    required bool linkOnly,
  }) async {
    _error = null;

    try {
      final response = await _api.postJson(
        '/api/toats/$toatId/share',
        body: <String, Object?>{
          'connectionIds': connectionIds,
          'permission': permission,
          'linkOnly': linkOnly,
        },
        authenticated: true,
      );

      final result = ShareToatResult.fromJson(response);
      if (result.shareUrl.isEmpty) {
        throw const ApiServiceException(
          statusCode: 500,
          message: 'Could not create that share link.',
        );
      }
      return result;
    } on ApiServiceException catch (error) {
      _error = error.message;
      rethrow;
    } catch (_) {
      _error = 'Could not create that share link.';
      rethrow;
    }
  }
}

String? _emptyToNull(String? value) {
  final trimmed = value?.trim() ?? '';
  return trimmed.isEmpty ? null : trimmed;
}
