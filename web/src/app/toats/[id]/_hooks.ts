import type { ToatDetail, ToatLayout } from "./_types";
import {
  formatRelativeChip,
  toatTime,
  toatEndTime,
  toatLocation,
  toatPeople,
  mapHref,
  getVisual,
  getPrimaryAction,
  buildReminderLines,
  getAgendaLines,
} from "./_utils";

export function useToatLayout(toat: ToatDetail, now: Date): ToatLayout {
  const joinUrl = toat.enrichments?.communication?.joinUrl ?? null;
  const phone = toat.enrichments?.communication?.phone ?? null;
  const loc = toatLocation(toat);
  const maps = mapHref(loc);
  const people = toatPeople(toat);
  const startDate = toatTime(toat) ? new Date(toatTime(toat)!) : null;
  const endDate = toatEndTime(toat) ? new Date(toatEndTime(toat)!) : null;
  const ticketUrl = toat.enrichments?.event?.ticketUrl ?? null;
  return {
    isMeeting: !!joinUrl,
    isEvent: !!toat.enrichments?.event,
    isChecklist: toat.enrichments?.action?.type === "checklist",
    loc,
    maps,
    phone,
    joinUrl,
    people,
    startDate,
    endDate,
    ticketUrl,
    visual: getVisual(toat),
    heroChip: formatRelativeChip(toat, now),
    primaryAction: getPrimaryAction(toat),
    reminders: buildReminderLines(toat),
    agenda: getAgendaLines(toat),
  };
}
