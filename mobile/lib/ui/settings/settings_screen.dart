import 'dart:io';

import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import 'package:toatre/models/connection.dart';
import 'package:toatre/models/user_settings.dart';
import 'package:toatre/providers/auth_provider.dart';
import 'package:toatre/providers/settings_provider.dart';
import 'package:toatre/providers/share_provider.dart';
import 'package:toatre/services/api_service.dart';
import 'package:toatre/ui/auth/login_screen.dart';
import 'package:toatre/utils/app_colors.dart';
import 'package:toatre/utils/text_styles.dart';

enum SettingsTab { general, connections, pings, sync, toatlink }

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
  String _defaultTier = 'regular';
  bool _signingOut = false;
  String _handleDraft = '';
  String _phoneDraft = '';
  String _verificationCode = '';
  bool _smsEnabled = false;
  NotificationPreferences _notificationPreferences =
      createDefaultNotificationPreferences();
  SyncConnections _syncConnections = <String, SyncConnection>{};
  SyncDirection _googleCalendarDirection = SyncDirection.sourceToToatre;
  SyncDirection _microsoftDirection = SyncDirection.sourceToToatre;
  SyncDirection _calendlyDirection = SyncDirection.sourceToToatre;
  SyncDirection _zoomDirection = SyncDirection.sourceToToatre;
  String? _editingConnectionId;
  String _connectionName = '';
  String _connectionRelationship = '';
  String _connectionPhone = '';
  String _connectionEmail = '';
  String _connectionHandle = '';
  String _connectionNotes = '';

  bool _bookingEnabled = false;
  List<int> _bookingWindowDays = <int>[1, 2, 3, 4, 5];
  String _bookingWindowStart = '09:00';
  String _bookingWindowEnd = '17:00';
  int _bookingSlotLength = 30;
  int _bookingBuffer = 0;
  int _bookingAdvance = 60;
  int _bookingMaxDays = 14;
  bool _loadingBooking = false;
  bool _savingBooking = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<SettingsProvider>().loadSettings();
      context.read<ShareProvider>().loadConnections();
    });
  }

  @override
  Widget build(BuildContext context) {
    final settingsProvider = context.watch<SettingsProvider>();
    final shareProvider = context.watch<ShareProvider>();
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
                  Expanded(child: Text('Settings', style: TextStyles.heading2)),
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
                          payload?.profile.displayName ??
                          auth.user?.displayName,
                      email: payload?.profile.email ?? auth.user?.email,
                      handle: payload?.profile.handle,
                      signingOut: _signingOut,
                      onSignOut: () => _signOut(context),
                    ),
                    const SizedBox(height: 16),
                    SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: SettingsTab.values
                            .where((tab) => tab != SettingsTab.sync)
                            .map((tab) {
                              return Padding(
                                padding: const EdgeInsets.only(right: 10),
                                child: _TabButton(
                                  label: _tabLabel(tab),
                                  active: _activeTab == tab,
                                  onTap: () {
                                    setState(() => _activeTab = tab);
                                    if (tab == SettingsTab.toatlink &&
                                        !_loadingBooking) {
                                      _loadBookingSettings();
                                    }
                                  },
                                ),
                              );
                            })
                            .toList(),
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
                    ] else if (settingsProvider.error != null &&
                        payload == null) ...[
                      const SizedBox(height: 24),
                      _ErrorCard(
                        message: settingsProvider.error!,
                        onRetry: settingsProvider.loadSettings,
                      ),
                    ] else if (payload != null) ...[
                      const SizedBox(height: 16),
                      if (_activeTab == SettingsTab.general)
                        Column(
                          children: [
                            _GeneralTab(
                              timezone: _timezone,
                              workStart: _workStart,
                              workEnd: _workEnd,
                              voiceRetention: _voiceRetention,
                              defaultTier: _defaultTier,
                              busy: settingsProvider.savingKey == 'general',
                              onTimezoneChanged: (value) =>
                                  setState(() => _timezone = value),
                              onWorkStartChanged: (value) =>
                                  setState(() => _workStart = value),
                              onWorkEndChanged: (value) =>
                                  setState(() => _workEnd = value),
                              onVoiceRetentionChanged: (value) =>
                                  setState(() => _voiceRetention = value),
                              onDefaultTierChanged: (value) =>
                                  setState(() => _defaultTier = value),
                              onSave: () => _saveGeneral(settingsProvider),
                            ),
                            const SizedBox(height: 16),
                            _HandleTab(
                              handle: _handleDraft,
                              busy: settingsProvider.savingKey == 'handle',
                              onChanged: (value) =>
                                  setState(() => _handleDraft = value),
                              onSave: () => _saveHandle(settingsProvider),
                            ),
                            const SizedBox(height: 16),
                            _PhoneTab(
                              phoneDraft: _phoneDraft,
                              verificationCode: _verificationCode,
                              smsEnabled: _smsEnabled,
                              settings: payload.settings,
                              sendingCode:
                                  settingsProvider.savingKey == 'phone-start',
                              verifying:
                                  settingsProvider.savingKey == 'phone-check',
                              saving:
                                  settingsProvider.savingKey == 'phone-save',
                              onPhoneChanged: (value) =>
                                  setState(() => _phoneDraft = value),
                              onCodeChanged: (value) =>
                                  setState(() => _verificationCode = value),
                              onSmsEnabledChanged: (value) =>
                                  setState(() => _smsEnabled = value),
                              onSendCode: () =>
                                  _sendPhoneCode(settingsProvider),
                              onVerify: () => _verifyPhone(settingsProvider),
                              onSave: () => _savePhone(settingsProvider),
                            ),
                            const SizedBox(height: 16),
                            _DangerZoneCard(
                              onDeleteAccount: () =>
                                  _deleteAccount(context, settingsProvider),
                            ),
                          ],
                        ),
                      if (_activeTab == SettingsTab.pings)
                        _PingsTab(
                          preferences: _notificationPreferences,
                          busy: settingsProvider.savingKey == 'pings',
                          onToggle: _toggleChannel,
                          onSave: () => _savePings(settingsProvider),
                        ),
                      if (_activeTab == SettingsTab.connections)
                        _ConnectionsTab(
                          connections: shareProvider.connections,
                          loading: shareProvider.loading,
                          busy: shareProvider.saving,
                          editingId: _editingConnectionId,
                          name: _connectionName,
                          relationship: _connectionRelationship,
                          phone: _connectionPhone,
                          email: _connectionEmail,
                          handle: _connectionHandle,
                          notes: _connectionNotes,
                          onNameChanged: (value) =>
                              setState(() => _connectionName = value),
                          onRelationshipChanged: (value) =>
                              setState(() => _connectionRelationship = value),
                          onPhoneChanged: (value) =>
                              setState(() => _connectionPhone = value),
                          onEmailChanged: (value) =>
                              setState(() => _connectionEmail = value),
                          onHandleChanged: (value) =>
                              setState(() => _connectionHandle = value),
                          onNotesChanged: (value) =>
                              setState(() => _connectionNotes = value),
                          onEdit: _editConnection,
                          onDelete: (id) =>
                              _deleteConnection(shareProvider, id),
                          onCancel: _resetConnectionDraft,
                          onSave: () => _saveConnection(shareProvider),
                        ),
                      if (_activeTab == SettingsTab.sync)
                        _SyncTab(
                          googleConnection:
                              _syncConnections[googleCalendarProviderKey],
                          googleDirection: _googleCalendarDirection,
                          microsoftConnection: _syncConnections['microsoft'],
                          microsoftDirection: _microsoftDirection,
                          calendlyConnection: _syncConnections['calendly'],
                          calendlyDirection: _calendlyDirection,
                          zoomConnection: _syncConnections['zoom'],
                          zoomDirection: _zoomDirection,
                          savingKey: settingsProvider.savingKey,
                          showIosCalendar: Platform.isIOS,
                          onGoogleDirectionChanged: (direction) => setState(
                            () => _googleCalendarDirection = direction,
                          ),
                          onMicrosoftDirectionChanged: (direction) =>
                              setState(() => _microsoftDirection = direction),
                          onCalendlyDirectionChanged: (direction) =>
                              setState(() => _calendlyDirection = direction),
                          onZoomDirectionChanged: (direction) =>
                              setState(() => _zoomDirection = direction),
                          onConnectGoogle: () =>
                              _connectGoogleCalendar(settingsProvider),
                          onDisconnectGoogle: () =>
                              _disconnectGoogleCalendar(settingsProvider),
                          onSyncGoogle: () =>
                              _syncGoogleCalendarNow(settingsProvider),
                          onConnectMicrosoft: () =>
                              _connectMicrosoft(settingsProvider),
                          onDisconnectMicrosoft: () =>
                              _disconnectMicrosoft(settingsProvider),
                          onSyncMicrosoft: () =>
                              _syncMicrosoftNow(settingsProvider),
                          onConnectCalendly: () =>
                              _connectCalendly(settingsProvider),
                          onDisconnectCalendly: () =>
                              _disconnectCalendly(settingsProvider),
                          onSyncCalendly: () =>
                              _syncCalendlyNow(settingsProvider),
                          onConnectZoom: () => _connectZoom(settingsProvider),
                          onDisconnectZoom: () =>
                              _disconnectZoom(settingsProvider),
                          onSyncZoom: () => _syncZoomNow(settingsProvider),
                        ),
                      if (_activeTab == SettingsTab.toatlink)
                        _ToatLinkTab(
                          handle: payload.profile.handle,
                          enabled: _bookingEnabled,
                          windowDays: _bookingWindowDays,
                          windowStart: _bookingWindowStart,
                          windowEnd: _bookingWindowEnd,
                          slotLength: _bookingSlotLength,
                          buffer: _bookingBuffer,
                          advance: _bookingAdvance,
                          maxDays: _bookingMaxDays,
                          loading: _loadingBooking,
                          saving: _savingBooking,
                          onEnabledChanged: (v) =>
                              setState(() => _bookingEnabled = v),
                          onWindowDaysChanged: (v) =>
                              setState(() => _bookingWindowDays = v),
                          onWindowStartChanged: (v) =>
                              setState(() => _bookingWindowStart = v),
                          onWindowEndChanged: (v) =>
                              setState(() => _bookingWindowEnd = v),
                          onSlotLengthChanged: (v) =>
                              setState(() => _bookingSlotLength = v),
                          onBufferChanged: (v) =>
                              setState(() => _bookingBuffer = v),
                          onAdvanceChanged: (v) =>
                              setState(() => _bookingAdvance = v),
                          onMaxDaysChanged: (v) =>
                              setState(() => _bookingMaxDays = v),
                          onSave: _saveBookingSettings,
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
    _defaultTier = payload.settings.defaultTier;
    _handleDraft = payload.profile.handle ?? '';
    _phoneDraft =
        payload.settings.pendingPhone ?? payload.settings.reminderPhone ?? '';
    _verificationCode = '';
    _smsEnabled = payload.settings.smsEnabled;
    _notificationPreferences = <String, NotificationChannels>{
      for (final entry in payload.settings.notificationPreferences.entries)
        entry.key: entry.value.copyWith(),
    };
    _syncConnections = <String, SyncConnection>{
      for (final entry in payload.settings.syncConnections.entries)
        entry.key: entry.value,
    };
    _googleCalendarDirection =
        _syncConnections[googleCalendarProviderKey]?.direction ??
        SyncDirection.sourceToToatre;
    _microsoftDirection =
        _syncConnections['microsoft']?.direction ??
        SyncDirection.sourceToToatre;
    _calendlyDirection =
        _syncConnections['calendly']?.direction ?? SyncDirection.sourceToToatre;
    _zoomDirection =
        _syncConnections['zoom']?.direction ?? SyncDirection.sourceToToatre;
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
        defaultTier: _defaultTier,
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

  Future<void> _connectGoogleCalendar(SettingsProvider provider) async {
    try {
      await provider.connectGoogleCalendar(direction: _googleCalendarDirection);
      _showNotice(
        'Finish Google Calendar approval in the browser.',
        _NoticeTone.success,
      );
    } catch (_) {
      _showNotice(
        provider.error ?? 'Could not connect Google Calendar sync.',
        _NoticeTone.error,
      );
    }
  }

  Future<void> _disconnectGoogleCalendar(SettingsProvider provider) async {
    try {
      await provider.disconnectGoogleCalendar();
      _showNotice('Google Calendar sync paused.', _NoticeTone.success);
    } catch (_) {
      _showNotice(
        provider.error ?? 'Could not pause Google Calendar sync.',
        _NoticeTone.error,
      );
    }
  }

  Future<void> _syncGoogleCalendarNow(SettingsProvider provider) async {
    try {
      await provider.syncGoogleCalendarNow();
      _showNotice('Google Calendar sync finished.', _NoticeTone.success);
    } catch (_) {
      _showNotice(
        provider.error ?? 'Could not sync Google Calendar.',
        _NoticeTone.error,
      );
    }
  }

  Future<void> _connectMicrosoft(SettingsProvider provider) async {
    try {
      await provider.connectMicrosoftCalendar(direction: _microsoftDirection);
      _showNotice(
        'Finish Microsoft approval in the browser.',
        _NoticeTone.success,
      );
    } catch (_) {
      _showNotice(
        provider.error ?? 'Could not connect Microsoft Calendar sync.',
        _NoticeTone.error,
      );
    }
  }

  Future<void> _disconnectMicrosoft(SettingsProvider provider) async {
    try {
      await provider.disconnectMicrosoftCalendar();
      _showNotice('Microsoft Calendar sync paused.', _NoticeTone.success);
    } catch (_) {
      _showNotice(
        provider.error ?? 'Could not pause Microsoft Calendar sync.',
        _NoticeTone.error,
      );
    }
  }

  Future<void> _syncMicrosoftNow(SettingsProvider provider) async {
    try {
      await provider.syncMicrosoftNow();
      _showNotice('Microsoft Calendar sync finished.', _NoticeTone.success);
    } catch (_) {
      _showNotice(
        provider.error ?? 'Could not sync Microsoft Calendar.',
        _NoticeTone.error,
      );
    }
  }

  Future<void> _connectCalendly(SettingsProvider provider) async {
    try {
      await provider.connectCalendly(direction: _calendlyDirection);
      _showNotice(
        'Finish Calendly approval in the browser.',
        _NoticeTone.success,
      );
    } catch (_) {
      _showNotice(
        provider.error ?? 'Could not connect Calendly sync.',
        _NoticeTone.error,
      );
    }
  }

  Future<void> _disconnectCalendly(SettingsProvider provider) async {
    try {
      await provider.disconnectCalendly();
      _showNotice('Calendly sync paused.', _NoticeTone.success);
    } catch (_) {
      _showNotice(
        provider.error ?? 'Could not pause Calendly sync.',
        _NoticeTone.error,
      );
    }
  }

  Future<void> _syncCalendlyNow(SettingsProvider provider) async {
    try {
      await provider.syncCalendlyNow();
      _showNotice('Calendly sync finished.', _NoticeTone.success);
    } catch (_) {
      _showNotice(
        provider.error ?? 'Could not sync Calendly.',
        _NoticeTone.error,
      );
    }
  }

  Future<void> _connectZoom(SettingsProvider provider) async {
    try {
      await provider.connectZoom(direction: _zoomDirection);
      _showNotice('Finish Zoom approval in the browser.', _NoticeTone.success);
    } catch (_) {
      _showNotice(
        provider.error ?? 'Could not connect Zoom sync.',
        _NoticeTone.error,
      );
    }
  }

  Future<void> _disconnectZoom(SettingsProvider provider) async {
    try {
      await provider.disconnectZoom();
      _showNotice('Zoom sync paused.', _NoticeTone.success);
    } catch (_) {
      _showNotice(
        provider.error ?? 'Could not pause Zoom sync.',
        _NoticeTone.error,
      );
    }
  }

  Future<void> _syncZoomNow(SettingsProvider provider) async {
    try {
      await provider.syncZoomNow();
      _showNotice('Zoom sync finished.', _NoticeTone.success);
    } catch (_) {
      _showNotice(provider.error ?? 'Could not sync Zoom.', _NoticeTone.error);
    }
  }

  Future<void> _signOut(BuildContext context) async {
    if (_signingOut) {
      return;
    }

    setState(() => _signingOut = true);
    await context.read<AuthProvider>().signOut();
    if (!context.mounted) return;
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute<void>(builder: (_) => const LoginScreen()),
      (_) => false,
    );
  }

  Future<void> _deleteAccount(
    BuildContext context,
    SettingsProvider provider,
  ) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        backgroundColor: const Color(0xFF1C1F2E),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text(
          'Delete your account?',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700),
        ),
        content: const Text(
          'This permanently deletes all your toats, pings, and account data. '
          'There is no undo.',
          style: TextStyle(color: Color(0xFF94A3B8)),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(true),
            child: const Text(
              'Delete account',
              style: TextStyle(color: Color(0xFFEF4444)),
            ),
          ),
        ],
      ),
    );

    if (confirmed != true || !context.mounted) return;

    try {
      await provider.deleteAccount();
      if (!context.mounted) return;
      await context.read<AuthProvider>().signOut();
      if (!context.mounted) return;
      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute<void>(builder: (_) => const LoginScreen()),
        (_) => false,
      );
    } catch (_) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            provider.error ?? 'Could not delete your account. Try again.',
          ),
        ),
      );
    }
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
      case SettingsTab.connections:
        return 'Connections';
      case SettingsTab.pings:
        return 'Pings';
      case SettingsTab.toatlink:
        return 'Toat Link';
      case SettingsTab.sync:
        return 'Sync';
    }
  }

  Future<void> _loadBookingSettings() async {
    if (!mounted) return;
    setState(() => _loadingBooking = true);
    try {
      final data = await ApiService.instance.getJson(
        '/api/booking/settings',
        authenticated: true,
      );
      if (!mounted) return;
      setState(() {
        _bookingEnabled = data['enabled'] == true;
        _bookingWindowDays =
            (data['windowDays'] as List<dynamic>?)
                ?.map((e) => (e as num).toInt())
                .toList() ??
            <int>[1, 2, 3, 4, 5];
        _bookingWindowStart = (data['windowStart'] as String?) ?? '09:00';
        _bookingWindowEnd = (data['windowEnd'] as String?) ?? '17:00';
        _bookingSlotLength = (data['slotLength'] as num?)?.toInt() ?? 30;
        _bookingBuffer = (data['bufferMinutes'] as num?)?.toInt() ?? 0;
        _bookingAdvance = (data['advanceNoticeMinutes'] as num?)?.toInt() ?? 60;
        _bookingMaxDays = (data['maxDaysAhead'] as num?)?.toInt() ?? 14;
      });
    } catch (_) {
      // best effort
    } finally {
      if (mounted) setState(() => _loadingBooking = false);
    }
  }

  Future<void> _saveBookingSettings() async {
    if (!mounted) return;
    setState(() => _savingBooking = true);
    try {
      await ApiService.instance.patchJson(
        '/api/booking/settings',
        authenticated: true,
        body: <String, Object?>{
          'enabled': _bookingEnabled,
          'windowDays': _bookingWindowDays,
          'windowStart': _bookingWindowStart,
          'windowEnd': _bookingWindowEnd,
          'slotLength': _bookingSlotLength,
          'bufferMinutes': _bookingBuffer,
          'advanceNoticeMinutes': _bookingAdvance,
          'maxDaysAhead': _bookingMaxDays,
        },
      );
      if (!mounted) return;
      setState(() {
        _notice = 'Toat Link settings saved.';
        _noticeTone = _NoticeTone.success;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _notice = 'Could not save Toat Link settings.';
        _noticeTone = _NoticeTone.error;
      });
    } finally {
      if (mounted) setState(() => _savingBooking = false);
    }
  }

  void _editConnection(ToatreConnection connection) {
    setState(() {
      _editingConnectionId = connection.id;
      _connectionName = connection.name;
      _connectionRelationship = connection.relationship;
      _connectionPhone = connection.phone ?? '';
      _connectionEmail = connection.email ?? '';
      _connectionHandle = connection.handle ?? '';
      _connectionNotes = connection.notes ?? '';
    });
  }

  void _resetConnectionDraft() {
    setState(() {
      _editingConnectionId = null;
      _connectionName = '';
      _connectionRelationship = '';
      _connectionPhone = '';
      _connectionEmail = '';
      _connectionHandle = '';
      _connectionNotes = '';
    });
  }

  Future<void> _saveConnection(ShareProvider provider) async {
    try {
      await provider.saveConnection(
        id: _editingConnectionId,
        name: _connectionName,
        relationship: _connectionRelationship,
        phone: _connectionPhone,
        email: _connectionEmail,
        handle: _connectionHandle,
        notes: _connectionNotes,
      );
      _resetConnectionDraft();
      _showNotice('Connection saved.', _NoticeTone.success);
    } catch (_) {
      _showNotice(
        provider.error ?? 'Could not save that connection.',
        _NoticeTone.error,
      );
    }
  }

  Future<void> _deleteConnection(ShareProvider provider, String id) async {
    try {
      await provider.deleteConnection(id);
      if (_editingConnectionId == id) {
        _resetConnectionDraft();
      }
      _showNotice('Connection removed.', _NoticeTone.success);
    } catch (_) {
      _showNotice(
        provider.error ?? 'Could not remove that connection.',
        _NoticeTone.error,
      );
    }
  }
}

class _HeroCard extends StatelessWidget {
  const _HeroCard({
    required this.displayName,
    required this.email,
    required this.handle,
    required this.signingOut,
    required this.onSignOut,
  });

  final String? displayName;
  final String? email;
  final String? handle;
  final bool signingOut;
  final VoidCallback onSignOut;

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
          Text(displayName ?? 'Your profile', style: TextStyles.heading1),
          const SizedBox(height: 8),
          Text(
            [
              if (handle != null && handle!.isNotEmpty) '@$handle',
              if (email != null && email!.isNotEmpty) email,
            ].join(' · '),
            style: TextStyles.body.copyWith(color: AppColors.textSecondary),
          ),
          const SizedBox(height: 12),
          Text(
            'Manage your profile, phone Pings, handle, and privacy in one place.',
            style: TextStyles.smallMedium,
          ),
          const SizedBox(height: 18),
          GestureDetector(
            onTap: signingOut ? null : onSignOut,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              decoration: BoxDecoration(
                color: const Color(0xFFFFF1F2),
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: const Color(0x33EF4444)),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (signingOut)
                    const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  else
                    const Icon(
                      Icons.logout_rounded,
                      size: 20,
                      color: AppColors.error,
                    ),
                  const SizedBox(width: 10),
                  Text(
                    signingOut ? 'Signing out…' : 'Sign out',
                    style: TextStyles.bodyMedium.copyWith(
                      color: AppColors.error,
                    ),
                  ),
                ],
              ),
            ),
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
          color: active ? AppColors.softPurple : AppColors.bgElevated,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: active ? const Color(0x335B3DF5) : AppColors.border,
          ),
        ),
        child: Text(
          label,
          style: TextStyles.smallMedium.copyWith(
            color: active ? AppColors.primary : AppColors.textSecondary,
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
          ElevatedButton(onPressed: onRetry, child: const Text('Try again')),
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
    required this.defaultTier,
    required this.busy,
    required this.onTimezoneChanged,
    required this.onWorkStartChanged,
    required this.onWorkEndChanged,
    required this.onVoiceRetentionChanged,
    required this.onDefaultTierChanged,
    required this.onSave,
  });

  final String timezone;
  final String workStart;
  final String workEnd;
  final bool voiceRetention;
  final String defaultTier;
  final bool busy;
  final ValueChanged<String> onTimezoneChanged;
  final ValueChanged<String> onWorkStartChanged;
  final ValueChanged<String> onWorkEndChanged;
  final ValueChanged<bool> onVoiceRetentionChanged;
  final ValueChanged<String> onDefaultTierChanged;
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
                      ..selection = TextSelection.collapsed(
                        offset: workStart.length,
                      ),
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
                      ..selection = TextSelection.collapsed(
                        offset: workEnd.length,
                      ),
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
          const SizedBox(height: 14),
          _FieldLabel(
            label: 'Default tier',
            child: Row(
              children: [
                for (final t in ['urgent', 'important', 'regular'])
                  Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: GestureDetector(
                      onTap: () => onDefaultTierChanged(t),
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 14,
                          vertical: 9,
                        ),
                        decoration: BoxDecoration(
                          color: defaultTier == t
                              ? AppColors.primary.withValues(alpha: 0.15)
                              : AppColors.bgElevated,
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(
                            color: defaultTier == t
                                ? AppColors.primary
                                : Colors.transparent,
                          ),
                        ),
                        child: Text(
                          t[0].toUpperCase() + t.substring(1),
                          style: TextStyles.small.copyWith(
                            color: defaultTier == t
                                ? AppColors.primary
                                : AppColors.text,
                            fontWeight: defaultTier == t
                                ? FontWeight.w700
                                : FontWeight.normal,
                          ),
                        ),
                      ),
                    ),
                  ),
              ],
            ),
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
              controller: TextEditingController(
                text: phoneDraft,
              )..selection = TextSelection.collapsed(offset: phoneDraft.length),
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
                ..selection = TextSelection.collapsed(
                  offset: verificationCode.length,
                ),
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
            body:
                'SMS is optional and only works after your phone number is verified.',
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
                    color: AppColors.bgElevated,
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Text('@', style: TextStyles.bodyMedium),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: TextField(
                    onChanged: onChanged,
                    controller: TextEditingController(text: handle)
                      ..selection = TextSelection.collapsed(
                        offset: handle.length,
                      ),
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

class _ConnectionsTab extends StatelessWidget {
  const _ConnectionsTab({
    required this.connections,
    required this.loading,
    required this.busy,
    required this.editingId,
    required this.name,
    required this.relationship,
    required this.phone,
    required this.email,
    required this.handle,
    required this.notes,
    required this.onNameChanged,
    required this.onRelationshipChanged,
    required this.onPhoneChanged,
    required this.onEmailChanged,
    required this.onHandleChanged,
    required this.onNotesChanged,
    required this.onEdit,
    required this.onDelete,
    required this.onCancel,
    required this.onSave,
  });

  final List<ToatreConnection> connections;
  final bool loading;
  final bool busy;
  final String? editingId;
  final String name;
  final String relationship;
  final String phone;
  final String email;
  final String handle;
  final String notes;
  final ValueChanged<String> onNameChanged;
  final ValueChanged<String> onRelationshipChanged;
  final ValueChanged<String> onPhoneChanged;
  final ValueChanged<String> onEmailChanged;
  final ValueChanged<String> onHandleChanged;
  final ValueChanged<String> onNotesChanged;
  final ValueChanged<ToatreConnection> onEdit;
  final ValueChanged<String> onDelete;
  final VoidCallback onCancel;
  final VoidCallback onSave;

  @override
  Widget build(BuildContext context) {
    return _PanelCard(
      title: 'People Toatre should know',
      eyebrow: 'Connections',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Connections power sharing and help capture understand phrases like “call mom” with the right name and phone number.',
            style: TextStyles.body.copyWith(color: AppColors.textSecondary),
          ),
          const SizedBox(height: 16),
          if (loading)
            const Center(child: CircularProgressIndicator())
          else if (connections.isEmpty)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.bgElevated,
                borderRadius: BorderRadius.circular(18),
              ),
              child: Text('No connections yet.', style: TextStyles.bodyMedium),
            )
          else
            for (final connection in connections) ...[
              _ConnectionTile(
                connection: connection,
                onEdit: () => onEdit(connection),
                onDelete: () => onDelete(connection.id),
              ),
              const SizedBox(height: 10),
            ],
          const SizedBox(height: 12),
          Text(
            editingId == null ? 'Add connection' : 'Update connection',
            style: TextStyles.heading3,
          ),
          const SizedBox(height: 14),
          _FieldLabel(
            label: 'Name',
            child: TextField(
              onChanged: onNameChanged,
              controller: TextEditingController(text: name)
                ..selection = TextSelection.collapsed(offset: name.length),
              decoration: const InputDecoration(hintText: 'Alex Carter'),
            ),
          ),
          const SizedBox(height: 12),
          _FieldLabel(
            label: 'Relationship',
            child: TextField(
              onChanged: onRelationshipChanged,
              controller: TextEditingController(text: relationship)
                ..selection = TextSelection.collapsed(
                  offset: relationship.length,
                ),
              decoration: const InputDecoration(hintText: 'mom'),
            ),
          ),
          const SizedBox(height: 12),
          _FieldLabel(
            label: 'Phone',
            child: TextField(
              onChanged: onPhoneChanged,
              controller: TextEditingController(text: phone)
                ..selection = TextSelection.collapsed(offset: phone.length),
              decoration: const InputDecoration(hintText: '+15551234567'),
              keyboardType: TextInputType.phone,
            ),
          ),
          const SizedBox(height: 12),
          _FieldLabel(
            label: 'Email',
            child: TextField(
              onChanged: onEmailChanged,
              controller: TextEditingController(text: email)
                ..selection = TextSelection.collapsed(offset: email.length),
              decoration: const InputDecoration(hintText: 'name@example.com'),
              keyboardType: TextInputType.emailAddress,
            ),
          ),
          const SizedBox(height: 12),
          _FieldLabel(
            label: 'Handle',
            child: TextField(
              onChanged: onHandleChanged,
              controller: TextEditingController(text: handle)
                ..selection = TextSelection.collapsed(offset: handle.length),
              decoration: const InputDecoration(hintText: 'handle'),
            ),
          ),
          const SizedBox(height: 12),
          _FieldLabel(
            label: 'Notes',
            child: TextField(
              onChanged: onNotesChanged,
              controller: TextEditingController(text: notes)
                ..selection = TextSelection.collapsed(offset: notes.length),
              decoration: const InputDecoration(
                hintText: 'Nickname or calling context',
              ),
            ),
          ),
          const SizedBox(height: 18),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: busy ? null : onSave,
              child: Text(
                busy
                    ? 'Saving…'
                    : editingId == null
                    ? 'Add connection'
                    : 'Save connection',
              ),
            ),
          ),
          if (editingId != null) ...[
            const SizedBox(height: 10),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton(
                onPressed: onCancel,
                child: const Text('Cancel edit'),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _ConnectionTile extends StatelessWidget {
  const _ConnectionTile({
    required this.connection,
    required this.onEdit,
    required this.onDelete,
  });

  final ToatreConnection connection;
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.bgElevated,
        borderRadius: BorderRadius.circular(18),
      ),
      child: Row(
        children: [
          CircleAvatar(
            backgroundColor: AppColors.primary,
            child: Text(
              connection.name.characters.take(2).toString().toUpperCase(),
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w800,
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(connection.name, style: TextStyles.bodyMedium),
                Text(
                  [
                    connection.relationship,
                    if (connection.phone != null) connection.phone!,
                  ].join(' · '),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyles.small,
                ),
              ],
            ),
          ),
          IconButton(onPressed: onEdit, icon: const Icon(Icons.edit_outlined)),
          IconButton(
            onPressed: onDelete,
            icon: const Icon(Icons.delete_outline),
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
                color: AppColors.bgElevated,
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

class _SyncTab extends StatelessWidget {
  const _SyncTab({
    required this.googleConnection,
    required this.googleDirection,
    required this.microsoftConnection,
    required this.microsoftDirection,
    required this.calendlyConnection,
    required this.calendlyDirection,
    required this.zoomConnection,
    required this.zoomDirection,
    required this.savingKey,
    required this.showIosCalendar,
    required this.onGoogleDirectionChanged,
    required this.onMicrosoftDirectionChanged,
    required this.onCalendlyDirectionChanged,
    required this.onZoomDirectionChanged,
    required this.onConnectGoogle,
    required this.onDisconnectGoogle,
    required this.onSyncGoogle,
    required this.onConnectMicrosoft,
    required this.onDisconnectMicrosoft,
    required this.onSyncMicrosoft,
    required this.onConnectCalendly,
    required this.onDisconnectCalendly,
    required this.onSyncCalendly,
    required this.onConnectZoom,
    required this.onDisconnectZoom,
    required this.onSyncZoom,
  });

  final SyncConnection? googleConnection;
  final SyncDirection googleDirection;
  final SyncConnection? microsoftConnection;
  final SyncDirection microsoftDirection;
  final SyncConnection? calendlyConnection;
  final SyncDirection calendlyDirection;
  final SyncConnection? zoomConnection;
  final SyncDirection zoomDirection;
  final String? savingKey;
  final bool showIosCalendar;
  final ValueChanged<SyncDirection> onGoogleDirectionChanged;
  final ValueChanged<SyncDirection> onMicrosoftDirectionChanged;
  final ValueChanged<SyncDirection> onCalendlyDirectionChanged;
  final ValueChanged<SyncDirection> onZoomDirectionChanged;
  final VoidCallback onConnectGoogle;
  final VoidCallback onDisconnectGoogle;
  final VoidCallback onSyncGoogle;
  final VoidCallback onConnectMicrosoft;
  final VoidCallback onDisconnectMicrosoft;
  final VoidCallback onSyncMicrosoft;
  final VoidCallback onConnectCalendly;
  final VoidCallback onDisconnectCalendly;
  final VoidCallback onSyncCalendly;
  final VoidCallback onConnectZoom;
  final VoidCallback onDisconnectZoom;
  final VoidCallback onSyncZoom;

  static const bool _kMicrosoftEnabled = bool.fromEnvironment(
    'SYNC_MICROSOFT_ENABLED',
    defaultValue: false,
  );
  static const bool _kCalendlyEnabled = bool.fromEnvironment(
    'SYNC_CALENDLY_ENABLED',
    defaultValue: false,
  );
  static const bool _kZoomEnabled = bool.fromEnvironment(
    'SYNC_ZOOM_ENABLED',
    defaultValue: false,
  );

  @override
  Widget build(BuildContext context) {
    return _PanelCard(
      title: 'Keep calendars moving with Toatre',
      eyebrow: 'Sync',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Connect services one at a time. Sync starts from the moment a service is connected, so older calendar entries stay where they are.',
            style: TextStyles.body.copyWith(color: AppColors.textSecondary),
          ),
          const SizedBox(height: 18),
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: [
              _SyncProviderButton(
                label: 'Google Calendar',
                iconLabel: 'G',
                active: true,
                connected: googleConnection?.connected == true,
              ),
              if (showIosCalendar)
                const _SyncProviderButton(
                  label: 'iOS Calendar',
                  icon: Icons.calendar_month_rounded,
                  active: false,
                  connected: false,
                ),
              if (_kMicrosoftEnabled)
                _SyncProviderButton(
                  label: 'Microsoft 365',
                  iconLabel: '⊞',
                  active: _kMicrosoftEnabled,
                  connected: microsoftConnection?.connected == true,
                ),
              if (_kCalendlyEnabled)
                _SyncProviderButton(
                  label: 'Calendly',
                  icon: Icons.event_available_rounded,
                  active: _kCalendlyEnabled,
                  connected: calendlyConnection?.connected == true,
                ),
              if (_kZoomEnabled)
                _SyncProviderButton(
                  label: 'Zoom',
                  iconLabel: 'Z',
                  active: _kZoomEnabled,
                  connected: zoomConnection?.connected == true,
                ),
            ],
          ),
          const SizedBox(height: 18),
          _GoogleCalendarSyncCard(
            connection: googleConnection,
            direction: googleDirection,
            busy: savingKey == 'sync-google',
            syncing: savingKey == 'sync-google-run',
            onDirectionChanged: onGoogleDirectionChanged,
            onConnect: onConnectGoogle,
            onDisconnect: onDisconnectGoogle,
            onSync: onSyncGoogle,
          ),
          if (_kMicrosoftEnabled) ...[
            const SizedBox(height: 16),
            _GenericSyncCard(
              title: 'Microsoft 365 Calendar',
              iconLabel: '⊞',
              iconColor: const Color(0xFF0078D7),
              connection: microsoftConnection,
              direction: microsoftDirection,
              busy: savingKey == 'sync-microsoft',
              syncing: savingKey == 'sync-microsoft-run',
              directions: const [
                (
                  id: SyncDirection.sourceToToatre,
                  title: 'Microsoft to Toatre',
                  body:
                      'New Microsoft 365 calendar entries become Toatre toats.',
                ),
                (
                  id: SyncDirection.toatreToSource,
                  title: 'Toatre to Microsoft',
                  body:
                      'New scheduled Toatre toats appear in your Microsoft 365 calendar.',
                ),
                (
                  id: SyncDirection.twoWay,
                  title: 'Two-way',
                  body: 'New items move both ways from now on.',
                ),
              ],
              connectLabel: 'Connect Microsoft 365',
              disconnectLabel: 'Pause Microsoft sync',
              connectingLabel: 'Opening Microsoft…',
              onDirectionChanged: onMicrosoftDirectionChanged,
              onConnect: onConnectMicrosoft,
              onDisconnect: onDisconnectMicrosoft,
              onSync: onSyncMicrosoft,
            ),
          ],
          if (_kCalendlyEnabled) ...[
            const SizedBox(height: 16),
            _GenericSyncCard(
              title: 'Calendly',
              icon: Icons.event_available_rounded,
              iconColor: const Color(0xFF006BFF),
              connection: calendlyConnection,
              direction: calendlyDirection,
              busy: savingKey == 'sync-calendly',
              syncing: savingKey == 'sync-calendly-run',
              directions: const [
                (
                  id: SyncDirection.sourceToToatre,
                  title: 'Calendly to Toatre',
                  body:
                      'New confirmed Calendly bookings appear as toats in your timeline.',
                ),
              ],
              connectLabel: 'Connect Calendly',
              disconnectLabel: 'Pause Calendly sync',
              connectingLabel: 'Opening Calendly…',
              onDirectionChanged: onCalendlyDirectionChanged,
              onConnect: onConnectCalendly,
              onDisconnect: onDisconnectCalendly,
              onSync: onSyncCalendly,
            ),
          ],
          if (_kZoomEnabled) ...[
            const SizedBox(height: 16),
            _GenericSyncCard(
              title: 'Zoom',
              iconLabel: 'Z',
              iconColor: const Color(0xFF2D8CFF),
              connection: zoomConnection,
              direction: zoomDirection,
              busy: savingKey == 'sync-zoom',
              syncing: savingKey == 'sync-zoom-run',
              directions: const [
                (
                  id: SyncDirection.sourceToToatre,
                  title: 'Zoom to Toatre',
                  body:
                      'Upcoming Zoom meetings appear as toats in your timeline.',
                ),
              ],
              connectLabel: 'Connect Zoom',
              disconnectLabel: 'Pause Zoom sync',
              connectingLabel: 'Opening Zoom…',
              onDirectionChanged: onZoomDirectionChanged,
              onConnect: onConnectZoom,
              onDisconnect: onDisconnectZoom,
              onSync: onSyncZoom,
            ),
          ],
        ],
      ),
    );
  }
}

class _SyncProviderButton extends StatelessWidget {
  const _SyncProviderButton({
    required this.label,
    required this.active,
    required this.connected,
    this.iconLabel,
    this.icon,
  });

  final String label;
  final String? iconLabel;
  final IconData? icon;
  final bool active;
  final bool connected;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: active ? AppColors.softPurple : AppColors.bgElevated,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: active ? const Color(0x335B3DF5) : AppColors.border,
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          _ProviderMark(iconLabel: iconLabel, icon: icon),
          const SizedBox(width: 8),
          Text(
            label,
            style: TextStyles.smallMedium.copyWith(
              color: active ? AppColors.primary : AppColors.textSecondary,
            ),
          ),
          if (connected) ...[
            const SizedBox(width: 8),
            const Icon(
              Icons.check_circle_rounded,
              size: 16,
              color: AppColors.success,
            ),
          ],
        ],
      ),
    );
  }
}

class _GoogleCalendarSyncCard extends StatelessWidget {
  const _GoogleCalendarSyncCard({
    required this.connection,
    required this.direction,
    required this.busy,
    required this.syncing,
    required this.onDirectionChanged,
    required this.onConnect,
    required this.onDisconnect,
    required this.onSync,
  });

  final SyncConnection? connection;
  final SyncDirection direction;
  final bool busy;
  final bool syncing;
  final ValueChanged<SyncDirection> onDirectionChanged;
  final VoidCallback onConnect;
  final VoidCallback onDisconnect;
  final VoidCallback onSync;

  @override
  Widget build(BuildContext context) {
    final connected = connection?.connected == true;

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppColors.bgElevated,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const _ProviderMark(iconLabel: 'G', large: true),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Google Calendar', style: TextStyles.heading3),
                    const SizedBox(height: 4),
                    Text(
                      connected
                          ? 'Connected ${_formatSyncDate(connection?.connectedAt)}'
                          : 'Choose a direction, then connect Google Calendar.',
                      style: TextStyles.small.copyWith(
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
              _StatusChip(
                label: connected ? 'Connected' : 'Ready',
                highlighted: connected,
              ),
            ],
          ),
          const SizedBox(height: 18),
          _DirectionDiagram(direction: direction),
          const SizedBox(height: 16),
          Column(
            children: [
              _DirectionOption(
                title: 'Google to Toatre',
                body: 'New Google Calendar entries become Toatre toats.',
                direction: SyncDirection.sourceToToatre,
                value: direction,
                onChanged: onDirectionChanged,
              ),
              const SizedBox(height: 10),
              _DirectionOption(
                title: 'Toatre to Google',
                body: 'New scheduled Toatre toats are sent to Google Calendar.',
                direction: SyncDirection.toatreToSource,
                value: direction,
                onChanged: onDirectionChanged,
              ),
              const SizedBox(height: 10),
              _DirectionOption(
                title: 'Two-way',
                body: 'New items move both ways from now on.',
                direction: SyncDirection.twoWay,
                value: direction,
                onChanged: onDirectionChanged,
              ),
            ],
          ),
          const SizedBox(height: 16),
          Text(
            'Marking a toat done will not hide the original Google Calendar entry.',
            style: TextStyles.small.copyWith(color: AppColors.textSecondary),
          ),
          if (connected && connection?.lastSyncedAt != null) ...[
            const SizedBox(height: 8),
            Text(
              'Last synced ${_formatSyncDate(connection?.lastSyncedAt)}',
              style: TextStyles.small.copyWith(color: AppColors.textSecondary),
            ),
          ],
          const SizedBox(height: 18),
          Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              ElevatedButton(
                onPressed: busy || syncing
                    ? null
                    : connected
                    ? onDisconnect
                    : onConnect,
                child: Text(
                  busy
                      ? 'Opening Google…'
                      : connected
                      ? 'Pause Google Calendar sync'
                      : 'Connect Google Calendar',
                ),
              ),
              if (connected) ...[
                const SizedBox(height: 10),
                OutlinedButton(
                  onPressed: busy || syncing ? null : onSync,
                  child: Text(syncing ? 'Syncing…' : 'Sync now'),
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }
}

class _DirectionDiagram extends StatelessWidget {
  const _DirectionDiagram({required this.direction});

  final SyncDirection direction;

  @override
  Widget build(BuildContext context) {
    final leftActive = direction != SyncDirection.toatreToSource;
    final rightActive = direction != SyncDirection.sourceToToatre;

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0x0F5B3DF5),
        borderRadius: BorderRadius.circular(18),
      ),
      child: Row(
        children: [
          const _ProviderMark(iconLabel: 'G', large: true),
          Expanded(
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.arrow_back_rounded,
                  color: rightActive ? AppColors.primary : AppColors.textMuted,
                ),
                Container(
                  width: 34,
                  height: 2,
                  margin: const EdgeInsets.symmetric(horizontal: 4),
                  color: AppColors.border,
                ),
                Icon(
                  Icons.arrow_forward_rounded,
                  color: leftActive ? AppColors.primary : AppColors.textMuted,
                ),
              ],
            ),
          ),
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              gradient: AppColors.brandGradient,
              borderRadius: BorderRadius.circular(16),
            ),
            child: const Icon(Icons.mic_rounded, color: Colors.white),
          ),
        ],
      ),
    );
  }
}

/// Generic sync card used for Microsoft, Calendly, and Zoom providers.
class _GenericSyncCard extends StatelessWidget {
  const _GenericSyncCard({
    required this.title,
    required this.connection,
    required this.direction,
    required this.busy,
    required this.syncing,
    required this.directions,
    required this.connectLabel,
    required this.disconnectLabel,
    required this.connectingLabel,
    required this.onDirectionChanged,
    required this.onConnect,
    required this.onDisconnect,
    required this.onSync,
    this.iconLabel,
    this.icon,
    this.iconColor,
  });

  final String title;
  final SyncConnection? connection;
  final SyncDirection direction;
  final bool busy;
  final bool syncing;
  final List<({SyncDirection id, String title, String body})> directions;
  final String connectLabel;
  final String disconnectLabel;
  final String connectingLabel;
  final ValueChanged<SyncDirection> onDirectionChanged;
  final VoidCallback onConnect;
  final VoidCallback onDisconnect;
  final VoidCallback onSync;
  final String? iconLabel;
  final IconData? icon;
  final Color? iconColor;

  @override
  Widget build(BuildContext context) {
    final connected = connection?.connected == true;

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppColors.bgElevated,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _ProviderMark(
                iconLabel: iconLabel,
                icon: icon,
                large: true,
                color: iconColor,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: TextStyles.heading3),
                    const SizedBox(height: 4),
                    Text(
                      connected
                          ? 'Connected ${_formatSyncDate(connection?.connectedAt)}'
                          : directions.first.body,
                      style: TextStyles.small.copyWith(
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
              _StatusChip(
                label: connected ? 'Connected' : 'Ready',
                highlighted: connected,
              ),
            ],
          ),
          if (directions.length > 1) ...[
            const SizedBox(height: 16),
            Column(
              children: [
                for (int i = 0; i < directions.length; i++) ...[
                  if (i > 0) const SizedBox(height: 10),
                  _DirectionOption(
                    title: directions[i].title,
                    body: directions[i].body,
                    direction: directions[i].id,
                    value: direction,
                    onChanged: onDirectionChanged,
                  ),
                ],
              ],
            ),
          ],
          if (connected && connection?.lastSyncedAt != null) ...[
            const SizedBox(height: 8),
            Text(
              'Last synced ${_formatSyncDate(connection?.lastSyncedAt)}',
              style: TextStyles.small.copyWith(color: AppColors.textSecondary),
            ),
          ],
          const SizedBox(height: 18),
          Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              ElevatedButton(
                onPressed: busy || syncing
                    ? null
                    : connected
                    ? onDisconnect
                    : onConnect,
                child: Text(
                  busy
                      ? connectingLabel
                      : connected
                      ? disconnectLabel
                      : connectLabel,
                ),
              ),
              if (connected) ...[
                const SizedBox(height: 10),
                OutlinedButton(
                  onPressed: busy || syncing ? null : onSync,
                  child: Text(syncing ? 'Syncing…' : 'Sync now'),
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }
}

class _DirectionOption extends StatelessWidget {
  const _DirectionOption({
    required this.title,
    required this.body,
    required this.direction,
    required this.value,
    required this.onChanged,
  });

  final String title;
  final String body;
  final SyncDirection direction;
  final SyncDirection value;
  final ValueChanged<SyncDirection> onChanged;

  @override
  Widget build(BuildContext context) {
    final selected = direction == value;

    return GestureDetector(
      onTap: () => onChanged(direction),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: selected ? AppColors.softPurple : AppColors.bg,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: selected ? const Color(0x335B3DF5) : AppColors.border,
          ),
        ),
        child: Row(
          children: [
            Icon(
              selected ? Icons.radio_button_checked : Icons.radio_button_off,
              color: selected ? AppColors.primary : AppColors.textMuted,
            ),
            const SizedBox(width: 12),
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
          ],
        ),
      ),
    );
  }
}

class _ProviderMark extends StatelessWidget {
  const _ProviderMark({
    this.iconLabel,
    this.icon,
    this.large = false,
    this.color,
  });

  final String? iconLabel;
  final IconData? icon;
  final bool large;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    final size = large ? 48.0 : 28.0;
    final iconColor = color ?? const Color(0xFF4285F4);
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(large ? 16 : 10),
        border: Border.all(color: AppColors.border),
      ),
      child: Center(
        child: iconLabel != null
            ? Text(
                iconLabel!,
                style: TextStyles.bodyMedium.copyWith(
                  color: iconColor,
                  fontSize: large ? 22 : 14,
                  fontWeight: FontWeight.w800,
                ),
              )
            : Icon(
                icon ?? Icons.sync_rounded,
                color: iconColor,
                size: large ? 24 : 16,
              ),
      ),
    );
  }
}

String _formatSyncDate(DateTime? value) {
  if (value == null) {
    return 'just now';
  }
  return DateFormat.MMMd().add_jm().format(value);
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
        color: AppColors.bgElevated,
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
        color: highlighted ? const Color(0x2222C55E) : AppColors.bgElevated,
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
          color: value ? AppColors.softPurple : AppColors.bgElevated,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(
            color: value ? const Color(0x335B3DF5) : AppColors.border,
          ),
        ),
        child: Text(
          label,
          style: TextStyles.smallMedium.copyWith(
            color: value ? AppColors.primary : AppColors.textSecondary,
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

class _DangerZoneCard extends StatelessWidget {
  const _DangerZoneCard({required this.onDeleteAccount});

  final VoidCallback onDeleteAccount;

  @override
  Widget build(BuildContext context) {
    return _PanelCard(
      title: 'Danger zone',
      eyebrow: 'Account',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Deleting your account permanently removes all toats, pings, and data. '
            'This cannot be undone.',
            style: TextStyles.small.copyWith(color: AppColors.textSecondary),
          ),
          const SizedBox(height: 16),
          GestureDetector(
            onTap: onDeleteAccount,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              decoration: BoxDecoration(
                color: const Color(0xFFFFF1F2),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: const Color(0x44EF4444)),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(
                    Icons.delete_forever_rounded,
                    size: 20,
                    color: AppColors.error,
                  ),
                  const SizedBox(width: 10),
                  Text(
                    'Delete my account',
                    style: TextStyles.bodyMedium.copyWith(
                      color: AppColors.error,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ToatLinkTab extends StatelessWidget {
  const _ToatLinkTab({
    required this.handle,
    required this.enabled,
    required this.windowDays,
    required this.windowStart,
    required this.windowEnd,
    required this.slotLength,
    required this.buffer,
    required this.advance,
    required this.maxDays,
    required this.loading,
    required this.saving,
    required this.onEnabledChanged,
    required this.onWindowDaysChanged,
    required this.onWindowStartChanged,
    required this.onWindowEndChanged,
    required this.onSlotLengthChanged,
    required this.onBufferChanged,
    required this.onAdvanceChanged,
    required this.onMaxDaysChanged,
    required this.onSave,
  });

  final String? handle;
  final bool enabled;
  final List<int> windowDays;
  final String windowStart;
  final String windowEnd;
  final int slotLength;
  final int buffer;
  final int advance;
  final int maxDays;
  final bool loading;
  final bool saving;
  final ValueChanged<bool> onEnabledChanged;
  final ValueChanged<List<int>> onWindowDaysChanged;
  final ValueChanged<String> onWindowStartChanged;
  final ValueChanged<String> onWindowEndChanged;
  final ValueChanged<int> onSlotLengthChanged;
  final ValueChanged<int> onBufferChanged;
  final ValueChanged<int> onAdvanceChanged;
  final ValueChanged<int> onMaxDaysChanged;
  final VoidCallback onSave;

  static const _days = <_DayOption>[
    _DayOption(n: 1, label: 'Mon'),
    _DayOption(n: 2, label: 'Tue'),
    _DayOption(n: 3, label: 'Wed'),
    _DayOption(n: 4, label: 'Thu'),
    _DayOption(n: 5, label: 'Fri'),
    _DayOption(n: 6, label: 'Sat'),
    _DayOption(n: 0, label: 'Sun'),
  ];

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.bgElevated,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Toat Link', style: TextStyles.heading3),
          const SizedBox(height: 4),
          Text(
            'Let others book time with you. Blocked slots hide your content.',
            style: TextStyles.small,
          ),
          if (handle != null) ...[
            const SizedBox(height: 14),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: AppColors.primary.withAlpha(20),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.primary.withAlpha(50)),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      'toatre.com/$handle',
                      style: TextStyles.smallMedium.copyWith(
                        color: AppColors.primary,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
          const SizedBox(height: 18),
          SwitchListTile(
            contentPadding: EdgeInsets.zero,
            title: Text('Enable Toat Link', style: TextStyles.bodyMedium),
            subtitle: Text(
              'Allow others to request meetings',
              style: TextStyles.small,
            ),
            value: enabled,
            onChanged: onEnabledChanged,
            activeColor: AppColors.primary,
          ),
          if (loading) ...[
            const SizedBox(height: 24),
            const Center(child: CircularProgressIndicator()),
          ] else if (enabled) ...[
            const SizedBox(height: 18),
            Text('Available days', style: TextStyles.label),
            const SizedBox(height: 10),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: _days.map((d) {
                final active = windowDays.contains(d.n);
                return GestureDetector(
                  onTap: () {
                    final updated = List<int>.from(windowDays);
                    if (active)
                      updated.remove(d.n);
                    else
                      updated
                        ..add(d.n)
                        ..sort();
                    onWindowDaysChanged(updated);
                  },
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 8,
                    ),
                    decoration: BoxDecoration(
                      color: active
                          ? AppColors.primary.withAlpha(30)
                          : AppColors.bg,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(
                        color: active
                            ? AppColors.primary.withAlpha(80)
                            : AppColors.border,
                        width: 1.5,
                      ),
                    ),
                    child: Text(
                      d.label,
                      style: TextStyles.smallMedium.copyWith(
                        color: active
                            ? AppColors.primary
                            : AppColors.textSecondary,
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
            const SizedBox(height: 18),
            Row(
              children: [
                Expanded(
                  child: _TimeField(
                    label: 'Window start',
                    value: windowStart,
                    onChanged: onWindowStartChanged,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _TimeField(
                    label: 'Window end',
                    value: windowEnd,
                    onChanged: onWindowEndChanged,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 18),
            Text('Slot length', style: TextStyles.label),
            const SizedBox(height: 10),
            Row(
              children: [
                _SlotLengthButton(
                  label: '30 min',
                  active: slotLength == 30,
                  onTap: () => onSlotLengthChanged(30),
                ),
                const SizedBox(width: 10),
                _SlotLengthButton(
                  label: '1 hour',
                  active: slotLength == 60,
                  onTap: () => onSlotLengthChanged(60),
                ),
              ],
            ),
            const SizedBox(height: 18),
            Row(
              children: [
                Expanded(
                  child: _NumberField(
                    label: 'Buffer (min)',
                    value: buffer,
                    onChanged: onBufferChanged,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _NumberField(
                    label: 'Min notice (min)',
                    value: advance,
                    onChanged: onAdvanceChanged,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),
            _NumberField(
              label: 'Max days ahead',
              value: maxDays,
              onChanged: onMaxDaysChanged,
            ),
          ],
          const SizedBox(height: 22),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: saving ? null : onSave,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: AppColors.textPrimary,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
              child: Text(
                saving ? 'Saving�' : 'Save Toat Link settings',
                style: TextStyles.bodyMedium,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _DayOption {
  const _DayOption({required this.n, required this.label});
  final int n;
  final String label;
}

class _SlotLengthButton extends StatelessWidget {
  const _SlotLengthButton({
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
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
        decoration: BoxDecoration(
          color: active ? AppColors.primary.withAlpha(30) : AppColors.bg,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: active ? AppColors.primary.withAlpha(80) : AppColors.border,
            width: 1.5,
          ),
        ),
        child: Text(
          label,
          style: TextStyles.smallMedium.copyWith(
            color: active ? AppColors.primary : AppColors.textSecondary,
          ),
        ),
      ),
    );
  }
}

class _TimeField extends StatelessWidget {
  const _TimeField({
    required this.label,
    required this.value,
    required this.onChanged,
  });
  final String label;
  final String value;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: TextStyles.label),
        const SizedBox(height: 6),
        GestureDetector(
          onTap: () async {
            final parts = value.split(':');
            final initialTime = TimeOfDay(
              hour: int.tryParse(parts[0]) ?? 9,
              minute: int.tryParse(parts.length > 1 ? parts[1] : '0') ?? 0,
            );
            final picked = await showTimePicker(
              context: context,
              initialTime: initialTime,
            );
            if (picked != null) {
              onChanged(
                '${picked.hour.toString().padLeft(2, '0')}:${picked.minute.toString().padLeft(2, '0')}',
              );
            }
          },
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 11),
            decoration: BoxDecoration(
              color: AppColors.bg,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: AppColors.border),
            ),
            child: Text(value, style: TextStyles.bodyMedium),
          ),
        ),
      ],
    );
  }
}

class _NumberField extends StatelessWidget {
  const _NumberField({
    required this.label,
    required this.value,
    required this.onChanged,
  });
  final String label;
  final int value;
  final ValueChanged<int> onChanged;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: TextStyles.label),
        const SizedBox(height: 6),
        TextFormField(
          initialValue: value.toString(),
          keyboardType: TextInputType.number,
          style: TextStyles.bodyMedium,
          decoration: InputDecoration(
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 12,
              vertical: 11,
            ),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: BorderSide(color: AppColors.border),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: BorderSide(color: AppColors.border),
            ),
            filled: true,
            fillColor: AppColors.bg,
          ),
          onChanged: (v) => onChanged(int.tryParse(v) ?? value),
        ),
      ],
    );
  }
}
