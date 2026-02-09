import UIKit
import Capacitor
import AVFoundation

@UIApplicationMain
class AppDelegate: CAPAppDelegate {

    override func application(_ application: UIApplication,
                              didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Configure audio session for breathwork and focus sounds
        // .playback category ensures audio works even when the ringer/silent switch is off
        // .mixWithOthers lets it coexist with background music
        do {
            let session = AVAudioSession.sharedInstance()
            try session.setCategory(.playback, mode: .default, options: [.mixWithOthers])
            try session.setActive(true)
        } catch {
            print("Audio session setup failed: \(error)")
        }

        return super.application(application, didFinishLaunchingWithOptions: launchOptions)
    }

    // Clear badge count whenever app becomes active
    override func applicationDidBecomeActive(_ application: UIApplication) {
        super.applicationDidBecomeActive(application)
        application.applicationIconBadgeNumber = 0
    }
}
