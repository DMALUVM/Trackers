import Foundation
import Capacitor
import LocalAuthentication

/// Native Face ID / Touch ID via LAContext.
/// Replaces WebAuthn which doesn't work in WKWebView.
@objc(BiometricPlugin)
public class BiometricPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "BiometricPlugin"
    public let jsName = "BiometricPlugin"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "isAvailable", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "authenticate", returnType: CAPPluginReturnPromise),
    ]

    /// Check if biometric auth is available and what type
    @objc func isAvailable(_ call: CAPPluginCall) {
        let context = LAContext()
        var error: NSError?
        let available = context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error)

        var biometryType = "none"
        if available {
            switch context.biometryType {
            case .faceID: biometryType = "faceID"
            case .touchID: biometryType = "touchID"
            case .opticID: biometryType = "opticID"
            default: biometryType = "unknown"
            }
        }

        call.resolve([
            "available": available,
            "biometryType": biometryType,
            "errorMessage": error?.localizedDescription ?? "",
        ])
    }

    /// Prompt Face ID / Touch ID
    @objc func authenticate(_ call: CAPPluginCall) {
        let reason = call.getString("reason") ?? "Unlock Routines365"
        let context = LAContext()

        context.evaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, localizedReason: reason) { success, error in
            if success {
                call.resolve(["success": true])
            } else {
                let errorMsg = error?.localizedDescription ?? "Authentication failed"
                call.resolve(["success": false, "error": errorMsg])
            }
        }
    }
}
