import Foundation
import Capacitor
import WidgetKit

/// Bridges app data to the iOS widget via shared UserDefaults (App Groups).
/// The widget reads from the same App Group container.
@objc(WidgetDataPlugin)
public class WidgetDataPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "WidgetDataPlugin"
    public let jsName = "WidgetDataPlugin"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "updateWidgetData", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "reloadWidget", returnType: CAPPluginReturnPromise),
    ]

    // IMPORTANT: This must match the App Group ID configured in Xcode
    private let appGroupID = "group.com.routines365.app"

    /// Update shared data that the widget reads.
    /// Params: streak (int), bestStreak (int), todayDone (int), todayTotal (int), greenToday (bool)
    @objc func updateWidgetData(_ call: CAPPluginCall) {
        guard let defaults = UserDefaults(suiteName: appGroupID) else {
            call.reject("Cannot access App Group container")
            return
        }

        let streak = call.getInt("streak") ?? 0
        let bestStreak = call.getInt("bestStreak") ?? 0
        let todayDone = call.getInt("todayDone") ?? 0
        let todayTotal = call.getInt("todayTotal") ?? 0
        let greenToday = call.getBool("greenToday") ?? false

        defaults.set(streak, forKey: "widget_streak")
        defaults.set(bestStreak, forKey: "widget_bestStreak")
        defaults.set(todayDone, forKey: "widget_todayDone")
        defaults.set(todayTotal, forKey: "widget_todayTotal")
        defaults.set(greenToday, forKey: "widget_greenToday")
        defaults.set(Date().timeIntervalSince1970, forKey: "widget_lastUpdate")
        defaults.synchronize()

        // Tell WidgetKit to refresh
        if #available(iOS 14.0, *) {
            WidgetCenter.shared.reloadAllTimelines()
        }

        call.resolve(["updated": true])
    }

    @objc func reloadWidget(_ call: CAPPluginCall) {
        if #available(iOS 14.0, *) {
            WidgetCenter.shared.reloadAllTimelines()
        }
        call.resolve(["reloaded": true])
    }
}
