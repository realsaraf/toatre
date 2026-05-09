import { getResendClient } from "./resend";

const FROM = "Toatre <hello@toatre.com>";

function formatSlot(start: Date, end: Date): string {
  const day = start.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  const startTime = start.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const endTime = end.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return `${day} · ${startTime} – ${endTime}`;
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function baseHtml({
  badgeLabel,
  badgeColor,
  headingColor,
  heading,
  subheading,
  rows,
  ctaHref,
  ctaLabel,
  footerText,
}: {
  badgeLabel: string;
  badgeColor: string;
  headingColor: string;
  heading: string;
  subheading: string;
  rows: Array<{ label: string; value: string }>;
  ctaHref: string | null;
  ctaLabel: string | null;
  footerText: string;
}): string {
  const rowsHtml = rows
    .map(
      (r) => `
      <tr>
        <td style="padding:6px 0;font-size:13px;color:#94A3B8;font-weight:500;white-space:nowrap;vertical-align:top;padding-right:16px">${escapeHtml(r.label)}</td>
        <td style="padding:6px 0;font-size:13px;color:#E2E8F0;font-weight:500;word-break:break-word">${escapeHtml(r.value)}</td>
      </tr>`,
    )
    .join("");

  const ctaHtml = ctaHref && ctaLabel
    ? `<a href="${ctaHref}" style="display:inline-block;background:#7C3AED;color:#fff;font-size:15px;font-weight:600;text-decoration:none;padding:13px 28px;border-radius:12px;margin-top:24px">${escapeHtml(ctaLabel)}</a>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${escapeHtml(heading)}</title>
</head>
<body style="margin:0;padding:0;background:#0F172A;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <div style="max-width:520px;margin:40px auto;background:#1C1F2E;border-radius:20px;overflow:hidden">
    <div style="background:linear-gradient(135deg,${badgeColor});padding:32px 32px 24px">
      <div style="font-size:22px;font-weight:800;color:#fff;letter-spacing:-0.5px">toatre</div>
      <div style="font-size:13px;color:rgba(255,255,255,0.7);margin-top:4px">Your personal timeline assistant</div>
    </div>
    <div style="padding:28px 32px 32px">
      <div style="display:inline-block;background:${badgeColor.split(",")[0].replace("135deg,", "")};font-size:12px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:0.08em;padding:5px 12px;border-radius:999px;margin-bottom:14px">${escapeHtml(badgeLabel)}</div>
      <p style="font-size:22px;font-weight:700;color:${headingColor};line-height:1.35;margin:0 0 8px">${escapeHtml(heading)}</p>
      <p style="font-size:14px;color:#94A3B8;margin:0 0 22px">${escapeHtml(subheading)}</p>
      <table style="width:100%;border-collapse:collapse;background:#131825;border-radius:12px;padding:12px 16px" cellpadding="0" cellspacing="0">
        <tbody>${rowsHtml}</tbody>
      </table>
      ${ctaHtml}
    </div>
    <div style="padding:18px 32px;border-top:1px solid rgba(255,255,255,0.06)">
      <p style="font-size:12px;color:#475569;margin:0">${escapeHtml(footerText)}</p>
    </div>
  </div>
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
}): Promise<void> {
  const client = getResendClient();
  const slotLabel = formatSlot(input.slotStart, input.slotEnd);
  const deepLink = input.toatId ? `https://toatre.com/toats/${input.toatId}` : "https://toatre.com/inbox";

  if (input.type === "new_request") {
    const rows: Array<{ label: string; value: string }> = [
      { label: "From", value: `${input.bookerName} <${input.bookerEmail}>` },
      { label: "Slot", value: slotLabel },
    ];
    if (input.message) rows.push({ label: "Message", value: input.message });

    await client.emails.send({
      from: FROM,
      to: input.toEmail,
      subject: `${input.bookerName} wants to meet — ${slotLabel}`,
      html: baseHtml({
        badgeLabel: "New booking request",
        badgeColor: "#5B3DF5, #7C3AED",
        headingColor: "#F1F5F9",
        heading: `${input.bookerName} wants to meet with you`,
        subheading: `Review the request in Toatre and accept or decline.`,
        rows,
        ctaHref: deepLink,
        ctaLabel: "Review in Toatre",
        footerText: "Someone submitted a booking request through your Toat Link. Open Toatre to accept or decline.",
      }),
    });
    return;
  }

  if (input.type === "accepted") {
    await client.emails.send({
      from: FROM,
      to: input.toEmail,
      subject: `Your booking with ${input.ownerName} is confirmed`,
      html: baseHtml({
        badgeLabel: "Booking confirmed",
        badgeColor: "#059669, #10B981",
        headingColor: "#D1FAE5",
        heading: `You're on! ${input.ownerName} accepted your request`,
        subheading: `Add this to your calendar so you don't forget.`,
        rows: [
          { label: "With", value: input.ownerName },
          { label: "When", value: slotLabel },
        ],
        ctaHref: null,
        ctaLabel: null,
        footerText: `Your booking request with ${input.ownerName} was accepted. See you then!`,
      }),
    });
    return;
  }

  // denied
  await client.emails.send({
    from: FROM,
    to: input.toEmail,
    subject: `Booking update from ${input.ownerName}`,
    html: baseHtml({
      badgeLabel: "Booking declined",
      badgeColor: "#DC2626, #EF4444",
      headingColor: "#FEE2E2",
      heading: `${input.ownerName} couldn't make that slot work`,
      subheading: `Try another time or reach out directly.`,
      rows: [
        { label: "With", value: input.ownerName },
        { label: "Slot", value: slotLabel },
      ],
      ctaHref: null,
      ctaLabel: null,
      footerText: `Your booking request was declined. You can visit ${input.ownerName}'s Toat Link to pick another slot.`,
    }),
  });
}
