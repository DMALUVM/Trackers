import UIKit
import Capacitor
import AVFoundation
import UserNotifications

@UIApplicationMain
class AppDelegate: CAPAppDelegate {

    override func application(_ application: UIApplication,
                              didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Configure audio session for breathwork and focus sounds
        do {
            let session = AVAudioSession.sharedInstance()
            try session.setCategory(.playback, mode: .default, options: [.mixWithOthers])
            try session.setActive(true)
        } catch {
            print("Audio session setup failed: \(error)")
        }

        return super.application(application, didFinishLaunchingWithOptions: launchOptions)
    }

    // Clear badge + delivered notifications whenever app becomes active
    override func applicationDidBecomeActive(_ application: UIApplication) {
        super.applicationDidBecomeActive(application)

        // Clear badge — use modern API on iOS 16+, legacy fallback otherwise
        if #available(iOS 16.0, *) {
            UNUserNotificationCenter.current().setBadgeCount(0) { error in
                if let error = error {
                    print("Failed to clear badge: \(error)")
                }
            }
        } else {
            application.applicationIconBadgeNumber = 0
        }

        // Also remove delivered notifications from Notification Center
        UNUserNotificationCenter.current().removeAllDeliveredNotifications()
    }
}
