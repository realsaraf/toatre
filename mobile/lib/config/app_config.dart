class AppConfig {
  AppConfig._();

  static const String apiBaseUrl = String.fromEnvironment(
    'TOATRE_API_BASE_URL',
    defaultValue: 'https://toatre.com',
  );

  static Uri apiUri(String path, {Map<String, String>? queryParameters}) {
    final base = apiBaseUrl.endsWith('/')
        ? apiBaseUrl.substring(0, apiBaseUrl.length - 1)
        : apiBaseUrl;

    return Uri.parse('$base$path').replace(queryParameters: queryParameters);
  }
}
