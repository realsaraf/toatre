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

/// Profile returned by `GET /api/auth/me`.
///
/// Pure Bearer-token auth — same pattern as Mutqin. The mobile app never
/// posts an `idToken` to a `/session` endpoint; every request just sends
/// `Authorization: Bearer <fresh-id-token>` and the server verifies it.
class UserProfile {
  const UserProfile({
    required this.uid,
    required this.email,
    required this.handle,
    required this.displayName,
    required this.photoUrl,
  });

  final String uid;
  final String? email;
  final String? handle;
  final String? displayName;
  final String? photoUrl;

  bool get hasHandle => (handle ?? '').isNotEmpty;

  factory UserProfile.fromJson(Map<String, dynamic> json) => UserProfile(
    uid: json['uid'] as String,
    email: json['email'] as String?,
    handle: json['handle'] as String?,
    displayName: json['displayName'] as String?,
    photoUrl: json['photoUrl'] as String?,
  );
}

class AuthService {
  AuthService._();

  static final AuthService instance = AuthService._();

  final FirebaseAuth _auth = FirebaseAuth.instance;
  final ApiService _api = ApiService.instance;
  final GoogleSignIn _googleSignIn = GoogleSignIn(scopes: ['email', 'profile']);

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

  /// Fetch the current user's profile (and discover handle status) using
  /// the same Bearer-token flow every other authenticated call uses.
  Future<UserProfile> fetchProfile() async {
    // ignore: avoid_print
    print('[fetchProfile] calling GET /api/auth/me');
    try {
      final response = await _api.getJson('/api/auth/me', authenticated: true);
      // ignore: avoid_print
      print('[fetchProfile] OK handle=${response['handle']}');
      return UserProfile.fromJson(response);
    } on ApiServiceException catch (e) {
      // ignore: avoid_print
      print('[fetchProfile] FAILED status=${e.statusCode} msg=${e.message}');
      rethrow;
    } catch (e) {
      // ignore: avoid_print
      print('[fetchProfile] FAILED: $e');
      rethrow;
    }
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
