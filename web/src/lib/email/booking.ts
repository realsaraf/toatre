import { getResendClient } from "./resend";

const FROM = "Toatre <hello@toatre.com>";

function formatSlot(start: Date): string {
  return start.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

function formatTime(start: Date, end: Date): string {
  const startTime = start.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const endTime = end.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return `${startTime} – ${endTime}`;
}

function esc(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

type EmailVariant = "request" | "confirmed" | "declined";

interface EmailConfig {
  variant: EmailVariant;
  heading: string;
  subheading: string;
  headerGradient: string;
  badgeText: string;
  badgeBg: string;
  rows: Array<{ icon: string; label: string; value: string }>;
  meetLink: string | null;
  ctaHref: string | null;
  ctaLabel: string | null;
  ctaColor: string;
  footerText: string;
}

function buildEmail(cfg: EmailConfig): string {
  const detailRows = cfg.rows
    .map(
      (row) => `
        <tr>
          <td style="padding:14px 16px 14px 20px;vertical-align:top;font-size:18px;line-height:1;width:48px;">${row.icon}</td>
          <td style="padding:14px 16px 14px 0;vertical-align:top;border-bottom:1px solid rgba(255,255,255,0.05);">
            <p style="margin:0 0 3px;font-size:11px;font-weight:700;color:#6B7280;text-transform:uppercase;letter-spacing:0.07em;">${esc(row.label)}</p>
            <p style="margin:0;font-size:15px;font-weight:500;color:#E5E7EB;line-height:1.45;">${esc(row.value)}</p>
          </td>
        </tr>`,
    )
    .join("");

  const meetSection = cfg.meetLink
    ? `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;background:linear-gradient(135deg,#064E3B 0%,#065F46 100%);border-radius:14px;overflow:hidden;">
          <tr>
            <td style="padding:20px 24px;">
              <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#34D399;text-transform:uppercase;letter-spacing:0.07em;">Google Meet</p>
              <p style="margin:0 0 14px;font-size:15px;color:#ECFDF5;font-weight:500;">Your video meeting is ready to join.</p>
              <a href="${esc(cfg.meetLink)}" style="display:inline-block;background:#10B981;color:#fff;font-size:14px;font-weight:700;text-decoration:none;padding:11px 24px;border-radius:10px;letter-spacing:-0.01em;">Join with Google Meet →</a>
            </td>
          </tr>
        </table>`
    : "";

  const ctaSection = cfg.ctaHref && cfg.ctaLabel
    ? `<div style="margin-top:24px;"><a href="${esc(cfg.ctaHref)}" style="display:inline-block;background:${esc(cfg.ctaColor)};color:#fff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:12px;letter-spacing:-0.01em;">${esc(cfg.ctaLabel)}</a></div>`
    : "";

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta name="color-scheme" content="dark" />
  <title>${esc(cfg.heading)}</title>
</head>
<body style="margin:0;padding:0;background-color:#0D0F1A;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0D0F1A;padding:40px 16px;">
    <tr>
      <td align="center">

        <!-- ── Main card ────────────────────────────────── -->
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;border-radius:20px;overflow:hidden;box-shadow:0 32px 80px rgba(0,0,0,0.6);">

          <!-- Header gradient -->
          <tr>
            <td style="background:${esc(cfg.headerGradient)};padding:40px 40px 36px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <!-- Logo -->
                  <td style="vertical-align:middle;">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:40px;height:40px;background:rgba(255,255,255,0.15);border-radius:12px;text-align:center;vertical-align:middle;">
                          <span style="color:#fff;font-size:20px;font-weight:900;line-height:40px;display:block;">t</span>
                        </td>
                        <td style="padding-left:12px;vertical-align:middle;">
                          <span style="color:#fff;font-size:22px;font-weight:800;letter-spacing:-0.04em;">toatre</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <!-- Badge -->
                  <td align="right" style="vertical-align:middle;">
                    <span style="display:inline-block;background:${esc(cfg.badgeBg)};color:#fff;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;padding:5px 13px;border-radius:999px;">${esc(cfg.badgeText)}</span>
                  </td>
                </tr>
              </table>
              <p style="margin:28px 0 8px;font-size:28px;font-weight:800;color:#fff;line-height:1.2;letter-spacing:-0.03em;">${esc(cfg.heading)}</p>
              <p style="margin:0;font-size:15px;color:rgba(255,255,255,0.72);line-height:1.55;">${esc(cfg.subheading)}</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#13172A;padding:32px 40px 36px;">
              <!-- Detail rows -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#1C2240;border-radius:14px;overflow:hidden;">
                <tbody>${detailRows}</tbody>
              </table>
              ${meetSection}
              ${ctaSection}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#0F1221;padding:20px 40px;border-top:1px solid rgba(255,255,255,0.06);">
              <p style="margin:0;font-size:12px;color:#4B5563;line-height:1.65;">${esc(cfg.footerText)}</p>
            </td>
          </tr>

        </table>

        <!-- Sub-footer -->
        <p style="margin:20px 0 0;font-size:11px;color:#374151;text-align:center;">
          <a href="https://toatre.com" style="color:#4B5563;text-decoration:none;">toatre.com</a>&nbsp;&nbsp;·&nbsp;&nbsp;Your personal timeline assistant
        </p>

      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendBookingNotification(input: {
  type: "new_request" | "accepted" | "denied";
  toEmail: string;
  ownerName: string;
  bookerName: string;
  bookerEmail: string;
  slotStart: Date;
  slotEnd: Date;
  message: string | null;
  toatId: string | null;
  meetLink?: string | null;
}): Promise<void> {
  const client = getResendClient();
  const dateLabel = formatSlot(input.slotStart);
  const timeLabel = formatTime(input.slotStart, input.slotEnd);
  const deepLink = input.toatId ? `https://toatre.com/toats/${input.toatId}` : "https://toatre.com/inbox";
  const meet = input.meetLink ?? null;

  if (input.type === "new_request") {
    const rows: Array<{ icon: string; label: string; value: string }> = [
      { icon: "👤", label: "From", value: `${input.bookerName}` },
      { icon: "📧", label: "Email", value: input.bookerEmail },
      { icon: "📅", label: "Date", value: dateLabel },
      { icon: "🕐", label: "Time", value: timeLabel },
    ];
    if (input.message) rows.push({ icon: "💬", label: "Message", value: input.message });

    await client.emails.send({
      from: FROM,
      to: input.toEmail,
      subject: `${input.bookerName} wants to meet — ${dateLabel}`,
      html: buildEmail({
        variant: "request",
        heading: `${input.bookerName} wants to meet`,
        subheading: "Review the request in Toatre and accept or decline.",
        headerGradient: "linear-gradient(145deg, #3B1FA3 0%, #5B3DF5 50%, #7C3AED 100%)",
        badgeText: "New booking request",
        badgeBg: "rgba(255,255,255,0.18)",
        rows,
        meetLink: null,
        ctaHref: deepLink,
        ctaLabel: "Review in Toatre",
        ctaColor: "#5B3DF5",
        footerText: `Someone submitted a booking request through your Toat Link. Open Toatre to accept or decline. If this was unexpected, you can ignore this email.`,
      }),
    });
    return;
  }

  if (input.type === "accepted") {
    const rows: Array<{ icon: string; label: string; value: string }> = [
      { icon: "🎉", label: "Host", value: input.ownerName },
      { icon: "📅", label: "Date", value: dateLabel },
      { icon: "🕐", label: "Time", value: timeLabel },
    ];
    if (meet) rows.push({ icon: "🎥", label: "Video call", value: "Google Meet — link below" });

    await client.emails.send({
      from: FROM,
      to: input.toEmail,
      subject: `Your booking with ${input.ownerName} is confirmed`,
      html: buildEmail({
        variant: "confirmed",
        heading: `You're on, ${input.bookerName}!`,
        subheading: `${input.ownerName} accepted your request. See you soon.`,
        headerGradient: "linear-gradient(145deg, #064E3B 0%, #065F46 50%, #047857 100%)",
        badgeText: "Booking confirmed",
        badgeBg: "rgba(255,255,255,0.15)",
        rows,
        meetLink: meet,
        ctaHref: null,
        ctaLabel: null,
        ctaColor: "#5B3DF5",
        footerText: `Your booking request with ${input.ownerName} was accepted. Add the meeting to your calendar so you don't forget.`,
      }),
    });
    return;
  }

  // denied
  await client.emails.send({
    from: FROM,
    to: input.toEmail,
    subject: `Booking update from ${input.ownerName}`,
    html: buildEmail({
      variant: "declined",
      heading: `That slot didn't work out`,
      subheading: `${input.ownerName} wasn't able to make that time. Try a different slot.`,
      headerGradient: "linear-gradient(145deg, #7F1D1D 0%, #991B1B 50%, #B91C1C 100%)",
      badgeText: "Booking declined",
      badgeBg: "rgba(255,255,255,0.15)",
      rows: [
        { icon: "👤", label: "Host", value: input.ownerName },
        { icon: "📅", label: "Date", value: dateLabel },
        { icon: "🕐", label: "Time", value: timeLabel },
      ],
      meetLink: null,
      ctaHref: null,
      ctaLabel: null,
      ctaColor: "#5B3DF5",
      footerText: `Your booking request was declined. You can visit ${input.ownerName}'s Toat Link to pick another slot that works for both of you.`,
    }),
  });
}
