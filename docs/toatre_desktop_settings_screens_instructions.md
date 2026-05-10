# Toatre Desktop Settings Screens — Implementation Prompt & UI Specification

## 0. Purpose

Build the desktop **Settings** experience for Toatre from the approved mockups and product direction.

This document is written as a detailed implementation prompt for an LLM, designer, or frontend engineer. It defines the exact layout, component hierarchy, visual rules, and screen-by-screen behavior for:

1. General
2. Notifications
3. Handle
4. Integrations

The Settings area must feel like a calm control center for Toatre. It should not feel like an enterprise admin dashboard.

---

## 1. Product principles for Settings

Settings should help the user control the product without forcing them to manage too many options.

Core principles:

- Keep the structure simple.
- Show only meaningful settings.
- Use clear section grouping.
- Avoid technical language.
- Avoid unnecessary configuration.
- Use autosave for most settings.
- Use explicit save only where the action is sensitive, such as changing a handle.
- Keep the design consistent with the desktop Timeline, Capture modal, and Toat detail layouts.

User-facing language should use:

- **Notifications**, not Pings, in the Settings navigation.
- **Handle**, for the public identity and booking page section.
- **Integrations**, for calendar and app connections.
- **Toat**, for saved timeline items.

---

## 2. Global desktop Settings layout

### 2.1 Overall shell

The Settings area uses the same desktop app shell as the rest of Toatre.

Layout:

```text
DesktopSettingsPage
├── AppSidebar
├── TopHeader
└── SettingsWorkspace
    ├── SettingsSectionNav
    └── SettingsContent
```

### 2.2 Page width and alignment

Use a full desktop canvas.

Approximate layout widths:

- App sidebar: 240px
- Settings section nav: 220–240px
- Main settings content: flexible, max readable width around 980–1100px

The main content must not stretch too wide. Keep cards readable and centered within the available workspace.

### 2.3 Background

Use a very light cool gray or off-white page background.

Cards should be white with subtle borders.

Avoid heavy shadows.

---

## 3. Primary app sidebar

The leftmost sidebar is the main app navigation and remains consistent across Toatre.

### 3.1 Sidebar structure

```text
AppSidebar
├── BrandBlock
├── MainNav
│   ├── Timeline
│   ├── Inbox
│   └── People
├── UtilityNav
│   ├── Settings
│   └── Help & feedback
└── SharedLinks
    ├── Toatre Link
    └── Bookings
```

### 3.2 Visible items

Top brand area:

- Toatre icon
- `toatre` wordmark

Main navigation:

- Timeline
- Inbox with badge `3`
- People

Utility section:

- Settings, active
- Help & feedback

Shared Links section:

- label: `SHARED LINKS`
- Toatre Link
- Bookings with badge `7`

### 3.3 Active state

Settings is active in this sidebar.

Use:

- soft lavender active background
- purple icon
- purple text
- rounded active item container

### 3.4 Do not include

Do not include:

- Search item in the sidebar
- My Toats classification block
- New Toat button
- Floating capture controls

Settings is a control surface, not a capture surface.

---

## 4. Top header

The top header runs across the content area.

### 4.1 Header structure

```text
TopHeader
├── GlobalSearch
└── HeaderActions
    ├── NotificationBell
    ├── UserAvatar
    └── DropdownCaret
```

### 4.2 Search

Placeholder:

`Search toats, people, places...`

Shortcut hint:

`⌘ K`

Style:

- white rounded input
- subtle border
- search icon at left
- keyboard shortcut pill at right

### 4.3 Right header actions

Show:

- notification bell with badge `2`
- circular user avatar
- small purple status dot
- dropdown caret

### 4.4 Do not include

Do not include:

- New Toat button
- floating mic
- keyboard capture button
- date selector

Those belong to Timeline, not Settings.

---

## 5. Settings section navigation

Inside the Settings workspace, there is a second left panel for Settings-specific areas.

### 5.1 Structure

```text
SettingsSectionNav
├── SettingsNavItem(General)
├── SettingsNavItem(Notifications)
├── SettingsNavItem(Handle)
└── SettingsNavItem(Integrations)
```

### 5.2 Items

Use exactly these core sections:

1. General
2. Notifications
3. Handle
4. Integrations

### 5.3 Item presentation

Each item includes:

- icon
- title
- optional helper line for sections that benefit from explanation

Recommended helper lines:

General:
- no helper line needed

Notifications:
- no helper line needed

Handle:
- `Reserve your handle & booking page`

Integrations:
- `Connect your calendars and apps`

### 5.4 Active state

The active item uses:

- soft lavender background
- purple icon
- purple text
- rounded rectangle container

Inactive items:

- transparent background
- dark text
- muted icon

---

## 6. Shared visual system

### 6.1 Color language

Primary accent:

- Toatre purple

Secondary accent colors:

- green for connected/success/available
- gray for inactive/disconnected
- blue only when needed for provider-specific actions
- red only for destructive actions

Use purple for:

- active settings section
- selected tabs
- selected segmented controls
- enabled switches
- important action links

### 6.2 Card style

All main content sections use white cards.

Card style:

- border: subtle light gray
- radius: 16–20px
- shadow: none or extremely subtle
- padding: 20–24px

### 6.3 Controls

Inputs and selects:

- height: 44–48px
- border: light gray
- radius: 10–14px
- white background
- right caret for dropdowns

Switches:

- enabled: purple track with white knob
- disabled: gray track with white knob

Tabs:

- text tabs with underline
- active text purple
- active underline purple
- inactive text muted gray
- no filled pill background

### 6.4 Typography

Suggested hierarchy:

- Page title: 28–32px, bold
- Section heading: 20–24px, bold
- Card title: 16–18px, semibold
- Row label: 14–15px, semibold
- Helper text: 12–14px, muted
- Values: 14–15px, medium

---

## 7. Atomic design system

### 7.1 Atoms

Required atoms:

```text
Icon
Avatar
Badge
StatusDot
Text
Button
IconButton
Input
Select
Switch
SegmentedControl
Tab
Divider
CardSurface
```

### 7.2 Molecules

Required molecules:

```text
AppNavItem
SettingsNavItem
TopSearchBar
HeaderUserMenu
SettingsCard
SettingsRow
ReadOnlyAccountIdentity
SocialLoginRow
PreferenceSelectField
ToggleSettingRow
TopTabs
ConnectionRow
HandleUrlField
LivePreviewCard
SavedStatusIndicator
```

### 7.3 Organisms

Required organisms:

```text
AppSidebar
TopHeader
SettingsSectionNav
GeneralSettingsPanel
NotificationsSettingsPanel
HandleSettingsPanel
IntegrationsSettingsPanel
```

---

# 8. General settings screen

## 8.1 Purpose

General contains the user’s basic account display and core app preferences.

Important: this screen should be simple and short.

### General must include

- Account
- Preferences
- Toat defaults

### General must not include

- Privacy section
- Appearance section
- Password row
- Editable name
- Editable email

The user signs in through social sign-in, so name and email are treated as provider-owned identity fields.

---

## 8.2 Active state

In the Settings section nav:

- General is active
- Notifications, Handle, Integrations are inactive

---

## 8.3 Page header

Title:

`Settings`

Subtitle:

`Manage your account, preferences and Toatre experience.`

---

## 8.4 General content order

```text
GeneralSettingsPanel
├── PageHeader
├── AccountCard
├── PreferencesCard
├── ToatDefaultsCard
└── SavedStatusIndicator
```

---

## 8.5 Account card

### Purpose

Show the signed-in account and provider.

### Layout

White card with two horizontal zones:

1. User identity row
2. Social sign-in row

### Identity row

Left:

- circular avatar

Middle:

- name
- email
- short bio / intro line

Right:

- button: `Edit bio & photo`

### Exact sample content

Name:

`Saraf T`

Email:

`saraf@example.com`

Bio:

`Builder of Toatre. Helping founders, engineers and creators make time for what matters.`

Button:

`Edit bio & photo`

### Critical rule

Name and email are read-only in Toatre.

Do not add:

- Edit name
- Edit email
- Change email
- Change password

### Social sign-in row

Below the identity row.

Content:

- Google icon
- text: `Signed in with Google`
- right button: `Manage account`
- optional external-link icon

Purpose:

The user can manage their identity from the connected provider, not directly inside Toatre.

---

## 8.6 Preferences card

### Purpose

Core app behavior preferences.

### Layout

One horizontal card with four columns.

```text
PreferencesCard
├── TimeZoneSelect
├── WeekStartsOnSelect
├── LanguageSelect
└── ThemeSegmentedControl
```

### Field 1: Time zone

Label:

`Time zone`

Value:

`(GMT+05:30) Asia/Kolkata`

Control:

Dropdown select

### Field 2: Week starts on

Label:

`Week starts on`

Value:

`Monday`

Control:

Dropdown select

### Field 3: Language

Label:

`Language`

Value:

`English`

Control:

Dropdown select

### Field 4: Theme

Label:

`Theme`

Control:

Segmented control

Options:

- Light
- System

Selected:

`Light`

Important:

Theme can live here as a compact preference, but there should be no separate Appearance card on this screen.

---

## 8.7 Toat defaults card

### Purpose

Define default behavior for newly created toats.

### Layout

One horizontal card with four columns.

```text
ToatDefaultsCard
├── DefaultDurationSelect
├── DefaultReminderSelect
├── DefaultCategorySelect
└── QuickCaptureBehaviorToggle
```

### Field 1: Default duration

Label:

`Default duration`

Value:

`30 mins`

Control:

Dropdown select

### Field 2: Default reminder

Label:

`Default reminder`

Value:

`10 mins before`

Control:

Dropdown select

### Field 3: Default category

Label:

`Default category`

Value:

`Personal`

Control:

Dropdown select with green dot

### Field 4: Quick-capture behavior

Label:

`Quick-capture behavior`

Helper:

`Split multiple requests into separate toats`

Control:

Enabled switch

---

## 8.8 Saved state indicator

At the bottom left of the content area:

- green check icon
- text: `All changes saved automatically.`

Keep it small and quiet.

---

# 9. Notifications settings screen

## 9.1 Purpose

Notifications controls how and when the user receives reminders, booking updates, and system delivery messages.

Use the word **Notifications** in the Settings UI.

Do not call this section Pings.

---

## 9.2 Active state

In the Settings section nav:

- Notifications is active

---

## 9.3 Page header

Title:

`Notifications`

Subtitle:

`Manage how and when you receive reminders and booking updates.`

---

## 9.4 Top tabs

Notifications has top tabs.

Tabs:

1. Delivery
2. Reminders
3. Bookings

Default active tab:

`Delivery`

Tab style:

- active tab uses purple text
- active tab has purple underline
- inactive tabs use muted text
- no pill background

---

## 9.5 Delivery tab content order

```text
NotificationsSettingsPanel
├── PageHeader
├── TopTabs
├── NotificationChannelsCard
├── ReminderDeliveryCard
├── QuietHoursCard
├── BookingNotificationsCard
└── SavedStatusIndicator
```

---

## 9.6 Notification channels card

Title:

`Notification channels`

Rows:

### Email

Title:

`Email`

Helper:

`Receive notifications at your primary email address.`

Control:

Enabled switch

### Push notifications

Title:

`Push notifications`

Helper:

`Receive notifications on your mobile devices.`

Control:

Enabled switch

### Desktop notifications

Title:

`Desktop notifications`

Helper:

`Receive notifications while using Toatre in this browser.`

Control:

Dropdown or status select with value:

`Enabled`

---

## 9.7 Reminder delivery card

Title:

`Reminder delivery`

Rows:

### Upcoming toat reminders

Title:

`Upcoming toat reminders`

Helper:

`Remind me before toats begin.`

Control:

Dropdown value:

`10 mins before`

### Start time notifications

Title:

`Start time notifications`

Helper:

`Notify me when a toat is starting.`

Control:

Dropdown value:

`At start time`

### Daily summary

Title:

`Daily summary`

Helper:

`Send a simple summary of my day each morning.`

Control:

Enabled switch

---

## 9.8 Quiet hours card

Title:

`Quiet hours`

Helper:

`Pause non-urgent notifications during quiet hours.`

Main control:

Enabled switch

Fields:

1. Start time: `10:00 PM`
2. End time: `7:00 AM`
3. Time zone: `(GMT+05:30) Asia/Kolkata`

Layout:

Use a horizontal row of three fields under the quiet hours description.

---

## 9.9 Booking notifications card

Title:

`Booking notifications`

Rows:

1. New booking request
2. Booking confirmed
3. Booking cancelled
4. Reschedule request

Each row contains:

- icon
- title
- helper text
- Email pill
- Push pill
- chevron

### Row 1

Title:

`New booking request`

Helper:

`Notify me when I receive a new booking request.`

### Row 2

Title:

`Booking confirmed`

Helper:

`Notify me when a booking is confirmed.`

### Row 3

Title:

`Booking cancelled`

Helper:

`Notify me when a booking is cancelled.`

### Row 4

Title:

`Reschedule request`

Helper:

`Notify me when a reschedule is requested.`

Channel pills:

- `Email`
- `Push`

Style:

- small purple-tinted pills
- check icon optional

---

## 9.10 Reminders tab requirements

The Reminders tab is not the default mock state, but the implementation should support it.

Purpose:

Control reminder behavior without exposing too many internal rules.

Recommended cards:

1. Default reminder timing
2. Location-based reminders
3. Important toats
4. Snooze behavior

Keep it simple.

Do not expose a full technical reminder-policy matrix.

---

## 9.11 Bookings tab requirements

Purpose:

Control booking-related notification behavior.

Recommended cards:

1. Booking requests
2. Confirmations and cancellations
3. Guest reminders
4. Owner daily booking summary

---

# 10. Handle settings screen

## 10.1 Purpose

Handle is where the user manages their public identity and booking page.

This section includes:

- handle reservation
- public booking page basics
- availability setup
- booking rules

---

## 10.2 Active state

In the Settings section nav:

- Handle is active

---

## 10.3 Page heading

Main page title can remain:

`Settings`

Inside the content area, show section header:

Title:

`Handle`

Subtitle:

`Reserve your handle and configure your public booking page.`

---

## 10.4 Top tabs

Handle has top tabs.

Tabs:

1. Handle
2. Page
3. Availability
4. Booking rules

Default active tab for the current mock:

`Handle`

---

## 10.5 Handle tab content order

```text
HandleSettingsPanel
├── PageHeader
├── SectionHeader
├── TopTabs
├── YourHandleCard
├── HandleReservationCard
├── PageBasicsCard
├── VisibilityCard
└── SavedStatusIndicator
```

---

## 10.6 Your handle card

Title:

`Your handle`

Main URL field:

`toatre.com/saraf`

Status pill:

`Live`

Helper text:

`This is your public page used for bookings.`

Right action:

`Copy link`

with copy icon.

Style:

- one clean card
- URL appears inside a bordered field
- green status pill inside or near the field

---

## 10.7 Handle reservation card

Title:

`Handle reservation`

Input value:

`@saraf`

Availability status:

`Available`

Helper text:

`Handles must be unique. Letters, numbers, and underscores only.`

Right action:

`Save handle`

Behavior:

Changing a handle should not autosave. It should require pressing `Save handle`.

---

## 10.8 Page basics card

This card has two columns.

Left column:

- editable page basics

Right column:

- live preview

### Left fields

Field 1:

Label:

`Page title`

Value:

`Saraf T`

Counter:

`7 / 60`

Field 2:

Label:

`Greeting message`

Value:

`Let's find the perfect time to connect.`

Counter:

`37 / 100`

Field 3:

Label:

`Intro line`

Value:

`Builder of Toatre. Helping founders, engineers and creators make time for what matters.`

Counter:

`84 / 160`

### Right live preview

Title:

`Live preview`

Preview card contains:

- avatar
- name: `Saraf T`
- greeting line
- intro line
- CTA button: `Book time with me`

The live preview should feel like a small version of the public booking page.

---

## 10.9 Visibility card

Title:

`Visibility`

Rows:

### Public page enabled

Helper:

`Make your booking page accessible via your handle.`

Control:

Enabled switch

### Collect guest email before showing availability

Helper:

`Ask for email before displaying availability options.`

Control:

Enabled switch

### Hide from search engines

Helper:

`Prevent your page from appearing in search engine results.`

Control:

Disabled switch

---

## 10.10 Page tab requirements

Purpose:

Customize the public booking page.

Recommended cards:

1. Page copy
2. Profile photo
3. Cover image, optional
4. Live public preview
5. Confirmation message

Keep customization limited. Do not turn this into a full website builder.

---

## 10.11 Availability tab requirements

Purpose:

Configure when people can book.

Recommended cards:

1. Available days
2. Daily time window
3. Slot duration
4. Buffer between slots
5. Different hours for specific days
6. Blocked days
7. Time zone

This tab must support per-day availability later, but keep the default setup clean.

---

## 10.12 Booking rules tab requirements

Purpose:

Control how bookings work.

Recommended cards:

1. Booking mode
2. Minimum notice
3. Maximum days in advance
4. Maximum bookings per day
5. Guest info requirements
6. Rescheduling and cancellation rules
7. Meeting method

Booking mode options:

- Instant booking
- Request approval

Meeting method options:

- Video
- Phone
- In person
- Custom

---

# 11. Integrations settings screen

## 11.1 Purpose

Integrations is where the user connects calendars and manages how Toatre checks availability and creates booked sessions.

The v1 focus is calendar integrations and meeting provider defaults.

---

## 11.2 Active state

In the Settings section nav:

- Integrations is active

---

## 11.3 Page header

Title:

`Integrations`

Subtitle:

`Connect your calendars and manage how events are synced.`

---

## 11.4 Top tabs

Tabs:

1. Connected calendars
2. Sync rules
3. Conflict handling

Default active tab:

`Connected calendars`

---

## 11.5 Connected calendars tab content order

```text
IntegrationsSettingsPanel
├── PageHeader
├── TopTabs
├── ConnectedCalendarsCard
├── SettingsGrid
│   ├── PrimaryCalendarForBookingsCard
│   └── AvailabilitySyncCard
├── SettingsGrid
│   ├── DefaultMeetingProviderCard
│   └── CalendarSyncStatusCard
└── SavedStatusIndicator
```

---

## 11.6 Connected calendars card

Title:

`Connected calendars`

Rows:

### Google Calendar

Icon:

Google Calendar icon

Title:

`Google Calendar`

Subtitle:

`saraf.t@toatre.com`

Status:

green dot + `Connected`

Action:

`Manage`

### Outlook Calendar

Icon:

Outlook icon

Title:

`Outlook Calendar`

Subtitle:

`Connect your Outlook calendar`

Status:

gray dot + `Not connected`

Action:

`Connect`

### Apple Calendar

Icon:

Apple Calendar icon

Title:

`Apple Calendar`

Subtitle:

`Connect your iCloud calendar`

Status:

gray dot + `Not connected`

Action:

`Connect`

---

## 11.7 Primary calendar for bookings card

Title:

`Primary calendar for bookings`

Helper:

`Choose where booked sessions will be added.`

Control:

Dropdown value:

`Google Calendar (saraf.t@toatre.com)`

---

## 11.8 Availability sync card

Title:

`Availability sync`

Helper:

`Select which calendars to check for conflicts.`

Selected calendar:

`Google Calendar (saraf.t@toatre.com)`

Action:

`Add calendar`

Right-side toggles:

1. `Blocking busy times` enabled
2. `Read-only imported events` enabled
3. `Two-way sync if supported` disabled

Important product note:

Read-only imported events should be clear. Toatre should not surprise the user by changing external calendar data unless the user explicitly enables two-way sync.

---

## 11.9 Default meeting provider card

Title:

`Default meeting provider`

Helper:

`Choose the meeting tool to use for new bookings.`

Options:

- Google Meet, selected
- Zoom
- Microsoft Teams

Use radio-card or segmented-card style.

---

## 11.10 Calendar sync status card

Title:

`Calendar sync status`

Content:

Label:

`Last synced`

Value:

`2 minutes ago`

Green check icon.

Action button:

`Sync now`

---

## 11.11 Sync rules tab requirements

Purpose:

Control how Toatre interacts with connected calendars.

Recommended cards:

1. Import direction
2. Export direction
3. Sync start date
4. Include/exclude all-day events
5. Booking calendar behavior

Use plain English.

Avoid technical words like OAuth, scopes, API, webhook.

---

## 11.12 Conflict handling tab requirements

Purpose:

Control how Toatre handles conflicts when people book through the user’s handle page.

Recommended cards:

1. Treat busy events as unavailable
2. Ignore tentative events
3. Buffer before calendar events
4. Buffer after calendar events
5. Conflict warning behavior

---

# 12. Shared component details

## 12.1 Settings card

Use for all grouped settings.

Structure:

```text
SettingsCard
├── CardHeader
│   ├── Title
│   └── OptionalDescription
└── CardBody
```

Style:

- white background
- subtle border
- rounded corners
- internal padding
- no heavy shadow

---

## 12.2 Settings row

Structure:

```text
SettingsRow
├── LeadingIcon
├── TextBlock
│   ├── Title
│   └── HelperText
└── ControlArea
```

Rows should be separated by subtle dividers.

---

## 12.3 Top tabs

Structure:

```text
TopTabs
├── Tab(active)
├── Tab
└── Tab
```

Style:

- horizontal row
- active underline
- purple active text
- muted inactive text

Use top tabs only for:

- Notifications
- Handle
- Integrations

Do not add tabs to General.

---

## 12.4 Saved status indicator

Place at bottom of content area.

Content:

`All changes saved automatically.`

Style:

- green check icon
- muted text
- small
- left aligned

---

# 13. Explicit exclusions

Do not include the following in the Settings screens:

1. New Toat button in the header
2. Floating capture controls
3. Search item in the primary sidebar
4. My Toats category block
5. Privacy card inside General
6. Appearance card inside General
7. Password row inside General
8. Editable name field
9. Editable email field
10. Technical OAuth/API wording
11. Excessive toggles
12. Pings as a settings section name

Use **Notifications**, not Pings.

---

# 14. Implementation behavior rules

## 14.1 Autosave

Most settings autosave.

Show:

`All changes saved automatically.`

## 14.2 Explicit save

Use explicit save for:

- Handle changes

Do not autosave handle edits immediately.

## 14.3 Social sign-in identity

Name and email are read-only.

The user is signed in through Google or another provider.

Use:

`Signed in with Google`

and

`Manage account`

## 14.4 Integrations

Connect actions open provider connection flow.

Manage actions open provider-specific integration settings.

Do not show technical integration details unless necessary.

---

# 15. Final quality bar

The Settings experience is successful when:

- the user immediately understands the four core settings areas
- General is short and clean
- Notifications are grouped without feeling overwhelming
- Handle clearly owns booking-page setup
- Integrations clearly focus on calendars and meeting tools
- social-login identity is not accidentally treated as editable
- the design feels consistent with Timeline and Capture
- there are no unnecessary or imaginary options

Settings should feel like Toatre’s quiet control room.
