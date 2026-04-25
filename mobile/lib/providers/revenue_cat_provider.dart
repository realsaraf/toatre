import 'package:flutter/foundation.dart';

import 'package:toatre/services/revenue_cat_service.dart';

/// Provides RevenueCat Pro state and purchase flow to the widget tree.
class RevenueCatProvider extends ChangeNotifier {
  bool _isPro = false;
  bool _isLoading = false;
  String? _errorMessage;

  bool get isPro => _isPro;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  /// Called after RevenueCatService.init() — refreshes local state.
  Future<void> refresh() async {
    await RevenueCatService.instance.refresh();
    _isPro = RevenueCatService.instance.isPro;
    notifyListeners();
  }

  Future<bool> purchasePro() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final success = await RevenueCatService.instance.purchasePro();
      _isPro = success;
      if (!success) {
        _errorMessage = 'Purchase did not complete. Please try again.';
      }
      return success;
    } catch (e) {
      _errorMessage = 'Something went wrong. Please try again.';
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> restorePurchases() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final restored = await RevenueCatService.instance.restorePurchases();
      _isPro = restored;
      if (!restored) {
        _errorMessage = 'No Pro purchases found to restore.';
      }
      return restored;
    } catch (e) {
      _errorMessage = 'Restore failed. Please try again.';
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
