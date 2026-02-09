import Foundation
import Capacitor
import StoreKit

/// Capacitor plugin for StoreKit 2 subscriptions.
/// Handles: product listing, purchasing, receipt validation, restore.
@objc(StoreKitPlugin)
public class StoreKitPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "StoreKitPlugin"
    public let jsName = "StoreKitPlugin"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "getProducts", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "purchase", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "restorePurchases", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getActiveSubscription", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getEntitlements", returnType: CAPPluginReturnPromise),
    ]

    // Product IDs — must match App Store Connect
    private let productIds: Set<String> = [
        "com.routines365.app.premium.monthly",
        "com.routines365.app.premium.yearly",
    ]

    private var products: [Product] = []
    private var transactionListener: Task<Void, Error>?

    override public func load() {
        // Listen for transaction updates (renewals, revocations, etc.)
        transactionListener = listenForTransactions()
        // Pre-fetch products
        Task {
            await loadProducts()
        }
    }

    deinit {
        transactionListener?.cancel()
    }

    // MARK: - Transaction Listener

    private func listenForTransactions() -> Task<Void, Error> {
        Task.detached {
            for await result in Transaction.updates {
                do {
                    let transaction = try self.checkVerified(result)
                    await transaction.finish()
                    // Notify web layer of status change
                    self.notifyListeners("subscriptionStatusChanged", data: [
                        "isPremium": await self.checkPremiumStatus()
                    ])
                } catch {
                    print("Transaction verification failed: \(error)")
                }
            }
        }
    }

    // MARK: - Load Products

    private func loadProducts() async {
        do {
            products = try await Product.products(for: productIds)
        } catch {
            print("Failed to load products: \(error)")
        }
    }

    // MARK: - Get Products

    @objc func getProducts(_ call: CAPPluginCall) {
        Task {
            if products.isEmpty {
                await loadProducts()
            }

            let data = products.map { product -> [String: Any] in
                var dict: [String: Any] = [
                    "id": product.id,
                    "displayName": product.displayName,
                    "description": product.description,
                    "price": product.price as NSDecimalNumber,
                    "displayPrice": product.displayPrice,
                    "type": product.type == .autoRenewable ? "subscription" : "other",
                ]

                if let sub = product.subscription {
                    dict["period"] = self.periodString(sub.subscriptionPeriod)
                    if let introOffer = sub.introductoryOffer {
                        dict["freeTrialDays"] = self.trialDays(introOffer)
                    }
                }

                return dict
            }.sorted { ($0["id"] as? String ?? "") < ($1["id"] as? String ?? "") }

            call.resolve(["products": data])
        }
    }

    // MARK: - Purchase

    @objc func purchase(_ call: CAPPluginCall) {
        guard let productId = call.getString("productId") else {
            call.reject("Missing productId")
            return
        }

        Task {
            if products.isEmpty {
                await loadProducts()
            }

            guard let product = products.first(where: { $0.id == productId }) else {
                call.reject("Product not found: \(productId)")
                return
            }

            do {
                let result = try await product.purchase()

                switch result {
                case .success(let verification):
                    let transaction = try checkVerified(verification)
                    await transaction.finish()

                    call.resolve([
                        "success": true,
                        "transactionId": String(transaction.id),
                        "productId": transaction.productID,
                        "isPremium": true,
                    ])

                case .userCancelled:
                    call.resolve(["success": false, "cancelled": true])

                case .pending:
                    call.resolve(["success": false, "pending": true])

                @unknown default:
                    call.resolve(["success": false])
                }
            } catch {
                call.reject("Purchase failed: \(error.localizedDescription)")
            }
        }
    }

    // MARK: - Restore Purchases

    @objc func restorePurchases(_ call: CAPPluginCall) {
        Task {
            do {
                try await AppStore.sync()
                let isPremium = await checkPremiumStatus()
                call.resolve(["isPremium": isPremium, "restored": isPremium])
            } catch {
                call.reject("Restore failed: \(error.localizedDescription)")
            }
        }
    }

    // MARK: - Get Active Subscription

    @objc func getActiveSubscription(_ call: CAPPluginCall) {
        Task {
            let isPremium = await checkPremiumStatus()
            var activeSub: [String: Any]? = nil

            for await result in Transaction.currentEntitlements {
                do {
                    let transaction = try checkVerified(result)
                    if productIds.contains(transaction.productID) {
                        activeSub = [
                            "productId": transaction.productID,
                            "expiresDate": transaction.expirationDate?.timeIntervalSince1970 ?? 0,
                            "isTrialPeriod": transaction.offerType == .introductory,
                        ]
                        break
                    }
                } catch { continue }
            }

            call.resolve([
                "isPremium": isPremium,
                "subscription": activeSub as Any,
            ])
        }
    }

    // MARK: - Get Entitlements (all active)

    @objc func getEntitlements(_ call: CAPPluginCall) {
        Task {
            var entitlements: [[String: Any]] = []

            for await result in Transaction.currentEntitlements {
                do {
                    let transaction = try checkVerified(result)
                    entitlements.append([
                        "productId": transaction.productID,
                        "purchaseDate": transaction.purchaseDate.timeIntervalSince1970,
                        "expiresDate": transaction.expirationDate?.timeIntervalSince1970 as Any,
                        "isTrialPeriod": transaction.offerType == .introductory,
                    ])
                } catch { continue }
            }

            call.resolve(["entitlements": entitlements, "isPremium": !entitlements.isEmpty])
        }
    }

    // MARK: - Helpers

    private func checkPremiumStatus() async -> Bool {
        for await result in Transaction.currentEntitlements {
            do {
                let transaction = try checkVerified(result)
                if productIds.contains(transaction.productID) {
                    return true
                }
            } catch { continue }
        }
        return false
    }

    private func checkVerified<T>(_ result: VerificationResult<T>) throws -> T {
        switch result {
        case .unverified(_, let error):
            throw error
        case .verified(let safe):
            return safe
        }
    }

    private func periodString(_ period: Product.SubscriptionPeriod) -> String {
        switch period.unit {
        case .day: return "\(period.value) day\(period.value == 1 ? "" : "s")"
        case .week: return "\(period.value) week\(period.value == 1 ? "" : "s")"
        case .month: return "\(period.value) month\(period.value == 1 ? "" : "s")"
        case .year: return "\(period.value) year\(period.value == 1 ? "" : "s")"
        @unknown default: return "unknown"
        }
    }

    private func trialDays(_ offer: Product.SubscriptionOffer) -> Int {
        let period = offer.period
        switch period.unit {
        case .day: return period.value
        case .week: return period.value * 7
        case .month: return period.value * 30
        case .year: return period.value * 365
        @unknown default: return 0
        }
    }
}
