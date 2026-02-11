import Foundation
import Capacitor
import UserNotifications

/// Capacitor plugin for scheduling local notifications.
/// Used for daily habit reminders. No server needed.
@objc(LocalNotifyPlugin)
public class LocalNotifyPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "LocalNotifyPlugin"
    public let jsName = "LocalNotifyPlugin"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "requestPermission", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getPermissionStatus", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "scheduleDailyReminder", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "cancelReminder", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "cancelAll", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "clearBadge", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "listPending", returnType: CAPPluginReturnPromise),
    ]

    // MARK: - Permission

    @objc func requestPermission(_ call: CAPPluginCall) {
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) { granted, error in
            if let error = error {
                call.reject("Permission request failed: \(error.localizedDescription)")
            } else {
                call.resolve(["granted": granted])
            }
        }
    }

    @objc func getPermissionStatus(_ call: CAPPluginCall) {
        UNUserNotificationCenter.current().getNotificationSettings { settings in
            let status: String
            switch settings.authorizationStatus {
            case .authorized: status = "granted"
            case .denied: status = "denied"
            case .provisional: status = "provisional"
            case .notDetermined: status = "prompt"
            default: status = "unknown"
            }
            call.resolve(["status": status])
        }
    }

    // MARK: - Schedule

    /// Schedule a daily repeating reminder.
    /// Params: id (string), title (string), body (string), hour (int), minute (int), weekdays (array of 1-7)
    @objc func scheduleDailyReminder(_ call: CAPPluginCall) {
        guard let id = call.getString("id"),
              let title = call.getString("title"),
              let body = call.getString("body"),
              let hour = call.getInt("hour"),
              let minute = call.getInt("minute") else {
            call.reject("Missing required parameters: id, title, body, hour, minute")
            return
        }

        // Optional: specific weekdays (ISO: 1=Mon..7=Sun). If nil, fires every day.
        let weekdaysRaw = call.getArray("weekdays", Int.self)

        let content = UNMutableNotificationContent()
        content.title = title
        content.body = body
        content.sound = .default
        content.badge = 1

        let center = UNUserNotificationCenter.current()

        if let weekdays = weekdaysRaw, !weekdays.isEmpty {
            // Schedule one trigger per weekday — use DispatchGroup to wait for all
            let group = DispatchGroup()
            var firstError: Error? = nil
            let errorLock = NSLock()

            for isoDay in weekdays {
                // Convert ISO (1=Mon..7=Sun) to Apple (1=Sun..7=Sat)
                let appleDay = isoDay == 7 ? 1 : isoDay + 1

                var dateComponents = DateComponents()
                dateComponents.hour = hour
                dateComponents.minute = minute
                dateComponents.weekday = appleDay

                let trigger = UNCalendarNotificationTrigger(dateMatching: dateComponents, repeats: true)
                let request = UNNotificationRequest(identifier: "\(id)_day\(isoDay)", content: content, trigger: trigger)

                group.enter()
                center.add(request) { error in
                    if let error = error {
                        errorLock.lock()
                        if firstError == nil { firstError = error }
                        errorLock.unlock()
                    }
                    group.leave()
                }
            }

            group.notify(queue: .main) {
                if let error = firstError {
                    call.reject("Failed to schedule: \(error.localizedDescription)")
                } else {
                    call.resolve(["scheduled": true])
                }
            }
        } else {
            // Every day at this time — resolve/reject inside the completion handler
            var dateComponents = DateComponents()
            dateComponents.hour = hour
            dateComponents.minute = minute

            let trigger = UNCalendarNotificationTrigger(dateMatching: dateComponents, repeats: true)
            let request = UNNotificationRequest(identifier: id, content: content, trigger: trigger)
            center.add(request) { error in
                if let error = error {
                    call.reject("Failed to schedule: \(error.localizedDescription)")
                } else {
                    call.resolve(["scheduled": true])
                }
            }
        }
    }

    // MARK: - Cancel

    @objc func cancelReminder(_ call: CAPPluginCall) {
        guard let id = call.getString("id") else {
            call.reject("Missing id")
            return
        }

        let center = UNUserNotificationCenter.current()
        let ids = [id] + (1...7).map { "\(id)_day\($0)" }
        center.removePendingNotificationRequests(withIdentifiers: ids)
        call.resolve(["cancelled": true])
    }

    @objc func cancelAll(_ call: CAPPluginCall) {
        UNUserNotificationCenter.current().removeAllPendingNotificationRequests()
        UNUserNotificationCenter.current().removeAllDeliveredNotifications()
        if #available(iOS 16.0, *) {
            UNUserNotificationCenter.current().setBadgeCount(0) { _ in }
        } else {
            DispatchQueue.main.async {
                UIApplication.shared.applicationIconBadgeNumber = 0
            }
        }
        call.resolve(["cancelled": true])
    }

    @objc func clearBadge(_ call: CAPPluginCall) {
        UNUserNotificationCenter.current().removeAllDeliveredNotifications()
        if #available(iOS 16.0, *) {
            UNUserNotificationCenter.current().setBadgeCount(0) { error in
                if let error = error {
                    call.reject("Failed to clear badge: \(error.localizedDescription)")
                } else {
                    call.resolve(["cleared": true])
                }
            }
        } else {
            DispatchQueue.main.async {
                UIApplication.shared.applicationIconBadgeNumber = 0
                call.resolve(["cleared": true])
            }
        }
    }

    // MARK: - List

    @objc func listPending(_ call: CAPPluginCall) {
        UNUserNotificationCenter.current().getPendingNotificationRequests { requests in
            let list = requests.map { req -> [String: Any] in
                var dict: [String: Any] = [
                    "id": req.identifier,
                    "title": req.content.title,
                    "body": req.content.body,
                ]
                if let trigger = req.trigger as? UNCalendarNotificationTrigger {
                    dict["hour"] = trigger.dateComponents.hour ?? -1
                    dict["minute"] = trigger.dateComponents.minute ?? -1
                    dict["weekday"] = trigger.dateComponents.weekday ?? -1
                }
                return dict
            }
            call.resolve(["notifications": list])
        }
    }
}
