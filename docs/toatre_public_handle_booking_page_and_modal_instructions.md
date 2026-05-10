# Toatre Public Handle Booking Page & Booking Modal — UI Build Specification

## 0. Purpose

This document defines the public-facing **Toatre Handle booking page** and the **Book this time modal** shown after a visitor selects a time slot.

It is written as a detailed implementation prompt for an LLM, designer, or frontend engineer so the UI can be recreated accurately from the mockups without guessing.

This spec covers:

1. Public handle booking page
2. Selected time state
3. Booking details modal
4. Atomic design breakdown
5. Component hierarchy
6. Layout rules
7. Copy/content rules
8. Interaction behavior
9. Explicit exclusions

---

# 1. Product intent

The public handle page lets a visitor book time with a Toatre user.

The page should feel:

- personal
- trusted
- simple
- premium
- calm
- modern
- lightly branded
- easy to complete

The page should not feel:

- like a heavy SaaS landing page
- like a dark crypto/futuristic product page
- like a generic Calendly clone
- like an enterprise scheduling form
- like it is aggressively upselling Toatre

The primary user job is:

> Pick a date, pick a time, enter details, book.

The Toatre upsell exists, but it must remain secondary.

---

# 2. Final approved design direction

Use the **light-premium handle page** direction.

The selected direction keeps the strong two-column layout but removes the overly dark/cosmic feel.

## 2.1 Visual tone

The visual tone should be:

- mostly light
- soft pastel/lavender background
- subtle Toatre gradient accents
- large white booking card
- gentle shadows
- rounded corners
- modern but personal

## 2.2 Approximate balance

Use this visual ratio:

- 75% light surface
- 20% soft lavender/purple accent
- 5% deep gradient accents

Do not use a mostly dark full-page background.

---

# 3. Page-level layout

## 3.1 Overall page

Desktop page layout:

```text
PublicHandlePage
├── Header
├── HeroBookingSection
│   ├── ProfileColumn
│   └── BookingCard
├── BottomUpsellStrip
└── Footer
```

## 3.2 Canvas

- Full desktop web page
- Light off-white / pale lavender background
- Subtle dotted texture or abstract curve accents allowed
- No heavy background graphics
- No crowded lower-page sections

## 3.3 Page width

Use a centered max-width layout.

Recommended max width:

- `1180px–1280px`

Main content should have comfortable horizontal padding.

Recommended desktop padding:

- `40px–64px`

---

# 4. Header

## 4.1 Header contents

Top-left:

- Toatre logo icon
- `toatre` wordmark

Top-right:

- no CTA button

## 4.2 Important rule

Do **not** show a top-right `Get your Toatre Link` button.

Reason:

The bottom upsell strip already contains the `Get your link` CTA. The top CTA is redundant and creates unnecessary pressure on a booking page.

## 4.3 Header style

- transparent/light background
- enough top padding
- no sticky behavior required for this mock
- logo should be visible but not dominant

---

# 5. Hero booking section

## 5.1 Layout

Two-column layout:

```text
HeroBookingSection
├── ProfileColumn   approx 38–42%
└── BookingCard     approx 58–62%
```

The left profile column and right booking card should align vertically.

The booking card should be the most functional element.

## 5.2 Spacing

- large gap between columns: `64px–96px`
- generous top spacing after header
- enough bottom spacing before upsell strip

---

# 6. Profile column

## 6.1 Purpose

The profile column establishes who the visitor is booking with.

It should feel personal and trustworthy.

## 6.2 Profile column content order

```text
ProfileColumn
├── ProfilePhoto
├── NameRow
├── HandleText
├── SocialLinksRow
├── HeroHeadline
├── HeroSubtitle
└── BenefitList
```

---

## 6.3 Profile photo

### Style

- large circular avatar
- soft gradient ring around avatar
- subtle glow or border
- not too dramatic

### Size guidance

Desktop:

- avatar diameter: `140px–170px`

### Image behavior

Use the user’s profile image from their Toatre profile.

---

## 6.4 Name row

Content:

`Saraf T`

Include a small verified badge next to the name.

### Style

- large bold text
- dark navy
- verified badge in blue

---

## 6.5 Handle text

Content:

`@saraf`

Style:

- muted gray/slate
- medium size
- placed below name

---

## 6.6 Social links row

Social links must appear **under the user handle**.

These links come from what the user has set in their profile.

### Example icons

- X / Twitter
- LinkedIn
- Instagram
- YouTube

### Layout

- horizontal row of circular icon buttons
- each icon button has subtle border/background
- spacing between icons: `10px–14px`

### Style

- light circular buttons
- dark icon glyph
- hover can use subtle lavender tint

### Important

Only show icons for social links the user has actually configured.

Do not show empty or placeholder social icons.

---

## 6.7 Hero headline

Content:

`Book time with Saraf.`

The word `Saraf` may use Toatre gradient text.

### Style

- large, bold, expressive
- dark navy text
- gradient emphasis on the name or key phrase
- line breaks are allowed for visual balance

Suggested line break:

```text
Book time
with Saraf.
```

---

## 6.8 Hero subtitle

Content:

```text
Pick a time that works.
No back-and-forth.
```

Style:

- medium-large body text
- muted slate gray
- two short lines

---

## 6.9 Benefit list

Two small benefits below the subtitle.

### Benefit 1

Title:

`Quick & easy booking`

Helper:

`Book in seconds.`

Icon:

lightning bolt

### Benefit 2

Title:

`Secure & private`

Helper:

`Your information is safe.`

Icon:

shield

### Style

Each benefit uses:

- small circular icon container
- purple icon
- title in dark text
- helper in muted text

Layout can be stacked vertically or two-column depending on available width.

In the approved light mock, stacked vertical works well.

---

# 7. Booking card

## 7.1 Purpose

The booking card is the main functional unit.

It lets the visitor:

1. choose one date
2. see available times for that selected date only
3. click a time to open the booking modal

## 7.2 Card style

- large white card
- rounded corners: `24px–28px`
- subtle border
- soft shadow
- generous padding: `36px–48px`
- no dark background inside the card

---

## 7.3 Booking card content order

```text
BookingCard
├── DateSection
│   ├── StepTitle("1. Choose a date")
│   └── DateSelectorRow
├── Divider
├── TimeSection
│   ├── StepTitle("2. Select a time")
│   ├── AvailableTimesLabel
│   └── TimeSlotGrid
└── TimezoneNote
```

---

## 7.4 Date section

### Title

`1. Choose a date`

Style:

- semibold/bold
- dark navy
- medium-large

### Date selector row

Contains:

- left arrow button
- date chips
- right arrow button

Example visible date chips:

1. `Tue` / `May 12` selected
2. `Wed` / `May 13`
3. `Thu` / `May 14`
4. `Fri` / `May 15`
5. `Mon` / `May 18`

### Selected date chip

Selected date:

`Tue May 12`

Style:

- purple border
- light lavender fill
- small purple dot or selected indicator
- stronger text

### Unselected date chip

Style:

- white background
- light border
- dark text
- subtle hover state

### Arrow buttons

- rounded square
- subtle border
- chevron icon
- left and right arrow to move date range

---

## 7.5 Divider

Use a subtle horizontal divider between date selection and time selection.

---

## 7.6 Time section

### Title

`2. Select a time`

### Available times label

Content:

`Available times for Tuesday, May 12`

Style:

- calendar icon on left
- muted text
- selected date portion may be purple

### Critical behavior rule

After a visitor chooses a date, show **only available times for that selected date**.

Do not show multiple days grouped under the time section.

This was an important correction.

---

## 7.7 Time slot grid

### Example slots

Show only slots for Tuesday, May 12:

```text
9:00 AM
9:30 AM
10:00 AM
10:30 AM
11:30 AM
12:00 PM
12:30 PM
1:00 PM
2:00 PM
2:30 PM
3:00 PM
3:30 PM
4:00 PM
4:30 PM
5:00 PM
```

### Layout

Desktop grid:

- 4 columns preferred
- consistent card widths
- gap: `14px–18px`

### Slot button style

Default:

- white background
- light border
- dark text
- rounded corners
- medium height: `56px–64px`

Hover:

- purple border
- very light lavender background

Selected:

- purple border
- lavender fill or gradient emphasis
- optional check indicator

In the base page state, no time needs to be selected. In the modal-open state, the clicked time can remain visibly selected behind the overlay.

---

## 7.8 Timezone note

Content:

`All times shown in your local timezone`

Use a globe icon on the left.

Style:

- muted text
- placed at bottom of booking card
- no extra card background

Optional enhancement:

Show timezone name if available:

`All times shown in your local timezone`

or

`All times shown in Asia/Kolkata (GMT+5:30)`

Keep it simple.

---

# 8. Bottom upsell strip

## 8.1 Purpose

A secondary Toatre product upsell for visitors who want their own booking link.

This should not dominate the page.

## 8.2 Placement

Below the hero section, above the footer.

## 8.3 Height

Keep the entire upsell/footer lower area minimal.

The upsell strip itself should be compact.

Do not build a large marketing section.

## 8.4 Content

Left:

- circular link icon
- title: `Create your own Toatre Link`
- subtitle: `Share once. Get booked forever.`

Right:

- button: `Get your link`
- arrow icon

## 8.5 Style

- very light lavender-tinted card
- soft border
- rounded corners
- subtle gradient allowed
- white/purple CTA button
- no trust logos
- no testimonials
- no “Why book with me?” section

## 8.6 Explicit exclusions

Do not include:

- trusted-by logos
- testimonials
- multi-card feature sections
- waitlist
- large marketing blocks
- duplicate top CTA

---

# 9. Footer

## 9.1 Footer content

Left:

- Toatre logo
- tagline: `The easiest way to share your time.`
- small social icons

Right:

- copyright: `© 2025 Toatre. All rights reserved.`

## 9.2 Style

- minimal
- lots of whitespace
- muted text
- no large columns of links in this approved version

---

# 10. Booking modal

## 10.1 Purpose

The booking modal appears when the visitor clicks an available time slot.

It collects the visitor’s details and confirms the booking request/session.

## 10.2 Modal behavior

When a time is clicked:

- page background becomes dimmed and slightly blurred
- booking modal appears centered
- clicked time remains selected in the background
- background is not interactive while modal is open

---

# 11. Booking modal layout

## 11.1 Modal structure

```text
BookTimeModal
├── ModalHeader
├── SelectedTimeSummary
├── DetailsForm
├── CalendarInviteCheckbox
├── PrivacyNote
└── ModalFooterActions
```

## 11.2 Modal size

Recommended desktop modal:

- width: `560px–640px`
- max height: fit content, with scroll only if needed
- centered in viewport

## 11.3 Modal style

- white background
- rounded corners: `24px`
- soft shadow
- subtle border
- padding: `32px–40px`

---

# 12. Modal background overlay

## 12.1 Overlay style

Use:

- semi-transparent gray/black overlay
- light blur on the background
- background page still recognizable

The mock shows the page dimmed but still visible.

## 12.2 Background state

The selected time in the booking card should remain visible behind the modal.

Example selected background slot:

`10:00 AM`

with purple border / selected check.

---

# 13. Modal header

## 13.1 Header content

Left:

- title: `Book this time`
- subtitle: `Enter your details to confirm your session with Saraf T.`

Right:

- close icon button `X`

## 13.2 Style

Title:

- bold
- dark navy
- around 24–28px

Subtitle:

- muted slate
- medium size

Close button:

- top-right
- simple icon
- circular hover state

---

# 14. Selected time summary

## 14.1 Purpose

Shows the chosen date and time at the top of the modal.

## 14.2 Layout

A rounded bordered summary row with two equal sections:

Left section:

- calendar icon
- `Tue, May 12`

Right section:

- clock icon
- `10:00 AM`

## 14.3 Style

- light lavender tint
- purple icon accents
- subtle border
- rounded corners
- height around `56px–64px`

---

# 15. Details form

## 15.1 Section title

`Your details`

Style:

- semibold
- dark navy

## 15.2 Fields

The form includes:

1. Full name
2. Email address
3. What would you like to discuss?
4. Add a note (optional)

---

## 15.3 Full name field

Label:

`Full name`

Placeholder:

`Enter your full name`

Required:

Yes

Input type:

Text

---

## 15.4 Email address field

Label:

`Email address`

Placeholder:

`Enter your email address`

Required:

Yes

Input type:

Email

---

## 15.5 Discussion field

Label:

`What would you like to discuss?`

Placeholder:

`e.g., Career advice, Portfolio review, Mentorship`

Required:

Recommended yes, but product can make this configurable by the handle owner.

Input type:

Single-line text input in the mock.

If the user config requires longer reason, this can become a textarea, but default should stay compact.

---

## 15.6 Optional note field

Label:

`Add a note (optional)`

Placeholder:

`Anything else Saraf should know before the session?`

Required:

No

Input type:

Textarea

Height:

Around `84px–110px`

---

# 16. Calendar invite checkbox

## 16.1 Content

Checkbox label:

`Send me a calendar invite`

Default:

Checked

## 16.2 Style

- purple checked box
- label in dark text
- placed after the note field

---

# 17. Privacy note

## 17.1 Content

Use a shield icon and text:

`Your information is only used for this booking.`

## 17.2 Style

- muted text
- small
- subtle
- placed below calendar invite checkbox

---

# 18. Modal footer actions

## 18.1 Layout

Two buttons at the bottom:

Left:

- `Cancel`

Right:

- `Book time`

## 18.2 Cancel button

Style:

- secondary outline button
- white background
- light border
- dark text

## 18.3 Book time button

Style:

- primary purple gradient button
- white text
- rounded corners
- strong but not oversized

## 18.4 Button alignment

Use a two-column footer layout:

- Cancel on left
- Book time on right

Both should align to modal width.

---

# 19. Booking modal interaction states

## 19.1 Opening modal

Triggered by clicking a time slot.

Example:

Visitor clicks `10:00 AM`.

The modal opens with:

- date summary: `Tue, May 12`
- time summary: `10:00 AM`

## 19.2 Closing modal

User can close by:

- clicking `X`
- clicking `Cancel`
- pressing Escape
- optionally clicking overlay, if product allows

## 19.3 Submitting modal

Clicking `Book time` should:

1. validate required fields
2. show inline errors if invalid
3. submit booking
4. move to confirmation state after success

## 19.4 Validation

Required fields:

- full name
- email address
- discussion/reason, if owner requires it

Validation style:

- red border on invalid field
- short helper error text under field
- do not use browser-default error styling only

---

# 20. Confirmation state after booking

This spec focuses on the input modal, but the next state should exist.

After successful booking, show either:

1. success modal, or
2. replace modal content with confirmation

Suggested confirmation content:

Title:

`You're booked`

Subtitle:

`Your session with Saraf T is confirmed.`

Summary:

- Tue, May 12
- 10:00 AM
- calendar invite sent

Actions:

- `Add to calendar`
- `Done`

Keep it simple.

---

# 21. Atomic design breakdown

## 21.1 Atoms

```text
Logo
Icon
Avatar
VerifiedBadge
SocialIconButton
Button
IconButton
Input
Textarea
Checkbox
DateChip
TimeSlotButton
Badge
Text
Divider
CardSurface
Overlay
```

## 21.2 Molecules

```text
ProfileIdentity
SocialLinksRow
BenefitItem
DateSelector
AvailableTimesHeader
TimeSlotGrid
TimezoneNote
UpsellStrip
FooterBrand
SelectedTimeSummary
FormField
PrivacyNote
ModalActions
```

## 21.3 Organisms

```text
PublicHandleHeader
ProfileColumn
BookingCard
PublicHandleHero
BookingDetailsModal
BottomUpsell
PublicFooter
```

## 21.4 Template

```text
PublicHandlePage
├── PublicHandleHeader
├── PublicHandleHero
│   ├── ProfileColumn
│   │   ├── ProfileIdentity
│   │   ├── SocialLinksRow
│   │   ├── HeadlineBlock
│   │   └── BenefitList
│   └── BookingCard
│       ├── DateSelector
│       ├── TimeSlotGrid
│       └── TimezoneNote
├── BottomUpsell
└── PublicFooter

BookTimeModal
├── Overlay
└── ModalContainer
    ├── ModalHeader
    ├── SelectedTimeSummary
    ├── DetailsForm
    ├── CalendarInviteCheckbox
    ├── PrivacyNote
    └── ModalActions
```

---

# 22. Responsive behavior

This document is primarily for desktop, but the layout should be designed to adapt later.

## 22.1 Tablet

- stack profile and booking card if needed
- booking card remains dominant
- upsell stays compact

## 22.2 Mobile

Mobile should become:

1. profile summary
2. booking card
3. compact upsell
4. footer

The modal should become a full-width bottom sheet or centered mobile modal.

Mobile will be specified separately.

---

# 23. Accessibility requirements

## 23.1 Keyboard support

- date chips are keyboard focusable
- time slots are keyboard focusable
- modal traps focus while open
- Escape closes modal
- selected time has clear selected state
- submit button is reachable by keyboard

## 23.2 Labels

All form fields must have visible labels.

Do not rely only on placeholders.

## 23.3 Color contrast

Ensure:

- time slot text has sufficient contrast
- purple selected states remain readable
- muted text does not become too faint

## 23.4 ARIA

Recommended labels:

- close modal button: `Close booking form`
- selected date: `Selected date Tuesday, May 12`
- time button: `Select 10:00 AM`
- submit button: `Book selected time`

---

# 24. Explicit exclusions

Do not include these in the approved page:

1. Top-right `Get your Toatre Link` button
2. Trusted-by logo strip
3. Waitlist section
4. Testimonials
5. Multi-card feature marketing section
6. Dark full-page background
7. Multiple days shown under “Select a time”
8. Large footer link columns
9. Aggressive upsell copy
10. Extra form fields not configured by owner
11. Technical scheduling jargon
12. Product analytics or dashboard widgets

---

# 25. Final quality bar

The UI is successful when:

- the visitor immediately knows who they are booking with
- the booking card is the clearest element
- the page feels light, trustworthy, and premium
- date selection and time selection are not confused
- social links appear under the handle
- the upsell is present but quiet
- the booking modal feels easy and safe
- the form asks only for necessary information
- the design feels like Toatre, not Calendly

The final experience should feel like:

> A personal booking page with Toatre’s calm, premium time-slice identity.
