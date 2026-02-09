import Foundation
import Capacitor
import HealthKit

/// Capacitor plugin bridging Apple HealthKit to the web layer.
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
        CAPPluginMethod(name: "getHRV", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getRestingHeartRate", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getRespiratoryRate", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getBloodOxygen", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getBiometricSummary", returnType: CAPPluginReturnPromise),
    ]

    private let store = HKHealthStore()
    private let dateFormatter: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        f.timeZone = .current
        return f
    }()
    private let isoFormatter = ISO8601DateFormatter()

    private var readTypes: Set<HKObjectType> {
        let types: [HKObjectType?] = [
            HKQuantityType.quantityType(forIdentifier: .stepCount),
            HKQuantityType.quantityType(forIdentifier: .activeEnergyBurned),
            HKCategoryType.categoryType(forIdentifier: .sleepAnalysis),
            HKObjectType.workoutType(),
            HKQuantityType.quantityType(forIdentifier: .heartRateVariabilitySDNN),
            HKQuantityType.quantityType(forIdentifier: .restingHeartRate),
            HKQuantityType.quantityType(forIdentifier: .respiratoryRate),
            HKQuantityType.quantityType(forIdentifier: .oxygenSaturation),
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

        query.initialResultsHandler = { [weak self] _, results, _ in
            guard let self = self, let results = results else {
                call.resolve(["data": []])
                return
            }
            var data: [[String: Any]] = []
            results.enumerateStatistics(from: startDate, to: now) { stats, _ in
                let steps = stats.sumQuantity()?.doubleValue(for: .count()) ?? 0
                data.append(["date": self.dateFormatter.string(from: stats.startDate), "steps": Int(steps)])
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
        let sort = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)

        let query = HKSampleQuery(sampleType: sleepType, predicate: predicate, limit: HKObjectQueryNoLimit, sortDescriptors: [sort]) { [weak self] _, samples, _ in
            guard let self = self, let samples = samples as? [HKCategorySample] else {
                call.resolve(["data": []])
                return
            }

            var nightMap: [String: (totalMinutes: Double, bedTime: Date?, wakeTime: Date?)] = [:]
            for sample in samples {
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
                if entry.bedTime == nil || sample.startDate < entry.bedTime! { entry.bedTime = sample.startDate }
                if entry.wakeTime == nil || sample.endDate > entry.wakeTime! { entry.wakeTime = sample.endDate }
                nightMap[dateKey] = entry
            }

            let data: [[String: Any]] = nightMap.map { key, value in
                var dict: [String: Any] = ["date": key, "totalMinutes": Int(value.totalMinutes)]
                if let bed = value.bedTime { dict["bedTime"] = self.isoFormatter.string(from: bed) }
                if let wake = value.wakeTime { dict["wakeTime"] = self.isoFormatter.string(from: wake) }
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
        let sort = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)

        let query = HKSampleQuery(sampleType: HKObjectType.workoutType(), predicate: predicate, limit: HKObjectQueryNoLimit, sortDescriptors: [sort]) { [weak self] _, samples, _ in
            guard let self = self, let workouts = samples as? [HKWorkout] else {
                call.resolve(["data": []])
                return
            }
            let data: [[String: Any]] = workouts.map { w in
                [
                    "date": self.dateFormatter.string(from: w.startDate),
                    "type": self.workoutTypeName(w.workoutActivityType),
                    "durationMinutes": Int(w.duration / 60.0),
                    "calories": Int(w.totalEnergyBurned?.doubleValue(for: .kilocalorie()) ?? 0),
                ]
            }
            call.resolve(["data": data])
        }
        store.execute(query)
    }

    // MARK: - HRV

    @objc func getHRV(_ call: CAPPluginCall) {
        let days = call.getInt("days") ?? 30
        guard let t = HKQuantityType.quantityType(forIdentifier: .heartRateVariabilitySDNN) else {
            call.resolve(["data": []])
            return
        }
        fetchDailyQuantity(type: t, unit: HKUnit.secondUnit(with: .milli), days: days, call: call)
    }

    // MARK: - Resting Heart Rate

    @objc func getRestingHeartRate(_ call: CAPPluginCall) {
        let days = call.getInt("days") ?? 30
        guard let t = HKQuantityType.quantityType(forIdentifier: .restingHeartRate) else {
            call.resolve(["data": []])
            return
        }
        fetchDailyQuantity(type: t, unit: HKUnit.count().unitDivided(by: .minute()), days: days, call: call)
    }

    // MARK: - Respiratory Rate

    @objc func getRespiratoryRate(_ call: CAPPluginCall) {
        let days = call.getInt("days") ?? 30
        guard let t = HKQuantityType.quantityType(forIdentifier: .respiratoryRate) else {
            call.resolve(["data": []])
            return
        }
        fetchDailyQuantity(type: t, unit: HKUnit.count().unitDivided(by: .minute()), days: days, call: call)
    }

    // MARK: - Blood Oxygen

    @objc func getBloodOxygen(_ call: CAPPluginCall) {
        let days = call.getInt("days") ?? 30
        guard let t = HKQuantityType.quantityType(forIdentifier: .oxygenSaturation) else {
            call.resolve(["data": []])
            return
        }
        fetchDailyQuantity(type: t, unit: .percent(), days: days, call: call, multiplier: 100)
    }

    // MARK: - Biometric Summary (all at once)

    @objc func getBiometricSummary(_ call: CAPPluginCall) {
        let days = call.getInt("days") ?? 30
        let calendar = Calendar.current
        let now = Date()
        let start = calendar.date(byAdding: .day, value: -days, to: calendar.startOfDay(for: now))!

        let group = DispatchGroup()
        var hrvData: [[String: Any]] = []
        var rhrData: [[String: Any]] = []
        var rrData: [[String: Any]] = []
        var spo2Data: [[String: Any]] = []

        if let t = HKQuantityType.quantityType(forIdentifier: .heartRateVariabilitySDNN) {
            group.enter()
            fetchRaw(type: t, unit: HKUnit.secondUnit(with: .milli), start: start, end: now) { hrvData = $0; group.leave() }
        }
        if let t = HKQuantityType.quantityType(forIdentifier: .restingHeartRate) {
            group.enter()
            fetchRaw(type: t, unit: HKUnit.count().unitDivided(by: .minute()), start: start, end: now) { rhrData = $0; group.leave() }
        }
        if let t = HKQuantityType.quantityType(forIdentifier: .respiratoryRate) {
            group.enter()
            fetchRaw(type: t, unit: HKUnit.count().unitDivided(by: .minute()), start: start, end: now) { rrData = $0; group.leave() }
        }
        if let t = HKQuantityType.quantityType(forIdentifier: .oxygenSaturation) {
            group.enter()
            fetchRaw(type: t, unit: .percent(), start: start, end: now, multiplier: 100) { spo2Data = $0; group.leave() }
        }

        group.notify(queue: .main) {
            call.resolve(["data": [
                "hrv": hrvData,
                "restingHeartRate": rhrData,
                "respiratoryRate": rrData,
                "bloodOxygen": spo2Data,
            ]])
        }
    }

    // MARK: - Day Summary

    @objc func getDaySummary(_ call: CAPPluginCall) {
        let dateStr = call.getString("date") ?? dateFormatter.string(from: Date())
        guard let date = dateFormatter.date(from: dateStr) else { call.reject("Invalid date"); return }

        let calendar = Calendar.current
        let startOfDay = calendar.startOfDay(for: date)
        let endOfDay = calendar.date(byAdding: .day, value: 1, to: startOfDay)!

        let group = DispatchGroup()
        var steps = 0, calories = 0, sleepMins = 0
        var bedTime: String?, wakeTime: String?
        var workouts: [[String: Any]] = []
        var hrv: Double?, rhr: Double?

        // Steps
        if let t = HKQuantityType.quantityType(forIdentifier: .stepCount) {
            group.enter()
            let q = HKStatisticsQuery(quantityType: t, quantitySamplePredicate: HKQuery.predicateForSamples(withStart: startOfDay, end: endOfDay, options: .strictStartDate), options: .cumulativeSum) { _, s, _ in
                steps = Int(s?.sumQuantity()?.doubleValue(for: .count()) ?? 0); group.leave()
            }
            store.execute(q)
        }

        // Calories
        if let t = HKQuantityType.quantityType(forIdentifier: .activeEnergyBurned) {
            group.enter()
            let q = HKStatisticsQuery(quantityType: t, quantitySamplePredicate: HKQuery.predicateForSamples(withStart: startOfDay, end: endOfDay, options: .strictStartDate), options: .cumulativeSum) { _, s, _ in
                calories = Int(s?.sumQuantity()?.doubleValue(for: .kilocalorie()) ?? 0); group.leave()
            }
            store.execute(q)
        }

        // Sleep
        if let sleepType = HKCategoryType.categoryType(forIdentifier: .sleepAnalysis) {
            group.enter()
            let sleepStart = calendar.date(byAdding: .hour, value: -12, to: startOfDay)!
            let pred = HKQuery.predicateForSamples(withStart: sleepStart, end: endOfDay, options: .strictStartDate)
            let q = HKSampleQuery(sampleType: sleepType, predicate: pred, limit: HKObjectQueryNoLimit, sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)]) { [weak self] _, samples, _ in
                guard let self = self, let samples = samples as? [HKCategorySample] else { group.leave(); return }
                var total = 0.0; var earliest: Date?; var latest: Date?
                for s in samples {
                    let v = HKCategoryValueSleepAnalysis(rawValue: s.value)
                    let asleep: Bool
                    if #available(iOS 16.0, *) { asleep = v == .asleepCore || v == .asleepDeep || v == .asleepREM || v == .asleepUnspecified }
                    else { asleep = v == .asleep }
                    guard asleep else { continue }
                    total += s.endDate.timeIntervalSince(s.startDate) / 60.0
                    if earliest == nil || s.startDate < earliest! { earliest = s.startDate }
                    if latest == nil || s.endDate > latest! { latest = s.endDate }
                }
                sleepMins = Int(total)
                if let b = earliest { bedTime = self.isoFormatter.string(from: b) }
                if let w = latest { wakeTime = self.isoFormatter.string(from: w) }
                group.leave()
            }
            store.execute(q)
        }

        // HRV
        if let t = HKQuantityType.quantityType(forIdentifier: .heartRateVariabilitySDNN) {
            group.enter()
            let q = HKSampleQuery(sampleType: t, predicate: HKQuery.predicateForSamples(withStart: startOfDay, end: endOfDay, options: .strictStartDate), limit: 1, sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)]) { _, samples, _ in
                if let s = samples?.first as? HKQuantitySample { hrv = s.quantity.doubleValue(for: HKUnit.secondUnit(with: .milli)) }
                group.leave()
            }
            store.execute(q)
        }

        // RHR
        if let t = HKQuantityType.quantityType(forIdentifier: .restingHeartRate) {
            group.enter()
            let q = HKSampleQuery(sampleType: t, predicate: HKQuery.predicateForSamples(withStart: startOfDay, end: endOfDay, options: .strictStartDate), limit: 1, sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)]) { _, samples, _ in
                if let s = samples?.first as? HKQuantitySample { rhr = s.quantity.doubleValue(for: HKUnit.count().unitDivided(by: .minute())) }
                group.leave()
            }
            store.execute(q)
        }

        // Workouts
        group.enter()
        let wq = HKSampleQuery(sampleType: HKObjectType.workoutType(), predicate: HKQuery.predicateForSamples(withStart: startOfDay, end: endOfDay, options: .strictStartDate), limit: HKObjectQueryNoLimit, sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)]) { [weak self] _, samples, _ in
            guard let self = self, let ws = samples as? [HKWorkout] else { group.leave(); return }
            workouts = ws.map { ["date": self.dateFormatter.string(from: $0.startDate), "type": self.workoutTypeName($0.workoutActivityType), "durationMinutes": Int($0.duration / 60), "calories": Int($0.totalEnergyBurned?.doubleValue(for: .kilocalorie()) ?? 0)] }
            group.leave()
        }
        store.execute(wq)

        group.notify(queue: .main) {
            var result: [String: Any] = ["date": dateStr, "steps": steps, "activeCalories": calories, "sleepMinutes": sleepMins, "bedTime": bedTime as Any, "wakeTime": wakeTime as Any, "workouts": workouts]
            if let h = hrv { result["hrv"] = round(h * 10) / 10 }
            if let r = rhr { result["restingHeartRate"] = Int(r) }
            call.resolve(["data": result])
        }
    }

    // MARK: - Generic daily quantity helpers

    private func fetchDailyQuantity(type: HKQuantityType, unit: HKUnit, days: Int, call: CAPPluginCall, multiplier: Double = 1.0) {
        let now = Date()
        let start = Calendar.current.date(byAdding: .day, value: -days, to: Calendar.current.startOfDay(for: now))!
        fetchRaw(type: type, unit: unit, start: start, end: now, multiplier: multiplier) { data in
            call.resolve(["data": data])
        }
    }

    private func fetchRaw(type: HKQuantityType, unit: HKUnit, start: Date, end: Date, multiplier: Double = 1.0, completion: @escaping ([[String: Any]]) -> Void) {
        let pred = HKQuery.predicateForSamples(withStart: start, end: end, options: .strictStartDate)
        let sort = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)

        let query = HKSampleQuery(sampleType: type, predicate: pred, limit: HKObjectQueryNoLimit, sortDescriptors: [sort]) { [weak self] _, samples, _ in
            guard let self = self, let qs = samples as? [HKQuantitySample] else { completion([]); return }

            var grouped: [String: [Double]] = [:]
            for s in qs {
                let key = self.dateFormatter.string(from: s.startDate)
                grouped[key, default: []].append(s.quantity.doubleValue(for: unit) * multiplier)
            }

            let data: [[String: Any]] = grouped.map { key, vals in
                let avg = vals.reduce(0, +) / Double(vals.count)
                return ["date": key, "value": round(avg * 10) / 10, "min": round((vals.min() ?? 0) * 10) / 10, "max": round((vals.max() ?? 0) * 10) / 10, "samples": vals.count]
            }.sorted { ($0["date"] as? String ?? "") > ($1["date"] as? String ?? "") }

            completion(data)
        }
        store.execute(query)
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
