/**
 * /s/[token] — Public shared toat page.
 *
 * Server-rendered. No auth required.
 * Security gate: the share token must resolve to a valid ACL entry.
 */
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

export default async function SharedToatPage({ params }: PageProps) {
  const { token } = await params;
  const { acl, toats, users } = await getCollections();

  const share = await acl.findOne({ token });
  const toatId = share?.toatId instanceof ObjectId ? share.toatId : null;
  const toat = toatId ? await toats.findOne({ _id: toatId }) : null;

  if (!share || !toat) return <ShareNotFound />;

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
  const mapsUrl = location
    ? `https://maps.google.com/?q=${encodeURIComponent(location)}`
    : null;
  const people: string[] = Array.isArray(enrichments.people) ? enrichments.people : [];
  const proxyBase = `/api/share/${encodeURIComponent(token)}/attachments`;

  return (
    <div style={s.root}>
      <ShareNav />

      <ShareHero
        visualGradient={visual.gradient}
        visualLabel={visual.label}
        visualEmoji={visual.emoji}
        tier={tier}
        title={title}
        ownerName={ownerName}
      />

      <main style={s.main}>
        <ShareContent
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

        <div style={s.ctaBlock}>
          <OpenInAppHandoff token={token} gradient={visual.gradient} />
        </div>

        <ShareFooter />
      </main>
    </div>
  );
}

// ── Utilities ─────────────────────────────────────────────────────────────────

function parseDate(value: unknown): Date | null {
  if (typeof value !== "string" || !value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}
