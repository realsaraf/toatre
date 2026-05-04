# Toat Type Model

```mermaid
classDiagram
    class Toat {
        +string id
        +ToatTemplate template
        +ToatKind kind
        +ToatTier tier
        +ToatStatus status
        +string title
        +string|null datetime
        +string|null endDatetime
        +string|null location
        +string|null link
        +string[] people
        +string|null notes
        +string|null captureId
        +string createdAt
        +string updatedAt
        +TemplateData templateData
    }

    class MeetingData {
        +template = "meeting"
        +string|null joinUrl
        +string[] attendees
        +string|null agenda
    }

    class CallData {
        +template = "call"
        +string|null phone
        +string|null contactName
    }

    class AppointmentData {
        +template = "appointment"
        +string|null providerName
        +string|null phone
        +string|null address
    }

    class EventData {
        +template = "event"
        +string|null venue
        +string|null ticketUrl
        +string|null doorsAt
    }

    class DeadlineData {
        +template = "deadline"
        +string|null dueAt
        +bool softDeadline
    }

    class TaskData {
        +template = "task"
        +string|null completedAt
    }

    class ChecklistData {
        +template = "checklist"
        +ChecklistItem[] items
    }

    class ChecklistItem {
        +string id
        +string text
        +bool done
    }

    class ErrandData {
        +template = "errand"
        +string|null address
        +string|null storeOrVenue
    }

    class FollowUpData {
        +template = "follow_up"
        +string|null contactName
        +string|null phone
        +string|null email
        +channel call|email|message|null
    }

    class IdeaData {
        +template = "idea"
        +string|null revisitAt
        +string[] tags
    }

    Toat --> MeetingData : template = meeting
    Toat --> CallData : template = call
    Toat --> AppointmentData : template = appointment
    Toat --> EventData : template = event
    Toat --> DeadlineData : template = deadline
    Toat --> TaskData : template = task
    Toat --> ChecklistData : template = checklist
    Toat --> ErrandData : template = errand
    Toat --> FollowUpData : template = follow_up
    Toat --> IdeaData : template = idea

    ChecklistData --> ChecklistItem : items[]
```

## Enums

| Type | Values |
|---|---|
| `ToatTemplate` | `meeting` `call` `appointment` `event` `deadline` `task` `checklist` `errand` `follow_up` `idea` |
| `ToatKind` | `task` `event` `meeting` `idea` `errand` `deadline` |
| `ToatTier` | `urgent` `important` `regular` |
| `ToatStatus` | `active` `snoozed` `done` `cancelled` `archived` |

## Shared convenience fields on Toat

`location` and `link` live on the base Toat and are populated regardless of template — so a meeting's join URL is also in `link`, and an appointment's address is also in `location`. `templateData` holds the richer template-specific payload.

## Template → Kind mapping

| Template | Kind |
|---|---|
| meeting | meeting |
| call | task |
| appointment | errand |
| event | event |
| deadline | deadline |
| task | task |
| checklist | task |
| errand | errand |
| follow_up | task |
| idea | idea |
