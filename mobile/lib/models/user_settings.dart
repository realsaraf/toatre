const List<String> toatKinds = <String>[
  'task',
  'event',
  'meeting',
  'idea',
  'errand',
  'deadline',
];

class SettingsProfile {
  const SettingsProfile({
    required this.displayName,
    required this.email,
    required this.handle,
    required this.photoUrl,
  });

  final String? displayName;
  final String? email;
  final String? handle;
  final String? photoUrl;

  factory SettingsProfile.fromJson(Map<String, dynamic> json) {
    return SettingsProfile(
      displayName: json['displayName'] as String?,
      email: json['email'] as String?,
      handle: json['handle'] as String?,
      photoUrl: json['photoUrl'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'displayName': displayName,
      'email': email,
      'handle': handle,
      'photoUrl': photoUrl,
    };
  }
}

class NotificationChannels {
  const NotificationChannels({
    required this.push,
    required this.email,
    required this.sms,
  });

  final bool push;
  final bool email;
  final bool sms;

  factory NotificationChannels.fromJson(Map<String, dynamic>? json) {
    return NotificationChannels(
      push: json?['push'] == true,
      email: json?['email'] == true,
      sms: json?['sms'] == true,
    );
  }

  NotificationChannels copyWith({bool? push, bool? email, bool? sms}) {
    return NotificationChannels(
      push: push ?? this.push,
      email: email ?? this.email,
      sms: sms ?? this.sms,
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{'push': push, 'email': email, 'sms': sms};
  }
}

typedef NotificationPreferences = Map<String, NotificationChannels>;

enum SyncProviderKind { googleCalendar }

enum SyncDirection { sourceToToatre, toatreToSource, twoWay }

const String googleCalendarProviderKey = 'googleCalendar';

class SyncConnection {
  const SyncConnection({
    required this.provider,
    required this.direction,
    required this.connected,
    required this.connectedAt,
    required this.forwardOnlyFrom,
    required this.lastSyncedAt,
    required this.updatedAt,
  });

  final String provider;
  final SyncDirection direction;
  final bool connected;
  final DateTime? connectedAt;
  final DateTime? forwardOnlyFrom;
  final DateTime? lastSyncedAt;
  final DateTime? updatedAt;

  factory SyncConnection.fromJson(Map<String, dynamic> json) {
    return SyncConnection(
      provider: json['provider'] as String? ?? googleCalendarProviderKey,
      direction: syncDirectionFromString(json['direction'] as String?),
      connected: json['connected'] == true,
      connectedAt: _parseSettingsDate(json['connectedAt']),
      forwardOnlyFrom: _parseSettingsDate(json['forwardOnlyFrom']),
      lastSyncedAt: _parseSettingsDate(json['lastSyncedAt']),
      updatedAt: _parseSettingsDate(json['updatedAt']),
    );
  }

  SyncConnection copyWith({
    SyncDirection? direction,
    bool? connected,
    DateTime? connectedAt,
    bool clearConnectedAt = false,
    DateTime? forwardOnlyFrom,
    bool clearForwardOnlyFrom = false,
    DateTime? lastSyncedAt,
    bool clearLastSyncedAt = false,
    DateTime? updatedAt,
  }) {
    return SyncConnection(
      provider: provider,
      direction: direction ?? this.direction,
      connected: connected ?? this.connected,
      connectedAt: clearConnectedAt ? null : connectedAt ?? this.connectedAt,
      forwardOnlyFrom: clearForwardOnlyFrom
          ? null
          : forwardOnlyFrom ?? this.forwardOnlyFrom,
      lastSyncedAt: clearLastSyncedAt
          ? null
          : lastSyncedAt ?? this.lastSyncedAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'provider': provider,
      'direction': syncDirectionToString(direction),
      'connected': connected,
      'connectedAt': connectedAt?.toIso8601String(),
      'forwardOnlyFrom': forwardOnlyFrom?.toIso8601String(),
      'lastSyncedAt': lastSyncedAt?.toIso8601String(),
      'updatedAt': updatedAt?.toIso8601String(),
    };
  }
}

typedef SyncConnections = Map<String, SyncConnection>;

NotificationPreferences createDefaultNotificationPreferences() {
  return <String, NotificationChannels>{
    for (final kind in toatKinds)
      kind: const NotificationChannels(push: true, email: false, sms: false),
  };
}

NotificationPreferences notificationPreferencesFromJson(Object? input) {
  final defaults = createDefaultNotificationPreferences();
  if (input is! Map<String, dynamic>) {
    return defaults;
  }

  for (final kind in toatKinds) {
    defaults[kind] = NotificationChannels.fromJson(
      input[kind] as Map<String, dynamic>?,
    );
  }

  return defaults;
}

Map<String, dynamic> notificationPreferencesToJson(
  NotificationPreferences preferences,
) {
  return <String, dynamic>{
    for (final entry in preferences.entries) entry.key: entry.value.toJson(),
  };
}

SyncDirection syncDirectionFromString(String? value) {
  switch (value) {
    case 'sourceToToatre':
      return SyncDirection.sourceToToatre;
    case 'toatreToSource':
      return SyncDirection.toatreToSource;
    case 'twoWay':
      return SyncDirection.twoWay;
    default:
      return SyncDirection.sourceToToatre;
  }
}

String syncDirectionToString(SyncDirection direction) {
  switch (direction) {
    case SyncDirection.sourceToToatre:
      return 'sourceToToatre';
    case SyncDirection.toatreToSource:
      return 'toatreToSource';
    case SyncDirection.twoWay:
      return 'twoWay';
  }
}

SyncConnections syncConnectionsFromJson(Object? input) {
  if (input is! Map<String, dynamic>) {
    return <String, SyncConnection>{};
  }

  return <String, SyncConnection>{
    for (final entry in input.entries)
      if (entry.value is Map<String, dynamic>)
        entry.key: SyncConnection.fromJson(entry.value as Map<String, dynamic>),
  };
}

Map<String, dynamic> syncConnectionsToJson(SyncConnections connections) {
  return <String, dynamic>{
    for (final entry in connections.entries) entry.key: entry.value.toJson(),
  };
}

class AppSettings {
  const AppSettings({
    required this.timezone,
    required this.voiceRetention,
    required this.smsEnabled,
    required this.reminderPhone,
    required this.pendingPhone,
    required this.phoneVerified,
    required this.phoneVerifiedAt,
    required this.workStart,
    required this.workEnd,
    required this.notificationPreferences,
    required this.syncConnections,
  });

  final String timezone;
  final bool voiceRetention;
  final bool smsEnabled;
  final String? reminderPhone;
  final String? pendingPhone;
  final bool phoneVerified;
  final DateTime? phoneVerifiedAt;
  final String workStart;
  final String workEnd;
  final NotificationPreferences notificationPreferences;
  final SyncConnections syncConnections;

  factory AppSettings.fromJson(Map<String, dynamic> json) {
    return AppSettings(
      timezone: json['timezone'] as String? ?? 'UTC',
      voiceRetention: json['voiceRetention'] == true,
      smsEnabled: json['smsEnabled'] == true,
      reminderPhone: json['reminderPhone'] as String?,
      pendingPhone: json['pendingPhone'] as String?,
      phoneVerified: json['phoneVerified'] == true,
      phoneVerifiedAt: _parseSettingsDate(json['phoneVerifiedAt']),
      workStart: json['workStart'] as String? ?? '09:00',
      workEnd: json['workEnd'] as String? ?? '17:30',
      notificationPreferences: notificationPreferencesFromJson(
        json['notificationPreferences'],
      ),
      syncConnections: syncConnectionsFromJson(json['syncConnections']),
    );
  }

  AppSettings copyWith({
    String? timezone,
    bool? voiceRetention,
    bool? smsEnabled,
    String? reminderPhone,
    bool clearReminderPhone = false,
    String? pendingPhone,
    bool clearPendingPhone = false,
    bool? phoneVerified,
    DateTime? phoneVerifiedAt,
    bool clearPhoneVerifiedAt = false,
    String? workStart,
    String? workEnd,
    NotificationPreferences? notificationPreferences,
    SyncConnections? syncConnections,
  }) {
    return AppSettings(
      timezone: timezone ?? this.timezone,
      voiceRetention: voiceRetention ?? this.voiceRetention,
      smsEnabled: smsEnabled ?? this.smsEnabled,
      reminderPhone: clearReminderPhone
          ? null
          : reminderPhone ?? this.reminderPhone,
      pendingPhone: clearPendingPhone
          ? null
          : pendingPhone ?? this.pendingPhone,
      phoneVerified: phoneVerified ?? this.phoneVerified,
      phoneVerifiedAt: clearPhoneVerifiedAt
          ? null
          : phoneVerifiedAt ?? this.phoneVerifiedAt,
      workStart: workStart ?? this.workStart,
      workEnd: workEnd ?? this.workEnd,
      notificationPreferences:
          notificationPreferences ?? this.notificationPreferences,
      syncConnections: syncConnections ?? this.syncConnections,
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'timezone': timezone,
      'voiceRetention': voiceRetention,
      'smsEnabled': smsEnabled,
      'reminderPhone': reminderPhone,
      'pendingPhone': pendingPhone,
      'phoneVerified': phoneVerified,
      'phoneVerifiedAt': phoneVerifiedAt?.toIso8601String(),
      'workStart': workStart,
      'workEnd': workEnd,
      'notificationPreferences': notificationPreferencesToJson(
        notificationPreferences,
      ),
      'syncConnections': syncConnectionsToJson(syncConnections),
    };
  }
}

DateTime? _parseSettingsDate(Object? value) {
  if (value is! String || value.isEmpty) {
    return null;
  }

  return DateTime.tryParse(value)?.toLocal();
}

class SettingsPayload {
  const SettingsPayload({required this.profile, required this.settings});

  final SettingsProfile profile;
  final AppSettings settings;

  factory SettingsPayload.fromJson(Map<String, dynamic> json) {
    final profileJson = json['profile'];
    final settingsJson = json['settings'];

    return SettingsPayload(
      profile: SettingsProfile.fromJson(
        profileJson is Map<String, dynamic> ? profileJson : <String, dynamic>{},
      ),
      settings: AppSettings.fromJson(
        settingsJson is Map<String, dynamic>
            ? settingsJson
            : <String, dynamic>{},
      ),
    );
  }

  SettingsPayload copyWith({SettingsProfile? profile, AppSettings? settings}) {
    return SettingsPayload(
      profile: profile ?? this.profile,
      settings: settings ?? this.settings,
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'profile': profile.toJson(),
      'settings': settings.toJson(),
    };
  }
}
