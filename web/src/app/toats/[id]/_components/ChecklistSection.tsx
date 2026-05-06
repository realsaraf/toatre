import type { MutableRefObject } from "react";
import { BellIcon, GrabHandleIcon, PlusIcon } from "@/components/mobile-ui";
import type { ChecklistItem, DetailVisual, ToatDetail } from "../_types";
import { checklistStyles, notesStyles, sectionCardStyles, toggleStyles } from "../_styles";
import { SectionCard } from "./SectionCard";
import { LocationBlock } from "./LocationBlock";
import { SwitchVisual } from "./SwitchVisual";

export function ChecklistSection({
  checklistLocal,
  setChecklistLocal,
  saveChecklistItems,
  checklistDragIndex,
  visual,
  loc,
  maps,
  onChangeLocation,
  onRemoveLocation,
  notesLocal,
  showNotes,
  setNotesLocal,
  saveNotesText,
  notesSaveTimer,
}: {
  checklistLocal: ChecklistItem[];
  setChecklistLocal: (v: ChecklistItem[]) => void;
  saveChecklistItems: (v: ChecklistItem[]) => Promise<void>;
  checklistDragIndex: MutableRefObject<number | null>;
  visual: DetailVisual;
  loc: string | null;
  maps: string | null;
  onChangeLocation: () => void;
  onRemoveLocation: () => void;
  notesLocal: string;
  showNotes: boolean;
  setNotesLocal: (v: string) => void;
  saveNotesText: (v: string) => Promise<void>;
  notesSaveTimer: MutableRefObject<ReturnType<typeof setTimeout> | null>;
  user: { displayName: string | null } | null;
  toat: ToatDetail;
}) {
  const addItem = () => {
    const newItem: ChecklistItem = { id: Date.now().toString(), text: "", done: false };
    const next = [...checklistLocal, newItem];
    setChecklistLocal(next);
    void saveChecklistItems(next);
  };

  return (
    <>
      <SectionCard
        title="Checklist"
        action={
          <button type="button" style={sectionCardStyles.inlineGhost} onClick={addItem}>
            <PlusIcon size={15} /> Add item
          </button>
        }
      >
        {checklistLocal.length ? (
          <div style={checklistStyles.checklist}>
            {checklistLocal.map((item, i) => (
              <div
                key={item.id}
                style={{ ...checklistStyles.checklistRow, opacity: item.done ? 0.55 : 1 }}
                draggable
                onDragStart={() => {
                  checklistDragIndex.current = i;
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                }}
                onDrop={() => {
                  const from = checklistDragIndex.current;
                  if (from === null || from === i) return;
                  const next = [...checklistLocal];
                  const [moved] = next.splice(from, 1);
                  next.splice(i, 0, moved);
                  checklistDragIndex.current = null;
                  setChecklistLocal(next);
                  void saveChecklistItems(next);
                }}
              >
                <span style={checklistStyles.grabHandle}>
                  <GrabHandleIcon size={15} />
                </span>
                <button
                  type="button"
                  style={{
                    ...checklistStyles.checkCircle,
                    ...(item.done
                      ? { background: visual.accent, borderColor: visual.accent }
                      : {}),
                  }}
                  aria-label={item.done ? "Mark undone" : "Mark done"}
                  onClick={() => {
                    const updated = checklistLocal.map((c, j) =>
                      j === i ? { ...c, done: !c.done } : c,
                    );
                    const undone = updated.filter((c) => !c.done);
                    const done = updated.filter((c) => c.done);
                    const next = [...undone, ...done];
                    setChecklistLocal(next);
                    void saveChecklistItems(next);
                  }}
                />
                <input
                  style={{
                    ...checklistStyles.checkLabel,
                    ...(item.done ? { textDecoration: "line-through" } : {}),
                    flex: 1,
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    color: "inherit",
                    fontSize: "inherit",
                    fontFamily: "inherit",
                    padding: 0,
                  }}
                  value={item.text}
                  onChange={(e) => {
                    setChecklistLocal(
                      checklistLocal.map((c, j) =>
                        j === i ? { ...c, text: e.target.value } : c,
                      ),
                    );
                  }}
                  onBlur={() => void saveChecklistItems(checklistLocal)}
                  placeholder="Item text\u2026"
                />
                <button
                  type="button"
                  style={checklistStyles.checkDeleteButton}
                  aria-label="Remove item"
                  onClick={() => {
                    const next = checklistLocal.filter((_, j) => j !== i);
                    setChecklistLocal(next);
                    void saveChecklistItems(next);
                  }}
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        ) : (
          <button
            type="button"
            style={{
              ...sectionCardStyles.inlineGhost,
              width: "100%",
              justifyContent: "center",
              padding: "12px 0",
            }}
            onClick={addItem}
          >
            <PlusIcon size={18} /> Add your first item
          </button>
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
        </SectionCard>
      ) : null}

      <SectionCard title="Ping me">
        <div style={toggleStyles.toggleRow}>
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
              <p style={toggleStyles.toggleTitle}>30 min before</p>
              <p style={toggleStyles.toggleSubtitle}>
                We&apos;ll Ping you before you head out.
              </p>
            </div>
          </div>
          <SwitchVisual on={true} />
        </div>
      </SectionCard>

      {maps && loc ? (
        <LocationBlock
          location={loc}
          mapsUrl={maps}
          accent={visual.accent}
          onChangeLocation={onChangeLocation}
          onRemoveLocation={onRemoveLocation}
        />
      ) : null}
    </>
  );
}
