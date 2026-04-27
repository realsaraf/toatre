import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import 'package:toatre/models/user_settings.dart';
import 'package:toatre/providers/auth_provider.dart';
import 'package:toatre/providers/settings_provider.dart';
import 'package:toatre/utils/app_colors.dart';
import 'package:toatre/utils/text_styles.dart';

enum SettingsTab { general, phone, handle, pings }
enum _NoticeTone { success, error }

const Map<String, String> _kindLabels = <String, String>{
  'task': 'Tasks',
  'event': 'Events',
  'meeting': 'Meetings',
  'idea': 'Ideas',
  'errand': 'Errands',
  'deadline': 'Deadlines',
};

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  SettingsTab _activeTab = SettingsTab.general;
  String? _notice;
  _NoticeTone? _noticeTone;
  SettingsPayload? _appliedPayload;

  String _timezone = 'UTC';
  String _workStart = '09:00';
  String _workEnd = '17:30';
  bool _voiceRetention = false;
  String _handleDraft = '';
  String _phoneDraft = '';
  String _verificationCode = '';
  bool _smsEnabled = false;
  NotificationPreferences _notificationPreferences =
      createDefaultNotificationPreferences();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<SettingsProvider>().loadSettings();
    });
  }

  @override
  Widget build(BuildContext context) {
    final settingsProvider = context.watch<SettingsProvider>();
    final auth = context.watch<AuthProvider>();
    final payload = settingsProvider.payload;

    if (payload != null && !identical(payload, _appliedPayload)) {
      _applyPayload(payload);
      _appliedPayload = payload;
    }

    return Scaffold(
      backgroundColor: AppColors.bg,
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 14, 20, 0),
              child: Row(
                children: [
                  _IconCircleButton(
                    icon: Icons.arrow_back_rounded,
                    onTap: () => Navigator.of(context).pop(),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text('Settings', style: TextStyles.heading2),
                  ),
                  _IconCircleButton(
                    icon: Icons.logout_rounded,
                    onTap: settingsProvider.savingKey == 'signout'
                        ? null
                        : () => _signOut(context),
                  ),
                ],
              ),
            ),
            Expanded(
              child: RefreshIndicator(
                onRefresh: settingsProvider.loadSettings,
                child: ListView(
                  padding: const EdgeInsets.fromLTRB(20, 20, 20, 28),
                  children: [
                    _HeroCard(
                      displayName:
                          payload?.profile.displayName ?? auth.user?.displayName,
                      email: payload?.profile.email ?? auth.user?.email,
                      handle: payload?.profile.handle,
                    ),
                    const SizedBox(height: 16),
                    SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: SettingsTab.values.map((tab) {
                          return Padding(
                            padding: const EdgeInsets.only(right: 10),
                            child: _TabButton(
                              label: _tabLabel(tab),
                              active: _activeTab == tab,
                              onTap: () => setState(() => _activeTab = tab),
                            ),
                          );
                        }).toList(),
                      ),
                    ),
                    if (_notice != null) ...[
                      const SizedBox(height: 16),
                      _NoticeCard(
                        message: _notice!,
                        tone: _noticeTone ?? _NoticeTone.success,
                      ),
                    ],
                    if (settingsProvider.loading && payload == null) ...[
                      const SizedBox(height: 36),
                      const Center(child: CircularProgressIndicator()),
                    ] else if (settingsProvider.error != null && payload == null) ...[
                      const SizedBox(height: 24),
                      _ErrorCard(
                        message: settingsProvider.error!,
                        onRetry: settingsProvider.loadSettings,
                      ),
                    ] else if (payload != null) ...[
                      const SizedBox(height: 16),
                      if (_activeTab == SettingsTab.general)
                        _GeneralTab(
                          timezone: _timezone,
                          workStart: _workStart,
                          workEnd: _workEnd,
                          voiceRetention: _voiceRetention,
                          busy: settingsProvider.savingKey == 'general',
                          onTimezoneChanged: (value) =>
                              setState(() => _timezone = value),
                          onWorkStartChanged: (value) =>
                              setState(() => _workStart = value),
                          onWorkEndChanged: (value) =>
                              setState(() => _workEnd = value),
                          onVoiceRetentionChanged: (value) =>
                              setState(() => _voiceRetention = value),
                          onSave: () => _saveGeneral(settingsProvider),
                        ),
                      if (_activeTab == SettingsTab.phone)
                        _PhoneTab(
                          phoneDraft: _phoneDraft,
                          verificationCode: _verificationCode,
                          smsEnabled: _smsEnabled,
                          settings: payload.settings,
                          sendingCode: settingsProvider.savingKey == 'phone-start',
                          verifying: settingsProvider.savingKey == 'phone-check',
                          saving: settingsProvider.savingKey == 'phone-save',
                          onPhoneChanged: (value) =>
                              setState(() => _phoneDraft = value),
                          onCodeChanged: (value) =>
                              setState(() => _verificationCode = value),
                          onSmsEnabledChanged: (value) =>
                              setState(() => _smsEnabled = value),
                          onSendCode: () => _sendPhoneCode(settingsProvider),
                          onVerify: () => _verifyPhone(settingsProvider),
                          onSave: () => _savePhone(settingsProvider),
                        ),
                      if (_activeTab == SettingsTab.handle)
                        _HandleTab(
                          handle: _handleDraft,
                          busy: settingsProvider.savingKey == 'handle',
                          onChanged: (value) =>
                              setState(() => _handleDraft = value),
                          onSave: () => _saveHandle(settingsProvider),
                        ),
                      if (_activeTab == SettingsTab.pings)
                        _PingsTab(
                          preferences: _notificationPreferences,
                          busy: settingsProvider.savingKey == 'pings',
                          onToggle: _toggleChannel,
                          onSave: () => _savePings(settingsProvider),
                        ),
                    ],
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _applyPayload(SettingsPayload payload) {
    _timezone = payload.settings.timezone;
    _workStart = payload.settings.workStart;
    _workEnd = payload.settings.workEnd;
    _voiceRetention = payload.settings.voiceRetention;
    _handleDraft = payload.profile.handle ?? '';
    _phoneDraft = payload.settings.pendingPhone ?? payload.settings.reminderPhone ?? '';
    _verificationCode = '';
    _smsEnabled = payload.settings.smsEnabled;
    _notificationPreferences = <String, NotificationChannels>{
      for (final entry in payload.settings.notificationPreferences.entries)
        entry.key: entry.value.copyWith(),
    };
  }

  void _showNotice(String message, _NoticeTone tone) {
    setState(() {
      _notice = message;
      _noticeTone = tone;
    });
  }

  Future<void> _saveGeneral(SettingsProvider provider) async {
    try {
      await provider.saveGeneral(
        timezone: _timezone,
        workStart: _workStart,
        workEnd: _workEnd,
        voiceRetention: _voiceRetention,
      );
      _showNotice('General settings updated.', _NoticeTone.success);
    } catch (_) {
      _showNotice(
        provider.error ?? 'Could not save your general settings.',
        _NoticeTone.error,
      );
    }
  }

  Future<void> _saveHandle(SettingsProvider provider) async {
    final authProvider = context.read<AuthProvider>();
    try {
      await provider.saveHandle(_handleDraft);
      await authProvider.hydrate();
      if (!mounted) {
        return;
      }
      _showNotice('Handle updated.', _NoticeTone.success);
    } catch (_) {
      _showNotice(
        provider.error ?? 'Could not save your handle.',
        _NoticeTone.error,
      );
    }
  }

  Future<void> _sendPhoneCode(SettingsProvider provider) async {
    try {
      await provider.sendPhoneCode(_phoneDraft);
      _showNotice('Verification code sent.', _NoticeTone.success);
    } catch (_) {
      _showNotice(
        provider.error ?? 'Could not send a verification code.',
        _NoticeTone.error,
      );
    }
  }

  Future<void> _verifyPhone(SettingsProvider provider) async {
    try {
      await provider.verifyPhoneCode(
        phone: _phoneDraft,
        code: _verificationCode,
      );
      _showNotice('Phone verified for SMS Pings.', _NoticeTone.success);
    } catch (_) {
      _showNotice(
        provider.error ?? 'Could not verify that code.',
        _NoticeTone.error,
      );
    }
  }

  Future<void> _savePhone(SettingsProvider provider) async {
    try {
      await provider.savePhoneSettings(smsEnabled: _smsEnabled);
      _showNotice('SMS Ping setting updated.', _NoticeTone.success);
    } catch (_) {
      _showNotice(
        provider.error ?? 'Could not save your SMS Ping setting.',
        _NoticeTone.error,
      );
    }
  }

  Future<void> _savePings(SettingsProvider provider) async {
    try {
      await provider.savePingSettings(_notificationPreferences);
      _showNotice('Ping settings updated.', _NoticeTone.success);
    } catch (_) {
      _showNotice(
        provider.error ?? 'Could not save your Ping settings.',
        _NoticeTone.error,
      );
    }
  }

  Future<void> _signOut(BuildContext context) async {
    await context.read<AuthProvider>().signOut();
    if (!context.mounted) return;
    Navigator.of(context).popUntil((route) => route.isFirst);
  }

  void _toggleChannel(String kind, String channel) {
    final current = _notificationPreferences[kind];
    if (current == null) {
      return;
    }

    setState(() {
      _notificationPreferences = <String, NotificationChannels>{
        ..._notificationPreferences,
        kind: current.copyWith(
          push: channel == 'push' ? !current.push : null,
          email: channel == 'email' ? !current.email : null,
          sms: channel == 'sms' ? !current.sms : null,
        ),
      };
    });
  }

  String _tabLabel(SettingsTab tab) {
    switch (tab) {
      case SettingsTab.general:
        return 'General';
      case SettingsTab.phone:
        return 'Phone';
      case SettingsTab.handle:
        return 'Handle';
      case SettingsTab.pings:
        return 'Pings';
    }
  }
}

class _HeroCard extends StatelessWidget {
  const _HeroCard({
    required this.displayName,
    required this.email,
    required this.handle,
  });

  final String? displayName;
  final String? email;
  final String? handle;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.bgElevated,
        borderRadius: BorderRadius.circular(24),
        boxShadow: const [
          BoxShadow(
            color: Color(0x22000000),
            blurRadius: 24,
            offset: Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            displayName ?? 'Your profile',
            style: TextStyles.heading1,
          ),
          const SizedBox(height: 8),
          Text(
            [if (handle != null && handle!.isNotEmpty) '@$handle', if (email != null && email!.isNotEmpty) email]
                .join(' · '),
            style: TextStyles.body.copyWith(color: AppColors.textSecondary),
          ),
          const SizedBox(height: 12),
          Text(
            'Manage your profile, phone Pings, handle, and privacy in one place.',
            style: TextStyles.smallMedium,
          ),
        ],
      ),
    );
  }
}

class _TabButton extends StatelessWidget {
  const _TabButton({
    required this.label,
    required this.active,
    required this.onTap,
  });

  final String label;
  final bool active;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: active ? const Color(0xFF1B1832) : AppColors.bgElevated,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: active ? const Color(0x444F46E5) : AppColors.border,
          ),
        ),
        child: Text(
          label,
          style: TextStyles.smallMedium.copyWith(
            color: active ? AppColors.primaryLight : AppColors.textSecondary,
          ),
        ),
      ),
    );
  }
}

class _NoticeCard extends StatelessWidget {
  const _NoticeCard({required this.message, required this.tone});

  final String message;
  final _NoticeTone tone;

  @override
  Widget build(BuildContext context) {
    final isError = tone == _NoticeTone.error;
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: isError ? const Color(0x22EF4444) : const Color(0x2222C55E),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: isError ? const Color(0x44EF4444) : const Color(0x4422C55E),
        ),
      ),
      child: Text(
        message,
        style: TextStyles.smallMedium.copyWith(
          color: isError ? AppColors.error : AppColors.success,
        ),
      ),
    );
  }
}

class _ErrorCard extends StatelessWidget {
  const _ErrorCard({required this.message, required this.onRetry});

  final String message;
  final Future<void> Function() onRetry;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.bgElevated,
        borderRadius: BorderRadius.circular(22),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Could not load your settings.', style: TextStyles.bodyMedium),
          const SizedBox(height: 8),
          Text(message, style: TextStyles.small),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: onRetry,
            child: const Text('Try again'),
          ),
        ],
      ),
    );
  }
}

class _GeneralTab extends StatelessWidget {
  const _GeneralTab({
    required this.timezone,
    required this.workStart,
    required this.workEnd,
    required this.voiceRetention,
    required this.busy,
    required this.onTimezoneChanged,
    required this.onWorkStartChanged,
    required this.onWorkEndChanged,
    required this.onVoiceRetentionChanged,
    required this.onSave,
  });

  final String timezone;
  final String workStart;
  final String workEnd;
  final bool voiceRetention;
  final bool busy;
  final ValueChanged<String> onTimezoneChanged;
  final ValueChanged<String> onWorkStartChanged;
  final ValueChanged<String> onWorkEndChanged;
  final ValueChanged<bool> onVoiceRetentionChanged;
  final VoidCallback onSave;

  @override
  Widget build(BuildContext context) {
    return _PanelCard(
      title: 'Profile and privacy',
      eyebrow: 'General',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _FieldLabel(
            label: 'Timezone',
            child: TextField(
              onChanged: onTimezoneChanged,
              controller: TextEditingController(text: timezone)
                ..selection = TextSelection.collapsed(offset: timezone.length),
              decoration: const InputDecoration(hintText: 'America/New_York'),
            ),
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(
                child: _FieldLabel(
                  label: 'Work starts',
                  child: TextField(
                    onChanged: onWorkStartChanged,
                    controller: TextEditingController(text: workStart)
                      ..selection = TextSelection.collapsed(offset: workStart.length),
                    decoration: const InputDecoration(hintText: '09:00'),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _FieldLabel(
                  label: 'Work ends',
                  child: TextField(
                    onChanged: onWorkEndChanged,
                    controller: TextEditingController(text: workEnd)
                      ..selection = TextSelection.collapsed(offset: workEnd.length),
                    decoration: const InputDecoration(hintText: '17:30'),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          _ToggleTile(
            title: 'Keep voice transcripts',
            body:
                'Turn this on only if you want capture transcripts kept after extraction.',
            value: voiceRetention,
            onChanged: onVoiceRetentionChanged,
          ),
          const SizedBox(height: 18),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: busy ? null : onSave,
              child: Text(busy ? 'Saving…' : 'Save general settings'),
            ),
          ),
        ],
      ),
    );
  }
}

class _PhoneTab extends StatelessWidget {
  const _PhoneTab({
    required this.phoneDraft,
    required this.verificationCode,
    required this.smsEnabled,
    required this.settings,
    required this.sendingCode,
    required this.verifying,
    required this.saving,
    required this.onPhoneChanged,
    required this.onCodeChanged,
    required this.onSmsEnabledChanged,
    required this.onSendCode,
    required this.onVerify,
    required this.onSave,
  });

  final String phoneDraft;
  final String verificationCode;
  final bool smsEnabled;
  final AppSettings settings;
  final bool sendingCode;
  final bool verifying;
  final bool saving;
  final ValueChanged<String> onPhoneChanged;
  final ValueChanged<String> onCodeChanged;
  final ValueChanged<bool> onSmsEnabledChanged;
  final VoidCallback onSendCode;
  final VoidCallback onVerify;
  final VoidCallback onSave;

  @override
  Widget build(BuildContext context) {
    final verifiedDate = settings.phoneVerifiedAt != null
        ? DateFormat.yMMMd().format(settings.phoneVerifiedAt!)
        : null;

    return _PanelCard(
      title: 'Verify a number for SMS Pings',
      eyebrow: 'Phone',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: [
              _StatusChip(
                label: settings.phoneVerified ? 'Verified' : 'Not verified',
                highlighted: settings.phoneVerified,
              ),
              if (settings.reminderPhone != null)
                _StatusChip(label: settings.reminderPhone!, highlighted: false),
            ],
          ),
          const SizedBox(height: 16),
          _FieldLabel(
            label: 'Phone number',
            child: TextField(
              onChanged: onPhoneChanged,
              controller: TextEditingController(text: phoneDraft)
                ..selection = TextSelection.collapsed(offset: phoneDraft.length),
              decoration: const InputDecoration(hintText: '+15551234567'),
            ),
          ),
          const SizedBox(height: 12),
          Wrap(
            crossAxisAlignment: WrapCrossAlignment.center,
            spacing: 12,
            runSpacing: 8,
            children: [
              ElevatedButton(
                onPressed: sendingCode ? null : onSendCode,
                child: Text(sendingCode ? 'Sending…' : 'Send code'),
              ),
              if (settings.pendingPhone != null)
                Text(
                  'Pending: ${settings.pendingPhone}',
                  style: TextStyles.smallMedium,
                ),
            ],
          ),
          const SizedBox(height: 14),
          _FieldLabel(
            label: 'Verification code',
            child: TextField(
              onChanged: onCodeChanged,
              controller: TextEditingController(text: verificationCode)
                ..selection = TextSelection.collapsed(offset: verificationCode.length),
              decoration: const InputDecoration(hintText: '123456'),
            ),
          ),
          const SizedBox(height: 12),
          Wrap(
            crossAxisAlignment: WrapCrossAlignment.center,
            spacing: 12,
            runSpacing: 8,
            children: [
              OutlinedButton(
                onPressed: verifying ? null : onVerify,
                child: Text(verifying ? 'Checking…' : 'Verify phone'),
              ),
              if (verifiedDate != null)
                Text('Verified $verifiedDate', style: TextStyles.smallMedium),
            ],
          ),
          const SizedBox(height: 16),
          _ToggleTile(
            title: 'Use SMS for urgent Pings',
            body: 'SMS is optional and only works after your phone number is verified.',
            value: smsEnabled,
            onChanged: onSmsEnabledChanged,
          ),
          const SizedBox(height: 18),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: saving ? null : onSave,
              child: Text(saving ? 'Saving…' : 'Save phone settings'),
            ),
          ),
        ],
      ),
    );
  }
}

class _HandleTab extends StatelessWidget {
  const _HandleTab({
    required this.handle,
    required this.busy,
    required this.onChanged,
    required this.onSave,
  });

  final String handle;
  final bool busy;
  final ValueChanged<String> onChanged;
  final VoidCallback onSave;

  @override
  Widget build(BuildContext context) {
    return _PanelCard(
      title: 'Update your sharing handle',
      eyebrow: 'Handle',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _FieldLabel(
            label: 'Handle',
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 14,
                  ),
                  decoration: BoxDecoration(
                    color: const Color(0x121C2540),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Text('@', style: TextStyles.bodyMedium),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: TextField(
                    onChanged: onChanged,
                    controller: TextEditingController(text: handle)
                      ..selection = TextSelection.collapsed(offset: handle.length),
                    decoration: const InputDecoration(hintText: 'yourname'),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          Text(
            'Handles can use letters, numbers, and underscores.',
            style: TextStyles.small,
          ),
          const SizedBox(height: 18),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: busy ? null : onSave,
              child: Text(busy ? 'Saving…' : 'Save handle'),
            ),
          ),
        ],
      ),
    );
  }
}

class _PingsTab extends StatelessWidget {
  const _PingsTab({
    required this.preferences,
    required this.busy,
    required this.onToggle,
    required this.onSave,
  });

  final NotificationPreferences preferences;
  final bool busy;
  final void Function(String kind, String channel) onToggle;
  final VoidCallback onSave;

  @override
  Widget build(BuildContext context) {
    return _PanelCard(
      title: 'Choose how each kind reaches you',
      eyebrow: 'Pings',
      child: Column(
        children: [
          for (final kind in toatKinds) ...[
            Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0x121C2540),
                borderRadius: BorderRadius.circular(18),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(_kindLabels[kind] ?? kind, style: TextStyles.bodyMedium),
                  const SizedBox(height: 4),
                  Text(
                    'Push, email, and SMS preferences for ${(_kindLabels[kind] ?? kind).toLowerCase()}.',
                    style: TextStyles.small,
                  ),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 10,
                    runSpacing: 10,
                    children: [
                      _ChannelPill(
                        label: 'PUSH',
                        value: preferences[kind]?.push ?? false,
                        onTap: () => onToggle(kind, 'push'),
                      ),
                      _ChannelPill(
                        label: 'EMAIL',
                        value: preferences[kind]?.email ?? false,
                        onTap: () => onToggle(kind, 'email'),
                      ),
                      _ChannelPill(
                        label: 'SMS',
                        value: preferences[kind]?.sms ?? false,
                        onTap: () => onToggle(kind, 'sms'),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
          const SizedBox(height: 6),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: busy ? null : onSave,
              child: Text(busy ? 'Saving…' : 'Save Ping settings'),
            ),
          ),
        ],
      ),
    );
  }
}

class _PanelCard extends StatelessWidget {
  const _PanelCard({
    required this.title,
    required this.eyebrow,
    required this.child,
  });

  final String title;
  final String eyebrow;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.bgElevated,
        borderRadius: BorderRadius.circular(24),
        boxShadow: const [
          BoxShadow(
            color: Color(0x22000000),
            blurRadius: 24,
            offset: Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            eyebrow,
            style: TextStyles.label.copyWith(color: AppColors.primaryLight),
          ),
          const SizedBox(height: 8),
          Text(title, style: TextStyles.heading2),
          const SizedBox(height: 18),
          child,
        ],
      ),
    );
  }
}

class _FieldLabel extends StatelessWidget {
  const _FieldLabel({required this.label, required this.child});

  final String label;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: TextStyles.smallMedium),
        const SizedBox(height: 8),
        child,
      ],
    );
  }
}

class _ToggleTile extends StatelessWidget {
  const _ToggleTile({
    required this.title,
    required this.body,
    required this.value,
    required this.onChanged,
  });

  final String title;
  final String body;
  final bool value;
  final ValueChanged<bool> onChanged;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0x121C2540),
        borderRadius: BorderRadius.circular(18),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: TextStyles.bodyMedium),
                const SizedBox(height: 4),
                Text(body, style: TextStyles.small),
              ],
            ),
          ),
          Switch.adaptive(value: value, onChanged: onChanged),
        ],
      ),
    );
  }
}

class _StatusChip extends StatelessWidget {
  const _StatusChip({required this.label, required this.highlighted});

  final String label;
  final bool highlighted;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: highlighted ? const Color(0x2222C55E) : const Color(0x121C2540),
        borderRadius: BorderRadius.circular(18),
      ),
      child: Text(
        label,
        style: TextStyles.smallMedium.copyWith(
          color: highlighted ? AppColors.success : AppColors.textSecondary,
        ),
      ),
    );
  }
}

class _ChannelPill extends StatelessWidget {
  const _ChannelPill({
    required this.label,
    required this.value,
    required this.onTap,
  });

  final String label;
  final bool value;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: value ? const Color(0xFF1B1832) : const Color(0x121C2540),
          borderRadius: BorderRadius.circular(18),
          border: Border.all(
            color: value ? const Color(0x444F46E5) : AppColors.border,
          ),
        ),
        child: Text(
          label,
          style: TextStyles.smallMedium.copyWith(
            color: value ? AppColors.primaryLight : AppColors.textSecondary,
          ),
        ),
      ),
    );
  }
}

class _IconCircleButton extends StatelessWidget {
  const _IconCircleButton({required this.icon, required this.onTap});

  final IconData icon;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 44,
        height: 44,
        decoration: BoxDecoration(
          color: AppColors.bgElevated,
          shape: BoxShape.circle,
          border: Border.all(color: AppColors.border),
        ),
        child: Icon(icon, color: AppColors.text),
      ),
    );
  }
}