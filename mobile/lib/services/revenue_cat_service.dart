import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:purchases_flutter/purchases_flutter.dart';

import 'package:toatre/services/analytics_service.dart';

const _kEntitlementPro = 'pro';

/// Thin wrapper around RevenueCat.
///
/// Call [RevenueCatService.init] from main() after Firebase is ready.
/// Provides [isPro] getter and [purchasePro] method.
class RevenueCatService {
  RevenueCatService._();
  static final instance = RevenueCatService._();

  CustomerInfo? _customerInfo;

  bool get isPro {
    final entitlement = _customerInfo?.entitlements.active[_kEntitlementPro];
    return entitlement?.isActive ?? false;
  }

  Future<void> init({required String apiKey, String? userId}) async {
    await Purchases.setLogLevel(
      kDebugMode ? LogLevel.debug : LogLevel.error,
    );

    final config = PurchasesConfiguration(apiKey);
    await Purchases.configure(config);

    if (userId != null) {
      await Purchases.logIn(userId);
    }

    _customerInfo = await Purchases.getCustomerInfo();

    // Keep customer info fresh
    Purchases.addCustomerInfoUpdateListener((info) {
      _customerInfo = info;
    });
  }

  Future<void> loginUser(String userId) async {
    final result = await Purchases.logIn(userId);
    _customerInfo = result.customerInfo;
  }

  Future<void> logoutUser() async {
    await Purchases.logOut();
    _customerInfo = null;
  }

  Future<CustomerInfo?> refresh() async {
    _customerInfo = await Purchases.getCustomerInfo();
    return _customerInfo;
  }

  Future<bool> purchasePro() async {
    try {
      AnalyticsService.logProPurchaseStarted();
      final offerings = await Purchases.getOfferings();
      final proPackage = offerings.current?.availablePackages.firstWhere(
        (p) => p.identifier.contains('pro') || p.packageType == PackageType.monthly,
        orElse: () => offerings.current!.availablePackages.first,
      );

      if (proPackage == null) return false;

      final result = await Purchases.purchasePackage(proPackage);
      _customerInfo = result;

      final purchased = result.entitlements.active.containsKey(_kEntitlementPro);
      if (purchased) {
        AnalyticsService.logProPurchaseCompleted();
      }
      return purchased;
    } on PurchasesErrorCode catch (e) {
      if (e != PurchasesErrorCode.purchaseCancelledError) {
        AnalyticsService.logProPurchaseFailed(reason: e.toString());
      }
      return false;
    } catch (e) {
      AnalyticsService.logProPurchaseFailed(reason: e.toString());
      return false;
    }
  }

  Future<bool> restorePurchases() async {
    final info = await Purchases.restorePurchases();
    _customerInfo = info;
    return info.entitlements.active.containsKey(_kEntitlementPro);
  }
}
