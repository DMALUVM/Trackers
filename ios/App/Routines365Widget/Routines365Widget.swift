import WidgetKit
import SwiftUI

// MARK: - Data

struct RoutinesEntry: TimelineEntry {
    let date: Date
    let streak: Int
    let bestStreak: Int
    let todayDone: Int
    let todayTotal: Int
    let greenToday: Bool
}

// MARK: - Provider

struct RoutinesProvider: TimelineProvider {
    private let appGroupID = "group.com.routines365.app"

    func placeholder(in context: Context) -> RoutinesEntry {
        RoutinesEntry(date: Date(), streak: 7, bestStreak: 14, todayDone: 3, todayTotal: 5, greenToday: false)
    }

    func getSnapshot(in context: Context, completion: @escaping (RoutinesEntry) -> Void) {
        completion(readEntry())
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<RoutinesEntry>) -> Void) {
        let entry = readEntry()
        // Refresh every 30 minutes
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 30, to: Date())!
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        completion(timeline)
    }

    private func readEntry() -> RoutinesEntry {
        let defaults = UserDefaults(suiteName: appGroupID)
        return RoutinesEntry(
            date: Date(),
            streak: defaults?.integer(forKey: "widget_streak") ?? 0,
            bestStreak: defaults?.integer(forKey: "widget_bestStreak") ?? 0,
            todayDone: defaults?.integer(forKey: "widget_todayDone") ?? 0,
            todayTotal: defaults?.integer(forKey: "widget_todayTotal") ?? 0,
            greenToday: defaults?.bool(forKey: "widget_greenToday") ?? false
        )
    }
}

// MARK: - Small Widget View

struct SmallWidgetView: View {
    let entry: RoutinesEntry

    var progress: Double {
        guard entry.todayTotal > 0 else { return 0 }
        return Double(entry.todayDone) / Double(entry.todayTotal)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            // Header
            HStack {
                // Stack bars mini logo
                VStack(spacing: 2) {
                    ForEach(0..<4, id: \.self) { i in
                        RoundedRectangle(cornerRadius: 1.5)
                            .fill(barColor(index: i))
                            .frame(width: 16, height: 3)
                    }
                }
                Spacer()
                if entry.greenToday {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundColor(.green)
                        .font(.system(size: 16))
                }
            }

            Spacer()

            // Progress
            Text("\(entry.todayDone)/\(entry.todayTotal)")
                .font(.system(size: 28, weight: .bold, design: .rounded))
                .foregroundColor(.white)

            // Progress bar
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 4)
                        .fill(Color.white.opacity(0.15))
                        .frame(height: 6)
                    RoundedRectangle(cornerRadius: 4)
                        .fill(entry.greenToday ? Color.green : Color(red: 0.06, green: 0.73, blue: 0.51))
                        .frame(width: geo.size.width * progress, height: 6)
                }
            }
            .frame(height: 6)

            // Streak
            HStack(spacing: 4) {
                Image(systemName: "flame.fill")
                    .foregroundColor(.orange)
                    .font(.system(size: 10))
                Text("\(entry.streak) day streak")
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundColor(.white.opacity(0.7))
            }
        }
        .padding(14)
        .widgetURL(URL(string: "https://routines365.com/app/today"))
        .containerBackground(for: .widget) {
            Color.black
        }
    }

    func barColor(index: Int) -> Color {
        let colors: [Color] = [
            Color(red: 0.75, green: 0.95, blue: 0.39),
            Color(red: 0.29, green: 0.87, blue: 0.5),
            Color(red: 0.06, green: 0.73, blue: 0.51),
            Color(red: 0.02, green: 0.59, blue: 0.41),
        ]
        return index < colors.count ? colors[index] : .green
    }
}

// MARK: - Medium Widget View

struct MediumWidgetView: View {
    let entry: RoutinesEntry

    var progress: Double {
        guard entry.todayTotal > 0 else { return 0 }
        return Double(entry.todayDone) / Double(entry.todayTotal)
    }

    var body: some View {
        HStack(spacing: 16) {
            // Left: Progress
            VStack(alignment: .leading, spacing: 8) {
                // Mini logo
                VStack(spacing: 2) {
                    ForEach(0..<4, id: \.self) { i in
                        RoundedRectangle(cornerRadius: 1.5)
                            .fill(barColor(index: i))
                            .frame(width: 20, height: 3.5)
                    }
                }

                Spacer()

                Text("\(entry.todayDone)/\(entry.todayTotal)")
                    .font(.system(size: 32, weight: .bold, design: .rounded))
                    .foregroundColor(.white)

                Text("habits done")
                    .font(.system(size: 12, weight: .medium))
                    .foregroundColor(.white.opacity(0.5))

                // Progress bar
                GeometryReader { geo in
                    ZStack(alignment: .leading) {
                        RoundedRectangle(cornerRadius: 4)
                            .fill(Color.white.opacity(0.15))
                            .frame(height: 6)
                        RoundedRectangle(cornerRadius: 4)
                            .fill(entry.greenToday ? Color.green : Color(red: 0.06, green: 0.73, blue: 0.51))
                            .frame(width: geo.size.width * progress, height: 6)
                    }
                }
                .frame(height: 6)
            }

            // Right: Stats
            VStack(alignment: .leading, spacing: 12) {
                Spacer()

                StatRow(icon: "flame.fill", color: .orange, label: "Streak", value: "\(entry.streak)")
                StatRow(icon: "trophy.fill", color: .yellow, label: "Best", value: "\(entry.bestStreak)")

                if entry.greenToday {
                    HStack(spacing: 6) {
                        Image(systemName: "checkmark.circle.fill")
                            .foregroundColor(.green)
                            .font(.system(size: 14))
                        Text("Green day!")
                            .font(.system(size: 13, weight: .bold))
                            .foregroundColor(.green)
                    }
                }

                Spacer()
            }
        }
        .padding(14)
        .widgetURL(URL(string: "https://routines365.com/app/today"))
        .containerBackground(for: .widget) {
            Color.black
        }
    }

    func barColor(index: Int) -> Color {
        let colors: [Color] = [
            Color(red: 0.75, green: 0.95, blue: 0.39),
            Color(red: 0.29, green: 0.87, blue: 0.5),
            Color(red: 0.06, green: 0.73, blue: 0.51),
            Color(red: 0.02, green: 0.59, blue: 0.41),
        ]
        return index < colors.count ? colors[index] : .green
    }
}

struct StatRow: View {
    let icon: String
    let color: Color
    let label: String
    let value: String

    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: icon)
                .foregroundColor(color)
                .font(.system(size: 14))
                .frame(width: 20)
            VStack(alignment: .leading, spacing: 1) {
                Text(value)
                    .font(.system(size: 18, weight: .bold, design: .rounded))
                    .foregroundColor(.white)
                Text(label)
                    .font(.system(size: 10, weight: .medium))
                    .foregroundColor(.white.opacity(0.5))
            }
        }
    }
}

// MARK: - Widget Definition

struct Routines365Widget: Widget {
    let kind: String = "Routines365Widget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: RoutinesProvider()) { entry in
            if #available(iOS 17.0, *) {
                WidgetContent(entry: entry)
            } else {
                WidgetContent(entry: entry)
            }
        }
        .configurationDisplayName("Routines365")
        .description("Today's habit progress and streak.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

struct WidgetContent: View {
    @Environment(\.widgetFamily) var family
    let entry: RoutinesEntry

    var body: some View {
        switch family {
        case .systemMedium:
            MediumWidgetView(entry: entry)
        default:
            SmallWidgetView(entry: entry)
        }
    }
}

// MARK: - Preview

#Preview(as: .systemSmall) {
    Routines365Widget()
} timeline: {
    RoutinesEntry(date: .now, streak: 12, bestStreak: 21, todayDone: 3, todayTotal: 5, greenToday: false)
    RoutinesEntry(date: .now, streak: 12, bestStreak: 21, todayDone: 5, todayTotal: 5, greenToday: true)
}

#Preview(as: .systemMedium) {
    Routines365Widget()
} timeline: {
    RoutinesEntry(date: .now, streak: 12, bestStreak: 21, todayDone: 3, todayTotal: 5, greenToday: false)
}
