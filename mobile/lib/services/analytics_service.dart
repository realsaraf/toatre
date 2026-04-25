import 'package:firebase_analytics/firebase_analytics.dart';
import 'package:mixpanel_flutter/mixpanel_flutter.dart';

/// Unified analytics wrapper — fires to both Firebase Analytics and Mixpanel.
///
/// Call [AnalyticsService.init] from main() before runApp.
/// All event methods are static and safe to call before init (no-op if not ready).
class AnalyticsService {
  AnalyticsService._();

  static FirebaseAnalytics? _fa;
  static Mixpanel? _mp;

  static Future<void> init({required String mixpanelToken}) async {
    _fa = FirebaseAnalytics.instance;
    _mp = await Mixpanel.init(
      mixpanelToken,
      trackAutomaticEvents: true,
    );
  }

  // ─── Identity ──────────────────────────────────────────────────────────────

  static Future<void> identifyUser({
    required String uid,
    String? email,
    String? handle,
  }) async {
    await _fa?.setUserId(id: uid);
    _mp?.identify(uid);
    if (email != null) _mp?.getPeople().set('\$email', email);
    if (handle != null) _mp?.getPeople().set('handle', handle);
  }

  static Future<void> resetUser() async {
    await _fa?.setUserId(id: null);
    _mp?.reset();
  }

  // ─── Auth events ──────────────────────────────────────────────────────────

  static Future<void> logLogin({required String method}) async {
    await _fa?.logLogin(loginMethod: method);
    _mp?.track('Login', properties: {'method': method});
  }

  static Future<void> logSignUp({required String method}) async {
    await _fa?.logSignUp(signUpMethod: method);
    _mp?.track('Sign Up', properties: {'method': method});
  }

  // ─── Capture / Toat events ────────────────────────────────────────────────

  static Future<void> logVoiceCaptureStarted() async {
    await _fa?.logEvent(name: 'voice_capture_started');
    _mp?.track('Voice Capture Started');
  }

  static Future<void> logVoiceCaptureStopped({required int durationMs}) async {
    await _fa?.logEvent(
      name: 'voice_capture_stopped',
      parameters: {'duration_ms': durationMs},
    );
    _mp?.track('Voice Capture Stopped', properties: {'duration_ms': durationMs});
  }

  static Future<void> logToatCreated({
    required String kind,
    required String tier,
    required bool fromVoice,
  }) async {
    await _fa?.logEvent(
      name: 'toat_created',
      parameters: {'kind': kind, 'tier': tier, 'from_voice': fromVoice ? 1 : 0},
    );
    _mp?.track('Toat Created', properties: {
      'kind': kind,
      'tier': tier,
      'from_voice': fromVoice,
    });
  }

  static Future<void> logToatCompleted({required String kind}) async {
    await _fa?.logEvent(name: 'toat_completed', parameters: {'kind': kind});
    _mp?.track('Toat Completed', properties: {'kind': kind});
  }

  static Future<void> logToatDeleted({required String kind}) async {
    await _fa?.logEvent(name: 'toat_deleted', parameters: {'kind': kind});
    _mp?.track('Toat Deleted', properties: {'kind': kind});
  }

  // ─── Ping events ──────────────────────────────────────────────────────────

  static Future<void> logPingFired({required String channel}) async {
    await _fa?.logEvent(name: 'ping_fired', parameters: {'channel': channel});
    _mp?.track('Ping Fired', properties: {'channel': channel});
  }

  static Future<void> logPingTapped() async {
    await _fa?.logEvent(name: 'ping_tapped');
    _mp?.track('Ping Tapped');
  }

  // ─── Timeline events ──────────────────────────────────────────────────────

  static Future<void> logTimelineViewed() async {
    await _fa?.logScreenView(screenName: 'timeline');
    _mp?.track('Timeline Viewed');
  }

  // ─── Paywall / RevenueCat events ──────────────────────────────────────────

  static Future<void> logPaywallShown({required String reason}) async {
    await _fa?.logEvent(name: 'paywall_shown', parameters: {'reason': reason});
    _mp?.track('Paywall Shown', properties: {'reason': reason});
  }

  static Future<void> logProPurchaseStarted() async {
    await _fa?.logEvent(name: 'pro_purchase_started');
    _mp?.track('Pro Purchase Started');
  }

  static Future<void> logProPurchaseCompleted() async {
    await _fa?.logEvent(name: 'pro_purchase_completed');
    _mp?.track('Pro Purchase Completed');
  }

  static Future<void> logProPurchaseFailed({required String reason}) async {
    await _fa?.logEvent(
      name: 'pro_purchase_failed',
      parameters: {'reason': reason},
    );
    _mp?.track('Pro Purchase Failed', properties: {'reason': reason});
  }
}
