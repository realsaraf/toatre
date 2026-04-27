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

  NotificationChannels copyWith({
    bool? push,
    bool? email,
    bool? sms,
  }) {
    return NotificationChannels(
      push: push ?? this.push,
      email: email ?? this.email,
      sms: sms ?? this.sms,
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'push': push,
      'email': email,
      'sms': sms,
    };
  }
}

typedef NotificationPreferences = Map<String, NotificationChannels>;

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

  factory AppSettings.fromJson(Map<String, dynamic> json) {
    return AppSettings(
      timezone: json['timezone'] as String? ?? 'UTC',
      voiceRetention: json['voiceRetention'] == true,
      smsEnabled: json['smsEnabled'] == true,
      reminderPhone: json['reminderPhone'] as String?,
      pendingPhone: json['pendingPhone'] as String?,
      phoneVerified: json['phoneVerified'] == true,
      phoneVerifiedAt: _parseDate(json['phoneVerifiedAt']),
      workStart: json['workStart'] as String? ?? '09:00',
      workEnd: json['workEnd'] as String? ?? '17:30',
      notificationPreferences: notificationPreferencesFromJson(
        json['notificationPreferences'],
      ),
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
  }) {
    return AppSettings(
      timezone: timezone ?? this.timezone,
      voiceRetention: voiceRetention ?? this.voiceRetention,
      smsEnabled: smsEnabled ?? this.smsEnabled,
      reminderPhone: clearReminderPhone
          ? null
          : reminderPhone ?? this.reminderPhone,
      pendingPhone: clearPendingPhone ? null : pendingPhone ?? this.pendingPhone,
      phoneVerified: phoneVerified ?? this.phoneVerified,
      phoneVerifiedAt: clearPhoneVerifiedAt
          ? null
          : phoneVerifiedAt ?? this.phoneVerifiedAt,
      workStart: workStart ?? this.workStart,
      workEnd: workEnd ?? this.workEnd,
      notificationPreferences:
          notificationPreferences ?? this.notificationPreferences,
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
    };
  }

  static DateTime? _parseDate(Object? value) {
    if (value is! String || value.isEmpty) {
      return null;
    }

    return DateTime.tryParse(value)?.toLocal();
  }
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
        settingsJson is Map<String, dynamic> ? settingsJson : <String, dynamic>{},
      ),
    );
  }

  SettingsPayload copyWith({
    SettingsProfile? profile,
    AppSettings? settings,
  }) {
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