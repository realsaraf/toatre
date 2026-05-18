/**
 * /s/[token] — Public shared toat page.
 *
 * Server-rendered. No auth required.
 * Security gate: the share token must resolve to a valid ACL entry.
 */
import type { Metadata } from "next";
import { ShareNav } from "./_components/ShareNav";
import { ShareContent } from "./_components/ShareContent";
import { ShareFooter } from "./_components/ShareFooter";
import { ShareNotFound } from "./_components/ShareNotFound";
import { OpenInAppHandoff } from "./_components/OpenInAppHandoff";
import { s } from "./_components/_styles";
import {
  buildShareDescription,
  getShareOpenGraphImage,
  getSharedToatPageData,
} from "./_shared-toat";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ token: string }>;
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
  const imageUrl = getShareOpenGraphImage(token, sharedToat);

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
          alt: "Toatre app preview",
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
          .share-root {
            padding: 10px 0 24px !important;
          }
          .share-shell {
            margin: 0 !important;
            max-width: none !important;
            background: transparent !important;
            border: none !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            backdrop-filter: none !important;
          }
          .share-nav {
            margin: 0 10px 12px !important;
            padding: 18px 16px 12px !important;
            border-radius: 22px !important;
            border: 1px solid rgba(223,206,182,0.36) !important;
            box-shadow: 0 12px 28px rgba(189,139,63,0.10), 0 2px 8px rgba(76,55,24,0.04) !important;
            background: rgba(255,252,247,0.94) !important;
          }
          .share-main {
            max-width: none !important;
            padding: 0 10px 24px !important;
          }
          .share-card {
            border: 1px solid rgba(231,222,208,0.74) !important;
            box-shadow: 0 12px 28px rgba(53,39,25,0.08), 0 1px 3px rgba(53,39,25,0.03) !important;
          }
          .share-card-divider,
          .share-detail-row {
            border-color: rgba(231,222,208,0.28) !important;
          }
          .share-section {
            border-top: none !important;
            padding-top: 14px !important;
          }
          .share-map-wrap,
          .share-notes,
          .share-link-card,
          .share-attachment-card {
            border: 1px solid rgba(231,222,208,0.28) !important;
            box-shadow: inset 0 0 0 1px rgba(231,222,208,0.28) !important;
          }
          .share-footer {
            margin: 0 10px !important;
            padding: 12px 16px 4px !important;
            border-top: none !important;
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
