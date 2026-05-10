"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { BookingDashboardShell } from "@/app/_components/booking-dashboard";
import { MobileSettingsView } from "@/app/settings/_components/mobile/MobileSettingsView";
import { useSettings, type UseSettingsResult } from "@/app/settings/_hooks/useSettings";

const peoplePageCss = `
  .people-workspace { display: grid; grid-template-columns: minmax(340px, 420px) minmax(0, 1fr); gap: 24px; padding: 12px 34px 34px; }
  .people-card { border: 1px solid #e4e7f0; border-radius: 16px; background: #fff; box-shadow: 0 12px 30px rgba(20, 25, 58, 0.025); min-width: 0; }
  .people-card-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; padding: 22px 22px 18px; border-bottom: 1px solid #eef1f7; }
  .people-card-head h2 { margin: 0; font-size: 20px; font-weight: 850; color: #0d1235; }
  .people-card-head p { margin: 8px 0 0; color: #66708f; font-size: 13px; line-height: 1.45; }
  .people-card-body { padding: 22px; display: grid; gap: 16px; }
  .people-form-grid { display: grid; gap: 14px; }
  .people-inline-fields { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .people-field { display: grid; gap: 8px; color: #334155; font-size: 13px; font-weight: 700; }
  .people-field input, .people-field textarea { width: 100%; border: 1px solid #d8deeb; border-radius: 12px; background: #fff; color: #0f172a; font: inherit; font-size: 14px; padding: 12px 14px; box-sizing: border-box; }
  .people-field textarea { min-height: 112px; resize: vertical; }
  .people-actions { display: flex; align-items: center; gap: 12px; }
  .people-primary-button, .people-secondary-button, .people-ghost-button, .people-danger-button { min-height: 42px; border-radius: 10px; padding: 0 16px; font: inherit; font-size: 13px; font-weight: 800; cursor: pointer; }
  .people-primary-button { border: 0; background: linear-gradient(135deg, #6942ff, #5428e8); color: #fff; box-shadow: 0 10px 20px rgba(91, 45, 255, 0.18); }
  .people-secondary-button { border: 1px solid #d8deeb; background: #fff; color: #475569; }
  .people-ghost-button { border: 1px solid #d8deeb; background: #fff; color: #5b2dff; }
  .people-danger-button { border: 1px solid #fee2e2; background: #fff5f5; color: #b42318; }
  .people-primary-button:disabled, .people-danger-button:disabled { opacity: 0.6; cursor: not-allowed; }
  .people-list { display: grid; gap: 14px; }
  .people-list-item { border: 1px solid #e9edf5; border-radius: 14px; background: linear-gradient(180deg, #ffffff, #fbfcff); padding: 18px; display: grid; grid-template-columns: 48px minmax(0, 1fr) auto; gap: 14px; align-items: flex-start; }
  .people-avatar { width: 48px; height: 48px; border-radius: 14px; display: grid; place-items: center; background: linear-gradient(135deg, #efe9ff, #f8f5ff); color: #5b2dff; font-size: 18px; font-weight: 850; }
  .people-list-copy { min-width: 0; display: grid; gap: 8px; }
  .people-list-copy strong { color: #0d1235; font-size: 15px; font-weight: 850; }
  .people-list-copy p { margin: 0; color: #64748b; font-size: 13px; line-height: 1.45; }
  .people-chip-row { display: flex; flex-wrap: wrap; gap: 8px; }
  .people-chip { min-height: 28px; border-radius: 999px; padding: 0 12px; display: inline-flex; align-items: center; background: #f5f7fb; color: #475569; font-size: 12px; font-weight: 700; }
  .people-item-actions { display: flex; align-items: center; gap: 10px; }
  .people-empty { min-height: 220px; border: 1px dashed #dfe4ef; border-radius: 14px; display: grid; place-items: center; text-align: center; padding: 34px; color: #66708f; }
  .people-empty strong { display: block; color: #0d1235; margin-bottom: 8px; }
  .people-notice { border: 1px solid #d8ceff; background: #f6f2ff; color: #4d2bd0; border-radius: 11px; padding: 12px 14px; font-size: 13px; font-weight: 750; }
  .people-notice.error { border-color: #fecaca; background: #fff1f2; color: #b42318; }
  @media (max-width: 1180px) { .people-workspace { grid-template-columns: 1fr; } .people-inline-fields { grid-template-columns: 1fr; } .people-list-item { grid-template-columns: 48px minmax(0, 1fr); } .people-item-actions { grid-column: 1 / -1; } }
`;

export default function PeoplePage() {
  const router = useRouter();
  const settings = useSettings();
  const activeTab = settings.activeTab;
  const setActiveTab = settings.setActiveTab;

  useEffect(() => {
    if (activeTab !== "connections") {
      queueMicrotask(() => {
        setActiveTab("connections");
      });
    }
  }, [activeTab, setActiveTab]);

  if (!settings.user && !settings.loading) return null;

  if (!settings.isDesktopViewport) {
    return <MobileSettingsView {...settings} initialScreen="connections" />;
  }

  return <DesktopPeopleView {...settings} onCapture={() => router.push("/capture?mode=text")} />;
}

function DesktopPeopleView(props: UseSettingsResult & { onCapture: () => void }) {
  return (
    <BookingDashboardShell
      user={props.user}
      active="people"
      inboxCount={0}
      bookingCount={0}
      pageTitle="People"
      pageSubtitle="Save the people you coordinate with often"
      onCapture={props.onCapture}
    >
      <style>{peoplePageCss}</style>
      <section className="people-workspace">
        <div className="people-card">
          <div className="people-card-head">
            <div>
              <h2>{props.editingConnectionId ? "Edit connection" : "Add connection"}</h2>
              <p>Save the people who share toats with you or send booking requests often.</p>
            </div>
          </div>
          <div className="people-card-body">
            {props.notice.message ? <div className={`people-notice${props.notice.tone === "error" ? " error" : ""}`}>{props.notice.message}</div> : null}
            <div className="people-form-grid">
              <div className="people-inline-fields">
                <label className="people-field">
                  <span>Name</span>
                  <input value={props.connectionDraft.name} onChange={(event) => props.setConnectionDraft((current) => ({ ...current, name: event.target.value }))} />
                </label>
                <label className="people-field">
                  <span>Relationship</span>
                  <input value={props.connectionDraft.relationship} onChange={(event) => props.setConnectionDraft((current) => ({ ...current, relationship: event.target.value }))} />
                </label>
              </div>
              <div className="people-inline-fields">
                <label className="people-field">
                  <span>Phone</span>
                  <input value={props.connectionDraft.phone} onChange={(event) => props.setConnectionDraft((current) => ({ ...current, phone: event.target.value }))} />
                </label>
                <label className="people-field">
                  <span>Email</span>
                  <input value={props.connectionDraft.email} onChange={(event) => props.setConnectionDraft((current) => ({ ...current, email: event.target.value }))} />
                </label>
              </div>
              <label className="people-field">
                <span>Handle</span>
                <input value={props.connectionDraft.handle} onChange={(event) => props.setConnectionDraft((current) => ({ ...current, handle: event.target.value }))} />
              </label>
              <label className="people-field">
                <span>Notes</span>
                <textarea value={props.connectionDraft.notes} onChange={(event) => props.setConnectionDraft((current) => ({ ...current, notes: event.target.value }))} />
              </label>
            </div>
            <div className="people-actions">
              <button type="button" className="people-primary-button" onClick={() => void props.saveConnection()} disabled={props.savingKey === "connection-save"}>
                {props.savingKey === "connection-save" ? "Saving..." : props.editingConnectionId ? "Update connection" : "Add connection"}
              </button>
              {props.editingConnectionId ? <button type="button" className="people-secondary-button" onClick={props.resetConnectionDraft}>Cancel edit</button> : null}
            </div>
          </div>
        </div>

        <div className="people-card">
          <div className="people-card-head">
            <div>
              <h2>Saved people</h2>
              <p>{props.connections.length} connection{props.connections.length === 1 ? "" : "s"} ready for sharing, booking, and capture context.</p>
            </div>
          </div>
          <div className="people-card-body">
            {props.loadingState && props.connections.length === 0 ? <div className="people-empty"><div><strong>Loading people</strong><span>Pulling your saved connections now.</span></div></div> : null}
            {!props.loadingState && props.connections.length === 0 ? <div className="people-empty"><div><strong>No saved people yet</strong><span>Add the people you coordinate with often so sharing and capture work better.</span></div></div> : null}
            {props.connections.length > 0 ? (
              <div className="people-list">
                {props.connections.map((connection) => (
                  <article key={connection.id} className="people-list-item">
                    <div className="people-avatar">{connection.name.slice(0, 1).toUpperCase()}</div>
                    <div className="people-list-copy">
                      <strong>{connection.name}</strong>
                      <p>{connection.relationship || "Connection"}</p>
                      <div className="people-chip-row">
                        {connection.handle ? <span className="people-chip">@{connection.handle}</span> : null}
                        {connection.email ? <span className="people-chip">{connection.email}</span> : null}
                        {connection.phone ? <span className="people-chip">{connection.phone}</span> : null}
                      </div>
                      {connection.notes ? <p>{connection.notes}</p> : null}
                    </div>
                    <div className="people-item-actions">
                      <button type="button" className="people-ghost-button" onClick={() => props.editConnection(connection)}>Edit</button>
                      <button type="button" className="people-danger-button" onClick={() => void props.deleteConnection(connection.id)} disabled={props.savingKey === `connection-delete-${connection.id}`}>
                        {props.savingKey === `connection-delete-${connection.id}` ? "Removing..." : "Delete"}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </BookingDashboardShell>
  );
}
