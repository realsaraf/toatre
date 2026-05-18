class ToatAttachment {
  const ToatAttachment({
    required this.id,
    required this.label,
    required this.mimeType,
    required this.size,
    required this.createdAt,
  });

  final String id;
  final String label;
  final String mimeType;
  final int size;
  final DateTime? createdAt;

  bool get isImage => mimeType.startsWith('image/');

  factory ToatAttachment.fromJson(Map<String, dynamic> json) => ToatAttachment(
    id: json['id'] as String? ?? '',
    label: json['label'] as String? ?? 'Attachment',
    mimeType: json['mimeType'] as String? ?? 'application/octet-stream',
    size: json['size'] as int? ?? 0,
    createdAt: ToatSummary._parseDate(json['createdAt']),
  );

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'id': id,
      'label': label,
      'mimeType': mimeType,
      'size': size,
      'createdAt': createdAt?.toIso8601String(),
    };
  }
}

class ToatLink {
  const ToatLink({
    required this.id,
    required this.url,
    required this.label,
    required this.createdAt,
    this.ogTitle,
    this.ogDescription,
    this.ogImage,
  });

  final String id;
  final String url;
  final String label;
  final String? ogTitle;
  final String? ogDescription;
  final String? ogImage;
  final DateTime? createdAt;

  String? get hostLabel {
    final parsed = Uri.tryParse(url);
    if (parsed == null || parsed.host.isEmpty) return null;
    return parsed.host.replaceFirst(RegExp(r'^www\.'), '');
  }

  bool get hasOpenGraph =>
      (ogTitle?.isNotEmpty ?? false) ||
      (ogDescription?.isNotEmpty ?? false) ||
      (ogImage?.isNotEmpty ?? false);

  factory ToatLink.fromJson(Map<String, dynamic> json) => ToatLink(
    id: json['id'] as String? ?? '',
    url: json['url'] as String? ?? '',
    label: json['label'] as String? ?? '',
    ogTitle: json['ogTitle'] as String?,
    ogDescription: json['ogDescription'] as String?,
    ogImage: json['ogImage'] as String?,
    createdAt: ToatSummary._parseDate(json['createdAt']),
  );

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'id': id,
      'url': url,
      'label': label,
      'ogTitle': ogTitle,
      'ogDescription': ogDescription,
      'ogImage': ogImage,
      'createdAt': createdAt?.toIso8601String(),
    };
  }
}

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
    this.attachments = const <ToatAttachment>[],
    this.links = const <ToatLink>[],
    this.source,
    this.bookingRequestId,
    this.attachmentCount = 0,
    this.linkCount = 0,
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
  final List<ToatAttachment> attachments;
  final List<ToatLink> links;
  final String? source;
  final String? bookingRequestId;

  /// Number of file attachments on this toat.
  final int attachmentCount;

  /// Number of links on this toat.
  final int linkCount;

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

  /// Duration in minutes from the time enrichment.
  /// Returns null when there is no time set; default display is 60 min.
  int? get duration {
    final d = timeEnrichment?['duration'];
    return d is int ? d : null;
  }

  /// Reminder offset in minutes before the primary datetime.
  /// Returns null when not explicitly set (server defaults to 10 min).
  int? get reminderOffset {
    final r = timeEnrichment?['reminderOffset'];
    return r is int ? r : null;
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
    final attachmentList =
        (json['attachments'] as List<dynamic>? ?? const <dynamic>[])
            .whereType<Map<String, dynamic>>()
            .map(ToatAttachment.fromJson)
            .toList();
    final linkList = (json['links'] as List<dynamic>? ?? const <dynamic>[])
        .whereType<Map<String, dynamic>>()
        .map(ToatLink.fromJson)
        .toList();

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
      attachments: attachmentList,
      links: linkList,
      source: json['source'] as String?,
      bookingRequestId: json['bookingRequestId'] as String?,
      attachmentCount: attachmentList.length,
      linkCount: linkList.length,
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
    List<ToatAttachment>? attachments,
    List<ToatLink>? links,
    String? source,
    String? bookingRequestId,
    int? attachmentCount,
    int? linkCount,
  }) {
    final nextAttachments = attachments ?? this.attachments;
    final nextLinks = links ?? this.links;

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
      attachments: nextAttachments,
      links: nextLinks,
      source: source ?? this.source,
      bookingRequestId: bookingRequestId ?? this.bookingRequestId,
      attachmentCount: attachmentCount ?? nextAttachments.length,
      linkCount: linkCount ?? nextLinks.length,
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
      'attachments': attachments
          .map((attachment) => attachment.toJson())
          .toList(),
      'links': links.map((link) => link.toJson()).toList(),
      'source': source,
      'bookingRequestId': bookingRequestId,
    };
  }

  static DateTime? _parseDate(Object? value) {
    if (value is! String || value.isEmpty) {
      return null;
    }

    return DateTime.tryParse(value)?.toLocal();
  }
}
