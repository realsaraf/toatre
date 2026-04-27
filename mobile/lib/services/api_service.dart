import 'dart:convert';
import 'dart:io';

import 'package:firebase_auth/firebase_auth.dart';
import 'package:http/http.dart' as http;

import 'package:toatre/config/app_config.dart';

class ApiServiceException implements Exception {
  const ApiServiceException({required this.statusCode, required this.message});

  final int statusCode;
  final String message;

  @override
  String toString() => message;
}

class ApiService {
  ApiService._();

  static final ApiService instance = ApiService._();

  final FirebaseAuth _auth = FirebaseAuth.instance;
  final http.Client _client = http.Client();

  Future<Map<String, dynamic>> getJson(
    String path, {
    bool authenticated = false,
    Map<String, String>? queryParameters,
  }) async {
    final headers = await _headers(authenticated: authenticated);
    final response = await _client.get(
      AppConfig.apiUri(path, queryParameters: queryParameters),
      headers: headers,
    );

    return _decodeMap(response);
  }

  Future<Map<String, dynamic>> postJson(
    String path, {
    required Map<String, Object?> body,
    bool authenticated = false,
  }) async {
    final headers = await _headers(authenticated: authenticated);
    headers['Content-Type'] = 'application/json';

    final response = await _client.post(
      AppConfig.apiUri(path),
      headers: headers,
      body: jsonEncode(body),
    );

    return _decodeMap(response);
  }

  Future<Map<String, dynamic>> patchJson(
    String path, {
    required Map<String, Object?> body,
    bool authenticated = false,
  }) async {
    final headers = await _headers(authenticated: authenticated);
    headers['Content-Type'] = 'application/json';

    final response = await _client.patch(
      AppConfig.apiUri(path),
      headers: headers,
      body: jsonEncode(body),
    );

    return _decodeMap(response);
  }

  Future<Map<String, dynamic>> deleteJson(
    String path, {
    bool authenticated = false,
  }) async {
    final headers = await _headers(authenticated: authenticated);
    final response = await _client.delete(
      AppConfig.apiUri(path),
      headers: headers,
    );

    return _decodeMap(response);
  }

  Future<Map<String, dynamic>> postMultipart(
    String path, {
    required String fileField,
    required String filePath,
    Map<String, String> fields = const <String, String>{},
    bool authenticated = false,
  }) async {
    final headers = await _headers(authenticated: authenticated);
    final request = http.MultipartRequest('POST', AppConfig.apiUri(path));
    request.headers.addAll(headers);
    request.fields.addAll(fields);
    request.files.add(
      await http.MultipartFile.fromPath(
        fileField,
        filePath,
        filename: File(filePath).uri.pathSegments.last,
      ),
    );

    final response = await http.Response.fromStream(await request.send());
    return _decodeMap(response);
  }

  Future<Map<String, String>> _headers({required bool authenticated}) async {
    final headers = <String, String>{'Accept': 'application/json'};

    if (!authenticated) {
      return headers;
    }

    final user = _auth.currentUser;
    if (user == null) {
      throw const ApiServiceException(
        statusCode: 401,
        message: 'You need to sign in first.',
      );
    }

    final token = await user.getIdToken();
    headers['Authorization'] = 'Bearer $token';
    return headers;
  }

  Map<String, dynamic> _decodeMap(http.Response response) {
    final dynamic decoded = response.body.isEmpty
        ? <String, dynamic>{}
        : jsonDecode(response.body);

    final map = decoded is Map<String, dynamic> ? decoded : <String, dynamic>{};

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return map;
    }

    throw ApiServiceException(
      statusCode: response.statusCode,
      message: map['error'] as String? ?? 'Request failed.',
    );
  }
}
