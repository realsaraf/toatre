import WidgetKit
import SwiftUI

// MARK: - Data model (mirrors Flutter WidgetService output)

private let appGroupId = "group.com.toatre.app"

struct WidgetToat: Identifiable, Codable {
    let id: String
    let title: String
    let kind: String     // task | event | meeting | idea | errand | deadline
    let tier: String     // urgent | important | regular
    let time: String?    // ISO 8601 or nil
    let location: String?
}

// MARK: - Helpers

private func loadToats() -> [WidgetToat] {
    guard
        let defaults = UserDefaults(suiteName: appGroupId),
        let json = defaults.string(forKey: "toat_data"),
        let data = json.data(using: .utf8)
    else { return [] }
    return (try? JSONDecoder().decode([WidgetToat].self, from: data)) ?? []
}

private func parseISO(_ string: String?) -> Date? {
    guard let string else { return nil }
    let f = ISO8601DateFormatter()
    f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
    if let d = f.date(from: string) { return d }
    f.formatOptions = [.withInternetDateTime]
    return f.date(from: string)
}

private func relativeTimeLabel(_ date: Date) -> String {
    let now = Date()
    let mins = Int(date.timeIntervalSince(now) / 60)
    if mins <= 0 { return "Now" }
    if mins < 60  { return "Leave in \(mins) min" }
    let hrs = mins / 60
    let rem = mins % 60
    if rem == 0 { return "Leave in \(hrs)h" }
    return "Leave in \(hrs)h \(rem)m"
}

private func timeOnly(_ date: Date) -> String {
    let fmt = DateFormatter()
    fmt.timeStyle = .short
    fmt.dateStyle = .none
    return fmt.string(from: date)
}

private func kindIcon(_ kind: String) -> String {
    switch kind {
    case "meeting":  return "video.circle.fill"
    case "event":    return "calendar.circle.fill"
    case "task":     return "checkmark.circle.fill"
    case "idea":     return "lightbulb.circle.fill"
    case "errand":   return "bag.circle.fill"
    case "deadline": return "clock.badge.exclamationmark.fill"
    default:         return "circle.fill"
    }
}

private func tierColor(_ tier: String) -> Color {
    switch tier {
    case "urgent":    return Color(red: 1.0, green: 0.31, blue: 0.25)
    case "important": return Color(red: 1.0, green: 0.69, blue: 0.20)
    default:          return Color(red: 0.55, green: 0.47, blue: 1.0)
    }
}

// MARK: - Timeline Provider

struct ToatEntry: TimelineEntry {
    let date: Date
    let toats: [WidgetToat]
}

struct ToatreWidgetProvider: TimelineProvider {
    func placeholder(in context: Context) -> ToatEntry {
        ToatEntry(date: .now, toats: [
            WidgetToat(id: "1", title: "Team standup", kind: "meeting",
                       tier: "urgent", time: nil, location: nil),
            WidgetToat(id: "2", title: "Submit report", kind: "deadline",
                       tier: "important", time: nil, location: nil),
        ])
    }

    func getSnapshot(in context: Context, completion: @escaping (ToatEntry) -> Void) {
        completion(ToatEntry(date: .now, toats: loadToats()))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<ToatEntry>) -> Void) {
        let toats = loadToats()
        let entry = ToatEntry(date: .now, toats: toats)
        // Refresh every 15 minutes
        let refresh = Calendar.current.date(byAdding: .minute, value: 15, to: .now) ?? .now
        completion(Timeline(entries: [entry], policy: .after(refresh)))
    }
}

// MARK: - Design tokens (mirrors app AppColors dark theme)

private let bgColor      = Color(red: 0.067, green: 0.063, blue: 0.11)   // #111018
private let bgElevated   = Color(red: 0.11,  green: 0.106, blue: 0.165)  // #1C1B2A
private let borderColor  = Color(red: 1, green: 1, blue: 1, opacity: 0.07)
private let textPrimary  = Color(red: 0.95, green: 0.95, blue: 0.97)
private let textSecondary = Color(red: 0.6, green: 0.58, blue: 0.7)
private let brandPurple  = Color(red: 0.357, green: 0.231, blue: 0.961)  // #5B3BF5
private let accentTeal   = Color(red: 0.24, green: 0.80, blue: 0.73)     // #3DCEBB

// MARK: - Empty state

private struct EmptyStateView: View {
    var body: some View {
        VStack(spacing: 6) {
            Image(systemName: "checkmark.circle")
                .font(.system(size: 22, weight: .light))
                .foregroundColor(textSecondary)
            Text("All clear")
                .font(.system(size: 13, weight: .semibold))
                .foregroundColor(textSecondary)
            Text("No upcoming toats")
                .font(.system(size: 11))
                .foregroundColor(textSecondary.opacity(0.6))
        }
    }
}

// MARK: - Kind icon square (matches app's rounded-square icon badges)

private struct KindIconBadge: View {
    let kind: String
    var size: CGFloat = 36

    private var iconBgColor: Color {
        switch kind {
        case "meeting":  return Color(red: 0.17, green: 0.38, blue: 0.86)
        case "event":    return Color(red: 0.36, green: 0.23, blue: 0.96)
        case "task":     return Color(red: 0.24, green: 0.64, blue: 0.36)
        case "idea":     return Color(red: 0.86, green: 0.63, blue: 0.12)
        case "errand":   return Color(red: 0.73, green: 0.35, blue: 0.86)
        case "deadline": return Color(red: 0.87, green: 0.23, blue: 0.22)
        default:         return brandPurple
        }
    }

    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: size * 0.28, style: .continuous)
                .fill(iconBgColor)
            Image(systemName: kindIcon(kind))
                .font(.system(size: size * 0.44, weight: .semibold))
                .foregroundColor(.white)
        }
        .frame(width: size, height: size)
    }
}

// MARK: - Hero card — the NEXT toat (full emphasis, matches app's UP NEXT card)

private struct HeroToatView: View {
    let toat: WidgetToat
    var compact: Bool = false

    private var parsedDate: Date? { parseISO(toat.time) }
    private var accent: Color { tierColor(toat.tier) }

    var body: some View {
        ZStack(alignment: .topTrailing) {
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .fill(bgElevated)
                .overlay(
                    RoundedRectangle(cornerRadius: 14, style: .continuous)
                        .stroke(borderColor, lineWidth: 1)
                )

            VStack(alignment: .leading, spacing: 0) {
                // Top row: "UP NEXT" badge + time
                HStack(alignment: .center) {
                    Text("UP NEXT")
                        .font(.system(size: 9, weight: .bold))
                        .tracking(0.8)
                        .foregroundColor(accentTeal)
                        .padding(.horizontal, 7)
                        .padding(.vertical, 3)
                        .background(accentTeal.opacity(0.12), in: Capsule())

                    Spacer()

                    if let date = parsedDate {
                        Text(timeOnly(date))
                            .font(.system(size: compact ? 12 : 13, weight: .semibold))
                            .foregroundColor(textSecondary)
                    }
                }
                .padding(.bottom, compact ? 8 : 10)

                // Icon + title row
                HStack(alignment: .top, spacing: 10) {
                    KindIconBadge(kind: toat.kind, size: compact ? 32 : 40)

                    VStack(alignment: .leading, spacing: 3) {
                        Text(toat.title)
                            .font(.system(size: compact ? 14 : 16, weight: .bold))
                            .foregroundColor(textPrimary)
                            .lineLimit(compact ? 1 : 2)
                            .fixedSize(horizontal: false, vertical: true)

                        // Category / tier chip
                        Text(toat.kind.capitalized)
                            .font(.system(size: 10, weight: .medium))
                            .foregroundColor(textSecondary)
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(borderColor, in: Capsule())
                    }
                }
                .padding(.bottom, compact ? 6 : 8)

                // Relative time in accent teal (matches "Leave in 132 min" style)
                if let date = parsedDate {
                    Text(relativeTimeLabel(date))
                        .font(.system(size: compact ? 11 : 12, weight: .semibold))
                        .foregroundColor(accentTeal)
                }
            }
            .padding(12)
        }
    }
}

// MARK: - Compact row for subsequent toats (matches app list item style)

private struct CompactToatRow: View {
    let toat: WidgetToat

    private var parsedDate: Date? { parseISO(toat.time) }

    var body: some View {
        HStack(spacing: 10) {
            KindIconBadge(kind: toat.kind, size: 28)

            Text(toat.title)
                .font(.system(size: 13, weight: .medium))
                .foregroundColor(textPrimary)
                .lineLimit(1)

            Spacer(minLength: 4)

            if let date = parsedDate {
                Text(timeOnly(date))
                    .font(.system(size: 11, weight: .medium))
                    .foregroundColor(textSecondary)
            }
        }
    }
}

// MARK: - Widget views per family

private struct SmallWidgetView: View {
    let entry: ToatEntry

    var body: some View {
        Group {
            if let first = entry.toats.first {
                VStack(alignment: .leading, spacing: 0) {
                    // "UP NEXT" badge
                    HStack {
                        Text("UP NEXT")
                            .font(.system(size: 8, weight: .bold))
                            .tracking(0.8)
                            .foregroundColor(accentTeal)
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2.5)
                            .background(accentTeal.opacity(0.12), in: Capsule())
                        Spacer()
                        if let date = parseISO(first.time) {
                            Text(timeOnly(date))
                                .font(.system(size: 11, weight: .semibold))
                                .foregroundColor(textSecondary)
                        }
                    }

                    Spacer(minLength: 8)

                    // Icon badge
                    KindIconBadge(kind: first.kind, size: 34)

                    Spacer(minLength: 8)

                    // Title
                    Text(first.title)
                        .font(.system(size: 14, weight: .bold))
                        .foregroundColor(textPrimary)
                        .lineLimit(2)
                        .fixedSize(horizontal: false, vertical: true)

                    Spacer(minLength: 4)

                    // Time in teal
                    if let date = parseISO(first.time) {
                        Text(relativeTimeLabel(date))
                            .font(.system(size: 10, weight: .semibold))
                            .foregroundColor(accentTeal)
                            .lineLimit(1)
                    }

                    Spacer(minLength: 6)

                    // Tier indicator dots
                    HStack(spacing: 3) {
                        ForEach(0..<3) { i in
                            Capsule()
                                .fill(i == 0 ? tierColor(first.tier) : borderColor)
                                .frame(width: i == 0 ? 14 : 5, height: 2.5)
                        }
                    }
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
                .padding(12)
            } else {
                EmptyStateView()
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .padding(12)
            }
        }
        .widgetBackground(bgColor)
    }
}

private struct MediumWidgetView: View {
    let entry: ToatEntry

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            if entry.toats.isEmpty {
                Spacer()
                EmptyStateView().frame(maxWidth: .infinity)
                Spacer()
            } else {
                // Hero card
                HeroToatView(toat: entry.toats[0], compact: true)

                // Up to 2 compact rows
                let rest = Array(entry.toats.dropFirst().prefix(2))
                if !rest.isEmpty {
                    VStack(spacing: 8) {
                        ForEach(Array(rest.enumerated()), id: \.offset) { idx, toat in
                            CompactToatRow(toat: toat)
                            if idx < rest.count - 1 {
                                Rectangle()
                                    .fill(borderColor)
                                    .frame(height: 1)
                            }
                        }
                    }
                }

                Spacer(minLength: 0)
            }
        }
        .padding(14)
        .widgetBackground(bgColor)
    }
}

private struct LargeWidgetView: View {
    let entry: ToatEntry

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            if entry.toats.isEmpty {
                Spacer()
                EmptyStateView().frame(maxWidth: .infinity)
                Spacer()
            } else {
                // Hero card — full size
                HeroToatView(toat: entry.toats[0], compact: false)

                // "COMING UP" section
                let rest = Array(entry.toats.dropFirst().prefix(4))
                if !rest.isEmpty {
                    HStack {
                        Text("COMING UP")
                            .font(.system(size: 9, weight: .bold))
                            .tracking(1.2)
                            .foregroundColor(textSecondary)
                        Spacer()
                    }

                    VStack(spacing: 10) {
                        ForEach(Array(rest.enumerated()), id: \.offset) { idx, toat in
                            CompactToatRow(toat: toat)
                            if idx < rest.count - 1 {
                                Rectangle()
                                    .fill(borderColor)
                                    .frame(height: 1)
                            }
                        }
                    }
                }

                Spacer(minLength: 0)
            }
        }
        .padding(16)
        .widgetBackground(bgColor)
    }
}

// MARK: - Background helper (iOS 17+ uses containerBackground)

extension View {
    @ViewBuilder
    func widgetBackground(_ color: Color) -> some View {
        if #available(iOSApplicationExtension 17.0, *) {
            self.containerBackground(color, for: .widget)
        } else {
            self.background(color)
        }
    }
}

// MARK: - Widget entry view (dispatcher)

struct ToatreWidgetEntryView: View {
    let entry: ToatEntry
    @Environment(\.widgetFamily) var family

    var body: some View {
        switch family {
        case .systemSmall:  SmallWidgetView(entry: entry)
        case .systemMedium: MediumWidgetView(entry: entry)
        case .systemLarge:  LargeWidgetView(entry: entry)
        default:            MediumWidgetView(entry: entry)
        }
    }
}

// MARK: - Widget configuration

@main
struct ToatreWidget: Widget {
    let kind: String = "ToatreWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: ToatreWidgetProvider()) { entry in
            ToatreWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("Toatre")
        .description("See your next upcoming toats at a glance.")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
        .contentMarginsDisabled()
    }
}
