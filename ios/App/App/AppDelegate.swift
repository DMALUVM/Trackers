import UIKit
import AVFoundation
import UserNotifications

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

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

        return true
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
