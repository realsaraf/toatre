import 'dart:async';

import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';

import 'package:toatre/services/analytics_service.dart';
import 'package:toatre/services/auth_service.dart';

enum AuthStatus {
  unknown,
  unauthenticated,
  authenticating,
  needsHandle,
  authenticated,
  error,
}

class AuthProvider extends ChangeNotifier {
  AuthProvider() {
    _authSubscription = _authService.authStateChanges.listen(
      _onAuthStateChanged,
    );
    unawaited(hydrate());
  }

  final AuthService _authService = AuthService.instance;

  StreamSubscription<User?>? _authSubscription;
  AuthStatus _status = AuthStatus.unknown;
  User? _user;
  String? _errorMessage;
  String? _handle;

  AuthStatus get status => _status;
  User? get user => _user;
  String? get errorMessage => _errorMessage;
  String? get handle => _handle;
  bool get isAuthenticated => _status == AuthStatus.authenticated;
  bool get isBusy => _status == AuthStatus.authenticating;

  Stream<User?> get authStateChanges => _authService.authStateChanges;

  Future<void> hydrate() async {
    await _syncUser(_authService.currentUser);
  }

  Future<void> signInWithGoogle() async {
    _status = AuthStatus.authenticating;
    _errorMessage = null;
    notifyListeners();

    try {
      await _authService.signInWithGoogle();
      await AnalyticsService.logLogin(method: 'google');
    } on AuthServiceException catch (error) {
      _status = error.message.contains('cancelled')
          ? AuthStatus.unauthenticated
          : AuthStatus.error;
      _errorMessage = error.message;
      notifyListeners();
    } catch (_) {
      _status = AuthStatus.error;
      _errorMessage = 'Google sign-in failed. Try again.';
      notifyListeners();
    }
  }

  Future<void> signInWithApple() async {
    _status = AuthStatus.authenticating;
    _errorMessage = null;
    notifyListeners();

    try {
      await _authService.signInWithApple();
      await AnalyticsService.logLogin(method: 'apple');
    } on AuthServiceException catch (error) {
      _status = AuthStatus.error;
      _errorMessage = error.message;
      notifyListeners();
    } catch (_) {
      _status = AuthStatus.error;
      _errorMessage = 'Apple sign-in failed. Try again.';
      notifyListeners();
    }
  }

  Future<void> submitHandle(String rawHandle) async {
    _status = AuthStatus.authenticating;
    _errorMessage = null;
    notifyListeners();

    try {
      _handle = await _authService.saveHandle(rawHandle);
      _status = AuthStatus.authenticated;
      notifyListeners();

      final currentUser = _user;
      if (currentUser != null) {
        await AnalyticsService.identifyUser(
          uid: currentUser.uid,
          email: currentUser.email,
          handle: _handle,
        );
        await AnalyticsService.logSignUp(method: 'handle');
      }
    } on AuthServiceException catch (error) {
      _status = AuthStatus.needsHandle;
      _errorMessage = error.message;
      notifyListeners();
    } catch (_) {
      _status = AuthStatus.needsHandle;
      _errorMessage = 'Could not save that handle. Try another one.';
      notifyListeners();
    }
  }

  Future<void> signOut() async {
    await _authService.signOut();
    await AnalyticsService.resetUser();
  }

  Future<void> _onAuthStateChanged(User? user) async {
    await _syncUser(user);
  }

  Future<void> _syncUser(User? user) async {
    _user = user;

    if (user == null) {
      _status = AuthStatus.unauthenticated;
      _handle = null;
      _errorMessage = null;
      notifyListeners();
      return;
    }

    _status = AuthStatus.authenticating;
    _errorMessage = null;
    notifyListeners();

    try {
      final profile = await _authService.fetchProfile();
      _handle = profile.handle;
      _status = profile.hasHandle
          ? AuthStatus.authenticated
          : AuthStatus.needsHandle;
      await AnalyticsService.identifyUser(
        uid: user.uid,
        email: user.email,
        handle: _handle,
      );
    } on AuthServiceException catch (error) {
      _status = AuthStatus.error;
      _errorMessage = error.message;
    } catch (_) {
      _status = AuthStatus.error;
      _errorMessage = 'We could not restore your session.';
    }

    notifyListeners();
  }

  @override
  void dispose() {
    _authSubscription?.cancel();
    super.dispose();
  }
}
