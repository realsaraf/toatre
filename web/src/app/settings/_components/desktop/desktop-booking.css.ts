export const desktopToatLinkSettingsCss = `
  .desktop-booking-settings-page {
    min-height: 100vh;
    background: #f5f5fa;
    color: #17224d;
    font-family: Inter, "Segoe UI", sans-serif;
    display: flex;
    flex-direction: column;
  }

  .desktop-booking-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 14px 28px;
    background: white;
    border-bottom: 1px solid rgba(109, 73, 255, 0.08);
  }

  .dts-header-title h1 {
    margin: 0 0 2px;
    font-size: 18px;
    font-weight: 700;
    letter-spacing: -0.03em;
  }

  .dts-header-title p {
    margin: 0;
    font-size: 13px;
    color: #7a8199;
  }

  .desktop-booking-header-actions {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .dts-saved-pill {
    font-size: 13px;
    font-weight: 600;
    color: #16a34a;
    display: flex;
    align-items: center;
    gap: 5px;
    margin-right: 6px;
  }

  .dts-preview-btn, .dts-share-btn {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    min-height: 38px;
    padding: 0 16px;
    border-radius: 12px;
    font: inherit;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    border: 1px solid rgba(109, 73, 255, 0.18);
    background: white;
    color: #17224d;
    transition: background 0.15s;
  }

  .dts-share-btn {
    background: linear-gradient(135deg, #6d49ff 0%, #5b3df5 100%);
    color: white;
    border: none;
  }

  .dts-share-btn.small {
    min-height: 34px;
    padding: 0 14px;
    font-size: 13px;
  }

  .desktop-booking-shell {
    display: grid;
    grid-template-columns: 190px minmax(0, 1fr) 290px;
    gap: 0;
    flex: 1;
    align-items: start;
    max-width: 1440px;
    width: 100%;
    margin: 0 auto;
  }

  .desktop-booking-sidebar {
    background: white;
    border-right: 1px solid rgba(109, 73, 255, 0.08);
    min-height: calc(100vh - 66px);
    padding: 20px 12px 24px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .dts-sidebar-profile {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 12px 8px 16px;
    gap: 4px;
    border-bottom: 1px solid rgba(109, 73, 255, 0.07);
    margin-bottom: 8px;
  }

  .dts-sidebar-avatar {
    width: 56px;
    height: 56px;
    border-radius: 999px;
    overflow: hidden;
    margin-bottom: 6px;
    box-shadow: 0 0 0 3px rgba(109, 73, 255, 0.12);
  }

  .dts-sidebar-avatar > div,
  .dts-sidebar-avatar > div > div,
  .dts-sidebar-avatar img {
    width: 100% !important;
    height: 100% !important;
    border-radius: 999px !important;
  }

  .dts-sidebar-profile strong {
    font-size: 14px;
    font-weight: 700;
    text-align: center;
  }

  .dts-sidebar-profile span {
    font-size: 12px;
    color: #6d49ff;
    font-weight: 600;
  }

  .desktop-settings-nav {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
  }

  .dts-nav-label {
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.08em;
    color: #99a0bb;
    padding: 10px 12px 4px;
    text-transform: uppercase;
    display: block;
  }

  .desktop-settings-nav button {
    min-height: 40px;
    border-radius: 12px;
    border: none;
    background: transparent;
    color: #5f6783;
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 0 12px;
    font: inherit;
    font-weight: 600;
    font-size: 13.5px;
    cursor: pointer;
    text-align: left;
    width: 100%;
  }

  .desktop-settings-nav button.active {
    background: rgba(109, 73, 255, 0.09);
    color: #6d49ff;
  }

  .desktop-settings-nav button:hover:not(.active) {
    background: rgba(109, 73, 255, 0.05);
    color: #17224d;
  }

  .dts-pro-badge {
    margin-left: auto;
    font-size: 10px;
    font-weight: 800;
    background: linear-gradient(135deg, #6d49ff, #5b3df5);
    color: white;
    border-radius: 6px;
    padding: 2px 7px;
  }

  .dts-help-card {
    margin-top: auto;
    background: linear-gradient(135deg, rgba(109,73,255,0.08), rgba(91,61,245,0.04));
    border: 1px solid rgba(109, 73, 255, 0.12);
    border-radius: 16px;
    padding: 14px;
    display: grid;
    gap: 6px;
  }

  .dts-help-icon {
    color: #6d49ff;
    font-size: 18px;
  }

  .dts-help-card strong {
    font-size: 13px;
    font-weight: 700;
  }

  .dts-help-card p {
    margin: 0;
    font-size: 12px;
    color: #7a8199;
    line-height: 1.4;
  }

  .dts-ask-ai-btn {
    width: 100%;
    min-height: 36px;
    border-radius: 10px;
    background: linear-gradient(135deg, #6d49ff, #5b3df5);
    color: white;
    border: none;
    font: inherit;
    font-weight: 700;
    font-size: 13px;
    cursor: pointer;
    margin-top: 4px;
  }

  .dts-view-link {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 12.5px;
    font-weight: 600;
    color: #6d49ff;
    text-decoration: none;
    padding: 8px 12px 0;
  }

  .desktop-booking-main {
    padding: 24px 28px;
    display: grid;
    gap: 18px;
    align-content: start;
  }

  .desktop-settings-card {
    background: rgba(255, 255, 255, 0.98);
    border: 1px solid rgba(109, 73, 255, 0.09);
    border-radius: 20px;
    box-shadow: 0 4px 20px rgba(21, 28, 59, 0.04);
    padding: 22px 24px;
  }

  .desktop-card-head,
  .desktop-card-foot,
  .desktop-summary-row,
  .desktop-toggle-title-row,
  .desktop-inline-toggle-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }

  .desktop-card-head {
    align-items: start;
    margin-bottom: 16px;
  }

  .desktop-card-head h2 {
    margin: 0 0 4px;
    font-size: 18px;
    font-weight: 700;
    letter-spacing: -0.03em;
  }

  .desktop-card-head p {
    margin: 0;
    color: #7a8199;
    line-height: 1.5;
    font-size: 13px;
  }

  .dts-avail-actions {
    display: flex;
    gap: 8px;
  }

  .dts-action-ghost {
    min-height: 36px;
    padding: 0 14px;
    border-radius: 10px;
    border: 1px solid rgba(109, 73, 255, 0.14);
    background: white;
    color: #5f6783;
    font: inherit;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
  }

  .dts-avail-timeline {
    display: grid;
    gap: 0;
    border: 1px solid rgba(109, 73, 255, 0.09);
    border-radius: 14px;
    overflow: hidden;
    margin-bottom: 18px;
  }

  .dts-avail-time-row {
    display: flex;
    align-items: center;
    padding: 0 12px;
    height: 30px;
    border-bottom: 1px solid rgba(109, 73, 255, 0.07);
    background: #faf9ff;
  }

  .dts-avail-day-spacer {
    width: 86px;
    flex-shrink: 0;
  }

  .dts-avail-bar-area {
    flex: 1;
    display: flex;
    justify-content: space-between;
    padding: 0 2px;
  }

  .dts-avail-time-tick {
    font-size: 11px;
    color: #99a0bb;
    font-weight: 600;
  }

  .dts-avail-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border-bottom: 1px solid rgba(109, 73, 255, 0.05);
  }

  .dts-avail-row:last-child {
    border-bottom: none;
  }

  .dts-day-toggle {
    width: 36px;
    height: 20px;
    border-radius: 999px;
    background: #e2e6f0;
    border: none;
    padding: 2px;
    cursor: pointer;
    transition: background 0.2s;
    flex-shrink: 0;
    display: flex;
    align-items: center;
  }

  .dts-day-toggle.on {
    background: #6d49ff;
    justify-content: flex-end;
  }

  .dts-day-toggle span {
    width: 16px;
    height: 16px;
    border-radius: 999px;
    background: white;
    display: block;
    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  }

  .dts-day-label {
    width: 32px;
    font-size: 13px;
    font-weight: 600;
    color: #5f6783;
    flex-shrink: 0;
  }

  .dts-avail-row.on .dts-day-label {
    color: #17224d;
  }

  .dts-bar-track {
    flex: 1;
    position: relative;
    height: 28px;
    background: #f0eefc;
    border-radius: 8px;
    overflow: hidden;
    display: flex;
    align-items: center;
  }

  .dts-bar {
    position: absolute;
    top: 0;
    bottom: 0;
    background: linear-gradient(90deg, #6d49ff, #8b6cff);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 8px;
    min-width: 60px;
  }

  .dts-bar-start, .dts-bar-end {
    font-size: 10.5px;
    font-weight: 700;
    color: white;
    white-space: nowrap;
  }

  .dts-unavailable {
    font-size: 12px;
    color: #b0b8cc;
    font-weight: 600;
    padding-left: 10px;
  }

  .dts-avail-overflow {
    width: 28px;
    height: 28px;
    border-radius: 8px;
    border: 1px solid rgba(109, 73, 255, 0.12);
    background: white;
    font-size: 16px;
    line-height: 1;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    color: #7a8199;
  }

  .dts-avail-overflow-spacer {
    width: 28px;
    flex-shrink: 0;
  }

  .dts-slot-controls {
    display: grid;
    grid-template-columns: auto 1fr 1fr;
    gap: 18px;
    align-items: end;
    padding-top: 4px;
  }

  .dts-slot-label {
    display: block;
    font-size: 12px;
    font-weight: 700;
    color: #5f6783;
    margin-bottom: 8px;
  }

  .dts-slot-controls select {
    width: 100%;
    min-height: 44px;
    border-radius: 12px;
    border: 1px solid rgba(109, 73, 255, 0.12);
    background: #fbfbff;
    padding: 0 12px;
    color: #17224d;
    font: inherit;
    font-size: 13.5px;
    box-sizing: border-box;
  }

  .desktop-choice-row {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
  }

  .desktop-choice-row button {
    border: 1px solid rgba(109, 73, 255, 0.14);
    background: white;
    color: #5f6783;
    font: inherit;
    border-radius: 10px;
    cursor: pointer;
    min-height: 40px;
    min-width: 44px;
    font-size: 13px;
    font-weight: 600;
    padding: 0 14px;
  }

  .desktop-choice-row button.active {
    background: #6d49ff;
    color: white;
    border-color: #6d49ff;
  }

  .desktop-counter {
    color: #99a0bb;
    font-size: 13px;
    font-weight: 600;
  }

  .desktop-editor-toolbar {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 10px;
  }

  .desktop-editor-toolbar button {
    border: 1px solid rgba(109, 73, 255, 0.10);
    background: white;
    color: #4d5574;
    font: inherit;
    border-radius: 12px;
    cursor: pointer;
    width: 34px;
    height: 34px;
    font-weight: 700;
  }

  .desktop-editor-textarea,
  .desktop-field-stack input,
  .desktop-field-stack textarea,
  .desktop-field-stack select,
  .desktop-inline-toggle-row input,
  .desktop-three-column-grid select,
  .desktop-two-column-grid input,
  .desktop-two-column-grid select {
    width: 100%;
    min-height: 52px;
    border-radius: 16px;
    border: 1px solid rgba(109, 73, 255, 0.12);
    background: #fbfbff;
    padding: 0 16px;
    color: #17224d;
    font: inherit;
    box-sizing: border-box;
  }

  .desktop-editor-textarea,
  .desktop-field-stack textarea {
    min-height: 120px;
    padding: 16px;
    resize: vertical;
  }

  .desktop-card-foot {
    margin-top: 12px;
  }

  .desktop-card-foot .ghost,
  .desktop-photo-row .ghost,
  .desktop-cover-card .ghost {
    display: inline-flex;
    align-items: center;
    min-height: 40px;
    padding: 0 14px;
    border-radius: 12px;
    border: 1px solid rgba(109, 73, 255, 0.14);
    background: #ffffff;
    color: #6d49ff;
    font: inherit;
    font-weight: 600;
    cursor: pointer;
  }

  .desktop-field-stack,
  .desktop-toggle-grid,
  .desktop-customization-grid {
    display: grid;
    gap: 18px;
  }

  .desktop-field-stack.spaced-top {
    margin-top: 22px;
  }

  .desktop-field-stack label,
  .desktop-three-column-grid label,
  .desktop-two-column-grid label {
    display: grid;
    gap: 10px;
  }

  .desktop-field-stack label > span,
  .desktop-field-title,
  .desktop-three-column-grid label > span,
  .desktop-two-column-grid label > span {
    font-size: 13px;
    font-weight: 700;
    color: #5f6783;
  }

  .desktop-two-column-grid,
  .desktop-three-column-grid {
    display: grid;
    gap: 16px;
  }

  .desktop-two-column-grid {
    grid-template-columns: 1fr 1fr;
  }

  .desktop-three-column-grid {
    grid-template-columns: 1fr 1fr 1fr;
  }

  .desktop-toggle-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 14px 0;
    border-bottom: 1px solid rgba(109, 73, 255, 0.07);
    cursor: pointer;
  }

  .desktop-toggle-card:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }

  .desktop-toggle-card strong {
    font-size: 14px;
    display: block;
    margin-bottom: 3px;
  }

  .desktop-toggle-card p {
    margin: 0;
    font-size: 12.5px;
    color: #7a8199;
    line-height: 1.4;
  }

  .desktop-toggle-title-row {
    justify-content: flex-start;
    gap: 8px;
    margin-bottom: 3px;
  }

  .desktop-toggle-switch {
    width: 42px;
    height: 24px;
    border-radius: 999px;
    background: #e2e6f0;
    border: none;
    padding: 3px;
    cursor: pointer;
    transition: background 0.2s;
    flex-shrink: 0;
    display: flex;
    align-items: center;
  }

  .desktop-toggle-switch.active {
    background: #6d49ff;
    justify-content: flex-end;
  }

  .desktop-toggle-switch span {
    width: 18px;
    height: 18px;
    border-radius: 999px;
    background: white;
    display: block;
    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  }

  .desktop-pro-pill {
    display: inline-flex;
    align-items: center;
    min-height: 22px;
    padding: 0 8px;
    border-radius: 6px;
    background: linear-gradient(135deg, #6d49ff, #5b3df5);
    color: white;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.02em;
  }

  .desktop-pro-pill.muted {
    background: rgba(109, 73, 255, 0.10);
    color: #6d49ff;
  }

  .desktop-customization-grid {
    grid-template-columns: 1fr 1fr;
  }

  .desktop-cover-card {
    position: relative;
    min-height: 90px;
    border-radius: 16px;
    background: linear-gradient(135deg, rgba(109, 73, 255, 0.10), rgba(91, 61, 245, 0.06));
    border: 1px dashed rgba(109, 73, 255, 0.20);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  .desktop-cover-card .ghost.overlay {
    position: relative;
  }

  .desktop-cover-shape {
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse at top left, rgba(109,73,255,0.15), transparent 60%);
  }

  .desktop-photo-chip {
    width: 44px;
    height: 44px;
    border-radius: 999px;
    overflow: hidden;
    border: 2px solid rgba(109, 73, 255, 0.15);
  }

  .desktop-photo-chip > div,
  .desktop-photo-chip img {
    width: 100% !important;
    height: 100% !important;
  }

  .desktop-color-swatch {
    width: 28px;
    height: 28px;
    border-radius: 8px;
    border: 2px solid transparent;
    padding: 0;
    cursor: pointer;
    background: transparent;
  }

  .desktop-color-swatch.active {
    box-shadow: 0 0 0 3px rgba(109, 73, 255, 0.30);
  }

  .desktop-inline-toggle-row {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }

  .desktop-link-field {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 6px;
    border-radius: 16px;
    background: #f7f5ff;
    border: 1px solid rgba(109, 73, 255, 0.10);
    margin-bottom: 4px;
  }

  .desktop-link-field span {
    flex: 1;
    min-width: 0;
    padding-left: 10px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: #6d49ff;
    font-weight: 700;
    font-size: 14px;
  }

  .desktop-link-field button {
    display: inline-flex;
    align-items: center;
    min-height: 38px;
    padding: 0 14px;
    border-radius: 12px;
    border: none;
    background: #6d49ff;
    color: white;
    font: inherit;
    font-weight: 700;
    cursor: pointer;
  }

  .desktop-settings-footer {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-top: 4px;
  }

  .desktop-save-button {
    min-height: 48px;
    padding: 0 24px;
    border-radius: 14px;
    border: none;
    background: linear-gradient(135deg, #6d49ff 0%, #5b3df5 100%);
    color: white;
    font: inherit;
    font-weight: 700;
    font-size: 15px;
    cursor: pointer;
    box-shadow: 0 8px 24px rgba(91, 61, 245, 0.25);
  }

  .desktop-save-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .desktop-autosave-note {
    font-size: 13px;
    font-weight: 600;
    color: #16a34a;
  }

  /* Right preview panel */
  .dts-preview-panel {
    border-left: 1px solid rgba(109, 73, 255, 0.08);
    padding: 20px 16px;
    display: flex;
    flex-direction: column;
    gap: 14px;
    background: #faf9ff;
    min-height: calc(100vh - 66px);
  }

  .dts-preview-panel-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .dts-preview-panel-head > span {
    font-size: 13px;
    font-weight: 700;
    color: #17224d;
  }

  .dts-device-toggle {
    display: flex;
    gap: 2px;
    background: rgba(109, 73, 255, 0.07);
    border-radius: 10px;
    padding: 3px;
  }

  .dts-device-toggle button {
    width: 30px;
    height: 26px;
    border: none;
    border-radius: 8px;
    background: transparent;
    color: #7a8199;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .dts-device-toggle button.active {
    background: white;
    color: #6d49ff;
    box-shadow: 0 1px 4px rgba(0,0,0,0.08);
  }

  .dts-preview-mini {
    background: white;
    border: 1px solid rgba(109, 73, 255, 0.10);
    border-radius: 18px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    gap: 0;
    box-shadow: 0 4px 20px rgba(21, 28, 59, 0.06);
  }

  .dts-preview-mini-banner {
    height: 72px;
    background: linear-gradient(135deg, rgba(109,73,255,0.25) 0%, rgba(91,61,245,0.12) 100%);
  }

  .dts-preview-mini-avatar {
    width: 52px;
    height: 52px;
    border-radius: 999px;
    overflow: hidden;
    border: 3px solid white;
    margin: -26px auto 0;
    box-shadow: 0 2px 8px rgba(0,0,0,0.12);
    background: white;
  }

  .dts-preview-mini-avatar > div,
  .dts-preview-mini-avatar img {
    width: 100% !important;
    height: 100% !important;
    border-radius: 999px !important;
  }

  .dts-preview-name {
    display: block;
    text-align: center;
    font-size: 14px;
    font-weight: 700;
    margin: 8px 12px 0;
  }

  .dts-preview-bio {
    margin: 4px 12px 0;
    font-size: 11px;
    color: #7a8199;
    text-align: center;
    line-height: 1.4;
  }

  .dts-preview-meta {
    display: flex;
    flex-direction: column;
    gap: 3px;
    padding: 8px 12px;
  }

  .dts-preview-meta span {
    font-size: 11px;
    color: #7a8199;
  }

  .dts-preview-book-section {
    padding: 10px 12px;
    border-top: 1px solid rgba(109, 73, 255, 0.07);
  }

  .dts-preview-book-section > strong {
    display: block;
    font-size: 12px;
    font-weight: 700;
    margin-bottom: 8px;
    color: #17224d;
  }

  .dts-preview-date-row {
    display: flex;
    gap: 4px;
    margin-bottom: 10px;
    overflow: hidden;
  }

  .dts-mini-date {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    flex: 1;
    min-width: 0;
    padding: 5px 2px;
    border-radius: 8px;
  }

  .dts-mini-date span {
    font-size: 9px;
    font-weight: 700;
    color: #99a0bb;
    letter-spacing: 0.04em;
  }

  .dts-mini-date strong {
    font-size: 12px;
    font-weight: 700;
    color: #17224d;
  }

  .dts-mini-date.active {
    background: #6d49ff;
  }

  .dts-mini-date.active span,
  .dts-mini-date.active strong {
    color: white;
  }

  .dts-preview-slots {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 5px;
  }

  .dts-preview-slots span {
    display: block;
    background: #f5f5fb;
    border: 1px solid rgba(109, 73, 255, 0.10);
    border-radius: 8px;
    padding: 6px 0;
    font-size: 11px;
    font-weight: 600;
    color: #17224d;
    text-align: center;
  }

  .dts-preview-more {
    grid-column: 1 / -1;
    display: block;
    text-align: center;
    font-size: 11px;
    color: #6d49ff;
    font-weight: 700;
    text-decoration: none;
    padding: 4px 0;
  }

  .dts-preview-powered {
    padding: 8px 12px 12px;
    text-align: center;
    font-size: 11px;
    color: #99a0bb;
  }

  .dts-help-cta {
    background: white;
    border: 1px solid rgba(109, 73, 255, 0.10);
    border-radius: 16px;
    padding: 14px;
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }

  .dts-help-cta-icon {
    font-size: 20px;
    color: #6d49ff;
    flex-shrink: 0;
  }

  .dts-help-cta strong {
    display: block;
    font-size: 12.5px;
    font-weight: 700;
  }

  .dts-help-cta p {
    margin: 0;
    font-size: 11.5px;
    color: #7a8199;
    line-height: 1.3;
  }

  .dts-help-cta > div {
    flex: 1;
    min-width: 0;
  }

  /* Hero live chip */
  .desktop-settings-hero {
    padding: 20px 24px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .desktop-settings-hero h1 {
    margin: 0 0 6px;
    font-size: 22px;
    font-weight: 700;
    letter-spacing: -0.03em;
  }

  .desktop-settings-hero p {
    margin: 0;
    color: #7a8199;
    line-height: 1.5;
    font-size: 13px;
  }

  .desktop-live-chip-row {
    display: flex;
    align-items: center;
    gap: 10px;
    background: #f7f5ff;
    border: 1px solid rgba(109, 73, 255, 0.10);
    border-radius: 14px;
    padding: 10px 14px;
  }

  .desktop-live-dot {
    color: #16a34a;
    font-size: 12px;
    font-weight: 700;
    white-space: nowrap;
  }

  .desktop-live-url {
    color: #6d49ff;
    font-size: 14px;
    font-weight: 700;
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    text-decoration: none;
  }

  .desktop-live-chip-row button {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    min-height: 34px;
    padding: 0 12px;
    border-radius: 10px;
    border: 1px solid rgba(109, 73, 255, 0.15);
    background: white;
    color: #5f6783;
    font: inherit;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
  }
`;
