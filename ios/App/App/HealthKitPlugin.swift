import Foundation
import Capacitor
import HealthKit

/// Capacitor plugin bridging Apple HealthKit to the web layer.
/// Drop this file into ios/App/App/ in your Xcode project.
@objc(HealthKitPlugin)
public class HealthKitPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "HealthKitPlugin"
    public let jsName = "HealthKitPlugin"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "requestAuthorization", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "isAuthorized", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getSteps", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getSleep", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getWorkouts", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getDaySummary", returnType: CAPPluginReturnPromise),
    ]

    private let store = HKHealthStore()
    private let dateFormatter: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        f.timeZone = .current
        return f
    }()
    private let isoFormatter = ISO8601DateFormatter()

    // Types we want to read
    private var readTypes: Set<HKObjectType> {
        let types: [HKObjectType?] = [
            HKQuantityType.quantityType(forIdentifier: .stepCount),
            HKQuantityType.quantityType(forIdentifier: .activeEnergyBurned),
            HKCategoryType.categoryType(forIdentifier: .sleepAnalysis),
            HKObjectType.workoutType(),
        ]
        return Set(types.compactMap { $0 })
    }

    // MARK: - Authorization

    @objc func requestAuthorization(_ call: CAPPluginCall) {
        guard HKHealthStore.isHealthDataAvailable() else {
            call.resolve(["authorized": false])
            return
        }
        store.requestAuthorization(toShare: nil, read: readTypes) { success, error in
            if let error = error {
                call.reject("HealthKit auth failed: \(error.localizedDescription)")
            } else {
                call.resolve(["authorized": success])
            }
        }
    }

    @objc func isAuthorized(_ call: CAPPluginCall) {
        guard HKHealthStore.isHealthDataAvailable() else {
            call.resolve(["authorized": false])
            return
        }
        // Check if we can read steps as a proxy for authorization
        let stepType = HKQuantityType.quantityType(forIdentifier: .stepCount)!
        let status = store.authorizationStatus(for: stepType)
        call.resolve(["authorized": status == .sharingAuthorized || status == .notDetermined ? false : true])
    }

    // MARK: - Steps

    @objc func getSteps(_ call: CAPPluginCall) {
        let days = call.getInt("days") ?? 7
        guard let stepType = HKQuantityType.quantityType(forIdentifier: .stepCount) else {
            call.resolve(["data": []])
            return
        }

        let calendar = Calendar.current
        let now = Date()
        let startDate = calendar.date(byAdding: .day, value: -(days - 1), to: calendar.startOfDay(for: now))!
        let interval = DateComponents(day: 1)

        let query = HKStatisticsCollectionQuery(
            quantityType: stepType,
            quantitySamplePredicate: HKQuery.predicateForSamples(withStart: startDate, end: now, options: .strictStartDate),
            options: .cumulativeSum,
            anchorDate: calendar.startOfDay(for: now),
            intervalComponents: interval
        )

        query.initialResultsHandler = { [weak self] _, results, error in
            guard let self = self, let results = results else {
                call.resolve(["data": []])
                return
            }

            var data: [[String: Any]] = []
            results.enumerateStatistics(from: startDate, to: now) { stats, _ in
                let steps = stats.sumQuantity()?.doubleValue(for: .count()) ?? 0
                data.append([
                    "date": self.dateFormatter.string(from: stats.startDate),
                    "steps": Int(steps),
                ])
            }
            call.resolve(["data": data])
        }

        store.execute(query)
    }

    // MARK: - Sleep

    @objc func getSleep(_ call: CAPPluginCall) {
        let days = call.getInt("days") ?? 7
        guard let sleepType = HKCategoryType.categoryType(forIdentifier: .sleepAnalysis) else {
            call.resolve(["data": []])
            return
        }

        let calendar = Calendar.current
        let now = Date()
        let startDate = calendar.date(byAdding: .day, value: -days, to: calendar.startOfDay(for: now))!

        let predicate = HKQuery.predicateForSamples(withStart: startDate, end: now, options: .strictStartDate)
        let sortDescriptor = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)

        let query = HKSampleQuery(
            sampleType: sleepType,
            predicate: predicate,
            limit: HKObjectQueryNoLimit,
            sortDescriptors: [sortDescriptor]
        ) { [weak self] _, samples, error in
            guard let self = self, let samples = samples as? [HKCategorySample] else {
                call.resolve(["data": []])
                return
            }

            // Group sleep samples by night (use the date of wake-up)
            var nightMap: [String: (totalMinutes: Double, bedTime: Date?, wakeTime: Date?)] = [:]

            for sample in samples {
                // Only count asleep categories (not inBed or awake)
                let value = HKCategoryValueSleepAnalysis(rawValue: sample.value)
                let isAsleep: Bool
                if #available(iOS 16.0, *) {
                    isAsleep = value == .asleepCore || value == .asleepDeep || value == .asleepREM || value == .asleepUnspecified
                } else {
                    isAsleep = value == .asleep
                }
                guard isAsleep else { continue }

                let dateKey = self.dateFormatter.string(from: sample.endDate)
                let duration = sample.endDate.timeIntervalSince(sample.startDate) / 60.0

                var entry = nightMap[dateKey] ?? (totalMinutes: 0, bedTime: nil, wakeTime: nil)
                entry.totalMinutes += duration
                if entry.bedTime == nil || sample.startDate < entry.bedTime! {
                    entry.bedTime = sample.startDate
                }
                if entry.wakeTime == nil || sample.endDate > entry.wakeTime! {
                    entry.wakeTime = sample.endDate
                }
                nightMap[dateKey] = entry
            }

            let data: [[String: Any]] = nightMap.map { key, value in
                var dict: [String: Any] = [
                    "date": key,
                    "totalMinutes": Int(value.totalMinutes),
                ]
                if let bed = value.bedTime {
                    dict["bedTime"] = self.isoFormatter.string(from: bed)
                }
                if let wake = value.wakeTime {
                    dict["wakeTime"] = self.isoFormatter.string(from: wake)
                }
                return dict
            }.sorted { ($0["date"] as? String ?? "") > ($1["date"] as? String ?? "") }

            call.resolve(["data": data])
        }

        store.execute(query)
    }

    // MARK: - Workouts

    @objc func getWorkouts(_ call: CAPPluginCall) {
        let days = call.getInt("days") ?? 7
        let calendar = Calendar.current
        let now = Date()
        let startDate = calendar.date(byAdding: .day, value: -days, to: calendar.startOfDay(for: now))!

        let predicate = HKQuery.predicateForSamples(withStart: startDate, end: now, options: .strictStartDate)
        let sortDescriptor = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)

        let query = HKSampleQuery(
            sampleType: HKObjectType.workoutType(),
            predicate: predicate,
            limit: HKObjectQueryNoLimit,
            sortDescriptors: [sortDescriptor]
        ) { [weak self] _, samples, error in
            guard let self = self, let workouts = samples as? [HKWorkout] else {
                call.resolve(["data": []])
                return
            }

            let data: [[String: Any]] = workouts.map { workout in
                let duration = workout.duration / 60.0
                let calories = workout.totalEnergyBurned?.doubleValue(for: .kilocalorie()) ?? 0

                return [
                    "date": self.dateFormatter.string(from: workout.startDate),
                    "type": self.workoutTypeName(workout.workoutActivityType),
                    "durationMinutes": Int(duration),
                    "calories": Int(calories),
                ]
            }

            call.resolve(["data": data])
        }

        store.execute(query)
    }

    // MARK: - Day Summary

    @objc func getDaySummary(_ call: CAPPluginCall) {
        let dateStr = call.getString("date") ?? dateFormatter.string(from: Date())
        guard let date = dateFormatter.date(from: dateStr) else {
            call.reject("Invalid date format")
            return
        }

        let calendar = Calendar.current
        let startOfDay = calendar.startOfDay(for: date)
        let endOfDay = calendar.date(byAdding: .day, value: 1, to: startOfDay)!

        let group = DispatchGroup()
        var stepsResult: Int = 0
        var caloriesResult: Int = 0
        var sleepMinutes: Int = 0
        var bedTime: String? = nil
        var wakeTime: String? = nil
        var workoutsResult: [[String: Any]] = []

        // Steps
        if let stepType = HKQuantityType.quantityType(forIdentifier: .stepCount) {
            group.enter()
            let predicate = HKQuery.predicateForSamples(withStart: startOfDay, end: endOfDay, options: .strictStartDate)
            let query = HKStatisticsQuery(quantityType: stepType, quantitySamplePredicate: predicate, options: .cumulativeSum) { _, stats, _ in
                stepsResult = Int(stats?.sumQuantity()?.doubleValue(for: .count()) ?? 0)
                group.leave()
            }
            store.execute(query)
        }

        // Active calories
        if let calType = HKQuantityType.quantityType(forIdentifier: .activeEnergyBurned) {
            group.enter()
            let predicate = HKQuery.predicateForSamples(withStart: startOfDay, end: endOfDay, options: .strictStartDate)
            let query = HKStatisticsQuery(quantityType: calType, quantitySamplePredicate: predicate, options: .cumulativeSum) { _, stats, _ in
                caloriesResult = Int(stats?.sumQuantity()?.doubleValue(for: .kilocalorie()) ?? 0)
                group.leave()
            }
            store.execute(query)
        }

        // Sleep (look back into the previous night)
        if let sleepType = HKCategoryType.categoryType(forIdentifier: .sleepAnalysis) {
            group.enter()
            let sleepStart = calendar.date(byAdding: .hour, value: -12, to: startOfDay)!
            let predicate = HKQuery.predicateForSamples(withStart: sleepStart, end: endOfDay, options: .strictStartDate)
            let sortDescriptor = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)

            let query = HKSampleQuery(sampleType: sleepType, predicate: predicate, limit: HKObjectQueryNoLimit, sortDescriptors: [sortDescriptor]) { [weak self] _, samples, _ in
                guard let self = self, let samples = samples as? [HKCategorySample] else {
                    group.leave()
                    return
                }

                var totalSleep = 0.0
                var earliest: Date? = nil
                var latest: Date? = nil

                for sample in samples {
                    let value = HKCategoryValueSleepAnalysis(rawValue: sample.value)
                    let isAsleep: Bool
                    if #available(iOS 16.0, *) {
                        isAsleep = value == .asleepCore || value == .asleepDeep || value == .asleepREM || value == .asleepUnspecified
                    } else {
                        isAsleep = value == .asleep
                    }
                    guard isAsleep else { continue }

                    totalSleep += sample.endDate.timeIntervalSince(sample.startDate) / 60.0
                    if earliest == nil || sample.startDate < earliest! { earliest = sample.startDate }
                    if latest == nil || sample.endDate > latest! { latest = sample.endDate }
                }

                sleepMinutes = Int(totalSleep)
                if let bed = earliest { bedTime = self.isoFormatter.string(from: bed) }
                if let wake = latest { wakeTime = self.isoFormatter.string(from: wake) }
                group.leave()
            }
            store.execute(query)
        }

        // Workouts
        group.enter()
        let wPredicate = HKQuery.predicateForSamples(withStart: startOfDay, end: endOfDay, options: .strictStartDate)
        let wSort = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)
        let wQuery = HKSampleQuery(sampleType: HKObjectType.workoutType(), predicate: wPredicate, limit: HKObjectQueryNoLimit, sortDescriptors: [wSort]) { [weak self] _, samples, _ in
            guard let self = self, let workouts = samples as? [HKWorkout] else {
                group.leave()
                return
            }
            workoutsResult = workouts.map { w in
                [
                    "date": self.dateFormatter.string(from: w.startDate),
                    "type": self.workoutTypeName(w.workoutActivityType),
                    "durationMinutes": Int(w.duration / 60.0),
                    "calories": Int(w.totalEnergyBurned?.doubleValue(for: .kilocalorie()) ?? 0),
                ]
            }
            group.leave()
        }
        store.execute(wQuery)

        group.notify(queue: .main) {
            call.resolve(["data": [
                "date": dateStr,
                "steps": stepsResult,
                "activeCalories": caloriesResult,
                "sleepMinutes": sleepMinutes,
                "bedTime": bedTime as Any,
                "wakeTime": wakeTime as Any,
                "workouts": workoutsResult,
            ]])
        }
    }

    // MARK: - Helpers

    private func workoutTypeName(_ type: HKWorkoutActivityType) -> String {
        switch type {
        case .running: return "Running"
        case .walking: return "Walking"
        case .cycling: return "Cycling"
        case .swimming: return "Swimming"
        case .yoga: return "Yoga"
        case .functionalStrengthTraining, .traditionalStrengthTraining: return "Strength Training"
        case .highIntensityIntervalTraining: return "HIIT"
        case .rowing: return "Rowing"
        case .elliptical: return "Elliptical"
        case .stairClimbing: return "Stair Climbing"
        case .hiking: return "Hiking"
        case .dance: return "Dance"
        case .pilates: return "Pilates"
        case .coreTraining: return "Core Training"
        case .crossTraining: return "Cross Training"
        case .mixedCardio: return "Cardio"
        default: return "Workout"
        }
    }
}
