import 'package:firebase_auth/firebase_auth.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:sign_in_with_apple/sign_in_with_apple.dart';

import 'package:toatre/services/api_service.dart';

class AuthServiceException implements Exception {
  const AuthServiceException(this.message);

  final String message;

  @override
  String toString() => message;
}

class AuthSessionResult {
  const AuthSessionResult({required this.hasHandle});

  final bool hasHandle;
}

class AuthService {
  AuthService._();

  static final AuthService instance = AuthService._();

  final FirebaseAuth _auth = FirebaseAuth.instance;
  final ApiService _api = ApiService.instance;
  final GoogleSignIn _googleSignIn = GoogleSignIn(scopes: ['email']);

  Stream<User?> get authStateChanges => _auth.authStateChanges();
  User? get currentUser => _auth.currentUser;

  Future<void> signInWithGoogle() async {
    final googleUser = await _googleSignIn.signIn();
    if (googleUser == null) {
      throw const AuthServiceException('Google sign-in was cancelled.');
    }

    final googleAuth = await googleUser.authentication;
    final credential = GoogleAuthProvider.credential(
      accessToken: googleAuth.accessToken,
      idToken: googleAuth.idToken,
    );

    await _auth.signInWithCredential(credential);
  }

  Future<void> signInWithApple() async {
    final credential = await SignInWithApple.getAppleIDCredential(
      scopes: [
        AppleIDAuthorizationScopes.email,
        AppleIDAuthorizationScopes.fullName,
      ],
    );

    final identityToken = credential.identityToken;
    final authorizationCode = credential.authorizationCode;

    if (identityToken == null || identityToken.isEmpty) {
      throw const AuthServiceException('Apple sign-in did not return a token.');
    }

    final oauthCredential = OAuthProvider(
      'apple.com',
    ).credential(idToken: identityToken, accessToken: authorizationCode);

    await _auth.signInWithCredential(oauthCredential);
  }

  Future<AuthSessionResult> syncSession() async {
    final user = _auth.currentUser;
    final idToken = await user?.getIdToken();

    if (idToken == null || idToken.isEmpty) {
      throw const AuthServiceException('Missing auth token.');
    }

    final response = await _api.postJson(
      '/api/auth/session',
      body: {'idToken': idToken},
    );

    return AuthSessionResult(hasHandle: response['hasHandle'] == true);
  }

  Future<String> saveHandle(String handle) async {
    final normalized = handle.trim().toLowerCase().replaceFirst('@', '');
    if (normalized.isEmpty) {
      throw const AuthServiceException('Handle cannot be empty.');
    }

    final response = await _api.postJson(
      '/api/auth/profile',
      body: {'handle': normalized},
      authenticated: true,
    );

    return response['handle'] as String? ?? normalized;
  }

  Future<void> signOut() async {
    await _auth.signOut();
    await _googleSignIn.signOut();
  }
}
