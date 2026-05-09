import { getResendClient } from "./resend";

const FROM = "Toatre <hello@toatre.com>";

function buildHtml(toatTitle: string, reminderLabel: string, subtitle: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Toatre Ping</title>
  <style>
    body{margin:0;padding:0;background:#0F172A;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif}
    .wrap{max-width:480px;margin:40px auto;background:#1C1F2E;border-radius:20px;overflow:hidden}
    .header{background:linear-gradient(135deg,#7C3AED,#6366F1);padding:32px 32px 24px}
    .logo{font-size:22px;font-weight:800;color:#fff;letter-spacing:-0.5px}
    .header-label{font-size:13px;color:rgba(255,255,255,0.7);margin-top:4px}
    .body{padding:28px 32px 32px}
    .reminder-label{font-size:13px;color:#A78BFA;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:10px}
    .toat-title{font-size:22px;font-weight:700;color:#F1F5F9;line-height:1.35;margin:0 0 10px}
    .subtitle{font-size:15px;color:#94A3B8;margin:0 0 28px}
    .cta{display:inline-block;background:#7C3AED;color:#fff;font-size:15px;font-weight:600;text-decoration:none;padding:13px 28px;border-radius:12px}
    .footer{padding:18px 32px;border-top:1px solid rgba(255,255,255,0.06)}
    .footer-text{font-size:12px;color:#475569;margin:0}
  </style>
</head>
<body>
  <div class="wrap">
    <div class="header">
      <div class="logo">toatre</div>
      <div class="header-label">Your personal timeline assistant</div>
    </div>
    <div class="body">
      <div class="reminder-label">${escapeHtml(reminderLabel)}</div>
      <p class="toat-title">${escapeHtml(toatTitle)}</p>
      <p class="subtitle">${escapeHtml(subtitle)}</p>
      <a class="cta" href="https://toatre.com">Open Toatre</a>
    </div>
    <div class="footer">
      <p class="footer-text">You're receiving this because you enabled email pings in Toatre.<br>Manage your preferences in Settings.</p>
    </div>
  </div>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendReminderEmail(input: {
  toEmail: string;
  toatTitle: string;
  reminderLabel: string;
  subtitle: string;
}): Promise<void> {
  const client = getResendClient();

  await client.emails.send({
    from: FROM,
    to: input.toEmail,
    subject: `Ping: ${input.toatTitle}`,
    html: buildHtml(input.toatTitle, input.reminderLabel, input.subtitle),
  });
}
