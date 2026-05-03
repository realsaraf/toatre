import 'dart:async';
import 'dart:math';

import 'package:flutter/material.dart';
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';
import 'package:record/record.dart';

import 'package:toatre/models/toat_summary.dart';
import 'package:toatre/services/analytics_service.dart';
import 'package:toatre/services/api_service.dart';

enum CaptureStatus { idle, recording, processing, review, error }

enum CaptureInputMode { voice, text }

class CaptureProvider extends ChangeNotifier {
  final ApiService _api = ApiService.instance;
  final AudioRecorder _recorder = AudioRecorder();
  final Random _random = Random();

  CaptureStatus _status = CaptureStatus.idle;
  CaptureInputMode _mode = CaptureInputMode.voice;
  String? _error;
  String _transcript = '';
  int _elapsedSeconds = 0;
  String? _recordingPath;
  List<double> _waveform = List<double>.filled(18, 0.15);
  List<ToatSummary> _toats = <ToatSummary>[];
  Set<String> _selectedIds = <String>{};
  String? _captureId;

  Timer? _elapsedTimer;
  Timer? _waveformTimer;

  CaptureStatus get status => _status;
  CaptureInputMode get mode => _mode;
  String? get error => _error;
  String get transcript => _transcript;
  int get elapsedSeconds => _elapsedSeconds;
  List<double> get waveform => _waveform;
  List<ToatSummary> get toats => _toats;
  int get selectedCount => _selectedIds.length;
  bool get isRecording => _status == CaptureStatus.recording;
  bool get isProcessing => _status == CaptureStatus.processing;
  bool get isReviewing => _status == CaptureStatus.review;
  bool get isTextMode => _mode == CaptureInputMode.text;

  String? get captureId => _captureId;

  bool isSelected(String toatId) => _selectedIds.contains(toatId);

  void setMode(CaptureInputMode mode) {
    if (_status == CaptureStatus.processing) {
      return;
    }

    _mode = mode;
    _error = null;
    notifyListeners();
  }

  Future<void> startRecording() async {
    _error = null;
    _transcript = '';
    _toats = <ToatSummary>[];
    _selectedIds = <String>{};
    _elapsedSeconds = 0;
    _waveform = List<double>.filled(18, 0.15);

    final hasPermission = await _recorder.hasPermission();
    if (!hasPermission) {
      _status = CaptureStatus.error;
      _error = 'Microphone permission is required.';
      notifyListeners();
      return;
    }

    final dir = await getTemporaryDirectory();
    _recordingPath = p.join(
      dir.path,
      'capture-${DateTime.now().millisecondsSinceEpoch}.m4a',
    );

    await _recorder.start(
      const RecordConfig(encoder: AudioEncoder.aacLc),
      path: _recordingPath!,
    );

    _status = CaptureStatus.recording;
    notifyListeners();
    await AnalyticsService.logVoiceCaptureStarted();

    _elapsedTimer?.cancel();
    _elapsedTimer = Timer.periodic(const Duration(seconds: 1), (_) {
      _elapsedSeconds += 1;
      notifyListeners();
    });

    _waveformTimer?.cancel();
    _waveformTimer = Timer.periodic(const Duration(milliseconds: 120), (_) {
      _waveform = List<double>.generate(
        18,
        (_) => 0.15 + (_random.nextDouble() * 0.85),
      );
      notifyListeners();
    });
  }

  Future<void> stopRecording() async {
    if (_status != CaptureStatus.recording) {
      return;
    }

    _elapsedTimer?.cancel();
    _waveformTimer?.cancel();
    _status = CaptureStatus.processing;
    notifyListeners();

    final recordedPath = await _recorder.stop();
    await AnalyticsService.logVoiceCaptureStopped(
      durationMs: _elapsedSeconds * 1000,
    );

    if (recordedPath == null || recordedPath.isEmpty) {
      _status = CaptureStatus.error;
      _error = 'No audio was captured. Try again.';
      notifyListeners();
      return;
    }

    try {
      final response = await _api.postMultipart(
        '/api/captures',
        fileField: 'audio',
        filePath: recordedPath,
        authenticated: true,
      );
      await _applyCaptureResponse(response, fromVoice: true);
    } on ApiServiceException catch (error) {
      _status = CaptureStatus.error;
      _error = error.message;
    } catch (_) {
      _status = CaptureStatus.error;
      _error = 'Capture failed. Try again.';
    }

    notifyListeners();
  }

  Future<void> submitTextCapture(String transcript) async {
    final trimmed = transcript.trim();
    if (trimmed.isEmpty) {
      _status = CaptureStatus.error;
      _error = 'Type something before sending it to Toatre.';
      notifyListeners();
      return;
    }

    _error = null;
    _transcript = trimmed;
    _toats = <ToatSummary>[];
    _selectedIds = <String>{};
    _status = CaptureStatus.processing;
    notifyListeners();

    try {
      final response = await _api.postJson(
        '/api/captures',
        body: <String, Object?>{'transcript': trimmed},
        authenticated: true,
      );
      await _applyCaptureResponse(response, fromVoice: false);
    } on ApiServiceException catch (error) {
      _status = CaptureStatus.error;
      _error = error.message;
    } catch (_) {
      _status = CaptureStatus.error;
      _error = 'Capture failed. Try again.';
    }

    notifyListeners();
  }

  void toggleSelection(String toatId) {
    if (_selectedIds.contains(toatId)) {
      _selectedIds.remove(toatId);
    } else {
      _selectedIds.add(toatId);
    }
    notifyListeners();
  }

  void toggleAllSelections() {
    if (_toats.isEmpty) {
      return;
    }

    if (_selectedIds.length == _toats.length) {
      _selectedIds = <String>{};
    } else {
      _selectedIds = _toats.map((toat) => toat.id).toSet();
    }
    notifyListeners();
  }

  void reset() {
    _elapsedTimer?.cancel();
    _waveformTimer?.cancel();
    _status = CaptureStatus.idle;
    _mode = CaptureInputMode.voice;
    _error = null;
    _transcript = '';
    _elapsedSeconds = 0;
    _recordingPath = null;
    _waveform = List<double>.filled(18, 0.15);
    _toats = <ToatSummary>[];
    _selectedIds = <String>{};
    _captureId = null;
    notifyListeners();
  }

  /// Commit the reviewed capture: selected toats become active, others are deleted.
  Future<void> commitCapture() async {
    final id = _captureId;
    if (id == null) return;
    final selectedIds = _selectedIds.toList();
    await _api.postJson(
      '/api/captures/$id/commit',
      body: <String, Object?>{'selectedIds': selectedIds},
      authenticated: true,
    );
  }

  /// Edit a toat that is currently in the review list (local only — also patches the server).
  void updateToatLocally(ToatSummary updated) {
    _toats = _toats.map((t) => t.id == updated.id ? updated : t).toList();
    notifyListeners();
  }

  Future<void> _applyCaptureResponse(
    Map<String, dynamic> response, {
    required bool fromVoice,
  }) async {
    _transcript = response['transcript'] as String? ?? _transcript;
    _captureId = response['captureId'] as String?;
    final toatsJson = response['toats'];
    final list = toatsJson is List<dynamic> ? toatsJson : const <dynamic>[];
    _toats = list
        .whereType<Map<String, dynamic>>()
        .map(ToatSummary.fromJson)
        .toList();
    _selectedIds = _toats.map((toat) => toat.id).toSet();
    _status = CaptureStatus.review;
    _waveform = List<double>.filled(18, 0.25);

    for (final toat in _toats) {
      await AnalyticsService.logToatCreated(
        kind: toat.kind,
        tier: toat.tier,
        fromVoice: fromVoice,
      );
    }
  }

  @override
  void dispose() {
    _elapsedTimer?.cancel();
    _waveformTimer?.cancel();
    _recorder.dispose();
    super.dispose();
  }
}
