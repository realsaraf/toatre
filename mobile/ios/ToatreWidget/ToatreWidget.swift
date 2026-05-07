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
    case "meeting":  return "video.fill"
    case "event":    return "calendar"
    case "task":     return "checkmark.circle"
    case "idea":     return "lightbulb"
    case "errand":   return "cart"
    case "deadline": return "clock.badge.exclamationmark"
    default:         return "sparkles"
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

// MARK: - Widget palette (matches the light app/widget mockups)

private let bgColor = Color(red: 0.988, green: 0.985, blue: 1.0)
private let bgGlowPink = Color(red: 1.0, green: 0.73, blue: 0.82, opacity: 0.18)
private let bgGlowBlue = Color(red: 0.72, green: 0.84, blue: 1.0, opacity: 0.18)
private let surfaceColor = Color.white
private let softSurface = Color(red: 0.972, green: 0.969, blue: 0.995)
private let strokeColor = Color(red: 0.91, green: 0.89, blue: 0.98)
private let shadowColor = Color(red: 0.17, green: 0.14, blue: 0.33, opacity: 0.08)
private let textPrimary = Color(red: 0.08, green: 0.11, blue: 0.23)
private let textSecondary = Color(red: 0.43, green: 0.46, blue: 0.57)
private let brandBlue = Color(red: 0.27, green: 0.34, blue: 0.95)
private let brandPurple = Color(red: 0.43, green: 0.24, blue: 0.95)
private let brandPink = Color(red: 0.95, green: 0.16, blue: 0.55)
private let brandOrange = Color(red: 0.98, green: 0.62, blue: 0.05)
private let brandPurpleSoft = Color(red: 0.95, green: 0.93, blue: 1.0)

private func kindAccent(_ kind: String) -> Color {
    switch kind {
    case "meeting":  return Color(red: 0.17, green: 0.49, blue: 1.0)
    case "event":    return brandPurple
    case "task":     return Color(red: 0.43, green: 0.84, blue: 0.44)
    case "idea":     return Color(red: 1.0, green: 0.73, blue: 0.20)
    case "errand":   return Color(red: 1.0, green: 0.55, blue: 0.12)
    case "deadline": return Color(red: 1.0, green: 0.31, blue: 0.58)
    default:           return brandPurple
    }
}

private func subtitleText(for toat: WidgetToat) -> String {
    if let location = toat.location, !location.isEmpty {
        return location
    }
    return toat.kind.capitalized
}

private func tierLabel(_ tier: String) -> String {
    switch tier {
    case "urgent":
        return "Urgent"
    case "important":
        return "Important"
    default:
        return "Regular"
    }
}

private func awayLabel(_ date: Date) -> String {
    let minutes = Int(date.timeIntervalSinceNow / 60)
    if minutes <= 0 { return "Now" }
    if minutes < 60 { return "\(minutes) min away" }
    let hours = minutes / 60
    let remainder = minutes % 60
    if remainder == 0 { return "\(hours)h away" }
    return "\(hours)h \(remainder)m away"
}

private func listTimeLabel(_ date: Date) -> String {
    let calendar = Calendar.current
    if calendar.isDateInTomorrow(date) {
        return "Tomorrow"
    }
    return timeOnly(date).uppercased()
}

private func attentionCount(_ toats: [WidgetToat]) -> Int {
    toats.filter { $0.tier == "urgent" || $0.tier == "important" }.count
}

private struct WidgetShell<Content: View>: View {
    @ViewBuilder let content: Content

    init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }

    var body: some View {
        ZStack {
            LinearGradient(
                colors: [bgColor, Color.white],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )

            Circle()
                .fill(bgGlowPink)
                .frame(width: 160, height: 160)
                .blur(radius: 30)
                .offset(x: -78, y: -54)

            Circle()
                .fill(bgGlowBlue)
                .frame(width: 180, height: 180)
                .blur(radius: 34)
                .offset(x: 88, y: 96)

            content
        }
    }
}

private struct SurfaceCard<Content: View>: View {
    let radius: CGFloat
    @ViewBuilder let content: Content

    init(radius: CGFloat = 24, @ViewBuilder content: () -> Content) {
        self.radius = radius
        self.content = content()
    }

    var body: some View {
        content
            .background(
                ZStack {
                    RoundedRectangle(cornerRadius: radius, style: .continuous)
                        .fill(
                            LinearGradient(
                                colors: [surfaceColor, softSurface],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )

                    RoundedRectangle(cornerRadius: radius, style: .continuous)
                        .fill(Color.white.opacity(0.46))
                        .blur(radius: 24)
                        .offset(x: -16, y: -18)
                }
            )
            .overlay(
                RoundedRectangle(cornerRadius: radius, style: .continuous)
                    .stroke(strokeColor, lineWidth: 1)
            )
            .shadow(color: shadowColor, radius: 22, x: 0, y: 12)
    }
}

private struct ToatreGlyph: View {
    let size: CGFloat

    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: size * 0.32, style: .continuous)
                .fill(
                    LinearGradient(
                        colors: [brandBlue, brandPurple, brandPink, brandOrange],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )

            ZStack {
                Capsule(style: .continuous)
                    .fill(Color.white)
                    .frame(width: size * 0.15, height: size * 0.52)
                    .offset(x: -size * 0.16, y: -size * 0.18)

                Capsule(style: .continuous)
                    .fill(Color.white)
                    .frame(width: size * 0.36, height: size * 0.15)
                    .offset(x: -size * 0.27, y: -size * 0.03)

                Capsule(style: .continuous)
                    .fill(Color.white)
                    .frame(width: size * 0.34, height: size * 0.15)
                    .offset(x: size * 0.02, y: -size * 0.03)

                Circle()
                    .stroke(Color.white, style: StrokeStyle(lineWidth: size * 0.15, lineCap: .round))
                    .frame(width: size * 0.54, height: size * 0.54)
                    .offset(x: size * 0.14, y: size * 0.13)

                ZStack {
                    Capsule(style: .continuous)
                        .fill(Color.white)
                        .frame(width: size * 0.06, height: size * 0.16)
                        .offset(x: -size * 0.02, y: -size * 0.01)
                        .rotationEffect(.degrees(18))

                    Capsule(style: .continuous)
                        .fill(Color.white)
                        .frame(width: size * 0.15, height: size * 0.06)
                        .offset(x: size * 0.04, y: size * 0.05)
                    
                    Circle()
                        .fill(Color.white)
                        .frame(width: size * 0.05, height: size * 0.05)
                }
                .frame(width: size * 0.22, height: size * 0.22)
                .offset(x: size * 0.14, y: size * 0.13)
            }
        }
        .frame(width: size, height: size)
        .shadow(color: brandPurple.opacity(0.18), radius: 18, x: 0, y: 10)
    }
}

private struct ToatreHeader: View {
    var compact: Bool = false

    var body: some View {
        HStack(spacing: compact ? 8 : 10) {
            ToatreGlyph(size: compact ? 24 : 28)

            VStack(alignment: .leading, spacing: compact ? 1 : 2) {
                Text("toatre")
                    .font(.system(size: compact ? 13 : 14, weight: .bold, design: .rounded))
                    .foregroundColor(textPrimary)

                if !compact {
                    Text("timeline")
                        .font(.system(size: 10, weight: .semibold))
                        .foregroundColor(textSecondary)
                }
            }
        }
    }
}

private struct TierPill: View {
    let tier: String

    var body: some View {
        Text(tierLabel(tier))
            .font(.system(size: 10, weight: .bold))
            .foregroundColor(tierColor(tier))
            .padding(.horizontal, 9)
            .padding(.vertical, 5)
            .background(
                Capsule()
                    .fill(tierColor(tier).opacity(0.12))
            )
    }
}

private struct TimeBadge: View {
    let text: String

    var body: some View {
        HStack(spacing: 6) {
            Image(systemName: "clock")
                .font(.system(size: 11, weight: .semibold))
            Text(text)
                .font(.system(size: 11, weight: .semibold))
        }
        .foregroundColor(textPrimary)
        .padding(.horizontal, 10)
        .padding(.vertical, 6)
        .background(
            Capsule()
                .fill(surfaceColor)
        )
        .overlay(
            Capsule()
                .stroke(strokeColor, lineWidth: 1)
        )
        .shadow(color: shadowColor, radius: 12, x: 0, y: 6)
    }
}

private struct KindIconTile: View {
    let toat: WidgetToat
    var size: CGFloat = 48

    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: size * 0.28, style: .continuous)
                .fill(
                    LinearGradient(
                        colors: [kindAccent(toat.kind).opacity(0.9), kindAccent(toat.kind)],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )

            Image(systemName: kindIcon(toat.kind))
                .font(.system(size: size * 0.36, weight: .semibold))
                .foregroundColor(.white)
        }
        .frame(width: size, height: size)
        .shadow(color: kindAccent(toat.kind).opacity(0.18), radius: 16, x: 0, y: 8)
    }
}

private struct TimelineMarker: View {
    let color: Color
    let showTail: Bool

    var body: some View {
        VStack(spacing: 0) {
            Circle()
                .fill(color)
                .frame(width: 10, height: 10)
                .overlay(Circle().stroke(surfaceColor, lineWidth: 2))

            if showTail {
                Rectangle()
                    .fill(color.opacity(0.22))
                    .frame(width: 2)
            }
        }
        .frame(width: 12)
    }
}

private struct EmptyStateView: View {
    var body: some View {
        SurfaceCard(radius: 22) {
            HStack(spacing: 12) {
                ToatreGlyph(size: 40)

                VStack(alignment: .leading, spacing: 2) {
                    Text("You're all clear")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundColor(textPrimary)
                    Text("No open toats right now.")
                        .font(.system(size: 12, weight: .medium))
                        .foregroundColor(textSecondary)
                }

                Spacer(minLength: 0)
            }
            .padding(14)
        }
    }
}

private struct HeroToatCard: View {
    let toat: WidgetToat

    private var date: Date? { parseISO(toat.time) }

    var body: some View {
        SurfaceCard(radius: 26) {
            ZStack(alignment: .topTrailing) {
                Circle()
                    .fill(kindAccent(toat.kind).opacity(0.08))
                    .frame(width: 132, height: 132)
                    .offset(x: 32, y: -26)

                VStack(alignment: .leading, spacing: 14) {
                    HStack(alignment: .center) {
                        HStack(spacing: 8) {
                            Text("UP NEXT")
                                .font(.system(size: 10, weight: .bold))
                                .foregroundColor(brandPurple)
                                .padding(.horizontal, 10)
                                .padding(.vertical, 5)
                                .background(
                                    Capsule()
                                        .fill(brandPurpleSoft)
                                )

                            TierPill(tier: toat.tier)
                        }

                        Spacer()

                        if let date {
                            TimeBadge(text: timeOnly(date))
                        }
                    }

                    HStack(alignment: .center, spacing: 14) {
                        KindIconTile(toat: toat, size: 58)

                        VStack(alignment: .leading, spacing: 6) {
                            Text(toat.title)
                                .font(.system(size: 18, weight: .bold))
                                .foregroundColor(textPrimary)
                                .lineLimit(2)

                            Text(subtitleText(for: toat))
                                .font(.system(size: 13, weight: .medium))
                                .foregroundColor(textSecondary)
                                .lineLimit(1)

                            if let date {
                                HStack(spacing: 6) {
                                    Image(systemName: "clock")
                                        .font(.system(size: 12, weight: .semibold))
                                    Text(awayLabel(date))
                                        .font(.system(size: 13, weight: .semibold))
                                }
                                .foregroundColor(brandPurple)
                            }
                        }

                        Spacer(minLength: 0)
                    }
                }
                .padding(16)
            }
        }
    }
}

private struct MediumLeadCard: View {
    let toat: WidgetToat

    private var date: Date? { parseISO(toat.time) }

    var body: some View {
        SurfaceCard(radius: 24) {
            HStack(alignment: .top, spacing: 14) {
                VStack(alignment: .leading, spacing: 8) {
                    HStack(spacing: 8) {
                        Text("UP NEXT")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(brandPurple)
                        TierPill(tier: toat.tier)
                    }

                    Text(toat.title)
                        .font(.system(size: 17, weight: .bold))
                        .foregroundColor(textPrimary)
                        .lineLimit(2)

                    Text(subtitleText(for: toat))
                        .font(.system(size: 12, weight: .medium))
                        .foregroundColor(textSecondary)
                        .lineLimit(1)

                    if let date {
                        HStack(spacing: 6) {
                            Image(systemName: "clock")
                                .font(.system(size: 11, weight: .semibold))
                            Text(awayLabel(date))
                                .font(.system(size: 12, weight: .semibold))
                        }
                        .foregroundColor(kindAccent(toat.kind))
                    }
                }

                Spacer(minLength: 0)

                KindIconTile(toat: toat, size: 46)
            }
            .padding(14)
        }
    }
}

private struct ScheduleRow: View {
    let toat: WidgetToat
    let showTail: Bool
    var largeIcon: Bool = false

    private var date: Date? { parseISO(toat.time) }

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            TimelineMarker(color: kindAccent(toat.kind), showTail: showTail)
                .padding(.top, 4)

            VStack(alignment: .leading, spacing: 3) {
                if let date {
                    Text(listTimeLabel(date))
                        .font(.system(size: 10, weight: .bold))
                        .foregroundColor(kindAccent(toat.kind))
                }

                Text(toat.title)
                    .font(.system(size: largeIcon ? 16 : 14, weight: .semibold))
                    .foregroundColor(textPrimary)
                    .lineLimit(1)

                Text(subtitleText(for: toat))
                    .font(.system(size: 12, weight: .medium))
                    .foregroundColor(textSecondary)
                    .lineLimit(1)
            }

            Spacer(minLength: 8)

            KindIconTile(toat: toat, size: largeIcon ? 38 : 32)
        }
    }
}

private struct FooterStats: View {
    let total: Int
    let attention: Int

    var body: some View {
        HStack(spacing: 16) {
            Label("\(total) open", systemImage: "clock")
            Label("\(attention) focus", systemImage: "exclamationmark.circle")
        }
        .font(.system(size: 10, weight: .medium))
        .foregroundColor(textSecondary)
    }
}

// MARK: - Widget views per family

private struct SmallWidgetView: View {
    let entry: ToatEntry

    private var first: WidgetToat? { entry.toats.first }

    var body: some View {
        WidgetShell {
            Group {
                if let first {
                    VStack(alignment: .leading, spacing: 10) {
                        HStack {
                            ToatreHeader(compact: true)
                            Spacer()
                            TierPill(tier: first.tier)
                        }

                        Text("NEXT UP")
                            .font(.system(size: 9, weight: .bold))
                            .foregroundColor(brandPurple)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(Capsule().fill(brandPurpleSoft))

                        HStack(alignment: .top, spacing: 10) {
                            TimelineMarker(color: kindAccent(first.kind), showTail: true)

                            VStack(alignment: .leading, spacing: 6) {
                                Text(first.title)
                                    .font(.system(size: 14, weight: .bold))
                                    .foregroundColor(textPrimary)
                                    .lineLimit(2)

                                Text(subtitleText(for: first))
                                    .font(.system(size: 11, weight: .medium))
                                    .foregroundColor(textSecondary)
                                    .lineLimit(1)

                                HStack(spacing: 6) {
                                    KindIconTile(toat: first, size: 28)
                                    if let date = parseISO(first.time) {
                                        Text(awayLabel(date))
                                            .font(.system(size: 11, weight: .semibold))
                                            .foregroundColor(kindAccent(first.kind))
                                    } else {
                                        Text("Open now")
                                            .font(.system(size: 11, weight: .semibold))
                                            .foregroundColor(kindAccent(first.kind))
                                    }
                                }
                            }
                        }

                        Spacer(minLength: 0)
                    }
                    .padding(14)
                } else {
                    VStack {
                        Spacer(minLength: 0)
                        EmptyStateView()
                        Spacer(minLength: 0)
                    }
                    .padding(12)
                }
            }
        }
        .widgetBackground(bgColor)
    }
}

private struct MediumWidgetView: View {
    let entry: ToatEntry

    private var hero: WidgetToat? { entry.toats.first }
    private var supporting: [WidgetToat] { Array(entry.toats.dropFirst().prefix(1)) }

    var body: some View {
        WidgetShell {
            VStack(alignment: .leading, spacing: 12) {
                HStack {
                    ToatreHeader(compact: true)
                    Spacer()
                    Text("\(entry.toats.count) open")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundColor(textSecondary)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 5)
                        .background(Capsule().fill(Color.white.opacity(0.7)))
                }

                if let hero {
                    MediumLeadCard(toat: hero)

                    if !supporting.isEmpty {
                        SurfaceCard(radius: 20) {
                            VStack(spacing: 0) {
                                ForEach(Array(supporting.enumerated()), id: \.offset) { index, toat in
                                    ScheduleRow(
                                        toat: toat,
                                        showTail: index < supporting.count - 1,
                                        largeIcon: false
                                    )
                                    .padding(14)
                                }
                            }
                        }
                    }

                    Spacer(minLength: 0)
                } else {
                    Spacer(minLength: 0)
                    EmptyStateView()
                    Spacer(minLength: 0)
                }
            }
            .padding(14)
        }
        .widgetBackground(bgColor)
    }
}

private struct LargeWidgetView: View {
    let entry: ToatEntry

    private var hero: WidgetToat? { entry.toats.first }
    private var rows: [WidgetToat] { Array(entry.toats.dropFirst().prefix(3)) }

    var body: some View {
        WidgetShell {
            VStack(alignment: .leading, spacing: 12) {
                HStack(alignment: .top) {
                    VStack(alignment: .leading, spacing: 3) {
                        Text("TODAY")
                            .font(.system(size: 12, weight: .bold))
                            .foregroundColor(brandPurple)
                        Text("Own your slice of time")
                            .font(.system(size: 11, weight: .medium))
                            .foregroundColor(textSecondary)
                    }
                    Spacer()
                    ToatreHeader(compact: true)
                }

                if let hero {
                    HeroToatCard(toat: hero)

                    if !rows.isEmpty {
                        SurfaceCard(radius: 22) {
                            VStack(spacing: 12) {
                                ForEach(Array(rows.enumerated()), id: \.offset) { index, toat in
                                    ScheduleRow(toat: toat, showTail: index < rows.count - 1)
                                }
                            }
                            .padding(14)
                        }
                    }

                    FooterStats(
                        total: entry.toats.count,
                        attention: attentionCount(entry.toats)
                    )
                    .padding(.horizontal, 4)
                } else {
                    Spacer(minLength: 0)
                    EmptyStateView()
                    Spacer(minLength: 0)
                }

                Spacer(minLength: 0)
            }
            .padding(16)
        }
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
