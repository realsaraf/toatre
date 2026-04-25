import 'package:flutter/material.dart';

enum CaptureStatus { idle, recording, processing, done, error }

class CaptureProvider extends ChangeNotifier {
  CaptureStatus _status = CaptureStatus.idle;
  String? _error;

  CaptureStatus get status => _status;
  String? get error => _error;
  bool get isRecording => _status == CaptureStatus.recording;

  void startRecording() {
    _status = CaptureStatus.recording;
    notifyListeners();
  }

  void stopRecording() {
    _status = CaptureStatus.processing;
    notifyListeners();
    // TODO: implement transcription + AI extraction
  }

  void reset() {
    _status = CaptureStatus.idle;
    _error = null;
    notifyListeners();
  }
}
