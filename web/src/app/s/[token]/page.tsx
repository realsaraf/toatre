/**
 * /s/[token] — Public shared toat page.
 *
 * Server-rendered. No auth required.
 * Security gate: the share token must resolve to a valid ACL entry.
 */
import type { Metadata } from "next";
import { ObjectId } from "mongodb";
import { getCollections } from "@/lib/mongo/collections";
import { migrateTemplateData, type Enrichments } from "@/types";
import { TOAT_VISUAL, resolveVisualKey } from "@/components/toat-visual";
import { ShareNav } from "./_components/ShareNav";
import { ShareHero } from "./_components/ShareHero";
import { ShareContent } from "./_components/ShareContent";
import { ShareFooter } from "./_components/ShareFooter";
import { ShareNotFound } from "./_components/ShareNotFound";
import { OpenInAppHandoff } from "./_components/OpenInAppHandoff";
import { s } from "./_components/_styles";
import type { ToatAttachment, ToatLink } from "@/types/documents";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ token: string }>;
}

interface SharedToatPageData {
  ownerName: string;
  title: string;
  tier: string;
  notes: string | null;
  links: ToatLink[];
  attachments: ToatAttachment[];
  visualEmoji: string;
  visualLabel: string;
  startDate: Date | null;
  endDate: Date | null;
  location: string | null;
  mapsUrl: string | null;
  subtitle: string | null;
  people: string[];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { token } = await params;
  const sharedToat = await getSharedToatPageData(token);

  if (!sharedToat) {
    return {
      title: "Shared toat unavailable",
      description: "This shared toat is unavailable.",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const description = buildShareDescription(sharedToat);
  const imageUrl = getShareOpenGraphImage(token, sharedToat.attachments);

  return {
    title: sharedToat.title,
    description,
    openGraph: {
      type: "website",
      url: `/s/${encodeURIComponent(token)}`,
      title: sharedToat.title,
      description,
      images: [
        {
          url: imageUrl,
          alt: `${sharedToat.title} on Toatre`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: sharedToat.title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function SharedToatPage({ params }: PageProps) {
  const { token } = await params;
  const sharedToat = await getSharedToatPageData(token);

  if (!sharedToat) return <ShareNotFound />;

  const {
    ownerName,
    title,
    tier,
    notes,
    links,
    attachments,
    visualEmoji,
    visualLabel,
    startDate,
    endDate,
    location,
    mapsUrl,
    subtitle,
    people,
  } = sharedToat;

  const hasTime = Boolean(startDate);
  const proxyBase = `/api/share/${encodeURIComponent(token)}/attachments`;

  return (
    <div className="share-root" style={s.root}>
      <style>{`
        @media (max-width: 720px) {
          .share-line-art { display: none !important; }
          .share-shell {
            margin: 0 12px !important;
            border-radius: 24px !important;
          }
          .share-main {
            padding: 0 14px 28px !important;
          }
          .share-cta-row {
            flex-direction: column !important;
          }
        }
      `}</style>

      <div aria-hidden style={s.rootGlowTop} />
      <div aria-hidden style={s.rootGlowBottom} />
      <svg className="share-line-art" width="220" height="320" viewBox="0 0 220 320" fill="none" style={s.rootArtLeft}>
        <path d="M214 14C124 48 124 272 214 306" stroke="#E9D7B9" strokeWidth="1.2" />
        <path d="M192 32C118 62 118 258 192 288" stroke="#E9D7B9" strokeWidth="1.2" opacity="0.84" />
        <path d="M170 56C112 82 112 238 170 264" stroke="#E9D7B9" strokeWidth="1.2" opacity="0.66" />
      </svg>
      <svg className="share-line-art" width="220" height="320" viewBox="0 0 220 320" fill="none" style={s.rootArtRight}>
        <path d="M6 14C96 48 96 272 6 306" stroke="#E9D7B9" strokeWidth="1.2" />
        <path d="M28 32C102 62 102 258 28 288" stroke="#E9D7B9" strokeWidth="1.2" opacity="0.84" />
        <path d="M50 56C108 82 108 238 50 264" stroke="#E9D7B9" strokeWidth="1.2" opacity="0.66" />
      </svg>

      <div className="share-shell" style={s.shell}>
        <ShareNav />
        <br/>

        <main className="share-main" style={s.main}>
          <ShareContent
            visualEmoji={visualEmoji}
            visualLabel={visualLabel}
            tier={tier}
            title={title}
            subtitle={subtitle}
            startDate={startDate}
            endDate={endDate}
            location={location}
            mapsUrl={mapsUrl}
            people={people}
            notes={notes}
            links={links}
            attachments={attachments}
            proxyBase={proxyBase}
          />

          {(hasTime || location) && (
            <div className="share-cta-row" style={s.ctaSecondaryRow}>
              <div style={s.ctaPrimaryCell}>
                <OpenInAppHandoff token={token} gradient="#1C1130" />
              </div>
              {hasTime && (
                <a
                  href={`/api/shares/${encodeURIComponent(token)}/ics`}
                  download
                  style={s.ctaSecondaryBtn}
                >
                  📅 Save to calendar
                </a>
              )}
            </div>
          )}

          {!hasTime && !location && (
            <div style={s.ctaBlock}>
              <OpenInAppHandoff token={token} gradient="#1C1130" />
            </div>
          )}

          <ShareFooter />
        </main>
      </div>
    </div>
  );
}

// ── Utilities ─────────────────────────────────────────────────────────────────

async function getSharedToatPageData(token: string): Promise<SharedToatPageData | null> {
  const { acl, toats, users } = await getCollections();

  const share = await acl.findOne({ token });
  const toatId = share?.toatId instanceof ObjectId ? share.toatId : null;
  const toat = toatId ? await toats.findOne({ _id: toatId }) : null;

  if (!share || !toat) return null;

  const ownerId =
    share.ownerId instanceof ObjectId
      ? share.ownerId
      : ObjectId.isValid(String(share.ownerId))
        ? new ObjectId(String(share.ownerId))
        : null;
  const owner = ownerId ? await users.findOne({ _id: ownerId }) : null;
  const ownerName =
    (typeof owner?.displayName === "string" && owner.displayName) ||
    (typeof owner?.email === "string" && owner.email.split("@")[0]) ||
    "Someone";

  const enrichments: Enrichments = toat.enrichments ?? migrateTemplateData(toat);
  const title = typeof toat.title === "string" ? toat.title : "Untitled toat";
  const tier = typeof toat.tier === "string" ? toat.tier : "regular";
  const notes = typeof toat.notes === "string" && toat.notes ? toat.notes : null;
  const links: ToatLink[] = Array.isArray(toat.links) ? toat.links : [];
  const attachments: ToatAttachment[] = Array.isArray(toat.attachments) ? toat.attachments : [];

  const visualKey = resolveVisualKey(title, enrichments);
  const visual = TOAT_VISUAL[visualKey] ?? TOAT_VISUAL.task;

  const startDate = parseDate(
    enrichments.time?.at ?? enrichments.time?.startAt ?? enrichments.time?.dueAt,
  );
  const endDate = parseDate(enrichments.time?.endAt);
  const location =
    (typeof enrichments.place?.address === "string" && enrichments.place.address) ||
    (typeof enrichments.place?.placeName === "string" && enrichments.place.placeName) ||
    (typeof enrichments.event?.address === "string" && enrichments.event.address) ||
    (typeof enrichments.event?.venueName === "string" && enrichments.event.venueName) ||
    null;
  const mapsUrl = location ? `https://maps.google.com/?q=${encodeURIComponent(location)}` : null;
  const subtitle =
    (typeof enrichments.event?.venueName === "string" && enrichments.event.venueName) ||
    null;
  const people: string[] = Array.isArray(enrichments.people) ? enrichments.people : [];

  return {
    ownerName,
    title,
    tier,
    notes,
    links,
    attachments,
    visualEmoji: visual.emoji,
    visualLabel: visual.label,
    startDate,
    endDate,
    location,
    mapsUrl,
    subtitle,
    people,
  };
}

function parseDate(value: unknown): Date | null {
  if (typeof value !== "string" || !value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function getShareOpenGraphImage(token: string, attachments: ToatAttachment[]): string {
  const imageAttachment = attachments.find((attachment) => attachment.mimeType.startsWith("image/"));
  if (!imageAttachment) return "/opengraph-image";
  return `/api/share/${encodeURIComponent(token)}/attachments/${encodeURIComponent(imageAttachment.id)}`;
}

function buildShareDescription(sharedToat: SharedToatPageData): string {
  const notes = compactWhitespace(sharedToat.notes);
  const when = formatShareDateForMetadata(sharedToat.startDate, sharedToat.endDate);
  const detailParts = [when, sharedToat.location].filter(Boolean);

  if (notes) {
    return truncateText(
      [notes, ...detailParts].join(" • "),
      160,
    );
  }

  const fallback = [`Shared by ${sharedToat.ownerName} on Toatre.`, ...detailParts].join(" • ");
  return truncateText(fallback, 160);
}

function formatShareDateForMetadata(startDate: Date | null, endDate: Date | null): string | null {
  if (!startDate) return null;

  const date = startDate.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const startTime = startDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  if (!endDate) return `${date} at ${startTime}`;

  const sameDay = startDate.toDateString() === endDate.toDateString();
  if (sameDay) {
    const endTime = endDate.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
    return `${date} ${startTime}–${endTime}`;
  }

  const endDateText = endDate.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const endTime = endDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${date} ${startTime}–${endDateText} ${endTime}`;
}

function compactWhitespace(value: string | null): string | null {
  if (!value) return null;
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized || null;
}

function truncateText(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}
