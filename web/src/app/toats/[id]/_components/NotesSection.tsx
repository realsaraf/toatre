import { EditIcon, SparkleIcon } from "@/components/mobile-ui";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { notesStyles, sectionCardStyles } from "../_styles";
import { formatShortDate } from "../_utils";
import { SectionCard } from "./SectionCard";

interface NotesSectionProps {
  notes: string;
  onEdit: () => void;
  showCaptureLine?: boolean;
  createdAt?: string;
  userInitial?: string;
  accent?: string;
}

export function NotesSection({
  notes,
  onEdit,
  showCaptureLine = false,
  createdAt,
  userInitial = "T",
  accent = "#6D28D9",
}: NotesSectionProps) {
  const trimmedNotes = notes.trim();

  return (
    <SectionCard
      title="Notes"
      action={
        <button type="button" style={sectionCardStyles.inlineGhost} onClick={onEdit}>
          <EditIcon size={15} /> {trimmedNotes ? "Edit" : "Add notes"}
        </button>
      }
    >
      {trimmedNotes ? (
        <MarkdownRenderer markdown={trimmedNotes} tone="detail" />
      ) : (
        <p style={notesStyles.bodyText}>No notes yet. Plain text works, and Markdown is optional.</p>
      )}

      {showCaptureLine && createdAt ? (
        <div style={notesStyles.captureLine}>
          <span style={notesStyles.captureAvatar}>{userInitial}</span>
          <span>Captured {formatShortDate(new Date(createdAt))}</span>
          <span style={{ color: accent }}>
            <SparkleIcon size={16} />
          </span>
        </div>
      ) : null}
    </SectionCard>
  );
}