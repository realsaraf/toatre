class ToatSummary {
  const ToatSummary({
    required this.id,
    required this.kind,
    required this.tier,
    required this.title,
    required this.datetime,
    required this.endDatetime,
    required this.location,
    required this.link,
    required this.people,
    required this.notes,
  });

  final String id;
  final String kind;
  final String tier;
  final String title;
  final DateTime? datetime;
  final DateTime? endDatetime;
  final String? location;
  final String? link;
  final List<String> people;
  final String? notes;

  factory ToatSummary.fromJson(Map<String, dynamic> json) {
    final peopleJson = json['people'];

    return ToatSummary(
      id: json['id'] as String? ?? '',
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
    );
  }

  static DateTime? _parseDate(Object? value) {
    if (value is! String || value.isEmpty) {
      return null;
    }

    return DateTime.tryParse(value)?.toLocal();
  }
}
