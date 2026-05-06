class ToatSummary {
  const ToatSummary({
    required this.id,
    required this.tier,
    required this.state,
    required this.title,
    required this.notes,
    required this.enrichments,
    required this.captureId,
    required this.createdAt,
    required this.updatedAt,
  });

  final String id;

  /// One of: urgent, important, regular
  final String tier;

  /// One of: open, done, archived
  final String state;
  final String title;
  final String? notes;
  final String? captureId;

  /// Progressive enrichment data (time, place, action, communication, event,
  /// money, thought, people).
  final Map<String, dynamic> enrichments;

  final DateTime? createdAt;
  final DateTime? updatedAt;

  // ── Convenience accessors ────────────────────────────────────────────────

  Map<String, dynamic>? get timeEnrichment {
    final t = enrichments['time'];
    return t is Map<String, dynamic> ? t : null;
  }

  Map<String, dynamic>? get placeEnrichment {
    final p = enrichments['place'];
    return p is Map<String, dynamic> ? p : null;
  }

  Map<String, dynamic>? get actionEnrichment {
    final a = enrichments['action'];
    return a is Map<String, dynamic> ? a : null;
  }

  Map<String, dynamic>? get communicationEnrichment {
    final c = enrichments['communication'];
    return c is Map<String, dynamic> ? c : null;
  }

  Map<String, dynamic>? get eventEnrichment {
    final e = enrichments['event'];
    return e is Map<String, dynamic> ? e : null;
  }

  /// Primary datetime from time enrichment (at, startAt, or dueAt).
  DateTime? get datetime {
    final t = timeEnrichment;
    if (t == null) return null;
    return _parseDate(t['at']) ??
        _parseDate(t['startAt']) ??
        _parseDate(t['dueAt']);
  }

  DateTime? get endDatetime {
    return _parseDate(timeEnrichment?['endAt']);
  }

  String? get location {
    return placeEnrichment?['address'] as String? ??
        placeEnrichment?['placeName'] as String? ??
        eventEnrichment?['address'] as String? ??
        eventEnrichment?['venueName'] as String?;
  }

  List<String> get people {
    final p = enrichments['people'];
    return p is List<dynamic>
        ? p.whereType<String>().toList()
        : const <String>[];
  }

  factory ToatSummary.fromJson(Map<String, dynamic> json) {
    final enrichmentsJson = json['enrichments'];

    return ToatSummary(
      id: json['id'] as String? ?? '',
      tier: json['tier'] as String? ?? 'regular',
      state: json['state'] as String? ?? 'open',
      title: json['title'] as String? ?? '',
      notes: json['notes'] as String?,
      enrichments: enrichmentsJson is Map<String, dynamic>
          ? enrichmentsJson
          : const <String, dynamic>{},
      captureId: json['captureId'] as String?,
      createdAt: _parseDate(json['createdAt']),
      updatedAt: _parseDate(json['updatedAt']),
    );
  }

  ToatSummary copyWith({
    String? id,
    String? tier,
    String? state,
    String? title,
    String? notes,
    bool clearNotes = false,
    Map<String, dynamic>? enrichments,
    String? captureId,
    bool clearCaptureId = false,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return ToatSummary(
      id: id ?? this.id,
      tier: tier ?? this.tier,
      state: state ?? this.state,
      title: title ?? this.title,
      notes: clearNotes ? null : notes ?? this.notes,
      enrichments: enrichments ?? this.enrichments,
      captureId: clearCaptureId ? null : captureId ?? this.captureId,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'id': id,
      'tier': tier,
      'state': state,
      'title': title,
      'notes': notes,
      'enrichments': enrichments,
      'captureId': captureId,
      'createdAt': createdAt?.toIso8601String(),
      'updatedAt': updatedAt?.toIso8601String(),
    };
  }

  static DateTime? _parseDate(Object? value) {
    if (value is! String || value.isEmpty) {
      return null;
    }

    return DateTime.tryParse(value)?.toLocal();
  }
}
