class ToatSummary {
  const ToatSummary({
    required this.id,
    required this.template,
    required this.kind,
    required this.tier,
    required this.title,
    required this.datetime,
    required this.endDatetime,
    required this.location,
    required this.link,
    required this.people,
    required this.notes,
    required this.status,
    required this.captureId,
    required this.templateData,
    required this.createdAt,
    required this.updatedAt,
  });

  final String id;

  /// One of: meeting, call, appointment, event, deadline, task, checklist,
  /// errand, follow_up, idea
  final String template;

  /// Legacy kind field kept for backward compat; use [template] for dispatch.
  final String kind;
  final String tier;
  final String title;
  final DateTime? datetime;
  final DateTime? endDatetime;
  final String? location;
  final String? link;
  final List<String> people;
  final String? notes;
  final String status;
  final String? captureId;

  /// Template-specific typed data (phone, joinUrl, checklist items, etc.).
  final Map<String, dynamic> templateData;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  factory ToatSummary.fromJson(Map<String, dynamic> json) {
    final peopleJson = json['people'];
    final tdJson = json['templateData'];

    return ToatSummary(
      id: json['id'] as String? ?? '',
      template: json['template'] as String? ?? 'task',
      kind: json['kind'] as String? ?? 'task',
      tier: json['tier'] as String? ?? 'regular',
      title: json['title'] as String? ?? '',
      datetime: _parseDate(json['datetime']),
      endDatetime: _parseDate(json['endDatetime']),
      location: json['location'] as String?,
      link: json['link'] as String?,
      people: peopleJson is List<dynamic>
          ? peopleJson.whereType<String>().toList()
          : const <String>[],
      notes: json['notes'] as String?,
      status: json['status'] as String? ?? 'active',
      captureId: json['captureId'] as String?,
      templateData: tdJson is Map<String, dynamic>
          ? tdJson
          : const <String, dynamic>{},
      createdAt: _parseDate(json['createdAt']),
      updatedAt: _parseDate(json['updatedAt']),
    );
  }

  ToatSummary copyWith({
    String? id,
    String? template,
    String? kind,
    String? tier,
    String? title,
    DateTime? datetime,
    bool clearDatetime = false,
    DateTime? endDatetime,
    bool clearEndDatetime = false,
    String? location,
    bool clearLocation = false,
    String? link,
    bool clearLink = false,
    List<String>? people,
    String? notes,
    bool clearNotes = false,
    String? status,
    String? captureId,
    bool clearCaptureId = false,
    Map<String, dynamic>? templateData,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return ToatSummary(
      id: id ?? this.id,
      template: template ?? this.template,
      kind: kind ?? this.kind,
      tier: tier ?? this.tier,
      title: title ?? this.title,
      datetime: clearDatetime ? null : datetime ?? this.datetime,
      endDatetime: clearEndDatetime ? null : endDatetime ?? this.endDatetime,
      location: clearLocation ? null : location ?? this.location,
      link: clearLink ? null : link ?? this.link,
      people: people ?? this.people,
      notes: clearNotes ? null : notes ?? this.notes,
      status: status ?? this.status,
      captureId: clearCaptureId ? null : captureId ?? this.captureId,
      templateData: templateData ?? this.templateData,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'id': id,
      'template': template,
      'kind': kind,
      'tier': tier,
      'title': title,
      'datetime': datetime?.toIso8601String(),
      'endDatetime': endDatetime?.toIso8601String(),
      'location': location,
      'link': link,
      'people': people,
      'notes': notes,
      'status': status,
      'captureId': captureId,
      'templateData': templateData,
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
