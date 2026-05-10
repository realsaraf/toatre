import type { Enrichments, ToatState } from "./enrichments";

// â”€â”€â”€ Migration helper: convert legacy templateData â†’ Enrichments â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Used by the API serializer to normalise old MongoDB documents on read.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function migrateTemplateData(doc: any): Enrichments {
  const template: string = doc.template ?? "";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const td: Record<string, any> = doc.templateData ?? {};
  const enrichments: Enrichments = {};

  // Carry over top-level convenience fields
  if (doc.datetime || doc.endDatetime) {
    enrichments.time = {
      at: doc.datetime ? new Date(doc.datetime).toISOString() : null,
      endAt: doc.endDatetime ? new Date(doc.endDatetime).toISOString() : null,
    };
  }
  if (doc.location) {
    enrichments.place = { address: doc.location };
  }
  if (doc.people?.length) {
    enrichments.people = doc.people;
  }

  // Template-specific migration
  switch (template) {
    case "meeting":
      enrichments.communication = {
        joinUrl: td.joinUrl ?? null,
        channel: "message",
      };
      if (td.attendees?.length) enrichments.people = [...(enrichments.people ?? []), ...td.attendees];
      if (td.agenda) enrichments.thought = { type: "note", content: td.agenda };
      break;
    case "call":
      enrichments.communication = {
        contact: td.contactName ?? null,
        phone: td.phone ?? null,
        channel: "call",
      };
      break;
    case "appointment":
      enrichments.communication = {
        contact: td.providerName ?? null,
        phone: td.phone ?? null,
      };
      if (td.address) enrichments.place = { address: td.address };
      break;
    case "event":
      enrichments.event = {
        venueName: td.venue ?? null,
        ticketUrl: td.ticketUrl ?? null,
      };
      if (td.doorsAt) {
        enrichments.time = { ...enrichments.time, at: td.doorsAt };
      }
      break;
    case "deadline":
      enrichments.time = { ...enrichments.time, dueAt: td.dueAt ?? null };
      break;
    case "task":
      enrichments.action = { type: "task", completedAt: td.completedAt ?? null };
      break;
    case "checklist":
      enrichments.action = {
        type: "checklist",
        checklist: (td.items ?? []).map((i: { id: string; text: string; done: boolean }) => ({
          id: i.id, text: i.text, done: i.done,
        })),
      };
      break;
    case "errand":
      enrichments.action = { type: "errand" };
      if (td.address || td.storeOrVenue) {
        enrichments.place = {
          placeName: td.storeOrVenue ?? null,
          address: td.address ?? doc.location ?? null,
        };
      }
      break;
    case "follow_up":
      enrichments.communication = {
        contact: td.contactName ?? null,
        phone: td.phone ?? null,
        email: td.email ?? null,
        channel: td.channel ?? null,
      };
      break;
    case "idea":
      enrichments.thought = {
        type: "idea",
        revisitAt: td.revisitAt ?? null,
        tags: td.tags ?? [],
      };
      break;
  }

  return enrichments;
}

/** Map legacy status string → ToatState. */
export function migrateStatus(status: string | undefined): ToatState {
  if (status === "done") return "done";
  if (status === "archived" || status === "cancelled") return "archived";
  return "open";
}