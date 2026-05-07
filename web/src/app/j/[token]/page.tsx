import { ObjectId } from "mongodb";
import { getCollections } from "@/lib/mongo/collections";
import { migrateTemplateData, type Enrichments } from "@/types";
import { OpenInAppHandoff } from "./OpenInAppHandoff";

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function SharedToatPage({ params }: PageProps) {
  const { token } = await params;
  const { acl, toats } = await getCollections();
  const share = await acl.findOne({ token });
  const toatId = share?.toatId instanceof ObjectId ? share.toatId : null;
  const toat = toatId ? await toats.findOne({ _id: toatId }) : null;

  if (!share || !toat) {
    return (
      <main style={styles.page}>
        <section style={styles.card}>
          <p style={styles.eyebrow}>Shared toat</p>
          <h1 style={styles.title}>This link is not available.</h1>
          <p style={styles.body}>Ask the sender to share the toat again.</p>
        </section>
      </main>
    );
  }

  const enrichments: Enrichments = toat.enrichments
    ? toat.enrichments
    : migrateTemplateData(toat);
  const datetime = sharedDatetime(enrichments);
  const location = sharedLocation(enrichments);
  const notes = typeof toat.notes === "string" ? toat.notes : null;

  return (
    <main style={styles.page}>
      <section style={styles.card}>
        <p style={styles.eyebrow}>Shared toat</p>
        <h1 style={styles.title}>{typeof toat.title === "string" ? toat.title : "Untitled toat"}</h1>
        <OpenInAppHandoff token={token} />
        {datetime ? <p style={styles.meta}>{datetime.toLocaleString()}</p> : null}
        {location ? <p style={styles.meta}>{location}</p> : null}
        {notes ? <p style={styles.body}>{notes}</p> : null}
        <a style={styles.buttonSecondary} href={`/login?next=/j/${encodeURIComponent(token)}`}>Continue on web</a>
      </section>
    </main>
  );
}

function sharedDatetime(enrichments: Enrichments): Date | null {
  return (
    parseDate(enrichments.time?.at) ??
    parseDate(enrichments.time?.startAt) ??
    parseDate(enrichments.time?.dueAt)
  );
}

function sharedLocation(enrichments: Enrichments): string | null {
  const location =
    enrichments.place?.address ??
    enrichments.place?.placeName ??
    enrichments.event?.address ??
    enrichments.event?.venueName;

  return typeof location === "string" && location ? location : null;
}

function parseDate(value: unknown): Date | null {
  if (typeof value !== "string" || !value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    padding: 24,
    background: "linear-gradient(180deg, var(--color-bg-app), var(--color-bg))",
  },
  card: {
    width: "min(100%, 560px)",
    borderRadius: 28,
    border: "1px solid rgba(255,255,255,0.9)",
    background: "rgba(255,255,255,0.94)",
    boxShadow: "0 28px 80px rgba(31,41,55,0.10)",
    padding: 28,
  },
  eyebrow: { margin: "0 0 8px", color: "var(--color-primary)", fontSize: 12, fontWeight: 800, textTransform: "uppercase" as const },
  title: { margin: "0 0 14px", color: "var(--color-text)", fontSize: 34, lineHeight: 1.04 },
  meta: { margin: "8px 0", color: "var(--color-text-secondary)", fontSize: 16 },
  body: { margin: "16px 0", color: "var(--color-text)", lineHeight: 1.6 },
  buttonSecondary: {
    display: "inline-flex",
    marginTop: 12,
    padding: "14px 18px",
    borderRadius: 16,
    border: "1px solid var(--color-border-strong)",
    background: "var(--color-card)",
    color: "var(--color-text)",
    fontWeight: 800,
    textDecoration: "none",
  },
};