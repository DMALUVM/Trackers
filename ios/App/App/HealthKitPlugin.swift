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
        // HealthKit intentionally hides READ authorization status for privacy.
        // authorizationStatus(for:) only works for WRITE permissions.
        // The reliable approach: try to read a small amount of data.
        // If we get results (or an empty set without error), user granted access.
        guard let stepType = HKQuantityType.quantityType(forIdentifier: .stepCount) else {
            call.resolve(["authorized": false])
            return
        }
        let now = Date()
        let start = Calendar.current.date(byAdding: .day, value: -1, to: now)!
        let pred = HKQuery.predicateForSamples(withStart: start, end: now, options: .strictStartDate)
        let q = HKStatisticsQuery(quantityType: stepType, quantitySamplePredicate: pred, options: .cumulativeSum) { _, stats, error in
            // If no error, user has granted read access (even if stats is nil / 0 steps)
            let authorized = error == nil
            call.resolve(["authorized": authorized])
        }
        store.execute(q)
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
        let sort = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)

        let query = HKSampleQuery(sampleType: sleepType, predicate: predicate, limit: HKObjectQueryNoLimit, sortDescriptors: [sort]) { [weak self] _, samples, _ in
            guard let self = self, let samples = samples as? [HKCategorySample] else {
                call.resolve(["data": []])
                return
            }

            // ── Collect time intervals by category ──
            // We merge overlapping intervals across ALL sources (same approach Apple Health uses).
            struct Interval {
                let start: Date
                let end: Date
            }

            var asleepIntervals: [Interval] = []
            var inBedIntervals: [Interval] = []
            var deepIntervals: [Interval] = []
            var coreIntervals: [Interval] = []
            var remIntervals: [Interval] = []

            for sample in samples {
                let value = HKCategoryValueSleepAnalysis(rawValue: sample.value)
                let iv = Interval(start: sample.startDate, end: sample.endDate)

                if #available(iOS 16.0, *) {
                    switch value {
                    case .asleepDeep:
                        asleepIntervals.append(iv)
                        deepIntervals.append(iv)
                    case .asleepCore:
                        asleepIntervals.append(iv)
                        coreIntervals.append(iv)
                    case .asleepREM:
                        asleepIntervals.append(iv)
                        remIntervals.append(iv)
                    case .asleepUnspecified:
                        asleepIntervals.append(iv)
                    case .inBed:
                        inBedIntervals.append(iv)
                    default:
                        continue
                    }
                } else {
                    if value == .asleep {
                        asleepIntervals.append(iv)
                    } else if value == .inBed {
                        inBedIntervals.append(iv)
                    } else {
                        continue
                    }
                }
            }

            // ── Merge overlapping intervals and sum unique minutes ──
            func mergeAndSum(_ intervals: [Interval]) -> (minutes: Double, earliest: Date?, latest: Date?) {
                guard !intervals.isEmpty else { return (0, nil, nil) }
                let sorted = intervals.sorted { $0.start < $1.start }
                var merged: [(start: Date, end: Date)] = []
                var cur = (start: sorted[0].start, end: sorted[0].end)
                for iv in sorted.dropFirst() {
                    if iv.start <= cur.end {
                        cur.end = max(cur.end, iv.end)
                    } else {
                        merged.append(cur)
                        cur = (start: iv.start, end: iv.end)
                    }
                }
                merged.append(cur)
                let total = merged.reduce(0.0) { $0 + $1.end.timeIntervalSince($1.start) / 60.0 }
                return (total, merged.first?.start, merged.last?.end)
            }

            let asleep = mergeAndSum(asleepIntervals)
            let inBed = mergeAndSum(inBedIntervals)
            let deep = mergeAndSum(deepIntervals)
            let core = mergeAndSum(coreIntervals)
            let rem = mergeAndSum(remIntervals)

            // ── Bucket by wake-up date ──
            // A sleep session belongs to the date you WAKE UP (endDate of last interval).
            // For "last night" = today's date. This matches Apple Health's grouping.
            let allIntervals = asleepIntervals + inBedIntervals
            guard !allIntervals.isEmpty else {
                call.resolve(["data": []])
                return
            }

            // Group all intervals into "nights" — a gap > 4 hours starts a new night
            let allSorted = allIntervals.sorted { $0.start < $1.start }
            var nights: [[(start: Date, end: Date)]] = [[]]
            var prevEnd = allSorted[0].start
            for iv in allSorted {
                if iv.start.timeIntervalSince(prevEnd) > 4 * 3600 {
                    nights.append([])
                }
                nights[nights.count - 1].append((start: iv.start, end: iv.end))
                prevEnd = max(prevEnd, iv.end)
            }

            // For each night, compute stats and key by wake-up date
            var nightMap: [String: [String: Any]] = [:]
            for night in nights {
                guard let first = night.first, let last = night.max(by: { $0.end < $1.end }) else { continue }
                let wakeDate = last.end
                let dateKey = self.dateFormatter.string(from: wakeDate)

                // Filter intervals belonging to this night's time window
                let nightStart = first.start
                let nightEnd = last.end

                func minutesInNight(_ intervals: [Interval]) -> Double {
                    let filtered = intervals.filter { $0.start >= nightStart.addingTimeInterval(-300) && $0.end <= nightEnd.addingTimeInterval(300) }
                    return mergeAndSum(filtered).minutes
                }

                let nightAsleep = minutesInNight(asleepIntervals)
                let nightInBed = minutesInNight(inBedIntervals)
                let totalMinutes = nightAsleep > 0 ? nightAsleep : nightInBed

                // Skip tiny sessions (< 30 min = naps)
                if totalMinutes < 30 { continue }

                var dict: [String: Any] = [
                    "date": dateKey,
                    "totalMinutes": Int(totalMinutes),
                    "asleepMinutes": Int(nightAsleep),
                    "inBedMinutes": Int(nightInBed > 0 ? nightInBed : nightAsleep),
                ]
                let nightDeep = minutesInNight(deepIntervals)
                let nightCore = minutesInNight(coreIntervals)
                let nightRem = minutesInNight(remIntervals)
                if nightDeep > 0 { dict["deepMinutes"] = Int(nightDeep) }
                if nightCore > 0 { dict["coreMinutes"] = Int(nightCore) }
                if nightRem > 0 { dict["remMinutes"] = Int(nightRem) }
                dict["bedTime"] = self.isoFormatter.string(from: first.start)
                dict["wakeTime"] = self.isoFormatter.string(from: wakeDate)

                // If multiple sessions for same date, keep the longer one
                if let existing = nightMap[dateKey],
                   let existingMins = existing["totalMinutes"] as? Int,
                   existingMins >= Int(totalMinutes) {
                    continue
                }
                nightMap[dateKey] = dict
            }

            let data = nightMap.values
                .sorted { ($0["date"] as? String ?? "") > ($1["date"] as? String ?? "") }

            call.resolve(["data": Array(data)])
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

        // Sleep — merge overlapping intervals across all sources (matches Apple Health)
        if let sleepType = HKCategoryType.categoryType(forIdentifier: .sleepAnalysis) {
            group.enter()
            let sleepStart = calendar.date(byAdding: .hour, value: -12, to: startOfDay)!
            let pred = HKQuery.predicateForSamples(withStart: sleepStart, end: endOfDay, options: .strictStartDate)
            let q = HKSampleQuery(sampleType: sleepType, predicate: pred, limit: HKObjectQueryNoLimit, sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)]) { [weak self] _, samples, _ in
                guard let self = self, let samples = samples as? [HKCategorySample] else { group.leave(); return }

                var asleepIvs: [(start: Date, end: Date)] = []
                var inBedIvs: [(start: Date, end: Date)] = []

                for s in samples {
                    let v = HKCategoryValueSleepAnalysis(rawValue: s.value)
                    let iv = (start: s.startDate, end: s.endDate)
                    if #available(iOS 16.0, *) {
                        switch v {
                        case .asleepCore, .asleepDeep, .asleepREM, .asleepUnspecified:
                            asleepIvs.append(iv)
                        case .inBed:
                            inBedIvs.append(iv)
                        default: continue
                        }
                    } else {
                        if v == .asleep { asleepIvs.append(iv) }
                        else if v == .inBed { inBedIvs.append(iv) }
                        else { continue }
                    }
                }

                // Merge overlapping intervals
                func mergeSum(_ ivs: [(start: Date, end: Date)]) -> (mins: Double, earliest: Date?, latest: Date?) {
                    guard !ivs.isEmpty else { return (0, nil, nil) }
                    let sorted = ivs.sorted { $0.start < $1.start }
                    var merged: [(start: Date, end: Date)] = []
                    var cur = sorted[0]
                    for iv in sorted.dropFirst() {
                        if iv.start <= cur.end { cur.end = max(cur.end, iv.end) }
                        else { merged.append(cur); cur = iv }
                    }
                    merged.append(cur)
                    let total = merged.reduce(0.0) { $0 + $1.end.timeIntervalSince($1.start) / 60.0 }
                    return (total, merged.first?.start, merged.last?.end)
                }

                let asleep = mergeSum(asleepIvs)
                let inBed = mergeSum(inBedIvs)
                sleepMins = Int(asleep.mins > 0 ? asleep.mins : inBed.mins)
                let allEarliest = [asleep.earliest, inBed.earliest].compactMap { $0 }.min()
                let allLatest = [asleep.latest, inBed.latest].compactMap { $0 }.max()
                if let b = allEarliest { bedTime = self.isoFormatter.string(from: b) }
                if let w = allLatest { wakeTime = self.isoFormatter.string(from: w) }
                group.leave()
            }
            store.execute(q)
        }

        // HRV — look back to previous evening (wearables like Oura/Garmin write HRV during sleep)
        if let t = HKQuantityType.quantityType(forIdentifier: .heartRateVariabilitySDNN) {
            group.enter()
            let hrvStart = calendar.date(byAdding: .hour, value: -12, to: startOfDay)!
            let q = HKSampleQuery(sampleType: t, predicate: HKQuery.predicateForSamples(withStart: hrvStart, end: endOfDay, options: .strictStartDate), limit: 1, sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)]) { _, samples, _ in
                if let s = samples?.first as? HKQuantitySample { hrv = s.quantity.doubleValue(for: HKUnit.secondUnit(with: .milli)) }
                group.leave()
            }
            store.execute(q)
        }

        // RHR — look back to previous evening (wearables calculate RHR during overnight sleep)
        if let t = HKQuantityType.quantityType(forIdentifier: .restingHeartRate) {
            group.enter()
            let rhrStart = calendar.date(byAdding: .hour, value: -12, to: startOfDay)!
            let q = HKSampleQuery(sampleType: t, predicate: HKQuery.predicateForSamples(withStart: rhrStart, end: endOfDay, options: .strictStartDate), limit: 1, sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)]) { _, samples, _ in
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
