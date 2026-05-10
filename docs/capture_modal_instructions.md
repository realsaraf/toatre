# Toatre Desktop Capture Modal — Full UI Build Specification

## Purpose

This document defines the **desktop Capture modal** for Toatre in enough detail that an LLM or frontend engineer can build it without guessing.

It covers:

- modal structure
- exact content order
- recording-mode behavior
- visual composition
- atomic design breakdown
- interaction rules
- relationship to the Timeline page

This spec is for the **desktop recording-state modal** opened from the floating capture controls.

---

# 1. Product intent of this modal

The Capture modal is the heart of Toatre.

Its purpose is to make voice capture feel:

- immediate
- safe
- simple
- private
- premium
- intelligently helpful

The modal must make it clear that:

- the user can just speak naturally
- the system is actively listening
- multiple toats can be captured from a single utterance
- the transcript is being processed live
- the mic control itself is the main record/stop action

This modal must not feel like:

- a dictation utility
- a transcription dashboard
- a complex form
- a noisy AI tool

---

# 2. Modal context

This modal appears **on top of the desktop Timeline page**.

The background page remains visible but dimmed.

The modal is opened from:

- the floating mic button → recording mode
- the floating keyboard button → text-entry mode

This document covers **recording mode only**.

---

# 3. Important behavioral rules

These are required.

## 3.1 Floating capture controls on page background

When the capture modal is open:

- the page-level floating capture controls must be **hidden**
- only the capture modal controls remain visible

Do not show the floating keyboard/mic capsule behind or below the modal.

---

## 3.2 Mic interaction model

In recording mode:

- the large mic control inside the modal is the **primary active recording control**
- the mic must visually indicate that recording is active
- the user stops recording by pressing the mic button itself

Therefore:

- **do not include a separate “Stop recording” button**

---

## 3.3 Content order correction

The transcript / captured text must appear **above the mic control**.

The mic control belongs lower in the modal, near the bottom action region.

The flow should be:

1. title and helper text
2. live listening visual
3. live transcript area
4. privacy / tip support content
5. bottom action row including the mic button

---

# 4. Screen composition summary

The capture modal is a centered, rounded white panel with soft shadow.

### Background state

- parent page visible but dimmed / desaturated slightly
- timeline and right detail panel still recognizable behind the modal
- no floating capture control visible behind the modal

### Modal size guidance

Approximate size:

- width: `~480px`
- height: auto, visually tall but not overwhelming
- vertically centered or slightly above absolute center

The modal should feel tall enough to breathe, but not so large that it becomes a full page.

---

# 5. Design tokens

Use the same design system as the Timeline page.

## 5.1 Color system

### Accent family

Use the Toatre gradient family:

- violet
- purple
- magenta
- warm orange

### Modal neutrals

- modal background: white
- border: extremely subtle light gray or none
- overlay dim: semi-transparent cool gray/black with low opacity
- primary text: dark navy
- secondary text: muted slate
- tertiary helper text: lighter gray

### Live state emphasis

Use purple / gradient accents to indicate live capture.

---

## 5.2 Radius

- modal container: `24px`
- transcript card: `18–20px`
- buttons: `14–16px`
- mic control: circular

---

## 5.3 Elevation

- modal has a soft but noticeable shadow
- internal cards have lighter elevation or simple borders
- mic control has slightly stronger emphasis glow because it is the main active control

---

## 5.4 Typography

### Required hierarchy

- modal title: bold / prominent
- body guidance: regular medium size
- live status label: semibold, accent-colored
- transcript text: readable, medium size
- pill text: small, semibold or medium
- button labels: medium

---

# 6. Atomic design breakdown

---

# 7. Atoms

## 7.1 Close button atom

### Structure

- circular button with `X` icon

### Placement

Top-right inside modal

### Style

- white or transparent background
- soft border or shadow optional
- subtle hover state

---

## 7.2 Listening indicator text atom

Text:

`Listening...`

Style:

- purple accent text
- medium weight
- paired with a tiny waveform icon

---

## 7.3 Timer atom

Text example:

`00:12`

Style:

- centered
- purple or dark accent
- medium emphasis

---

## 7.4 Transcript label atom

Text:

`Transcribing...`

Style:

- small
- purple
- preceded by a tiny colored dot

---

## 7.5 Privacy pill atom

Text:

`On-device transcription`

Optional leading icon:

- small lock icon

Style:

- rounded pill
- lavender tint background
- purple text
- compact

---

## 7.6 Bottom button atoms

### Secondary button atom

Used for:

- `Cancel`
- `Type instead`

Style:

- white / very light background
- subtle border
- rounded corners
- medium size

### Mic action atom

Used as the main active recording control.

Style:

- circular
- gradient fill from purple to magenta to orange
- white mic glyph
- subtle glow/ring
- larger than the other buttons

Because recording is active, this button must visually feel “live”.

Possible active cues:

- faint pulsing glow
- subtle outer ring
- strong color saturation

---

# 8. Molecules

## 8.1 Modal header molecule

### Structure

Left side:

- title: `Capture`
- helper line 1: `Tell Toatre what’s on your mind.`
- helper line 2: `You can say multiple things.`

Right side:

- close button

### Layout

- title and helper copy aligned left
- close button aligned top-right

---

## 8.2 Live listening visual molecule

This is the central visual signature area.

### Structure

From top to bottom:

1. small waveform icon + `Listening...`
2. large circular live visualizer
3. timer beneath the visualizer

### Main live visualizer

The large circular visualization should consist of:

- a large circular area
- gradient outer ring
- very subtle concentric rings around it or faint ambient circles
- waveform bars inside the circle rather than a static mic illustration

### Important correction

For this version, since recording is active, the central visual can emphasize **audio waveform / listening energy** more than a static icon. It should look live.

### Side waveform accents

Optional but recommended:

- subtle horizontal waveform bars extending left and right of the visualizer
- left side can lean purple
- right side can lean orange

These should remain delicate, not busy.

---

## 8.3 Transcript card molecule

### Structure

- small label row: purple dot + `Transcribing...`
- transcript body text

### Transcript text content

Use this exact content for the spec state:

`Dentist appointment tomorrow at 9am at Smile Care Clinic. Then team standup at 11am on Google Meet. Also remind me to call Mom this afternoon.`

### Style

- rounded white or very faintly tinted card
- soft border or extremely subtle elevation
- comfortable padding
- transcript text large enough to read clearly
- multi-line wrapping

### Placement

This transcript card must appear **above the mic control**.

---

## 8.4 Privacy support molecule

### Structure

A centered privacy pill:

- lock icon
- `On-device transcription`

### Placement

Directly below the transcript card.

---

## 8.5 Tip card molecule

### Structure

- leading small idea/lightbulb icon
- short message:
  - `Tip: You can say multiple things.`
  - `I’ll organize them for you.`

### Style

- light bordered or very lightly tinted panel
- understated
- not louder than the transcript card

### Placement

Below the privacy pill, above the bottom action row.

---

## 8.6 Bottom action row molecule

This is the bottom control cluster.

### Composition

Three controls on one horizontal row:

1. `Cancel` button on the left
2. large circular active mic button in the center
3. `Type instead` button on the right

### Layout rules

- keep the mic button visually dominant
- align all three controls horizontally
- give enough breathing room between controls

### Important correction

There must be **no separate “Stop recording” button**.

The active mic button itself is the record/stop toggle.

---

# 9. Organisms

## 9.1 Capture modal organism

### Full internal order

1. modal header
2. live listening visual area
3. transcript card
4. privacy pill
5. tip card
6. bottom action row

### Spacing logic

- header block has generous bottom spacing
- live visual area is the emotional centerpiece
- transcript card has strong readability
- lower support content is lighter and secondary
- bottom control row has clear affordances

---

## 9.2 Background dim layer organism

### Structure

- full-screen overlay behind modal
- partially obscures the timeline page
- does not fully black out the interface

### Rules

- the user should still perceive that they are on the timeline page
- modal is clearly the active focus
- floating capture controls from the page are hidden

---

# 10. Template-level composition

## 10.1 Exact modal content order

This is the correct order to implement.

```text
CaptureModal
├── ModalContainer
│   ├── ModalHeader
│   │   ├── Title("Capture")
│   │   ├── HelperText("Tell Toatre what’s on your mind.")
│   │   ├── HelperText("You can say multiple things.")
│   │   └── CloseButton
│   ├── ListeningVisualizerSection
│   │   ├── ListeningStatusRow
│   │   │   ├── WaveformIcon
│   │   │   └── Text("Listening...")
│   │   ├── LargeCircularLiveVisualizer
│   │   ├── SideWaveformAccents(optional)
│   │   └── Timer("00:12")
│   ├── TranscriptCard
│   │   ├── LabelRow
│   │   │   ├── PurpleDot
│   │   │   └── Text("Transcribing...")
│   │   └── TranscriptText
│   ├── PrivacyPill
│   │   ├── LockIcon
│   │   └── Text("On-device transcription")
│   ├── TipCard
│   │   ├── LightbulbIcon
│   │   ├── Text("Tip: You can say multiple things.")
│   │   └── Text("I’ll organize them for you.")
│   └── BottomActionRow
│       ├── SecondaryButton("Cancel")
│       ├── LiveMicButton(activeRecording=true)
│       └── SecondaryButton("Type instead", withKeyboardIcon=true)
```

---

# 11. Visual state specifics for recording mode

## 11.1 Active recording cues

The UI must clearly communicate that the system is actively recording.

Use all of the following cues:

- `Listening...` status label
- animated or visually energetic waveform language
- visible elapsed timer
- highly saturated gradient mic button
- transcript updating live

## 11.2 What not to show in this state

Do not show:

- a static inactive mic only
- a separate stop-recording CTA
- the page-level floating capture capsule
- extra complex settings inside the modal
- long AI explanations

---

# 12. Text content specification

Use the following text exactly in this recording-mode mock/spec.

## 12.1 Header copy

- `Capture`
- `Tell Toatre what’s on your mind.`
- `You can say multiple things.`

## 12.2 Live status

- `Listening...`
- timer example: `00:12`

## 12.3 Transcript label

- `Transcribing...`

## 12.4 Transcript content

`Dentist appointment tomorrow at 9am at Smile Care Clinic. Then team standup at 11am on Google Meet. Also remind me to call Mom this afternoon.`

## 12.5 Privacy label

- `On-device transcription`

## 12.6 Tip card copy

- `Tip: You can say multiple things.`
- `I’ll organize them for you.`

## 12.7 Bottom actions

- `Cancel`
- `Type instead`

The center mic button uses iconography only and does not need a text label.

---

# 13. Interaction rules

## 13.1 Close behavior

The user can close the modal by:

- pressing the `X`
- pressing `Cancel`
- clicking outside if that is enabled by product decision

## 13.2 Mic behavior

The large mic button behaves as the primary recording control.

### In this state

- recording is active
- clicking mic stops recording
- after stopping, the next flow may move toward review / extracted toats state

## 13.3 Type instead behavior

The `Type instead` button switches the modal into text-entry mode.

Do not close the modal; transition within the same modal frame.

## 13.4 Background behavior

While the modal is open:

- background page is inert or non-primary
- floating page capture controls are hidden
- selected toat detail panel stays visible in the background only as visual context

---

# 14. Accessibility notes

Even though this is a visual spec, the build should support:

- clear focus states
- keyboard navigability
- sufficient contrast for text
- clear aria label for the mic button
- close button accessible via keyboard

Suggested labels:

- mic button aria label: `Stop recording`
- type button aria label: `Switch to typed capture`
- close button aria label: `Close capture`

---

# 15. Explicit exclusions

These must not be included in the final recording-mode modal:

1. No floating capture controls visible outside the modal
2. No separate `Stop recording` button
3. No transcript placed below the mic button
4. No `New Toat` button in the page header behind the modal
5. No long form fields inside the recording state
6. No secondary AI badges unless they are very subtle

---

# 16. Final implementation guidance

If anything feels ambiguous, follow these principles in order:

1. keep the modal centered and calm
2. make the recording state unmistakable
3. make the transcript highly readable
4. use the mic itself as the stop control
5. keep the bottom action row simple
6. hide all background floating capture controls while modal is active

This modal should feel like a premium voice-capture experience, not a utility pop-up.

