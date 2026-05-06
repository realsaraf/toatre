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
    let cal = Calendar.current
    let now = Date()
    let timeStr = timeOnly(date)
    if cal.isDateInToday(date)     { return "Today · \(timeStr)" }
    if cal.isDateInTomorrow(date)  { return "Tomorrow · \(timeStr)" }
    if cal.isDateInYesterday(date) { return "Yesterday · \(timeStr)" }
    let fmt = DateFormatter()
    fmt.dateFormat = "EEE, MMM d"
    return "\(fmt.string(from: date)) · \(timeStr)"
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

// MARK: - Empty state

private struct EmptyStateView: View {
    var body: some View {
        VStack(spacing: 6) {
            Image(systemName: "checkmark.circle")
                .font(.system(size: 26, weight: .light))
                .foregroundColor(Color(.tertiaryLabel))
            Text("All clear")
                .font(.system(size: 13, weight: .semibold))
                .foregroundColor(.secondary)
            Text("No upcoming toats")
                .font(.system(size: 11))
                .foregroundColor(Color(.tertiaryLabel))
        }
    }
}

// MARK: - Hero card (the next toat — always gets full emphasis)

private struct HeroToatView: View {
    let toat: WidgetToat
    var compact: Bool = false   // true in medium/large (less vertical space)

    private var accent: Color { tierColor(toat.tier) }
    private var parsedDate: Date? { parseISO(toat.time) }

    var body: some View {
        HStack(spacing: 10) {
            // Tier accent bar
            RoundedRectangle(cornerRadius: 2)
                .fill(accent)
                .frame(width: 3)
                .frame(maxHeight: compact ? 40 : 54)

            VStack(alignment: .leading, spacing: compact ? 2 : 4) {
                // Kind pill
                HStack(spacing: 4) {
                    Image(systemName: kindIcon(toat.kind))
                        .font(.system(size: 10, weight: .semibold))
                    Text(toat.kind.uppercased())
                        .font(.system(size: 9, weight: .bold))
                        .tracking(0.8)
                }
                .foregroundColor(accent)

                // Title
                Text(toat.title)
                    .font(.system(size: compact ? 15 : 17, weight: .bold, design: .default))
                    .foregroundColor(.primary)
                    .lineLimit(compact ? 1 : 2)
                    .fixedSize(horizontal: false, vertical: true)

                // Time
                if let date = parsedDate {
                    Text(relativeTimeLabel(date))
                        .font(.system(size: compact ? 11 : 12, weight: .medium))
                        .foregroundColor(.secondary)
                } else if let loc = toat.location {
                    Label(loc, systemImage: "mappin")
                        .font(.system(size: compact ? 11 : 12))
                        .foregroundColor(.secondary)
                        .lineLimit(1)
                }
            }

            Spacer(minLength: 0)
        }
        .padding(.vertical, compact ? 6 : 8)
        .padding(.horizontal, 10)
        .background(accent.opacity(0.08), in: RoundedRectangle(cornerRadius: 10, style: .continuous))
    }
}

// MARK: - Compact row (subsequent toats)

private struct CompactToatRow: View {
    let toat: WidgetToat

    private var parsedDate: Date? { parseISO(toat.time) }

    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: kindIcon(toat.kind))
                .font(.system(size: 13, weight: .medium))
                .foregroundColor(tierColor(toat.tier))
                .frame(width: 18, alignment: .center)

            Text(toat.title)
                .font(.system(size: 13, weight: .medium))
                .foregroundColor(.primary)
                .lineLimit(1)

            Spacer(minLength: 4)

            if let date = parsedDate {
                Text(timeOnly(date))
                    .font(.system(size: 11, weight: .regular))
                    .foregroundColor(.secondary)
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
                    // Wordmark top-right
                    HStack {
                        Spacer()
                        ToatreWordmark()
                    }

                    Spacer(minLength: 6)

                    // Kind icon large
                    Image(systemName: kindIcon(first.kind))
                        .font(.system(size: 22, weight: .semibold))
                        .foregroundColor(tierColor(first.tier))

                    Spacer(minLength: 6)

                    // Title
                    Text(first.title)
                        .font(.system(size: 15, weight: .bold))
                        .foregroundColor(.primary)
                        .lineLimit(2)
                        .fixedSize(horizontal: false, vertical: true)

                    Spacer(minLength: 4)

                    // Time
                    if let date = parseISO(first.time) {
                        Text(relativeTimeLabel(date))
                            .font(.system(size: 10, weight: .medium))
                            .foregroundColor(tierColor(first.tier))
                    }

                    // Tier dot strip
                    HStack(spacing: 3) {
                        ForEach(0..<3) { i in
                            Capsule()
                                .fill(i == 0 ? tierColor(first.tier) : Color(.quaternaryLabel))
                                .frame(width: i == 0 ? 16 : 6, height: 3)
                        }
                    }
                    .padding(.top, 6)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
                .padding(14)
            } else {
                EmptyStateView()
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .padding(14)
            }
        }
        .widgetBackground()
    }
}

private struct MediumWidgetView: View {
    let entry: ToatEntry

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            // Header row
            HStack {
                Text("NEXT UP")
                    .font(.system(size: 9, weight: .bold))
                    .tracking(1.2)
                    .foregroundColor(.secondary)
                Spacer()
                ToatreWordmark()
            }

            if entry.toats.isEmpty {
                Spacer()
                EmptyStateView().frame(maxWidth: .infinity)
                Spacer()
            } else {
                // Hero — first toat
                HeroToatView(toat: entry.toats[0], compact: true)

                // Up to 2 more
                let rest = Array(entry.toats.dropFirst().prefix(2))
                if !rest.isEmpty {
                    VStack(spacing: 6) {
                        ForEach(Array(rest.enumerated()), id: \.offset) { idx, toat in
                            CompactToatRow(toat: toat)
                            if idx < rest.count - 1 {
                                Divider()
                            }
                        }
                    }
                }

                Spacer(minLength: 0)
            }
        }
        .padding(14)
        .widgetBackground()
    }
}

private struct LargeWidgetView: View {
    let entry: ToatEntry

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            // Header row
            HStack {
                Text("NEXT UP")
                    .font(.system(size: 9, weight: .bold))
                    .tracking(1.2)
                    .foregroundColor(.secondary)
                Spacer()
                ToatreWordmark()
            }

            if entry.toats.isEmpty {
                Spacer()
                EmptyStateView().frame(maxWidth: .infinity)
                Spacer()
            } else {
                // Hero — first toat, full size
                HeroToatView(toat: entry.toats[0], compact: false)

                // Up to 4 more
                let rest = Array(entry.toats.dropFirst().prefix(4))
                if !rest.isEmpty {
                    Text("COMING UP")
                        .font(.system(size: 9, weight: .bold))
                        .tracking(1.2)
                        .foregroundColor(.secondary)
                        .padding(.top, 2)

                    VStack(spacing: 8) {
                        ForEach(Array(rest.enumerated()), id: \.offset) { idx, toat in
                            CompactToatRow(toat: toat)
                            if idx < rest.count - 1 {
                                Divider()
                            }
                        }
                    }
                }

                Spacer(minLength: 0)
            }
        }
        .padding(16)
        .widgetBackground()
    }
}

private struct ToatreWordmark: View {
    var body: some View {
        Text("toatre")
            .font(.system(size: 10, weight: .bold, design: .rounded))
            .foregroundColor(Color(red: 0.55, green: 0.47, blue: 1.0))
            .tracking(2)
            .textCase(.uppercase)
    }
}

// MARK: - Background helper (iOS 17+ uses containerBackground)

extension View {
    @ViewBuilder
    func widgetBackground() -> some View {
        if #available(iOSApplicationExtension 17.0, *) {
            self.containerBackground(.background, for: .widget)
        } else {
            self.background(Color(.systemBackground))
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
