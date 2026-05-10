# Toatre Product Truth v1

## 0. Purpose of this document

This is the final product definition for Toatre. It defines what the app is, what it is not, how every major feature behaves, what every toat type contains, and what each primary screen must support across mobile and desktop.

This document is meant to be the source of truth for product, design, engineering, copy, QA, and future UI mockups.

It is intentionally detailed. It should prevent missing links later when designing mobile screens, desktop screens, data models, flows, states, and edge cases.

---

# 1. Product essence

## 1.1 One sentence

Toatre is a voice-first personal timeline assistant that turns what you say into structured slices of time called toats.

## 1.2 Product promise

Say it once. Toatre remembers it, places it on your timeline, and brings it back at the right moment.

## 1.3 Core metaphor

A toat is a slice of time.

A toat can be a task, meeting, errand, call, reminder, deadline, appointment, idea, list, or ticketed event. It begins simple and becomes richer only when needed.

## 1.4 Product philosophy

Toatre is not a calendar, not a todo app, not a note app, not a project management tool, and not a generic AI chat app.

Toatre is a chronological personal timeline.

Everything the user captures belongs somewhere in time. Some things have exact times. Some have soft times. Some have no time yet. Toatre still organizes them in a calm, human, useful way.

## 1.5 Design philosophy

Toatre should feel:

- calm
- warm
- premium
- private
- fast
- personal
- quietly intelligent
- visually chronological

Toatre should not feel:

- corporate
- busy
- gamified
- productivity-bro
- enterprise project management
- calendar-heavy
- cluttered with configuration
- like AI is doing magic for the sake of magic

## 1.6 Primary interaction

The primary action is capture.

The user taps the mic, speaks naturally, and Toatre creates one or more toats.

Manual creation exists, but it is secondary.

---

# 2. Locked vocabulary

These terms must be used consistently in UI, code, product docs, and support materials.

| Term | Meaning |
|---|---|
| Toatre | The product and brand. |
| toatre | The lowercase wordmark. |
| Toat | One saved slice of time. |
| Toats | Multiple saved timeline items. |
| Capture | Raw input from voice, text, share sheet, or imported source that creates one or more toats. |
| Ping | A reminder from Toatre. |
| Timeline | The main chronological view of the user’s toats. |
| Kind | The functional category of a toat. |
| Template | The richer layout/data pattern used by a toat. |
| Tier | User-visible urgency level. |
| Handle | A public @name used for sharing and booking. |
| Toatre Link | A public booking page tied to a handle. |
| Booking | A request or confirmed time created through a Toatre Link. |
| Connection | A person saved by the user for sharing, booking, or people-based organization. |

Avoid these in user-facing copy unless there is no better alternative:

- todo
- notification
- priority
- productivity system
- task manager
- calendar event as the main noun
- AI assistant as the main identity

---

# 3. Product pillars

## 3.1 Voice-first capture

The app starts from the belief that speaking is faster than organizing.

The capture experience must:

- feel immediate
- show live transcription when possible
- allow multiple toats from one voice clip
- allow quick correction before saving
- support typed capture as fallback
- make privacy clear
- avoid overwhelming the user with forms upfront

## 3.2 One unified timeline

All toats live in one chronological timeline.

The timeline is not a grid calendar by default. It is a vertical, chronological flow.

Calendar-style views can exist as secondary views, mainly for scanning and planning, but the core Toatre experience is the timeline.

## 3.3 Contextual toats

Every toat starts as a simple base item.

As Toatre understands context, the toat can evolve into richer templates:

- meeting
- call
- appointment
- errand
- checklist
- ticketed event
- deadline
- idea
- follow-up
- general task

A richer toat must never feel like a bloated form. It should simply show useful actions for that type.

## 3.4 Smart Pings

Pings should be helpful, not noisy.

Default Pings come from the toat’s kind, tier, time, location, and context. Users can override them, but Toatre should not force per-item reminder configuration.

## 3.5 Targeted sharing

Users can share a specific toat with specific people.

Sharing never exposes the full timeline.

The shared toat can be view-only or editable.

## 3.6 Personal booking through Toatre Link

A Toatre Link lets others request or book time with the user.

Bookings become toats on the user’s timeline.

The Toatre Link feature must be powerful but not over-configured.

## 3.7 Privacy by default

Voice audio is not stored by default.

Transcripts and AI extraction outputs should be transparent, deletable, and bounded by retention rules.

The app must feel safe from the first screen.

---

# 4. Information architecture

## 4.1 Primary mobile navigation

Mobile bottom navigation:

1. Timeline
2. Search
3. People
4. Inbox
5. Settings

The capture mic is a floating primary action, not a tab.

Why: capture is the main behavior, but it should remain available everywhere without replacing a destination.

## 4.2 Primary desktop navigation

Desktop left navigation:

1. Timeline
2. Calendar
3. Inbox
4. People
5. Search
6. Templates or Toat Types, only if needed later
7. Analytics, only if useful for power users or booking users
8. Settings
9. Integrations

Desktop top bar:

- search
- date controls
- new toat
- mic capture
- pings/inbox indicator
- profile menu

## 4.3 Public web surfaces

Public surfaces:

1. Marketing home page
2. Login/signup
3. Toatre Link booking page
4. Shared toat preview page
5. Privacy policy
6. Terms
7. Help/support

Public surfaces should be beautiful, minimal, and trust-building.

---

# 5. The base toat model

## 5.1 Product principle

Every toat starts from the same simple base.

The base toat answers:

- What is it?
- When does it matter?
- Where does it happen, if anywhere?
- Who is involved, if anyone?
- What should Toatre do at the right moment?

## 5.2 Base toat fields

### Identity

| Field | Required | Description |
|---|---:|---|
| id | Yes | Unique toat ID. |
| ownerId | Yes | User who owns the toat. |
| title | Yes | Main human-readable title. |
| kind | Yes | Core functional category. |
| template | Yes | UI/data template. Defaults to basic. |
| tier | Yes | urgent, important, or regular. Defaults to regular. |
| status | Yes | active, done, snoozed, cancelled, archived. |
| source | Yes | voice, typed, share, booking, calendar, import, manual. |
| captureId | Optional | Source capture that created the toat. |

### Time

| Field | Required | Description |
|---|---:|---|
| startsAt | Optional | Exact start time. |
| endsAt | Optional | Exact end time. |
| dueAt | Optional | Due time for deadline/task style toats. |
| allDay | Optional | Whether it is an all-day toat. |
| timeConfidence | Optional | exact, inferred, approximate, missing. |
| timeLabel | Optional | Human label like “this weekend”, “after work”, “someday”. |
| durationMinutes | Optional | Duration when known or user-set. |
| timezone | Optional | Timezone used for display and reminders. |

### Place

| Field | Required | Description |
|---|---:|---|
| locationName | Optional | Human name of the place. |
| address | Optional | Full address. |
| lat | Optional | Latitude. |
| lng | Optional | Longitude. |
| placeId | Optional | External provider place ID. |
| travelMode | Optional | drive, walk, transit, ride, none. |
| travelTimeMinutes | Optional | Estimated travel time when available. |

### People

| Field | Required | Description |
|---|---:|---|
| people | Optional | People connected to the toat. |
| guests | Optional | Booking/meeting guests. |
| sharedWith | Optional | Users/connections with access. |
| permission | Optional | view or edit for shared recipients. |

### Content

| Field | Required | Description |
|---|---:|---|
| notes | Optional | User notes. |
| transcriptSnippet | Optional | Relevant original capture text. |
| links | Optional | URLs attached to the toat. |
| attachments | Optional | Files, tickets, docs, images. |
| checklist | Optional | Checklist items when relevant. |

### Pings

| Field | Required | Description |
|---|---:|---|
| pings | Optional | User-visible reminder rules. |
| reminderOffset | Optional | Minutes before start/due time. |
| pingEnabled | Yes | Whether pings are enabled. |
| smartPingEnabled | Optional | Whether Toatre may infer helpful pings. |

### System

| Field | Required | Description |
|---|---:|---|
| createdAt | Yes | Creation timestamp. |
| updatedAt | Yes | Last updated timestamp. |
| completedAt | Optional | Completion timestamp. |
| archivedAt | Optional | Archive timestamp. |
| deletedAt | Optional | Soft delete timestamp. |
| version | Yes | Used for sync conflict resolution. |

## 5.3 Base toat required UI

Every toat card must support:

- icon
- title
- primary time or time label
- secondary context line
- kind/tier visual cue
- tap to open detail
- quick action when obvious
- status indicator when done/snoozed/cancelled

Every toat detail screen must support:

- title edit
- kind/template correction
- time edit
- location edit if relevant
- people edit if relevant
- notes edit
- ping edit
- share
- duplicate
- delete
- mark done or cancel, depending on kind

## 5.4 Base toat states

| State | Meaning | UI behavior |
|---|---|---|
| active | Upcoming or current | Normal timeline display. |
| done | Completed | Muted or checked; remains in past/history. |
| snoozed | Temporarily delayed | Shows next ping time. |
| cancelled | No longer happening | Muted, optional archive. |
| archived | Hidden from normal timeline | Search/history only. |
| needsReview | AI is not confident | Requires user confirmation. |
| missingTime | No usable time | Lives in unscheduled section. |
| conflict | Time overlaps or impossible | Shows attention cue. |

---

# 6. Toat kinds and templates

## 6.1 Kind vs template

Kind is the broad category used for timeline behavior, filtering, and default Pings.

Template is the more specific shape used for UI and data.

Example:

- “Call Mom” is kind `task`, template `call`.
- “Buy groceries” is kind `errand`, template `checklist` or `errand` depending on content.
- “Dentist appointment” is kind `errand`, template `appointment`.
- “Product team sync” is kind `meeting`, template `meeting`.

## 6.2 Supported kinds

| Kind | Purpose |
|---|---|
| task | Something to do. |
| event | Something happening at a time/place. |
| meeting | A scheduled conversation with people or join details. |
| errand | A task tied to a location or physical movement. |
| deadline | Something due by a time. |
| idea | A thought to revisit later. |

## 6.3 Supported templates

| Template | Kind | Purpose |
|---|---|---|
| basic | Any | Generic simple toat. |
| task | task | Simple action item. |
| call | task | Call someone. |
| follow_up | task | Follow up with someone by call, email, or message. |
| checklist | task or errand | Multi-item list. |
| errand | errand | Go somewhere or pick/drop something. |
| appointment | errand | Scheduled visit with provider/location. |
| meeting | meeting | Meeting with people and/or link. |
| event | event | Scheduled occurrence. |
| ticketed_event | event | Event with tickets, doors, venue, wallet/QR. |
| deadline | deadline | Due date/time. |
| idea | idea | Thought to revisit. |
| booking | meeting | Time booked through Toatre Link. |

---

# 7. Template deep dives

## 7.1 Basic toat

### Use cases

- “Remember this.”
- “Think about pricing later.”
- “Check the garage.”
- “Something about school forms.”

### Fields

Uses only base fields:

- title
- time label or startsAt/dueAt if known
- notes
- tier
- pings

### Detail options

- Edit title
- Add time
- Add location
- Add note
- Add people
- Add ping
- Convert type
- Share
- Mark done
- Duplicate
- Delete

### UI behavior

A basic toat should feel lightweight. It should never show empty complex sections.

---

## 7.2 Task toat

### Use cases

- “Send deck to Priya at 3.”
- “Pay electricity bill tomorrow.”
- “Finish application tonight.”

### Additional fields

| Field | Description |
|---|---|
| dueAt | When it should be done by. |
| completedAt | When user marked done. |
| estimatedMinutes | Optional estimate. |

### Primary actions

- Mark done
- Snooze
- Reschedule
- Share

### Detail options

- Change due time
- Add note
- Add link/file
- Add ping
- Convert to checklist
- Assign/share with person

### Timeline behavior

Task appears at due time if known. If only a vague time exists, it appears in a soft section such as “Later today”, “This weekend”, or “Someday”.

---

## 7.3 Call toat

### Use cases

- “Call Mom this afternoon.”
- “Call dentist tomorrow morning.”
- “Call Alex back after lunch.”

### Additional fields

| Field | Description |
|---|---|
| contactName | Person or organization to call. |
| phone | Phone number. |
| callReason | Optional reason. |
| preferredWindow | Optional time window. |

### Primary actions

- Call
- Message, if phone exists
- Mark done
- Snooze

### Detail options

- Edit contact
- Add phone
- Add note
- Change time
- Ping me
- Share
- Delete

### Timeline behavior

Call toats should show a clear call CTA on card when a phone number exists.

If no phone number exists, CTA becomes “Add phone” or no CTA depending on context.

---

## 7.4 Follow-up toat

### Use cases

- “Follow up with Priya about the deck.”
- “Message Calvin after the demo.”
- “Email school about Ryan’s form.”

### Additional fields

| Field | Description |
|---|---|
| contactName | Person/org. |
| channel | call, email, message, unknown. |
| phone | Optional. |
| email | Optional. |
| subject | Optional. |
| context | What the follow-up is about. |

### Primary actions

- Message
- Email
- Call
- Mark done

### Detail options

- Change channel
- Add contact details
- Add note
- Change time
- Add ping
- Share

### Timeline behavior

CTA should match channel if known. If channel is unknown, use “Open” or “Choose action”.

---

## 7.5 Checklist toat

### Use cases

- “Buy milk, eggs, bananas, and bread after work.”
- “Pack passport, charger, jacket, and snacks.”
- “Prepare launch checklist.”

### Additional fields

| Field | Description |
|---|---|
| items | Checklist items. |
| categories | Optional grouped categories. |
| completedCount | Derived. |
| totalCount | Derived. |
| listPurpose | shopping, packing, prep, custom. |

### Primary actions

- View list
- Add item
- Mark item done
- Directions if location exists
- Mark all done

### Detail options

- Edit items
- Reorder items
- Add category
- Add note
- Add location
- Ping me
- Share list

### Timeline behavior

Checklist toats can show progress like “3 of 12 left” and should support item completion without opening heavy edit mode.

### What not to build

Do not build a full shopping app with prices, coupons, stores, inventory, or recipe planning.

---

## 7.6 Errand toat

### Use cases

- “Pick up Ryan from school at 1.”
- “Drop package at UPS tomorrow.”
- “Buy groceries after work.”

### Additional fields

| Field | Description |
|---|---|
| locationName | Store/place. |
| address | Address. |
| travelTimeMinutes | Optional. |
| leaveBy | Derived from start time and travel. |
| travelMode | drive/walk/transit. |

### Primary actions

- Directions
- Leave-by Ping
- Mark done
- Snooze

### Detail options

- Edit location
- Open maps
- Change travel mode
- Change time
- Add checklist
- Add note
- Ping me
- Share

### Timeline behavior

Errands are location-aware. If travel time is available, the card may show “Leave in 10 min” or “25 min drive”.

---

## 7.7 Appointment toat

### Use cases

- “Dentist appointment tomorrow at 9.”
- “Doctor visit Friday at 3.”
- “Car service appointment next Tuesday.”

### Additional fields

| Field | Description |
|---|---|
| providerName | Clinic, doctor, service provider. |
| contactPhone | Optional. |
| address | Optional. |
| appointmentReason | Optional. |
| confirmationCode | Optional. |
| formsLink | Optional. |

### Primary actions

- Directions
- Call provider
- Reschedule
- Mark done

### Detail options

- Edit when
- Edit where
- Add phone
- Add note
- Add documents/forms
- Add leave-by Ping
- Add day-before Ping
- Share

### Timeline behavior

Appointment toats should prioritize when, where, travel, and provider contact.

---

## 7.8 Meeting toat

### Use cases

- “Team standup at 11 on Google Meet.”
- “Product sync with Alex and Priya tomorrow at 2.”
- “Zoom with client Friday.”

### Additional fields

| Field | Description |
|---|---|
| attendees | People. |
| joinUrl | Meeting link. |
| provider | Zoom, Google Meet, Teams, phone, in-person. |
| agenda | Optional agenda. |
| attachments | Optional docs. |
| host | Optional. |
| bookingSource | Optional if booked through Toatre Link. |

### Primary actions

- Join now
- Copy link
- Message guest
- Reschedule
- Mark done

### Detail options

- Edit time
- Edit meeting link
- Edit people
- Edit agenda
- Attach doc
- Add Ping
- Share
- Cancel toat

### Timeline behavior

Meeting cards should show “Join” when close to start time or when the meeting is active.

If the meeting was booked by someone else, show “Booked by [name]”.

---

## 7.9 Booking toat

### Use cases

- Someone books time through the user’s Toatre Link.
- Someone requests a slot that requires approval.

### Additional fields

| Field | Description |
|---|---|
| bookingId | Booking record. |
| guestName | Guest name. |
| guestEmail | Guest email. |
| guestMessage | Optional. |
| bookingStatus | requested, confirmed, declined, cancelled, rescheduled. |
| bookingPageId | Which Toatre Link created it. |
| meetingLocation | video, phone, in-person, custom. |
| guestTimezone | Guest timezone. |

### Primary actions

- Confirm, if request mode
- Decline, if request mode
- Join, if video
- Message guest
- Reschedule
- Cancel

### Detail options

- View guest info
- Add note
- Change meeting method
- Reschedule
- Cancel booking
- Share

### Timeline behavior

Booking toats should look like normal meeting toats with a clear booking badge.

---

## 7.10 Event toat

### Use cases

- “Dinner with parents Friday at 6.”
- “Attend lunch at Farhan’s house.”
- “School function on Saturday.”

### Additional fields

| Field | Description |
|---|---|
| venue | Optional. |
| eventType | social, family, work, personal, custom. |
| people | Optional. |
| location | Optional. |

### Primary actions

- Directions, if location exists
- Add note
- Share
- Mark done

### Detail options

- Edit time
- Edit location
- Add people
- Add note
- Add Ping
- Duplicate
- Delete

### Timeline behavior

Event toats are flexible. They should not require ticket fields unless the ticketed template is used.

---

## 7.11 Ticketed event toat

### Use cases

- “Venus concert in Las Vegas May 16.”
- “Flight at 8am with boarding pass.”
- “Movie tickets Saturday night.”
- “Conference pass next week.”

### Additional fields

| Field | Description |
|---|---|
| ticketType | concert, flight, movie, conference, sports, other. |
| ticketUrl | Optional. |
| walletPassUrl | Optional. |
| qrCode | Optional. |
| barcode | Optional. |
| venue | Optional. |
| doorsAt | Optional. |
| startsAt | Event start. |
| seats | Optional. |
| section | Optional. |
| row | Optional. |
| ticketCount | Optional. |

### Primary actions

- View tickets
- Add to wallet
- Directions
- Share

### Detail options

- Edit event time
- Edit venue
- Add ticket
- View ticket details
- Add note
- Add Ping
- Share
- Delete

### Timeline behavior

Ticketed events should show event time, door time if available, venue, ticket access, and directions.

### What not to build

Do not become a ticket marketplace. Toatre stores and surfaces user-owned ticket information only.

---

## 7.12 Deadline toat

### Use cases

- “Submit tax documents by Friday.”
- “Application due May 20.”
- “Pay rent by the 1st.”

### Additional fields

| Field | Description |
|---|---|
| dueAt | Required or strongly preferred. |
| softDeadline | Whether deadline is flexible. |
| preparationPings | Optional derived reminders. |
| relatedLinks | Optional. |

### Primary actions

- Mark done
- Add Ping
- Open link
- Snooze, only if soft

### Detail options

- Edit deadline
- Add note
- Add file/link
- Add preparation Ping
- Share
- Mark done

### Timeline behavior

Deadline toats should appear before and at the due time. Urgent/important deadlines can receive multiple Pings.

---

## 7.13 Idea toat

### Use cases

- “Idea for a new feature.”
- “Think about Toatre Link pricing.”
- “Book concept: boy finds a map.”

### Additional fields

| Field | Description |
|---|---|
| revisitAt | Optional. |
| tags | Optional. |
| relatedToats | Optional. |

### Primary actions

- Revisit later
- Convert to task
- Add note
- Share

### Detail options

- Edit note
- Add revisit time
- Add tags
- Convert to task/deadline/event
- Share
- Archive

### Timeline behavior

Ideas without a revisit time should not clutter Today. They belong in Search and a “Someday / Ideas” section.

---

# 8. Capture experience

## 8.1 Capture entry points

Capture should be reachable from:

- floating mic on mobile timeline
- floating mic on desktop
- empty state
- quick actions
- keyboard shortcut on desktop
- widgets, later

## 8.2 Capture modes

### Voice capture

Default mode.

States:

1. Ready
2. Listening
3. Transcribing
4. Thinking/extracting
5. Review
6. Add to timeline

### Typed capture

Secondary mode.

Use when:

- mic permission denied
- user is in public
- user prefers typing
- desktop user wants keyboard input

### Share/import capture

Used when receiving:

- links
- tickets
- calendar entries
- notes
- files

This should create a reviewable toat, not silently save everything.

## 8.3 Voice capture screen

Must include:

- large mic visual
- listening state
- elapsed recording time
- live transcript if available
- cancel
- stop/save
- type instead
- privacy cue
- short tip showing that multiple items are allowed

Do not include:

- large forms
- settings
- too many buttons
- unrelated upsell

## 8.4 Capture review screen

Purpose: let the user verify what Toatre understood before saving.

Must include:

- capture summary
- transcript snippet with highlighted entities
- number of toats found
- list of extracted toats
- select/deselect each toat
- edit each toat
- add another toat manually
- play transcript if audio retained or temporarily available
- add selected to timeline

Each extracted toat card must show:

- icon
- title
- time
- location/link/person if relevant
- confidence issue if any
- edit button

## 8.5 AI extraction behavior

Toatre must extract multiple toats from one capture.

Example:

“Dentist appointment tomorrow at 9 at Smile Care Clinic. Then team standup at 11 on Google Meet. Also remind me to call Mom this afternoon.”

Expected:

1. Dentist appointment
2. Team standup
3. Call Mom

Toatre should ask for review when:

- time is ambiguous
- location is uncertain
- contact is unknown
- multiple possible dates exist
- action is unclear

Toatre should not ask review questions during capture unless absolutely necessary. It should create best-effort toats and mark uncertain parts.

---

# 9. Timeline / Home view

## 9.1 Product role

The Timeline is the home of Toatre.

It answers:

- What is next?
- What is happening today?
- What needs attention?
- What is already done?
- What can I capture quickly?

## 9.2 Mobile timeline layout

### Header

- Toatre logo
- selected range: Today / This week / custom date
- date subtitle
- avatar/profile access
- optional calendar/filter controls

### Up Next card

Shown when there is an upcoming toat.

Must show:

- icon
- “Up next” label
- title
- time
- location/context
- immediate smart cue, such as “Leave in 10 min”
- primary action, such as Directions / Join / Call / Open

### Chronological list

Grouped by daypart or time:

- Morning
- Afternoon
- Evening
- Later
- Unscheduled, when needed

Each row shows:

- time on left
- vertical timeline line
- colored dot
- toat card
- quick action

### End-of-day card

Shown after the last scheduled toat:

- “You’re all clear after 8:30 PM”
- Calm contextual message
- optional illustration

### Floating capture mic

Always accessible.

The mic should never block essential content when scrolling.

### Bottom navigation

Timeline, Search, People, Inbox, Settings.

## 9.3 Desktop timeline layout

Desktop can use more space but must remain chronological.

Recommended default desktop timeline:

- left nav
- center chronological timeline/list
- right details panel for selected toat

Alternative views:

- Day timeline
- Week chronological timeline
- Calendar grid as secondary

Desktop should not default to a traditional calendar grid because Toatre’s core concept is chronological order.

## 9.4 Timeline filters

Filters should exist but stay secondary.

Useful filters:

- All
- Meetings
- Personal
- Booked by others
- Tasks
- Errands
- Needs attention
- Shared with me

Do not overbuild filters into complex query builders.

## 9.5 Timeline empty states

### No toats today

Copy direction:

“Nothing on the timeline. Tap the mic and tell me what’s on your mind.”

Actions:

- Capture by voice
- Type instead

### No upcoming toats

“Nothing coming up. Enjoy the quiet.”

### Missing-time toats exist

Show a small section:

“Needs a time”

Each card should let user set time quickly.

## 9.6 Timeline attention states

A toat may need attention when:

- no time was found
- location missing for an errand/appointment
- meeting link missing
- booking request pending
- shared update pending
- conflict detected
- Ping failed

Attention should be calm and helpful, not alarming.

---

# 10. Toat detail screens

## 10.1 Purpose

The detail screen exists to answer:

- What is this toat?
- What do I need to do next?
- Can I edit, share, or act on it quickly?

## 10.2 Detail screen structure

Common structure:

1. Back / close
2. Share / more
3. Large kind icon
4. Kind or status chip
5. Title
6. Primary context line
7. Primary action button
8. Context cards
9. Notes/transcript
10. Pings
11. Sharing
12. Bottom action bar

## 10.3 Detail screen rules

Show only sections that matter.

Do not show empty sections.

For example:

- A call toat does not need a map section.
- A grocery toat needs list progress.
- A meeting needs join info and agenda.
- A ticketed event needs tickets and venue.
- A basic idea needs note and revisit option.

## 10.4 Standard bottom actions

Actions may include:

- Mark done
- Snooze
- Reschedule
- Duplicate
- Delete

For meetings/bookings, include:

- Cancel
- Reschedule

For ticketed events, include:

- Add to wallet
- Share
- More

For checklist/errand:

- View list
- Directions

---

# 11. Search

## 11.1 Product role

Search helps the user find any toat, capture, person, place, or idea.

## 11.2 Search scope

Search should include:

- title
- notes
- transcript snippets
- people
- places
- links
- ticket/event details
- booking guest names

## 11.3 Search filters

Useful filters:

- All
- Upcoming
- Past
- Done
- Shared
- Ideas
- People
- Places

## 11.4 Search results

Each result should show:

- icon
- title
- time/date
- context
- matched term highlight when useful

Search should preserve the timeline feeling when possible, grouping results by time.

---

# 12. People

## 12.1 Product role

People is the user’s lightweight relationship layer.

It supports:

- sharing toats
- booking guests
- follow-ups
- call/message actions
- people-based search

It is not a social network.

## 12.2 Connection fields

| Field | Description |
|---|---|
| id | Unique connection ID. |
| displayName | Name. |
| handle | Optional Toatre handle. |
| email | Optional. |
| phone | Optional. |
| photoUrl | Optional. |
| relationshipLabel | Optional, such as family, work, client, friend. |
| notes | Optional private notes. |
| defaultPermission | view or edit. |
| createdAt | Created timestamp. |
| updatedAt | Updated timestamp. |

## 12.3 People page

Must show:

- search people
- list of saved connections
- add connection
- recently shared people
- people extracted from toats needing confirmation

Person detail should show:

- contact info
- shared toats
- upcoming toats with this person
- follow-up actions
- default sharing permission

## 12.4 What not to build

Do not build:

- public profiles
- followers
- feeds
- likes
- comments
- social discovery

---

# 13. Inbox

## 13.1 Product role

Inbox is where incoming items wait for user decision.

It is not an email inbox.

## 13.2 Inbox item types

| Type | Meaning |
|---|---|
| Shared toat | Someone shared a toat with the user. |
| Booking request | Someone requested time through Toatre Link. |
| Booking update | Guest cancelled/rescheduled/changed details. |
| Shared edit | A collaborator edited a shared toat. |
| System attention | A sync, Ping, or import needs review. |
| Imported capture | Something from share sheet/import needs confirmation. |

## 13.3 Inbox actions

Depending on item type:

- Accept
- Decline
- Add to timeline
- View
- Reply/message
- Approve booking
- Suggest another time
- Archive

## 13.4 Inbox states

### Empty inbox

“Nothing needs your attention.”

### Pending booking requests

Should be visually clear and actionable.

### Shared toats

Should show who shared it, permission level, and whether it will be added to the timeline.

---

# 14. Sharing

## 14.1 Product role

Sharing lets the user give someone access to one specific toat.

## 14.2 Share methods

1. Share with saved connection
2. Share with Toatre handle
3. Share via link
4. Native system share sheet

## 14.3 Permission levels

| Permission | Meaning |
|---|---|
| View only | Recipient can see but not change. |
| Can edit | Recipient can change allowed fields. |

Default should be View only.

## 14.4 Share sheet UI

Must include:

- toat preview
- people picker
- link share option
- permission selector
- send button

## 14.5 Shared toat behavior

Recipient sees:

- who shared it
- title
- time
- location/context
- actions relevant to them
- permission level

Recipient should never see owner’s full timeline.

## 14.6 Link share behavior

Share link opens public preview.

If recipient has app installed, open in app.

If not installed, show web preview and prompt to continue.

---

# 15. Toatre Link / booking

## 15.1 Product role

Toatre Link lets others book time with the user using a public handle page.

The booked time becomes a toat.

## 15.2 Core user story

“As a user, I want to share one simple link so people can book time with me without back-and-forth messages.”

## 15.3 Booking owner settings

### Essential settings

- Enable/disable Toatre Link
- Public handle URL
- Greeting message
- Available days
- Time window
- Slot duration
- Buffer between slots
- Minimum notice
- Maximum days in advance
- Booking mode: instant confirm or request approval
- Guest info required: name, email, optional message
- Meeting method: video, phone, in-person, custom
- Timezone

### Good advanced settings

- Different hours for specific days
- Max bookings per day
- Require reason/message
- Allow rescheduling
- Allow cancellations
- Redirect after booking
- Hide from search engines

### Avoid or defer

- Complex pricing tiers inside booking settings
- Deep custom CSS
- Multiple page variants before the core flow is proven
- Excessive per-day rules that make setup painful

## 15.4 Mobile Toatre Link settings

The mobile screen should not force the user to open many subpages for basic setup.

Recommended structure:

1. Link card with copy/share/preview
2. Live preview
3. Availability summary with inline day chips and range slider
4. Slot duration
5. Quick setup with AI natural language
6. Greeting message
7. Advanced booking rules collapsed
8. Save changes

## 15.5 Desktop Toatre Link settings

Desktop can show more sections, but should be grouped clearly:

Core setup:

- link and status
- greeting
- availability
- booking preferences

Page customization:

- photo
- cover image
- accent color
- title/meta description

Advanced:

- privacy
- redirects
- UTM
- search indexing

## 15.6 Public booking page

Must include:

- owner profile
- greeting
- trust/privacy cue
- available dates
- available times
- timezone info
- selected time confirmation
- guest information form
- confirmation state

## 15.7 Booking flow

1. Visitor opens Toatre Link.
2. Visitor selects date.
3. Visitor selects time.
4. Visitor enters required info.
5. Visitor confirms.
6. Owner receives booking toat.
7. Visitor receives confirmation.
8. Both can reschedule/cancel if allowed.

## 15.8 Booking page states

- No availability
- Time slot selected
- Slot no longer available
- Booking confirmed
- Request sent
- Booking cancelled
- Booking rescheduled
- Waitlist joined

## 15.9 Booking toats

A booked session appears on the owner timeline as a meeting/booking toat.

It must show:

- guest name
- time
- meeting method
- guest message if any
- booking source
- reschedule/cancel actions

---

# 16. Settings

## 16.1 Settings philosophy

Settings should not be a dumping ground.

The user should only see controls that change meaningful product behavior.

Keep the main settings page simple. Use deeper pages only where necessary.

## 16.2 Mobile settings sections

### Account

- Profile
- Toatre Link
- Privacy & security
- Pings

### Preferences

- Timezone
- Availability preferences
- Toat defaults
- Appearance

### Integrations

- Connected apps

### More

- Help & support
- About Toatre
- Log out

## 16.3 Profile settings

Fields:

- name
- photo
- handle
- bio/short description
- email
- phone, optional

Actions:

- edit profile
- change photo
- manage handle

## 16.4 Handle settings

Purpose: manage the public @handle.

Fields/actions:

- current handle
- availability check
- public URL
- copy link
- preview public profile/booking page

Rules:

- handle must be unique
- handle changes should be limited or clearly warned
- old handle redirects may be supported later but not required initially

## 16.5 Privacy & security

Controls:

- voice audio retention toggle
- delete transcripts
- data export
- blocked users/connections
- account deletion
- password/security provider info where relevant

Privacy explanations must be plain English.

## 16.6 Pings settings

Controls:

- global Ping toggle
- push Pings
- email Pings
- SMS Pings, if supported/gated
- per-kind Ping preferences
- quiet hours
- timezone behavior

Avoid making users configure every reminder. Defaults should be good.

## 16.7 Timezone settings

Controls:

- current timezone
- auto-detect timezone
- travel behavior: keep home timezone or update automatically

## 16.8 Availability preferences

Used for Toatre Link and scheduling suggestions.

Controls:

- default available days
- default time window
- different hours per day
- blocked time
- buffer between booked slots

## 16.9 Toat defaults

Controls:

- default slot duration
- default tier
- default Ping behavior
- default meeting method

## 16.10 Appearance

Controls:

- system/light/dark mode if supported
- accent color if supported

Keep visual customization limited. Toatre should remain a cohesive product.

## 16.11 Connected apps

Integrations:

- Google Calendar
- Apple Calendar
- Outlook Calendar
- Zoom
- Google Meet
- Microsoft Teams
- Slack, later if useful

Each integration should show:

- connected/disconnected
- sync direction if relevant
- last sync
- disconnect

Do not expose technical OAuth details to users.

## 16.12 Help & support

Must include:

- FAQ
- contact support
- report a problem
- feature request
- privacy explanation
- version/build info

## 16.13 Account deletion

Must be clear and complete.

Deletion should remove:

- user profile
- toats
- captures
- transcripts
- shared links owned by user
- booking pages
- settings
- device tokens
- connections owned by user

Before deletion:

- warn user
- require confirmation
- explain irreversible nature

---

# 17. Calendar view

## 17.1 Product role

Calendar view is a secondary planning view.

It helps users scan days/weeks, but it should not replace the timeline.

## 17.2 Views

- Day
- Week
- Month, optional on desktop

## 17.3 Rules

Calendar cards should still be toat cards.

Do not make the product feel like Google Calendar clone.

Use calendar view for:

- conflict detection
- week planning
- drag/reschedule
- bookings overview

---

# 18. Widgets

## 18.1 Product role

Widgets should surface what matters next without opening the app.

## 18.2 iOS home screen widgets

Sizes:

- small: next toat
- medium: next two toats or up next + later
- large: today timeline
- extra large iPad: fuller timeline

## 18.3 Lock screen widgets

Types:

- next toat time
- number of toats today
- urgent/needs-attention count
- next event

## 18.4 Widget actions

Possible states:

- open toat
- mark complete
- remind later
- open in app

Widgets should be glanceable, not miniature app screens.

---

# 19. Pings

## 19.1 Product role

Pings bring a toat back at the right time.

## 19.2 Ping types

| Type | Use |
|---|---|
| Time Ping | Before start/due time. |
| Leave-by Ping | Based on travel time. |
| Day-before Ping | For important scheduled items. |
| Follow-up Ping | For tasks/follow-ups. |
| Booking Ping | Before booked sessions. |
| Smart attention Ping | Missing info, conflict, or pending action. |

## 19.3 Ping channels

- push
- local device Ping
- email
- SMS, if enabled/gated

## 19.4 Ping rules

- Default to respectful, low-noise behavior.
- Urgent toats may have stronger Ping behavior.
- Users can disable Pings globally or per toat.
- Quiet hours should be respected unless urgent override is explicitly allowed.

## 19.5 Ping copy style

Good:

“Heads up — Dentist appointment at 9:00 AM.”

“Leave in 10 min for Smile Care Clinic.”

Bad:

“Notification: Event starting.”

“Don’t miss your task!”

---

# 20. Desktop product definition

## 20.1 Desktop purpose

Desktop is for review, editing, booking setup, and planning.

Mobile is for capture and daily use.

Desktop should support:

- timeline review
- detailed editing
- Toatre Link setup
- settings/integrations
- search
- booking management

## 20.2 Desktop layout standards

- left navigation
- top command/search/date bar
- central working area
- optional right detail panel

## 20.3 Desktop timeline

Should default to chronological list/timeline.

Can include:

- week strip
- filter chips
- selected toat side panel
- quick actions

## 20.4 Desktop Toatre Link setup

Desktop is the best place for advanced Toatre Link setup.

Use clean grouped cards:

- Link identity
- Greeting
- Availability
- Booking rules
- Confirmation behavior
- Page customization
- Privacy/advanced

## 20.5 Desktop settings

Use a two-column settings layout:

- left settings categories
- right settings content

Avoid one enormous scrolling page unless grouped very clearly.

---

# 21. Public marketing home page

## 21.1 Goal

Explain Toatre quickly and emotionally.

The home page must communicate:

- voice-first capture
- AI turns speech into toats
- everything lands on a personal timeline
- reminders happen at the right time
- privacy-first

## 21.2 Hero

Recommended message direction:

“Say it. Toatre gets it.”

Support line:

“Capture your day using your voice. Toatre turns it into toats and keeps you on track.”

Primary CTA:

- Sign up for free

Secondary CTA:

- Watch how it works

## 21.3 Hero visual

Should show:

- mobile capture screen
- mic visual
- calm background
- gradient/orb/mountain-like softness

Avoid:

- too many floating cards
- fake complex dashboards
- generic AI imagery

## 21.4 Sections

Essential sections:

1. How it works
2. Use cases
3. Toat examples
4. Privacy
5. Toatre Link/booking, if part of positioning
6. CTA

Do not overload the landing page.

---

# 22. Onboarding

## 22.1 Goals

Onboarding should get the user to their first capture as fast as possible.

## 22.2 Recommended steps

1. Welcome / product promise
2. Sign in
3. Create handle
4. Mic permission
5. Optional notification permission after first useful toat, not too early
6. First capture

## 22.3 Do not ask upfront

Avoid asking many settings before the user experiences value.

Do not ask upfront for:

- detailed availability
- all integrations
- all Ping preferences
- full profile completion

---

# 23. Data and sync behavior

## 23.1 Cross-device sync

A toat created, edited, deleted, completed, or shared on one device should reflect across devices quickly.

## 23.2 Offline behavior

Mobile should support:

- viewing cached timeline
- capturing voice/text offline when possible
- queuing saves
- syncing later

## 23.3 Conflict handling

When two devices edit the same toat:

- preserve the latest field-level change when possible
- avoid silent destructive overwrite
- show conflict only when necessary

---

# 24. Privacy and trust

## 24.1 Voice privacy

Default:

- audio is not stored by default
- transcript may be saved so the user can review/delete
- users can opt into retaining audio

## 24.2 User controls

Users must be able to:

- delete a capture
- delete transcript data
- delete account
- export data
- disconnect integrations
- revoke shared links
- remove people/connections

## 24.3 Public pages

Public booking pages and shared links must not expose private timeline data.

---

# 25. Analytics and product metrics

Track only meaningful product events.

## 25.1 Core events

- signup_started
- signup_completed
- first_capture_started
- capture_completed
- toats_extracted
- toat_added
- toat_completed
- ping_delivered
- ping_opened
- toat_shared
- booking_created
- booking_confirmed
- booking_cancelled
- toatre_link_enabled

## 25.2 Success metrics

- first capture completion rate
- capture-to-toat latency
- average toats per capture
- D1 retention
- D7 retention
- weekly captures per active user
- Pings opened
- booking link activation
- shared toats per active user

Do not track sensitive voice contents as analytics events.

---

# 26. Non-goals

Toatre should not become:

- a project management app
- a kanban board
- a full CRM
- a social network
- an email client
- a ticket marketplace
- a grocery shopping platform
- a habit tracker
- a streak/gamification app
- a generic AI chatbot
- a full replacement for calendar apps

Integrations can connect to other tools, but Toatre’s center remains the user’s personal timeline.

---

# 27. Feature completeness checklist

Before building or mocking any screen, confirm the design supports:

## Base toat

- title
- kind/template
- time
- place
- people
- notes
- pings
- status
- sharing
- actions

## Capture

- voice
- typed
- transcript
- multiple toats
- review
- edit before save
- low-confidence states

## Timeline

- today
- week
- upcoming
- past
- unscheduled
- needs attention
- empty states
- up next
- quick actions

## Details

- contextual fields
- contextual actions
- edit
- share
- pings
- delete/duplicate/done

## Inbox

- shared toats
- booking requests
- shared edits
- import reviews
- accept/decline/archive

## People

- connections
- handles
- sharing
- history
- contact methods

## Toatre Link

- public booking page
- availability
- slot duration
- buffer
- guest info
- confirmation
- booking toat
- owner settings
- reschedule/cancel

## Settings

- profile
- handle
- Toatre Link
- privacy
- Pings
- timezone
- availability
- defaults
- appearance
- connected apps
- help
- account deletion

---

# 28. Final product rule

When deciding whether a feature belongs in Toatre, ask:

Does this help the user capture something once, place it on a personal timeline, remember it at the right time, or share that specific slice of time with the right person?

If yes, it may belong.

If no, it is probably noise.

Toatre should feel like the quiet layer between the user’s mind and their day.

It should not ask the user to become more organized.

It should organize around them.

