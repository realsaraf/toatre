"use client";

import { useRef, useState, useCallback, useEffect, useImperativeHandle, forwardRef } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import {
  getCachedBlob,
  setCachedBlob,
  deleteCachedBlob,
} from "@/lib/attachmentCache";
import type { SerializedAttachment } from "@/types";

const ALLOWED_ACCEPT = "image/jpeg,image/png,image/webp,image/gif,application/pdf";

interface Props {
  toatId: string;
  initialAttachments: SerializedAttachment[];
}

export interface AttachmentBarHandle {
  triggerUpload: () => void;
}

function fileTypeIcon(mimeType: string): string {
  if (mimeType === "application/pdf") return "📄";
  if (mimeType.startsWith("image/")) return "🖼";
  return "📎";
}

export const AttachmentBar = forwardRef<AttachmentBarHandle, Props>(
  function AttachmentBar({ toatId, initialAttachments }, ref) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    triggerUpload: () => fileInputRef.current?.click(),
  }));

  const [attachments, setAttachments] = useState<SerializedAttachment[]>(initialAttachments);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  // blobUrl thumbnails keyed by attachmentId — populated from IndexedDB cache
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  const [viewer, setViewer] = useState<{
    url: string;
    mimeType: string;
    label: string;
    owned: boolean; // true = we created the blob URL, must revoke on close
    isPortrait: boolean;
  } | null>(null);

  // ── Fetch with auth token ────────────────────────────────────────────────
  const authFetch = useCallback(
    async (input: RequestInfo, init?: RequestInit): Promise<Response> => {
      const token = user ? await user.getIdToken() : null;
      return fetch(input, {
        ...init,
        headers: {
          ...(init?.headers as Record<string, string> | undefined),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
    },
    [user]
  );

  // ── Load thumbnails: cache-first, then fetch from API on miss ────────────
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      for (const a of attachments) {
        if (!a.mimeType.startsWith("image/")) continue;

        // Try cache first
        const cached = await getCachedBlob(a.id);
        if (cached) {
          if (!cancelled) setThumbnails((prev) => ({ ...prev, [a.id]: cached }));
          continue;
        }

        // Cache miss — fetch from API
        try {
          const res = await authFetch(`/api/toats/${toatId}/attachments/${a.id}`);
          if (!res.ok || cancelled) continue;
          const bytes = await res.arrayBuffer();
          await setCachedBlob(a.id, toatId, a.mimeType, bytes);
          const blobUrl = URL.createObjectURL(new Blob([bytes], { type: a.mimeType }));
          if (!cancelled) setThumbnails((prev) => ({ ...prev, [a.id]: blobUrl }));
        } catch { /* silent */ }
      }
    })();
    return () => { cancelled = true; };
  // authFetch is stable (useCallback on [user]) — safe dep
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attachments, toatId]);

  // ── Upload ───────────────────────────────────────────────────────────────
  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!e.target.files) return;
      // Reset so the same file can be re-picked
      e.target.value = "";
      if (!file) return;

      setUploading(true);
      try {
        const body = new FormData();
        body.append("file", file);
        const res = await authFetch(`/api/toats/${toatId}/attachments`, {
          method: "POST",
          body,
        });
        if (!res.ok) {
          const data = (await res.json().catch(() => null)) as { error?: string } | null;
          console.error("Upload failed:", data?.error ?? res.statusText);
          return;
        }
        const { attachment } = (await res.json()) as { attachment: SerializedAttachment };
        setAttachments((prev) => [...prev, attachment]);
        // Pre-fetch thumbnail into cache so it shows immediately
        void (async () => {
          try {
            const r = await authFetch(`/api/toats/${toatId}/attachments/${attachment.id}`);
            if (!r.ok) return;
            const bytes = await r.arrayBuffer();
            await setCachedBlob(attachment.id, toatId, attachment.mimeType, bytes);
            const blobUrl = URL.createObjectURL(new Blob([bytes], { type: attachment.mimeType }));
            setThumbnails((prev) => ({ ...prev, [attachment.id]: blobUrl }));
          } catch { /* silent */ }
        })();
      } finally {
        setUploading(false);
      }
    },
    [authFetch, toatId]
  );

  // ── View ─────────────────────────────────────────────────────────────────
  const handleView = useCallback(
    async (attachment: SerializedAttachment) => {
      // PDFs open in a new tab via a fetched blob URL
      const url = `/api/toats/${toatId}/attachments/${attachment.id}`;

      // Check cache first
      const cached = await getCachedBlob(attachment.id);
      if (cached) {
        if (attachment.mimeType === "application/pdf") {
          window.open(cached, "_blank", "noopener,noreferrer");
        } else {
          setViewer({ url: cached, mimeType: attachment.mimeType, label: attachment.label, owned: false, isPortrait: false });
        }
        return;
      }

      // Fetch and cache
      try {
        const res = await authFetch(url);
        if (!res.ok) return;
        const bytes = await res.arrayBuffer();
        await setCachedBlob(attachment.id, toatId, attachment.mimeType, bytes);
        const blobUrl = URL.createObjectURL(
          new Blob([bytes], { type: attachment.mimeType })
        );
        if (attachment.mimeType === "application/pdf") {
          window.open(blobUrl, "_blank", "noopener,noreferrer");
          // Revoke after a delay to let the tab open
          setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
        } else {
          setViewer({ url: blobUrl, mimeType: attachment.mimeType, label: attachment.label, owned: true, isPortrait: false });
        }
      } catch {
        // Silently ignore view errors
      }
    },
    [authFetch, toatId]
  );

  const closeViewer = useCallback(() => {
    if (viewer?.owned) URL.revokeObjectURL(viewer.url);
    setViewer(null);
  }, [viewer]);

  // ── Delete ───────────────────────────────────────────────────────────────
  const handleDelete = useCallback(
    async (e: React.MouseEvent, attachment: SerializedAttachment) => {
      e.stopPropagation();
      setDeletingId(attachment.id);
      try {
        const res = await authFetch(
          `/api/toats/${toatId}/attachments/${attachment.id}`,
          { method: "DELETE" }
        );
        if (res.ok) {
          await deleteCachedBlob(attachment.id);
          setAttachments((prev) => prev.filter((a) => a.id !== attachment.id));
        }
      } finally {
        setDeletingId(null);
      }
    },
    [authFetch, toatId]
  );

  if (attachments.length === 0 && !uploading) {
    // Keep input mounted so triggerUpload() can open the file picker at any time
    return (
      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_ACCEPT}
        style={{ display: "none" }}
        onChange={handleFileChange}
        aria-label="Attach a file"
      />
    );
  }

  return (
    <>
      {/* Always mounted — needed for triggerUpload() */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_ACCEPT}
        style={{ display: "none" }}
        onChange={handleFileChange}
        aria-label="Attach a file"
      />

      <section style={sectionCardStyle}>
        <div style={sectionHeaderStyle}>
          <h2 style={sectionHeadingStyle}>Attachments</h2>
          {!uploading && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={addMoreBtnStyle}
              aria-label="Add attachment"
            >
              + Add
            </button>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {attachments.map((a) => {
            const isImage = a.mimeType.startsWith("image/");
            const thumb = thumbnails[a.id];

            if (isImage) {
              return (
                <div
                  key={a.id}
                  style={{ ...imageCardStyle, opacity: deletingId === a.id ? 0.4 : 1 }}
                >
                  <button
                    type="button"
                    onClick={() => void handleView(a)}
                    disabled={deletingId === a.id}
                    style={imageCardThumbBtnStyle}
                    aria-label={`View ${a.label}`}
                  >
                    {thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={thumb} alt={a.label} style={imageCardThumbStyle} />
                    ) : (
                      <div style={imageCardThumbPlaceholderStyle}>
                        <span style={{ fontSize: 28 }}>🖼</span>
                      </div>
                    )}
                  </button>
                  <div style={imageCardFooterStyle}>
                    <button
                      type="button"
                      onClick={() => void handleView(a)}
                      disabled={deletingId === a.id}
                      style={imageCardLabelBtnStyle}
                      aria-label={`View ${a.label}`}
                    >
                      <span style={{ fontSize: 14, flexShrink: 0 }}>🖼</span>
                      <span style={{ fontSize: 12.5, fontWeight: 600, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, textAlign: "left" }}>
                        {a.label}
                      </span>
                    </button>
                    <span
                      role="button"
                      tabIndex={0}
                      aria-label={`Remove ${a.label}`}
                      onClick={(e) => void handleDelete(e, a)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          void handleDelete(e as unknown as React.MouseEvent, a);
                        }
                      }}
                      style={deleteXStyle}
                    >
                      ×
                    </span>
                  </div>
                </div>
              );
            }

            // PDF / other — keep compact chip
            return (
              <div
                key={a.id}
                style={{ ...chipStyle, opacity: deletingId === a.id ? 0.4 : 1 }}
              >
                <button
                  type="button"
                  onClick={() => void handleView(a)}
                  disabled={deletingId === a.id}
                  style={chipBtnStyle}
                  aria-label={`View ${a.label}`}
                >
                  <span style={{ fontSize: 13, flexShrink: 0 }}>{fileTypeIcon(a.mimeType)}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 120 }}>
                    {a.label}
                  </span>
                </button>
                <span
                  role="button"
                  tabIndex={0}
                  aria-label={`Remove ${a.label}`}
                  onClick={(e) => void handleDelete(e, a)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      void handleDelete(e as unknown as React.MouseEvent, a);
                    }
                  }}
                  style={deleteXStyle}
                >
                  ×
                </span>
              </div>
            );
          })}

          {uploading && (
            <span style={{ ...chipStyle, color: "#6B7280", fontStyle: "italic", fontSize: 12, pointerEvents: "none" }}>
              Uploading…
            </span>
          )}
        </div>
      </section>

      {/* Image viewer overlay */}
      {viewer && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={viewer.label}
          onClick={closeViewer}
          style={{
            position: "fixed",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            overflow: "hidden",
            background: "rgba(0,0,0,0.92)",
          }}
        >
          {/* Blurred background fill for portrait images */}
          {viewer.isPortrait && (
            <div aria-hidden style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={viewer.url}
                alt=""
                style={{
                  position: "absolute",
                  inset: "-10%",
                  width: "120%",
                  height: "120%",
                  objectFit: "cover",
                  filter: "blur(36px) brightness(0.45) saturate(1.4)",
                }}
              />
            </div>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={viewer.url}
            alt={viewer.label}
            onClick={(e) => e.stopPropagation()}
            onLoad={(e) => {
              const img = e.currentTarget;
              setViewer((v) =>
                v ? { ...v, isPortrait: img.naturalHeight > img.naturalWidth } : null
              );
            }}
            style={{
              position: "relative",
              zIndex: 1,
              maxWidth: "96vw",
              maxHeight: viewer.isPortrait ? "96vh" : "90vh",
              borderRadius: 14,
              boxShadow: "0 16px 48px rgba(0,0,0,0.5)",
              objectFit: "contain",
            }}
          />
          <button
            type="button"
            onClick={closeViewer}
            style={closeOverlayBtnStyle}
            aria-label="Close viewer"
          >
            ×
          </button>
        </div>
      )}
    </>
  );
});

// ── Styles ──────────────────────────────────────────────────────────────────
// Values mirror web/src/app/toats/[id]/_styles.ts sectionCardStyles

const sectionCardStyle: React.CSSProperties = {
  borderRadius: 20,
  background: "linear-gradient(180deg, rgba(255,255,255,0.96), rgba(255,255,255,0.84))",
  border: "1px solid rgba(255,255,255,0.94)",
  boxShadow: "0 28px 80px rgba(31,41,55,0.08)",
  padding: "14px 14px 13px",
  marginBottom: 10,
};

const sectionHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  marginBottom: 10,
};

const sectionHeadingStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 11.5,
  fontWeight: 700,
  color: "#6B7280",
  textTransform: "uppercase",
  letterSpacing: "0.02em",
};

const addMoreBtnStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  minHeight: 26,
  padding: "0 10px",
  borderRadius: 11,
  border: "1px solid rgba(123,92,246,0.18)",
  background: "rgba(123,92,246,0.08)",
  color: "#6D28D9",
  fontSize: 11.5,
  fontWeight: 700,
  cursor: "pointer",
};

const imageCardStyle: React.CSSProperties = {
  borderRadius: 16,
  overflow: "hidden",
  border: "1px solid rgba(124,58,237,0.12)",
  background: "rgba(124,58,237,0.03)",
};

const imageCardThumbBtnStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  padding: 0,
  border: "none",
  background: "none",
  cursor: "pointer",
};

const imageCardThumbStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  height: "auto",
  objectFit: "contain",
};

const imageCardThumbPlaceholderStyle: React.CSSProperties = {
  width: "100%",
  height: 120,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "rgba(124,58,237,0.06)",
};

const imageCardFooterStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  borderTop: "1px solid rgba(124,58,237,0.10)",
};

const imageCardLabelBtnStyle: React.CSSProperties = {
  flex: 1,
  display: "inline-flex",
  alignItems: "center",
  gap: 7,
  padding: "9px 12px",
  background: "none",
  border: "none",
  cursor: "pointer",
  minWidth: 0,
};

const chipStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  borderRadius: 14,
  background: "rgba(124,58,237,0.06)",
  border: "1px solid rgba(124,58,237,0.12)",
  overflow: "hidden",
};

const chipBtnStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "7px 10px",
  background: "none",
  border: "none",
  cursor: "pointer",
  minWidth: 0,
};

const deleteXStyle: React.CSSProperties = {
  padding: "7px 10px 7px 4px",
  fontSize: 15,
  lineHeight: 1,
  color: "#9CA3AF",
  cursor: "pointer",
  flexShrink: 0,
  background: "none",
  border: "none",
};

const closeOverlayBtnStyle: React.CSSProperties = {
  position: "absolute",
  top: 18,
  right: 22,
  background: "rgba(255,255,255,0.15)",
  border: "none",
  borderRadius: "50%",
  width: 40,
  height: 40,
  fontSize: 24,
  color: "#fff",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};
