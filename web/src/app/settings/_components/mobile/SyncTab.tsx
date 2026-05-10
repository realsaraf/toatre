"use client";

import type { SyncDirection, SyncConnection } from "../../_utils/settings-helpers";
import { SyncCard } from "./SyncCard";
import { styles } from "./mobile.styles";

interface SyncTabProps {
  syncConnections: Record<string, SyncConnection>;
  googleCalendarDirection: SyncDirection;
  setGoogleCalendarDirection: (v: SyncDirection) => void;
  microsoftDirection: SyncDirection;
  setMicrosoftDirection: (v: SyncDirection) => void;
  calendlyDirection: SyncDirection;
  setCalendlyDirection: (v: SyncDirection) => void;
  zoomDirection: SyncDirection;
  setZoomDirection: (v: SyncDirection) => void;
  savingKey: string | null;
  connectGoogleCalendar: () => Promise<void>;
  disconnectGoogleCalendar: () => Promise<void>;
  runGoogleCalendarSync: () => Promise<void>;
  connectMicrosoft: () => Promise<void>;
  disconnectMicrosoft: () => Promise<void>;
  runMicrosoftSync: () => Promise<void>;
  connectCalendly: () => Promise<void>;
  disconnectCalendly: () => Promise<void>;
  runCalendlySync: () => Promise<void>;
  connectZoom: () => Promise<void>;
  disconnectZoom: () => Promise<void>;
  runZoomSync: () => Promise<void>;
}

export function SyncTab({
  syncConnections,
  googleCalendarDirection,
  setGoogleCalendarDirection,
  microsoftDirection,
  setMicrosoftDirection,
  calendlyDirection,
  setCalendlyDirection,
  zoomDirection,
  setZoomDirection,
  savingKey,
  connectGoogleCalendar,
  disconnectGoogleCalendar,
  runGoogleCalendarSync,
  connectMicrosoft,
  disconnectMicrosoft,
  runMicrosoftSync,
  connectCalendly,
  disconnectCalendly,
  runCalendlySync,
  connectZoom,
  disconnectZoom,
  runZoomSync,
}: SyncTabProps) {
  return (
    <section style={styles.panelCard}>
      <div style={styles.sectionHead}>
        <div>
          <p style={styles.sectionEyebrow}>Sync</p>
          <h2 style={styles.sectionTitle}>Connected services</h2>
        </div>
      </div>

      <p style={styles.helperText}>Connect your calendars and booking sources so Toatre can keep your timeline aligned.</p>

      <SyncCard
        connection={syncConnections["googleCalendar"]}
        title="Google Calendar"
        description="Import scheduled items from Google and optionally push Toatre toats back."
        direction={googleCalendarDirection}
        setDirection={setGoogleCalendarDirection}
        onConnect={() => void connectGoogleCalendar()}
        onDisconnect={() => void disconnectGoogleCalendar()}
        onRun={() => void runGoogleCalendarSync()}
        actionKey="sync-google"
        runKey="sync-google-run"
        mark="G"
        savingKey={savingKey}
      />

      <SyncCard
        connection={syncConnections["microsoft"]}
        title="Microsoft Calendar"
        description="Bring Outlook calendar events into Toatre and keep updates in sync."
        direction={microsoftDirection}
        setDirection={setMicrosoftDirection}
        onConnect={() => void connectMicrosoft()}
        onDisconnect={() => void disconnectMicrosoft()}
        onRun={() => void runMicrosoftSync()}
        actionKey="sync-microsoft"
        runKey="sync-microsoft-run"
        mark="MS"
        savingKey={savingKey}
      />

      <SyncCard
        connection={syncConnections["calendly"]}
        title="Calendly"
        description="Turn new booking activity into Toatre toats automatically."
        direction={calendlyDirection}
        setDirection={setCalendlyDirection}
        onConnect={() => void connectCalendly()}
        onDisconnect={() => void disconnectCalendly()}
        onRun={() => void runCalendlySync()}
        actionKey="sync-calendly"
        runKey="sync-calendly-run"
        mark="C"
        savingKey={savingKey}
      />

      <SyncCard
        connection={syncConnections["zoom"]}
        title="Zoom"
        description="Keep Zoom meetings reflected in your timeline and booking flow."
        direction={zoomDirection}
        setDirection={setZoomDirection}
        onConnect={() => void connectZoom()}
        onDisconnect={() => void disconnectZoom()}
        onRun={() => void runZoomSync()}
        actionKey="sync-zoom"
        runKey="sync-zoom-run"
        mark="Z"
        savingKey={savingKey}
      />
    </section>
  );
}
