# Toatre Desktop Timeline Page — Full UI Build Specification

## Purpose

This document defines the **desktop Timeline page** for Toatre in enough detail that an LLM or frontend engineer can build it without guessing. It is written as a **source-of-truth implementation spec**, using **atomic design language** and covering:

- page structure
- layout and sizing
- design tokens
- component hierarchy
- exact visible content
- interaction behavior
- composition rules
- exclusions / what not to include

This spec is for the **desktop view only**.

---

# 1. Product intent of this page

The Timeline page is the main home screen of Toatre.

It must communicate:

- everything is in **chronological order**
- Toatre is **not a calendar-first product**
- the user’s day is organized as a vertical timeline of **toats**
- the user can always quickly capture a new toat using the **floating capture control**
- a selected toat can be explored in detail in the **right-side detail panel**

This page must feel:

- clean
- calm
- premium
- light
- Apple-like
- structured
- spacious
- visually chronological

It must not feel:

- dense enterprise software
- a project-management board
- a traditional calendar grid
- a cluttered dashboard

---

# 2. Screen type and scope

- Platform: desktop web app
- Layout type: full app shell
- Background: very light gray / off-white app background
- Main structure: **left navigation rail + top header + center timeline + right detail panel**

This spec describes the state where:

- the user is on the **Timeline** page
- one toat is already selected
- the floating capture controls are visible
- no capture modal is open
- no New Toat button should appear in the header

---

# 3. Global layout architecture

## 3.1 Page frame

Use a full-width desktop application shell.

### Outer composition

- Full viewport height
- Full viewport width
- No browser chrome in the mock implementation
- Soft background color behind all panels

### Horizontal structure

The page has **3 vertical zones**:

1. **Left sidebar navigation**
2. **Main content area**
3. **Right detail sidebar**

### Approximate width split

Use this guidance:

- Left sidebar: `~220px`
- Main content area: flexible / primary area
- Right detail panel: `~380px`

If needed, think of the content width ratio roughly as:

- left rail: 15%
- center content: 55%
- right detail: 30%

Do not make the right panel too narrow.

---

## 3.2 Top header bar

The header spans across the app content area horizontally and sits above the center and right columns.

### Header contents, left to right

1. brand/logo block at far left inside the app shell
2. top search bar
3. date navigation controls in the center
4. floating-capture area is **not** in the header; it stays floating over the content area
5. notifications icon
6. user avatar with small status dot and dropdown caret

### Explicit instruction

**Do not include a “New Toat” button in the header.**
This has been intentionally removed from the design direction.

---

# 4. Design tokens

These are not strict code variables, but they define the visual language that the implementation should follow.

## 4.1 Color system

### Primary accent

Toatre uses a purple-led gradient accent system.

Primary accent family:

- deep violet
- electric purple
- pink-magenta
- warm orange

Use these for:

- active controls
- gradient mic button
- selected chips when appropriate
- focus accents
- branded highlights

### Neutral palette

Use a soft light neutral system:

- page background: very light cool gray
- cards: white
- elevated cards: white with soft shadow
- panel background: white / faint tint
- borders: extremely subtle light gray
- primary text: near-black navy
- secondary text: muted slate gray
- tertiary text: lighter muted gray

### Semantic colors for toat types

Use soft but distinct colors for timeline dots and type icons.

Suggested mapping based on current visual language:

- orange = location/errand
- purple = meeting / collaboration
- blue = focus / calls / work session
- green = personal / home / pickup / mobility
- amber/yellow = idea or special highlight if needed

Do not oversaturate the page.

---

## 4.2 Radius

Rounded corners are important.

Use consistent soft rounded corners.

Recommended:

- large cards / panels: `20–24px`
- buttons / chips: `12–16px`
- small icon containers: `14–18px`
- circular buttons: fully rounded

---

## 4.3 Shadows

Use subtle elevation only.

- no heavy drop shadows
- cards should feel lifted very lightly
- floating controls may have slightly more elevation than regular cards

---

## 4.4 Typography

Use a modern sans-serif system.

### Hierarchy

- page title: bold, large
- section titles: semibold
- toat titles: semibold to bold
- metadata / labels: regular
- small helper text: regular, muted

### Tone

Text should feel human and crisp.

Avoid overly technical copy.

---

## 4.5 Spacing rhythm

Use a roomy spacing system.

Guideline rhythm:

- `8px` micro spacing
- `12px` compact spacing
- `16px` default spacing
- `20px` section padding
- `24px` card padding
- `32px` major section spacing

Never cram content.

---

# 5. Atomic design breakdown

This section defines the page from **atoms → molecules → organisms → templates**.

---

# 6. Atoms

## 6.1 Brand mark atom

### Structure

- small square or rounded-square colorful Toatre icon
- text wordmark: `toatre`

### Placement

Top-left of the left sidebar header area.

### Style

- icon uses Toatre gradient palette
- wordmark is dark navy text
- sufficient breathing room around it

---

## 6.2 Icon atom

Use a consistent outline or lightly filled icon system.

Required icon categories:

- timeline
- inbox
- people
- search
- gear/settings
- help
- notification bell
- dropdown caret
- calendar/nav arrows
- directions
- join/video
- home
- restaurant/meal
- meeting/provider icons
- upload / file / ping icons where needed

Icons should be:

- clean
- slightly rounded
- visually consistent
- not too thin

---

## 6.3 Avatar atom

### Usage points

- top-right user avatar
- people list in detail panel

### Style

- circular crop
- small soft shadow or border ring optional
- profile avatar in header has tiny purple status dot

---

## 6.4 Status dot atom

Used in:

- header user avatar
- timeline connector points
n- maybe other small statuses

Must be small, circular, and color-coded.

---

## 6.5 Label atom

Used for:

- small badges like `Booked by Alex`
- category labels like `Personal`
- helper label `Everything in chronological order`

Style:

- low emphasis
- rounded pill when badge-like
- muted background
- semibold or medium text

---

## 6.6 Chip atom

Filter chip or micro tag.

Style:

- rounded rectangle
- subtle border or light fill
- selected state uses purple tint / stronger border / slightly darker text

---

## 6.7 Button atoms

There are multiple button types.

### Primary CTA button

Used only where strong emphasis is needed, like `Join meeting`.

Style:

- filled purple / purple gradient
- white text
- medium height
- rounded corners

### Secondary button

Used for contextual actions like `Directions`, `Open`, `Join`.

Style:

- light tinted background matching action type
- colored text/icon
- rounded corners

### Ghost / icon button

Used in the header and small action areas.

Style:

- plain or softly outlined
- subtle hover state

---

## 6.8 Text atoms

### Text roles required

- Heading 1: page title
- Heading 2: panel titles
- Card title
- Metadata line
- Small label
- Timestamp
- Helper description

Use clear weight differences.

---

# 7. Molecules

## 7.1 Sidebar navigation item

### Structure

- icon on left
- label text
- optional count badge on right

### States

- default
- active
- hover

### Active state

`Timeline` is active.

It should have:

- tinted background
- purple icon/text emphasis
- rounded container

Items visible:

- Timeline (active)
- Inbox with badge `3`
- People

### Important exclusion

**Do not add a separate Search navigation item in the left sidebar.**
Search already exists in the top header.

---

## 7.2 Shared links nav item

Under the `SHARED LINKS` section, show:

- `Toatre Link`
- `Bookings` with badge `7`

Same structural pattern as sidebar items, but lighter emphasis than primary nav.

---

## 7.3 Sidebar info card — Toatre Link card

### Contents

- title: `Your Toatre Link`
- value: `toatre.com/saraf`
- tiny external-link / open icon

### Style

- soft lavender-tinted card
- rounded corners
- medium internal padding

---

## 7.4 Sidebar usage card

### Contents

- title: `This week`
- text: `12 / 20 toats used`
- progress bar

### Progress bar

- slim rounded bar
- light track
- purple fill

---

## 7.5 Header search bar

### Structure

- leading search icon
- placeholder text: `Search toats, people, places...`
- trailing keyboard shortcut hint: `⌘ K`

### Style

- white background
- rounded rectangle
- subtle border
- medium height

### Behavior

- visually stable
- not oversized
- should be clearly a global app search

---

## 7.6 Date navigation molecule

### Structure

- left arrow button
- centered date label: `Monday, May 12, 2025`
- optional dropdown caret after date label
- right arrow button

### Style

- each arrow in a soft rounded-square container
- date label centered and visually prominent

### Behavior

- left/right moves through day context
- date label can suggest a date-picker dropdown

---

## 7.7 Header utility molecule

On the far right:

- notifications bell with badge `2`
- user avatar
- dropdown caret

Do not include any other CTA in this area.

---

## 7.8 Filter chip row

Located under page title area.

### Visible chips

- `All` (selected)
- `Meetings`
- `Booked by others`

Optional future chips are fine in product, but **not in this v1 spec**.

### Explicit exclusion

Do not show the `MY TOATS` classification list that existed in older exploration.
That is intentionally removed in v1.

---

## 7.9 Timeline time marker molecule

Each timeline row begins with a compact left-side time block.

### Structure

- primary time, e.g. `8:00 AM`
- duration below or adjacent, e.g. `1h`, `30m`, `1.5h`

### Style

- time is medium-weight
- duration is smaller and muted

---

## 7.10 Timeline connector molecule

Between time labels and cards is a vertical timeline guide.

### Structure

- thin vertical line
- colored circular dots aligned to each toat

### Behavior

- each dot color matches the toat type color
- line is soft and subtle

---

## 7.11 Toat summary row molecule

This is the compact row representation inside the timeline list.

### Structure

- type icon tile at left
- title + secondary metadata in center
- optional badge(s)
- contextual action chip/button at far right

### Content examples from the mock

1. `Drop Ryan to Hillside Islamic Center`
   - secondary line: `Hillside Avenue`
   - right action: `Directions`
   - badge: `Personal`

2. `Team sync`
   - secondary line: `Microsoft Teams`
   - badge: `Booked by Alex`
   - right action: `Join meeting`

3. `Focus time`
   - secondary line: `AI product strategy`
   - badge: `Deep work`

4. `Lunch with Farhan`
   - secondary line: `190-14 McLoughlin Avenue, Hollis`
   - badge: `Booked by Farhan`

5. `Pick up Ryan from Hillside Islamic Center`
   - secondary line: `Hillside Islamic Centre`
   - right action: `Directions`

6. `Design review`
   - secondary line: `Figma`
   - right action: `Open`

7. `Client call`
   - secondary line: `Zoom Meeting`
   - right action: `Join`

8. `Dinner with parents`
   - secondary line: `Home`
   - badge: `Personal`

### Style

- row card is white
- rounded corners
- horizontal layout
- subtle border or elevation
- selected row may use a faint tint, especially for the selected `Team sync` row

---

## 7.12 Floating capture control molecule

This control floats over the lower-right area of the center content region.

### Structure

A horizontal rounded capsule containing:

1. small keyboard button on the left
2. large mic button on the right

### Style

- white elevated capsule container
- strong rounded shape
- soft shadow
- small keyboard button is light / neutral
- large mic button is a vivid Toatre gradient circle

### Behavior

- mic button opens the capture modal in recording mode
- keyboard button opens the capture modal in text-entry mode

### Important note

This floating control should be visible on the Timeline page.
It should **disappear when the Capture modal is open**.

---

## 7.13 End-of-day summary card molecule

Located near the bottom of the timeline list.

### Contents

- icon: subtle star/sparkle-like symbol
- title: `You’re all clear after 6:00 PM`
- subtitle: `Nothing else scheduled for today.`
- decorative soft illustration on the right edge

### Style

- wide card
- soft gradient or warm illustration accent
- calm and positive

---

# 8. Organisms

## 8.1 Left sidebar organism

### Composition

Top to bottom:

1. brand block
2. main nav block
3. divider / spacing
4. `SHARED LINKS` section
5. Toatre Link info card
6. weekly usage card
7. bottom utility nav

### Rules

- keep width fixed
- plenty of vertical breathing room
- no search item here
- no `MY TOATS` classification block here

---

## 8.2 Header organism

### Composition

Left to right:

1. search bar
2. centered date navigation cluster
3. right utility cluster with bell + avatar + caret

### Rules

- no `New Toat` button
- header must remain visually light and uncluttered
- enough horizontal spacing between search and date controls

---

## 8.3 Timeline list organism

### Composition

For each visible row:

- time block
- timeline connector line + dot
- toat summary row card

### Grouping

Rows are stacked vertically in chronological order.

### Visible order

1. 8:00 AM — Drop Ryan to Hillside Islamic Center
2. 9:30 AM — Team sync
3. 10:30 AM — Focus time
4. 12:00 PM — Lunch with Farhan
5. 1:00 PM — Pick up Ryan from Hillside Islamic Center
6. 2:30 PM — Design review
7. 4:00 PM — Client call
8. 6:00 PM — Dinner with parents

---

## 8.4 Right detail panel organism

This is critical. It must be designed so that **desktop detail composition reflects the same design system as mobile toat cards**, not an unrelated admin panel.

The user specifically wants the **side detail content to align with the mobile toat card philosophy**.

### Overall structure

The panel is a vertical stack of cards/sections.

Top section reflects the selected toat.

Selected toat in this state is:

`Team sync`

### Section order

1. hero card / toat summary card
2. action row in a **single horizontal line**
3. when & where section
4. people section
5. agenda section
6. attached file section
7. ping section

### Important correction

The actions must be presented in a **single horizontal row**, matching the style direction of mobile action cards.
They should not be visually treated as a heavy stacked control list.

---

## 8.5 Right panel — Hero toat card organism

### Content

- icon tile for Teams / meeting
- title: `Team sync`
- chip or timestamp row: `Today • 9:30 AM`
- platform line: `Microsoft Teams`
- primary button: `Join meeting`
- overflow action button `...`

### Style

- faint purple-tinted card background
- rounded corners
- slightly larger than other detail cards
- should feel like a desktop extension of the mobile toat hero card

---

## 8.6 Right panel — Action row organism

### Visible actions

In one horizontal line:

- `Mark done`
- `+1 Day`
- `Reschedule`
- `Duplicate`

### Style

- each action is a compact icon + label tile or pill card
- all four sit on one line
- equal spacing
- do not create a tall stacked box

### Color hints

- `Mark done` uses green emphasis
- `+1 Day` uses blue
- `Reschedule` uses purple
- `Duplicate` stays neutral

---

## 8.7 Right panel — When & where organism

### Title

`When & where`

### Fields

- `When` → `Monday, May 12, 2025 at 9:30 AM`
- `Duration` → `30 minutes` + `Edit` action on the right
- `Where` → `Microsoft Teams meeting` + `Join` action with external/open icon
- `Calendar` → `Work` + `Change` action on the right

### Style

- structured information card
- each row aligned cleanly
- labels left, values center, actions right

---

## 8.8 Right panel — People organism

### Title

`People`

### Content

- avatar row showing 3 visible avatars plus `+2`
- text: `4 going`
- optional dropdown caret on the right

### Style

- light white card
- medium padding

---

## 8.9 Right panel — Agenda organism

### Title

`Agenda`

### Content

Single paragraph:

`Discuss project updates and plan for this week.`

---

## 8.10 Right panel — Attachment organism

### Content

A file card showing:

- file icon
- file name: `Project Update Q2.docx`
- helper text: `Uploaded by Alex • Today`
- download icon
- overflow menu icon `...`

---

## 8.11 Right panel — Ping organism

### Title / content

- bell icon
- label: `Ping me`
- value: `10 minutes before`
- action: `Edit`

---

# 9. Template-level composition

## 9.1 Final page composition order

From top-left to bottom-right:

### Left sidebar

- Toatre logo
- Timeline
- Inbox (3)
- People
- SHARED LINKS
- Toatre Link
- Bookings (7)
- Your Toatre Link card
- This week usage card
- Settings
- Help & feedback

### Header

- Search bar
- Date controls
- Notifications bell with `2`
- User avatar + status dot + caret

### Main content column

- Page title: `Your timeline`
- Subtitle: `Everything in chronological order`
- Filter chips: `All`, `Meetings`, `Booked by others`
- Chronological timeline list
- End-of-day card
- Floating capture controls at lower-right of content area

### Right detail column

- Team sync hero card
- single-row actions
- When & where
- People
- Agenda
- Attachment
- Ping me

---

# 10. Interaction rules

## 10.1 Timeline row selection

- clicking a timeline toat selects it
- selected state updates the right detail panel
- selected row can have a light tinted background

## 10.2 Floating controls

- mic opens capture modal in recording mode
- keyboard opens capture modal in typing mode
- floating controls stay visible only on the page state when no capture modal is open

## 10.3 Header search

- global search across toats, people, and places
- keyboard shortcut shown as `⌘ K`

## 10.4 Right panel actions

- actions are one-click quick actions
- they should not navigate away unless necessary

---

# 11. Responsive constraint for this spec

This spec is only for **desktop**.

However, the right-side detail panel should be built from the **same design language as mobile toat cards**, so that later mobile and desktop feel systemically related.

This means:

- same icon tile language
- similar action tile language
- same hierarchy logic
- same rounded surfaces
- similar metadata grouping

Do not design the desktop detail panel as a completely separate product.

---

# 12. Explicit exclusions

These must **not** appear in this desktop timeline implementation:

1. No `New Toat` button in the header
2. No separate `Search` item in the left sidebar
3. No `MY TOATS` classification section in the left sidebar
4. No heavy stacked action box in the right detail panel
5. No calendar-grid default view
6. No extra enterprise widgets or analytics blocks in the main center area

---

# 13. Implementation-ready component hierarchy

Use this exact hierarchy as the build blueprint.

```text
TimelinePageDesktop
├──── 
│   ├── Sidebar
│   │   ├── BrandBlock
│   │   ├── PrimaryNav
│   │   │   ├── NavItem(Timeline, active)
│   │   │   ├── NavItem(Inbox, badge=3)
│   │   │   └── NavItem(People)
│   │   ├── SectionLabel("SHARED LINKS")
│   │   ├── SecondaryNav
│   │   │   ├── NavItem(Toatre Link)
│   │   │   └── NavItem(Bookings, badge=7)
│   │   ├── LinkInfoCard
│   │   ├── UsageCard
│   │   └── UtilityNav
│   │       ├── NavItem(Settings)
│   │       └── NavItem(Help & feedback)
│   ├── Header
│   │   ├── SearchBar
│   │   ├── DateNavigation
│   │   └── HeaderUtilityCluster
│   │       ├── NotificationBell(badge=2)
│   │       ├── UserAvatar(statusDot=true)
│   │       └── Caret
│   └── ContentArea
│       ├── MainColumn
│       │   ├── PageHeading
│       │   ├── FilterChipRow
│       │   ├── TimelineList
│       │   │   ├── TimelineRow(8:00 AM, Drop Ryan...)
│       │   │   ├── TimelineRow(9:30 AM, Team sync)
│       │   │   ├── TimelineRow(10:30 AM, Focus time)
│       │   │   ├── TimelineRow(12:00 PM, Lunch with Farhan)
│       │   │   ├── TimelineRow(1:00 PM, Pick up Ryan...)
│       │   │   ├── TimelineRow(2:30 PM, Design review)
│       │   │   ├── TimelineRow(4:00 PM, Client call)
│       │   │   └── TimelineRow(6:00 PM, Dinner with parents)
│       │   ├── EndOfDayCard
│       │   └── FloatingCaptureControls
│       │       ├── KeyboardCaptureButton
│       │       └── MicCaptureButton
│       └── DetailSidebar
│           ├── ToatHeroCard(Team sync)
│           ├── ActionRow
│           │   ├── QuickAction(Mark done)
│           │   ├── QuickAction(+1 Day)
│           │   ├── QuickAction(Reschedule)
│           │   └── QuickAction(Duplicate)
│           ├── DetailCard(When & where)
│           ├── DetailCard(People)
│           ├── DetailCard(Agenda)
│           ├── AttachmentCard
│           └── DetailCard(Ping me)
```

---

# 14. Final build note

If anything is uncertain during implementation, prefer the following principles:

1. chronological clarity over feature density
2. card calmness over dashboard complexity
3. alignment with mobile toat-card language over desktop admin-panel conventions
4. fewer controls, better grouped
5. the floating mic is the main create affordance

