"use client";

import { useRef } from "react";
import type { CSSProperties } from "react";
import { MarkdownRenderer } from "./MarkdownRenderer";

interface MarkdownNoteEditorProps {
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  placeholder?: string;
  rows?: number;
}

type ToolbarAction = "bold" | "italic" | "heading" | "list" | "link" | "quote";

const toolbarButtons: Array<{ id: ToolbarAction; label: string; title: string }> = [
  { id: "bold", label: "B", title: "Bold" },
  { id: "italic", label: "I", title: "Italic" },
  { id: "heading", label: "H", title: "Heading" },
  { id: "list", label: "List", title: "Bulleted list" },
  { id: "link", label: "Link", title: "Link" },
  { id: "quote", label: "Quote", title: "Quote" },
];

export function MarkdownNoteEditor({
  value,
  onChange,
  onBlur,
  placeholder = "Add a note...",
  rows = 5,
}: MarkdownNoteEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const applyAction = (action: ToolbarAction) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const selectionStart = textarea.selectionStart;
    const selectionEnd = textarea.selectionEnd;
    const next = transformMarkdown(value, selectionStart, selectionEnd, action);
    onChange(next.value);

    window.requestAnimationFrame(() => {
      const input = textareaRef.current;
      if (!input) return;
      input.focus();
      input.setSelectionRange(next.selectionStart, next.selectionEnd);
    });
  };

  return (
    <div style={styles.wrap}>
      <div style={styles.toolbar}>
        {toolbarButtons.map((button) => (
          <button
            key={button.id}
            type="button"
            title={button.title}
            aria-label={button.title}
            style={styles.toolbarButton}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => applyAction(button.id)}
          >
            {button.label}
          </button>
        ))}
      </div>

      <textarea
        ref={textareaRef}
        style={styles.textarea}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        rows={rows}
        spellCheck
      />

      <p style={styles.hint}>Plain text works too. Markdown is optional: bold, italic, headings, lists, links, and quotes.</p>

      {value.trim() ? (
        <div style={styles.previewWrap}>
          <p style={styles.previewLabel}>Preview</p>
          <MarkdownRenderer markdown={value} tone="detail" />
        </div>
      ) : null}
    </div>
  );
}

function transformMarkdown(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  action: ToolbarAction,
) {
  switch (action) {
    case "bold":
      return wrapSelection(value, selectionStart, selectionEnd, "**", "**", "bold text");
    case "italic":
      return wrapSelection(value, selectionStart, selectionEnd, "*", "*", "italic text");
    case "heading":
      return prefixLines(value, selectionStart, selectionEnd, "## ");
    case "list":
      return prefixLines(value, selectionStart, selectionEnd, "- ");
    case "quote":
      return prefixLines(value, selectionStart, selectionEnd, "> ");
    case "link":
      return insertLink(value, selectionStart, selectionEnd);
    default:
      return { value, selectionStart, selectionEnd };
  }
}

function wrapSelection(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  prefix: string,
  suffix: string,
  placeholder: string,
) {
  const selectedText = value.slice(selectionStart, selectionEnd);
  const innerText = selectedText || placeholder;
  const replacement = `${prefix}${innerText}${suffix}`;
  const nextValue = `${value.slice(0, selectionStart)}${replacement}${value.slice(selectionEnd)}`;
  const focusStart = selectionStart + prefix.length;
  const focusEnd = focusStart + innerText.length;

  return {
    value: nextValue,
    selectionStart: focusStart,
    selectionEnd: focusEnd,
  };
}

function prefixLines(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  prefix: string,
) {
  const lineStart = value.lastIndexOf("\n", Math.max(0, selectionStart - 1)) + 1;
  const nextBreak = value.indexOf("\n", selectionEnd);
  const lineEnd = nextBreak === -1 ? value.length : nextBreak;
  const selectedBlock = value.slice(lineStart, lineEnd);
  const prefixedBlock = selectedBlock
    .split("\n")
    .map((line) => (line.trim() ? `${prefix}${line}` : line))
    .join("\n");
  const nextValue = `${value.slice(0, lineStart)}${prefixedBlock}${value.slice(lineEnd)}`;

  return {
    value: nextValue,
    selectionStart: lineStart,
    selectionEnd: lineStart + prefixedBlock.length,
  };
}

function insertLink(value: string, selectionStart: number, selectionEnd: number) {
  const selectedText = value.slice(selectionStart, selectionEnd) || "link text";
  const replacement = `[${selectedText}](https://)`;
  const nextValue = `${value.slice(0, selectionStart)}${replacement}${value.slice(selectionEnd)}`;
  const urlStart = selectionStart + selectedText.length + 3;

  return {
    value: nextValue,
    selectionStart: urlStart,
    selectionEnd: urlStart + "https://".length,
  };
}

const styles: Record<string, CSSProperties> = {
  wrap: {
    display: "grid",
    gap: 10,
  },
  toolbar: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  toolbarButton: {
    minHeight: 30,
    padding: "0 10px",
    borderRadius: 10,
    border: "1px solid rgba(123,92,246,0.18)",
    background: "rgba(123,92,246,0.08)",
    color: "#6D28D9",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
  },
  textarea: {
    width: "100%",
    background: "transparent",
    border: "1px solid rgba(209,213,219,0.6)",
    borderRadius: 10,
    padding: "10px 12px",
    fontSize: 15,
    color: "#111827",
    fontFamily: "inherit",
    lineHeight: 1.6,
    resize: "vertical",
    outline: "none",
    boxSizing: "border-box",
  },
  hint: {
    margin: 0,
    fontSize: 11.5,
    lineHeight: 1.5,
    color: "#6B7280",
  },
  previewWrap: {
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid rgba(229,231,235,0.8)",
    background: "rgba(255,255,255,0.78)",
  },
  previewLabel: {
    margin: "0 0 10px",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    color: "#6B7280",
  },
};