import { BellIcon, ClockIcon, PhoneGlyph } from "@/components/mobile-ui";
import type { ToatDetail, DetailVisual } from "../_types";
import { formatDate, formatTime } from "../_utils";
import { buttonStyles, toggleStyles } from "../_styles";
import { SectionCard } from "./SectionCard";
import { InfoRow } from "./InfoRow";
import { LocationBlock } from "./LocationBlock";
import { SwitchVisual } from "./SwitchVisual";
import { NotesSection } from "./NotesSection";

export function WhenWhereCard({
  startDate,
  endDate,
  loc,
  maps,
  phone,
  visual,
  notesLocal,
  showNotes,
  onEditNotes,
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
  onEditNotes: () => void;
  onChangeLocation: () => void;
  onRemoveLocation: () => void;
  onShareOrCall: () => void;
  reminders: Array<{ title: string; subtitle: string }>;
  user: { displayName: string | null } | null;
  toat: ToatDetail;
}) {
  return (
    <>
      <SectionCard title="When & where">
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

        {phone ? (
          <InfoRow icon={<PhoneGlyph size={22} />} label="Contact" title={phone} />
        ) : null}
        {maps && loc ? (
          <>
            <LocationBlock
              location={loc}
              mapsUrl={maps}
              accent={visual.accent}
              onChangeLocation={onChangeLocation}
              onRemoveLocation={onRemoveLocation}
            />
            {phone ? (
              <div style={buttonStyles.buttonRow}>
                <button type="button" onClick={onShareOrCall} style={buttonStyles.secondaryButton}>
                  <PhoneGlyph size={20} /> Call
                </button>
              </div>
            ) : null}
          </>
        ) : phone ? (
          <div style={buttonStyles.buttonRow}>
            <button type="button" onClick={onShareOrCall} style={buttonStyles.secondaryButton}>
              <PhoneGlyph size={20} /> Call
            </button>
          </div>
        ) : null}
      </SectionCard>

      {showNotes || notesLocal.trim() !== "" ? (
        <NotesSection
          notes={notesLocal}
          onEdit={onEditNotes}
          showCaptureLine
          createdAt={toat.createdAt}
          userInitial={user?.displayName?.[0]?.toUpperCase() ?? "T"}
          accent={visual.accent}
        />
      ) : null}

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
