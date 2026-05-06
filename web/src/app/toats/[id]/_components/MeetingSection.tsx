import {
  BellIcon,
  ChevronRightIcon,
  ClockIcon,
  DocumentIcon,
  EditIcon,
  LocationIcon,
  MessageGlyph,
  VideoGlyph,
} from "@/components/mobile-ui";
import type { DetailVisual } from "../_types";
import { formatDate, formatTime } from "../_utils";
import { sectionCardStyles, buttonStyles, toggleStyles, attachmentStyles, notesStyles } from "../_styles";
import { SectionCard } from "./SectionCard";
import { InfoRow } from "./InfoRow";
import { LocationBlock } from "./LocationBlock";

export function MeetingSection({
  startDate,
  endDate,
  joinUrl,
  people,
  agenda,
  visual,
  loc,
  maps,
  onAddLocation,
  onChangeLocation,
  onRemoveLocation,
}: {
  startDate: Date | null;
  endDate: Date | null;
  joinUrl: string;
  people: string[];
  agenda: string[];
  visual: DetailVisual;
  loc: string | null;
  maps: string | null;
  onAddLocation: () => void;
  onChangeLocation: () => void;
  onRemoveLocation: () => void;
}) {
  return (
    <>
      <SectionCard title="Meeting details">
        {startDate ? (
          <InfoRow
            icon={<ClockIcon size={22} />}
            label="When"
            title={`${formatDate(startDate)} \u00b7 ${formatTime(startDate)}`}
            subtitle={endDate ? `Ends at ${formatTime(endDate)}` : null}
          />
        ) : null}
        <InfoRow
          icon={<VideoGlyph size={22} />}
          label="Link"
          title="Open meeting room"
          subtitle={joinUrl.replace(/^https?:\/\//, "")}
          onClick={() => window.open(joinUrl, "_blank", "noopener,noreferrer")}
          trailing={
            <span style={{ color: "#6B7280" }}>
              <ChevronRightIcon size={18} />
            </span>
          }
        />
        <InfoRow
          icon={<MessageGlyph size={22} />}
          label="People"
          title={`${people.length || 1} people`}
          subtitle={people.length ? people.join(", ") : "Just you so far"}
        />
      </SectionCard>

      <SectionCard
        title="Agenda"
        action={
          <button type="button" style={sectionCardStyles.inlineGhost}>
            <EditIcon size={18} /> Edit
          </button>
        }
      >
        {agenda.length ? (
          <ul style={attachmentStyles.list}>
            {agenda.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : (
          <p style={notesStyles.bodyText}>No agenda yet. Add one from your next capture.</p>
        )}
      </SectionCard>

      <SectionCard title="Attachment">
        <button
          type="button"
          onClick={() => window.open(joinUrl, "_blank", "noopener,noreferrer")}
          style={{ ...attachmentStyles.attachmentRow, ...attachmentStyles.attachmentRowButton }}
        >
          <span
            style={{
              ...attachmentStyles.attachmentIcon,
              color: visual.accent,
              background: visual.soft,
            }}
          >
            <DocumentIcon size={24} />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={attachmentStyles.attachmentTitle}>Meeting link</p>
            <p style={attachmentStyles.attachmentSubtitle}>
              {joinUrl.replace(/^https?:\/\//, "")}
            </p>
          </div>
          <span style={{ color: visual.accent }}>
            <ChevronRightIcon size={20} />
          </span>
        </button>
      </SectionCard>

      <SectionCard title="Ping">
        <div style={attachmentStyles.pingRow}>
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
            <p style={toggleStyles.toggleTitle}>10 min before</p>
            <p style={toggleStyles.toggleSubtitle}>
              You&apos;ll get a Ping before it starts.
            </p>
          </div>
        </div>
      </SectionCard>

      {maps && loc ? (
        <LocationBlock
          location={loc}
          mapsUrl={maps}
          gradient={visual.gradient}
          accent={visual.accent}
          onChangeLocation={onChangeLocation}
          onRemoveLocation={onRemoveLocation}
        />
      ) : (
        <div style={buttonStyles.buttonRow}>
          <button type="button" onClick={onAddLocation} style={buttonStyles.secondaryButton}>
            <LocationIcon size={18} /> Add location
          </button>
        </div>
      )}
    </>
  );
}
