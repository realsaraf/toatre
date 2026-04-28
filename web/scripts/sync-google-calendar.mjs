const apiUrl = process.env.TOATRE_API_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const cronSecret = process.env.CRON_SECRET;

if (!cronSecret) {
  console.error("CRON_SECRET is required to run Google Calendar sync.");
  process.exit(1);
}

const response = await fetch(`${apiUrl.replace(/\/$/, "")}/api/sync/google/run`, {
  method: "GET",
  headers: {
    "x-cron-secret": cronSecret,
  },
});

const text = await response.text();
if (!response.ok) {
  console.error(`Google Calendar sync failed: ${response.status} ${text}`);
  process.exit(1);
}

console.log(text || "Google Calendar sync finished.");
