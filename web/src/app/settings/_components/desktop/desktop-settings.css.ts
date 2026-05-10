export const desktopSettingsCss = `
  .desktop-settings-root {
    min-height: 100vh;
    background: #f8fafc;
    color: #0f172a;
    font-family: Inter, "Segoe UI", sans-serif;
    display: grid;
    grid-template-columns: 240px minmax(0, 1fr);
  }

  .desktop-settings-sidebar {
    background: rgba(255, 255, 255, 0.82);
    border-right: 1px solid #e5eaf3;
    min-height: 100vh;
    padding: 28px 16px;
    display: flex;
    flex-direction: column;
    gap: 26px;
    position: sticky;
    top: 0;
  }

  .desktop-settings-brand {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 0 10px 10px;
    font-size: 25px;
    font-weight: 800;
    color: #07133f;
    letter-spacing: 0;
  }

  .desktop-settings-brand img {
    width: 38px;
    height: 38px;
    border-radius: 12px;
  }

  .desktop-settings-nav-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding-bottom: 22px;
    border-bottom: 1px solid #e9edf5;
  }

  .desktop-settings-nav-label {
    font-size: 11px;
    font-weight: 750;
    letter-spacing: 0.08em;
    color: #64748b;
    padding: 8px 10px 4px;
  }

  .desktop-app-nav-item {
    min-height: 46px;
    border: 0;
    border-radius: 12px;
    background: transparent;
    color: #172554;
    display: grid;
    grid-template-columns: 24px 1fr auto;
    align-items: center;
    gap: 12px;
    padding: 0 14px;
    font: inherit;
    font-size: 15px;
    font-weight: 650;
    cursor: pointer;
    text-decoration: none;
  }

  .desktop-app-nav-item.active {
    background: #f0e9ff;
    color: #5b21ff;
  }

  .desktop-app-nav-item:hover:not(.active) {
    background: #f8f7ff;
  }

  .desktop-nav-badge {
    min-width: 22px;
    height: 22px;
    border-radius: 999px;
    background: #eef2f7;
    color: #334155;
    display: inline-grid;
    place-items: center;
    font-size: 12px;
    font-weight: 800;
  }

  .desktop-settings-main {
    min-width: 0;
    display: flex;
    flex-direction: column;
  }

  .desktop-settings-topbar {
    height: 76px;
    background: rgba(255, 255, 255, 0.88);
    border-bottom: 1px solid #e5eaf3;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    padding: 0 40px;
    position: sticky;
    top: 0;
    z-index: 10;
  }

  .desktop-top-search {
    width: min(430px, 48vw);
    height: 44px;
    border: 1px solid #d9e0ec;
    border-radius: 10px;
    background: white;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 0 14px;
    color: #52627c;
    font-size: 14px;
    font-weight: 600;
  }

  .desktop-top-search kbd {
    margin-left: auto;
    border: 0;
    background: transparent;
    color: #334155;
    font: inherit;
    font-size: 13px;
    font-weight: 700;
  }

  .desktop-top-actions {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .desktop-bell {
    position: relative;
    width: 34px;
    height: 34px;
    border: 0;
    background: transparent;
    color: #334155;
    display: grid;
    place-items: center;
  }

  .desktop-bell span {
    position: absolute;
    top: 0;
    right: 1px;
    min-width: 17px;
    height: 17px;
    border-radius: 999px;
    background: #5b21ff;
    color: white;
    font-size: 10px;
    font-weight: 800;
    display: grid;
    place-items: center;
  }

  .desktop-header-avatar {
    width: 45px;
    height: 45px;
    border-radius: 999px;
    overflow: hidden;
    position: relative;
  }

  .desktop-header-avatar > div,
  .desktop-header-avatar img {
    width: 100% !important;
    height: 100% !important;
    border-radius: 999px !important;
  }

  .desktop-settings-workspace {
    display: grid;
    grid-template-columns: 220px minmax(0, 1060px);
    gap: 32px;
    align-items: start;
    padding: 12px 48px 34px;
  }

  .desktop-settings-section-nav {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding-top: 88px;
  }

  .desktop-section-nav-item {
    border: 0;
    border-radius: 10px;
    background: transparent;
    min-height: 52px;
    display: grid;
    grid-template-columns: 24px 1fr;
    gap: 12px;
    align-items: center;
    color: #334155;
    padding: 10px 14px;
    text-align: left;
    font: inherit;
    cursor: pointer;
  }

  .desktop-section-nav-item strong {
    display: block;
    font-size: 15px;
    font-weight: 720;
  }

  .desktop-section-nav-item span {
    display: block;
    margin-top: 4px;
    font-size: 13px;
    line-height: 1.35;
    color: #52627c;
  }

  .desktop-section-nav-item.active {
    background: #f0e9ff;
    color: #5b21ff;
  }

  .desktop-section-nav-item.active span {
    color: #4f46e5;
  }

  .desktop-settings-content {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  .desktop-page-head h1 {
    margin: 0 0 10px;
    font-size: 29px;
    font-weight: 800;
    letter-spacing: 0;
    color: #07133f;
  }

  .desktop-page-head p {
    margin: 0;
    font-size: 15px;
    line-height: 1.6;
    color: #405070;
  }

  .desktop-panel-card {
    background: white;
    border: 1px solid #dfe6f1;
    border-radius: 12px;
    overflow: hidden;
  }

  .desktop-card-pad {
    padding: 24px 28px;
  }

  .desktop-card-title {
    margin: 0 0 18px;
    font-size: 17px;
    font-weight: 780;
    color: #0f172a;
  }

  .desktop-account-row {
    display: grid;
    grid-template-columns: 78px 1fr auto;
    gap: 24px;
    align-items: center;
  }

  .desktop-account-avatar {
    width: 78px;
    height: 78px;
    border-radius: 999px;
    overflow: hidden;
  }

  .desktop-account-avatar > div,
  .desktop-account-avatar img {
    width: 100% !important;
    height: 100% !important;
    border-radius: 999px !important;
  }

  .desktop-account-name {
    margin: 0 0 4px;
    font-size: 20px;
    font-weight: 800;
    color: #0f172a;
  }

  .desktop-account-email {
    margin: 0 0 6px;
    color: #405070;
    font-size: 14px;
    font-weight: 600;
  }

  .desktop-account-bio {
    margin: 0;
    color: #405070;
    max-width: 520px;
    line-height: 1.5;
    font-size: 14px;
  }

  .desktop-social-row {
    border-top: 1px solid #e8edf6;
    padding: 16px 28px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
  }

  .desktop-provider-chip {
    display: inline-flex;
    align-items: center;
    gap: 14px;
    font-weight: 720;
    color: #0f172a;
    font-size: 14px;
  }

  .desktop-google-mark,
  .desktop-provider-mark {
    width: 28px;
    height: 28px;
    border-radius: 8px;
    display: inline-grid;
    place-items: center;
    font-weight: 900;
    background: #f1f5f9;
    color: #475569;
  }

  .desktop-form-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 20px;
  }

  .desktop-form-grid.three {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .desktop-form-grid.two {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .desktop-field {
    display: grid;
    gap: 10px;
    min-width: 0;
  }

  .desktop-field-label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: #405070;
    font-weight: 700;
  }

  .desktop-field input,
  .desktop-field select,
  .desktop-field textarea,
  .desktop-input-shell {
    width: 100%;
    min-height: 45px;
    border: 1px solid #dfe6f1;
    border-radius: 9px;
    background: white;
    color: #0f172a;
    font: inherit;
    font-size: 14px;
    font-weight: 650;
    padding: 0 14px;
    box-sizing: border-box;
  }

  .desktop-field textarea {
    min-height: 74px;
    padding: 12px 14px;
    resize: vertical;
  }

  .desktop-segmented {
    display: grid;
    grid-template-columns: 1fr 1fr;
    border-radius: 9px;
    overflow: hidden;
    border: 1px solid #dfe6f1;
    background: #f8fafc;
  }

  .desktop-segmented button {
    min-height: 45px;
    border: 0;
    background: transparent;
    font: inherit;
    font-weight: 700;
    color: #405070;
    cursor: pointer;
  }

  .desktop-segmented button.active {
    color: #5b21ff;
    background: #f2eaff;
    box-shadow: inset 0 0 0 1px #b99cff;
    border-radius: 8px;
  }

  .desktop-row-list {
    display: flex;
    flex-direction: column;
  }

  .desktop-setting-row {
    display: grid;
    grid-template-columns: 26px 1fr auto;
    gap: 16px;
    align-items: center;
    min-height: 58px;
    padding: 12px 0;
    border-bottom: 1px solid #edf1f7;
  }

  .desktop-setting-row:last-child {
    border-bottom: 0;
  }

  .desktop-setting-row h3 {
    margin: 0 0 3px;
    font-size: 14px;
    color: #0f172a;
    font-weight: 760;
  }

  .desktop-setting-row p {
    margin: 0;
    color: #52627c;
    font-size: 13px;
    line-height: 1.35;
  }

  .desktop-switch {
    width: 38px;
    height: 22px;
    border: 0;
    border-radius: 999px;
    padding: 2px;
    background: #cbd5e1;
    display: flex;
    align-items: center;
    cursor: pointer;
  }

  .desktop-switch.active {
    background: #6d28ff;
    justify-content: flex-end;
  }

  .desktop-switch span {
    width: 18px;
    height: 18px;
    border-radius: 999px;
    background: white;
    box-shadow: 0 1px 4px rgba(15, 23, 42, 0.18);
  }

  .desktop-ghost-btn,
  .desktop-primary-btn,
  .desktop-soft-btn {
    min-height: 38px;
    padding: 0 16px;
    border-radius: 9px;
    font: inherit;
    font-size: 14px;
    font-weight: 760;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    white-space: nowrap;
  }

  .desktop-ghost-btn {
    color: #5b21ff;
    background: white;
    border: 1px solid #dfe6f1;
  }

  .desktop-soft-btn {
    color: #5b21ff;
    background: #f3ebff;
    border: 1px solid #cebfff;
  }

  .desktop-primary-btn {
    color: white;
    background: #6d28ff;
    border: 1px solid #6d28ff;
  }

  .desktop-ghost-btn:disabled,
  .desktop-primary-btn:disabled,
  .desktop-soft-btn:disabled {
    opacity: 0.58;
    cursor: not-allowed;
  }

  .desktop-tabs {
    display: flex;
    align-items: flex-end;
    gap: 34px;
    border-bottom: 1px solid #dfe6f1;
    margin-top: 6px;
  }

  .desktop-tabs button {
    border: 0;
    background: transparent;
    padding: 0 0 14px;
    color: #405070;
    font: inherit;
    font-size: 14px;
    font-weight: 720;
    cursor: pointer;
    border-bottom: 2px solid transparent;
  }

  .desktop-tabs button.active {
    color: #5b21ff;
    border-bottom-color: #6d28ff;
  }

  .desktop-handle-field {
    display: flex;
    align-items: center;
    gap: 12px;
    max-width: 360px;
    min-height: 46px;
    border: 1px solid #dfe6f1;
    border-radius: 8px;
    padding: 0 12px;
    color: #405070;
    font-weight: 760;
  }

  .desktop-handle-field strong {
    color: #0f172a;
    font-size: 17px;
  }

  .desktop-live-pill,
  .desktop-muted-pill,
  .desktop-channel-pill {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    border-radius: 999px;
    min-height: 24px;
    padding: 0 10px;
    font-size: 12px;
    font-weight: 760;
  }

  .desktop-live-pill {
    color: #15803d;
    background: #dcfce7;
  }

  .desktop-muted-pill {
    color: #64748b;
    background: #eef2f7;
  }

  .desktop-channel-pill {
    color: #5b21ff;
    background: #f1e9ff;
  }

  .desktop-section-card-head {
    display: flex;
    justify-content: space-between;
    gap: 18px;
    align-items: center;
    margin-bottom: 18px;
  }

  .desktop-section-card-head h2 {
    margin: 0 0 4px;
    font-size: 16px;
    font-weight: 780;
  }

  .desktop-section-card-head p {
    margin: 0;
    color: #52627c;
    font-size: 13px;
  }

  .desktop-handle-main-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
  }

  .desktop-page-basics-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 280px;
  }

  .desktop-page-basics-fields {
    display: grid;
    gap: 14px;
    padding-right: 28px;
  }

  .desktop-preview-box {
    border-left: 1px solid #e5eaf3;
    padding-left: 26px;
  }

  .desktop-mini-preview {
    border: 1px solid #dfe6f1;
    border-radius: 10px;
    padding: 16px;
    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
  }

  .desktop-mini-preview-head {
    display: grid;
    grid-template-columns: 44px 1fr;
    gap: 12px;
    align-items: center;
    margin-bottom: 10px;
  }

  .desktop-mini-avatar {
    width: 44px;
    height: 44px;
    border-radius: 999px;
    overflow: hidden;
  }

  .desktop-mini-avatar > div,
  .desktop-mini-avatar img {
    width: 100% !important;
    height: 100% !important;
    border-radius: 999px !important;
  }

  .desktop-mini-preview strong {
    font-size: 15px;
    display: block;
  }

  .desktop-mini-preview p {
    margin: 6px 0;
    color: #334155;
    line-height: 1.4;
    font-size: 12px;
  }

  .desktop-mini-preview .desktop-soft-btn {
    min-height: 30px;
    width: 100%;
    margin-top: 8px;
    font-size: 12px;
  }

  .desktop-visibility-row {
    grid-template-columns: 26px 1fr auto;
  }

  .desktop-connection-row {
    display: grid;
    grid-template-columns: 42px 1fr auto auto;
    gap: 18px;
    align-items: center;
    padding: 16px 0;
    border-bottom: 1px solid #edf1f7;
  }

  .desktop-connection-row:last-child {
    border-bottom: 0;
  }

  .desktop-calendar-icon {
    width: 42px;
    height: 42px;
    border-radius: 10px;
    display: grid;
    place-items: center;
    font-size: 13px;
    font-weight: 900;
    color: white;
    background: #4285f4;
  }

  .desktop-calendar-icon.outlook { background: #0078d4; }
  .desktop-calendar-icon.calendly { background: #006bff; }
  .desktop-calendar-icon.zoom { background: #2d8cff; }

  .desktop-connection-row h3 {
    margin: 0 0 3px;
    font-size: 15px;
    font-weight: 780;
  }

  .desktop-connection-row p {
    margin: 0;
    color: #52627c;
    font-size: 13px;
  }

  .desktop-status-text {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    color: #64748b;
    font-size: 13px;
    font-weight: 720;
  }

  .desktop-status-text.connected { color: #16a34a; }
  .desktop-dot { width: 8px; height: 8px; border-radius: 999px; background: currentColor; }

  .desktop-settings-card-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 18px;
  }

  .desktop-provider-options {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 6px;
  }

  .desktop-provider-option {
    min-height: 44px;
    border: 1px solid #dfe6f1;
    border-radius: 9px;
    background: white;
    color: #0f172a;
    font: inherit;
    font-size: 13px;
    font-weight: 740;
    cursor: pointer;
  }

  .desktop-provider-option.active {
    border-color: #a78bfa;
    background: #f3ebff;
    color: #5b21ff;
  }

  .desktop-saved-indicator {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    color: #64748b;
    font-size: 13px;
    font-weight: 650;
    margin: 22px 0 0 6px;
  }

  .desktop-saved-indicator span {
    width: 18px;
    height: 18px;
    border-radius: 999px;
    display: grid;
    place-items: center;
    background: #22c55e;
    color: white;
    font-size: 12px;
    font-weight: 900;
  }

  .desktop-notice {
    border-radius: 10px;
    padding: 12px 14px;
    font-size: 13px;
    font-weight: 700;
    border: 1px solid transparent;
  }

  .desktop-notice.success {
    color: #166534;
    background: #dcfce7;
    border-color: #bbf7d0;
  }

  .desktop-notice.error {
    color: #b91c1c;
    background: #fee2e2;
    border-color: #fecaca;
  }

  @media (max-width: 1320px) {
    .desktop-settings-workspace {
      grid-template-columns: 190px minmax(0, 1fr);
      padding-left: 32px;
      padding-right: 32px;
    }

    .desktop-form-grid,
    .desktop-form-grid.three {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
`;
