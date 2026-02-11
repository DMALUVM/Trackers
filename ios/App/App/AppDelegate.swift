import UIKit
import AVFoundation
import UserNotifications

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate, UNUserNotificationCenterDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication,
                     didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Configure audio session for breathwork and focus sounds
        do {
            let session = AVAudioSession.sharedInstance()
            try session.setCategory(.playback, mode: .default, options: [.mixWithOthers])
            try session.setActive(true)
        } catch {
            print("Audio session setup failed: \(error)")
        }

        // Register as notification delegate so notifications show in foreground
        UNUserNotificationCenter.current().delegate = self

        return true
    }

    // Show notifications even when app is in the foreground
    func userNotificationCenter(_ center: UNUserNotificationCenter,
                                willPresent notification: UNNotification,
                                withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        // Show banner, play sound, and update badge even while app is open
        if #available(iOS 14.0, *) {
            completionHandler([.banner, .sound, .badge])
        } else {
            completionHandler([.alert, .sound, .badge])
        }
    }

    // Handle notification tap — user tapped a delivered notification
    func userNotificationCenter(_ center: UNUserNotificationCenter,
                                didReceive response: UNNotificationResponse,
                                withCompletionHandler completionHandler: @escaping () -> Void) {
        // Just open the app — the web view handles navigation
        completionHandler()
    }

    // Clear badge + delivered notifications whenever app becomes active
    func applicationDidBecomeActive(_ application: UIApplication) {
        if #available(iOS 16.0, *) {
            UNUserNotificationCenter.current().setBadgeCount(0) { error in
                if let error = error {
                    print("Failed to clear badge: \(error)")
                }
            }
        } else {
            application.applicationIconBadgeNumber = 0
        }
        UNUserNotificationCenter.current().removeAllDeliveredNotifications()
    }
}
