import type { MutableRefObject } from "react";
import { BellIcon, ClockIcon, EditIcon, LocationIcon, MessageGlyph, PhoneGlyph, SparkleIcon } from "@/components/mobile-ui";
import { ChevronRightIcon } from "@/components/mobile-ui";
import type { ToatDetail, DetailVisual } from "../_types";
import { formatDate, formatTime, formatShortDate } from "../_utils";
import { sectionCardStyles, buttonStyles, toggleStyles, notesStyles } from "../_styles";
import { SectionCard } from "./SectionCard";
import { InfoRow } from "./InfoRow";
import { LocationBlock } from "./LocationBlock";
import { SwitchVisual } from "./SwitchVisual";

export function WhenWhereCard({
  startDate,
  endDate,
  loc,
  maps,
  phone,
  visual,
  notesLocal,
  showNotes,
  setNotesLocal,
  saveNotesText,
  notesSaveTimer,
  setShowNotes,
  onAddLocation,
  onChangeLocation,
  onRemoveLocation,
  onShareOrCall,
  reminders,
  user,
  toat,
}: {
  startDate: Date | null;
  endDate: Date | null;
  loc: string | null;
  maps: string | null;
  phone: string | null;
  visual: DetailVisual;
  notesLocal: string;
  showNotes: boolean;
  setNotesLocal: (v: string) => void;
  saveNotesText: (v: string) => Promise<void>;
  notesSaveTimer: MutableRefObject<ReturnType<typeof setTimeout> | null>;
  setShowNotes: (v: boolean) => void;
  onAddLocation: () => void;
  onChangeLocation: () => void;
  onRemoveLocation: () => void;
  onShareOrCall: () => void;
  reminders: Array<{ title: string; subtitle: string }>;
  user: { displayName: string | null } | null;
  toat: ToatDetail;
}) {
  return (
    <>
      <SectionCard
        title="When & where"
        action={
          <button type="button" style={sectionCardStyles.inlineGhost}>
            <EditIcon size={18} /> Edit
          </button>
        }
      >
        {startDate ? (
          <InfoRow
            icon={<ClockIcon size={22} />}
            label="When"
            title={formatDate(startDate)}
            subtitle={
              endDate
                ? `${formatTime(startDate)} \u2013 ${formatTime(endDate)}`
                : formatTime(startDate)
            }
          />
        ) : null}
        {loc ? (
          <InfoRow
            icon={<LocationIcon size={22} />}
            label="Where"
            title={loc}
            subtitle={maps ? "Open in Maps" : null}
            onClick={maps ? () => window.open(maps, "_blank", "noopener,noreferrer") : undefined}
            trailing={
              maps ? (
                <span style={{ color: "#6B7280" }}>
                  <ChevronRightIcon size={18} />
                </span>
              ) : undefined
            }
          />
        ) : null}
        {phone ? (
          <InfoRow icon={<PhoneGlyph size={22} />} label="Contact" title={phone} />
        ) : null}
        {maps && loc ? (
          <>
            <LocationBlock
              location={loc}
              mapsUrl={maps}
              gradient={visual.gradient}
              accent={visual.accent}
              onChangeLocation={onChangeLocation}
              onRemoveLocation={onRemoveLocation}
            />
            <div style={buttonStyles.buttonRow}>
              <button type="button" onClick={onShareOrCall} style={buttonStyles.secondaryButton}>
                {phone ? <PhoneGlyph size={20} /> : <MessageGlyph size={20} />}{" "}
                {phone ? "Call" : "Share"}
              </button>
            </div>
          </>
        ) : (
          <div style={buttonStyles.buttonRow}>
            <button type="button" onClick={onAddLocation} style={buttonStyles.secondaryButton}>
              <LocationIcon size={18} /> Add location
            </button>
            <button type="button" onClick={onShareOrCall} style={buttonStyles.secondaryButton}>
              {phone ? <PhoneGlyph size={20} /> : <MessageGlyph size={20} />}{" "}
              {phone ? "Call" : "Share"}
            </button>
          </div>
        )}
      </SectionCard>

      {showNotes || notesLocal.trim() !== "" ? (
        <SectionCard title="Notes">
          <textarea
            style={notesStyles.notesTextarea}
            value={notesLocal}
            onChange={(e) => {
              setNotesLocal(e.target.value);
              if (notesSaveTimer.current) clearTimeout(notesSaveTimer.current);
              notesSaveTimer.current = setTimeout(
                () => {
                  void saveNotesText(e.target.value);
                },
                800,
              );
            }}
            onBlur={() => void saveNotesText(notesLocal)}
            placeholder="Add a note\u2026"
            rows={3}
          />
          <div style={notesStyles.captureLine}>
            <span style={notesStyles.captureAvatar}>
              {user?.displayName?.[0]?.toUpperCase() ?? "T"}
            </span>
            <span>Captured {formatShortDate(new Date(toat.createdAt))}</span>
            <span style={{ color: visual.accent }}>
              <SparkleIcon size={16} />
            </span>
          </div>
        </SectionCard>
      ) : (
        <button
          type="button"
          onClick={() => setShowNotes(true)}
          style={{
            background: "transparent",
            border: "1.5px dashed rgba(123,92,246,0.25)",
            borderRadius: 14,
            padding: "12px 16px",
            width: "100%",
            color: "#7C3AED",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            textAlign: "left",
            marginBottom: 16,
          }}
        >
          + Add notes
        </button>
      )}

      {reminders.length ? (
        <SectionCard title="Reminders">
          {reminders.map((reminder) => (
            <div key={reminder.title} style={toggleStyles.toggleRow}>
              <div style={toggleStyles.toggleRowText}>
                <span
                  style={{
                    ...toggleStyles.toggleIcon,
                    color: visual.accent,
                    background: visual.soft,
                  }}
                >
                  <BellIcon size={20} />
                </span>
                <div>
                  <p style={toggleStyles.toggleTitle}>{reminder.title}</p>
                  <p style={toggleStyles.toggleSubtitle}>{reminder.subtitle}</p>
                </div>
              </div>
              <SwitchVisual on={true} />
            </div>
          ))}
        </SectionCard>
      ) : null}
    </>
  );
}
