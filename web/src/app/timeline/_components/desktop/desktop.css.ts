export const desktopTimelineCss = `
  .desktop-timeline-page {
    min-height: 100vh;
    background: linear-gradient(180deg, #F7F1E8 0%, #F5EDE2 42%, #F8F3EB 100%);
    color: #080f2d;
    display: grid;
    grid-template-columns: 220px minmax(0, 1fr);
    font-family: Inter, "Segoe UI", -apple-system, BlinkMacSystemFont, sans-serif;
  }

  .desktop-app-sidebar {
    border-right: 1px solid rgba(231,222,208,0.90);
    background: rgba(252,249,244,0.99);
    padding: 28px 16px 22px;
    display: flex;
    flex-direction: column;
    gap: 0;
    position: sticky;
    top: 0;
    height: 100vh;
    overflow-y: auto;
  }

  .desktop-app-brand-wrap { padding: 0 8px 34px; }
  .desktop-sidebar-group { display: grid; gap: 8px; padding-bottom: 26px; border-bottom: 1px solid rgba(231,222,208,0.70); }
  .desktop-sidebar-section { padding-top: 26px; display: grid; gap: 8px; }
  .desktop-sidebar-heading { font-size: 11px; font-weight: 700; color: #6c7593; text-transform: uppercase; letter-spacing: 0.08em; padding: 0 12px 6px; }
  .desktop-sidebar-footer { margin-top: auto; padding-top: 26px; display: grid; gap: 8px; }

  .desktop-sidebar-nav,
  .desktop-sidebar-link {
    min-height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 0 14px;
    border: none;
    background: transparent;
    color: #0e1737;
    font: inherit;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    width: 100%;
    text-align: left;
  }

  .desktop-sidebar-link { cursor: pointer; }
  .desktop-sidebar-nav:hover,
  .desktop-sidebar-link:hover { background: rgba(231,222,208,0.38); }
  .desktop-sidebar-nav.active,
  .desktop-sidebar-link.active { background: linear-gradient(135deg, rgba(79,70,229,0.10), rgba(99,102,241,0.06)); color: #4F46E5; }
  .desktop-sidebar-nav.compact { min-height: 42px; color: #17224d; font-size: 14px; }
  .desktop-sidebar-nav-icon,
  .desktop-sidebar-mini-icon { width: 20px; flex-shrink: 0; display: inline-flex; justify-content: center; color: currentColor; }
  .desktop-sidebar-badge,
  .desktop-sidebar-count { margin-left: auto; min-width: 26px; height: 26px; border-radius: 999px; background: #f0f2f7; color: #17224d; display: inline-flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; }
  .desktop-sidebar-nav.active .desktop-sidebar-badge { background: #ffffff; color: #4F46E5; }

  .desktop-link-card,
  .desktop-usage-card {
    position: relative;
    margin-top: 18px;
    border: 1px solid #e7ddff;
    border-radius: 14px;
    background: linear-gradient(135deg, #fbf9ff, #f5f0ff);
    padding: 16px;
    display: grid;
    gap: 10px;
    color: #4F46E5;
  }

  .desktop-link-card span,
  .desktop-usage-card span { font-size: 13px; color: #4F46E5; }
  .desktop-link-card strong,
  .desktop-usage-card strong { font-size: 13px; color: #17224d; font-weight: 600; }
  .desktop-link-card svg { position: absolute; right: 14px; bottom: 15px; }
  .desktop-usage-card { background: #ffffff; border-color: #e8ebf4; color: #17224d; }
  .desktop-usage-track { height: 8px; border-radius: 999px; background: #f1eef9; overflow: hidden; }
  .desktop-usage-track span { display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg, #4F46E5, #8b5cf6); }

  .desktop-app-main { min-width: 0; display: grid; grid-template-rows: 92px auto minmax(0, 1fr); }
  .desktop-app-topbar { border-bottom: 1px solid rgba(231,222,208,0.80); background: rgba(252,249,244,0.94); backdrop-filter: blur(18px); display: grid; grid-template-columns: minmax(260px, 396px) auto auto; align-items: center; gap: 28px; padding: 0 28px; }
  .desktop-topbar-right,
  .desktop-search-left { display: flex; align-items: center; }
  .desktop-topbar-right { justify-content: flex-end; gap: 18px; margin-left: auto; }

  .desktop-range-menu-wrap { position: relative; z-index: 20; display: flex; align-items: center; justify-content: center; }
  .desktop-range-pill { min-height: 46px; padding: 0 16px; border: 1px solid rgba(231,222,208,0.98); background: rgba(252,249,244,0.98); border-radius: 13px; display: inline-flex; align-items: center; gap: 10px; font: inherit; font-size: 15px; font-weight: 600; color: #262B37; cursor: pointer; white-space: nowrap; box-shadow: 0 8px 20px rgba(53,39,25,0.06); backdrop-filter: blur(12px); }
  .desktop-range-pill:hover { background: rgba(248,243,236,0.99); }
  .desktop-range-menu { position: absolute; top: calc(100% + 10px); left: 50%; transform: translateX(-50%); min-width: 280px; padding: 8px; border-radius: 18px; background: rgba(255,250,244,0.99); border: 1px solid rgba(231,223,211,0.96); box-shadow: 0 20px 48px rgba(53,39,25,0.12); backdrop-filter: blur(22px); }
  .desktop-range-item { width: 100%; min-height: 46px; padding: 8px 14px; border-radius: 12px; border: none; background: transparent; color: #22273A; display: grid; justify-items: start; gap: 2px; font: inherit; font-size: 13px; font-weight: 750; cursor: pointer; text-align: left; }
  .desktop-range-item small { color: #7C6F63; font-size: 11px; font-weight: 600; }
  .desktop-range-item:hover { background: rgba(231,222,208,0.30); }
  .desktop-range-item.active { background: linear-gradient(135deg, rgba(79,70,229,0.10), rgba(99,102,241,0.06)); color: #4F46E5; }

  .desktop-section-block { margin-bottom: 4px; }
  .desktop-section-head { padding: 14px 0 8px; font-size: 11px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; display: flex; align-items: center; gap: 8px; }

  .desktop-search-button { height: 56px; min-width: 0; width: 100%; border: 1px solid rgba(231,222,208,0.98); background: rgba(252,249,244,0.98); color: #6A6159; border-radius: 13px; display: inline-flex; align-items: center; gap: 12px; font: inherit; font-size: 14px; cursor: pointer; padding: 0 14px 0 18px; box-shadow: 0 16px 45px rgba(18, 26, 61, 0.03); }
  .desktop-search-left { gap: 12px; flex: 1; min-width: 0; }
  .desktop-search-left span:last-child { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .desktop-keycap { min-width: 42px; height: 30px; border-radius: 8px; background: #f1f3f8; color: #56617f; font-size: 13px; display: inline-flex; align-items: center; justify-content: center; }
  .desktop-square-button { width: 48px; height: 48px; padding: 0; border: 1px solid rgba(231,222,208,0.90); background: rgba(252,249,244,0.98); color: #182344; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; font: inherit; font-size: 28px; line-height: 1; cursor: pointer; box-shadow: 0 14px 36px rgba(18,26,61,0.03); }
  .desktop-square-button:disabled { opacity: 0.45; cursor: default; }
  .desktop-square-button.icon-only { width: 44px; height: 44px; font-size: 15px; }
  .desktop-bell-button { position: relative; width: 42px; height: 42px; border: none; background: transparent; color: #17224d; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; }
  .desktop-bell-button span { position: absolute; right: 4px; top: 2px; min-width: 18px; height: 18px; border-radius: 999px; background: #4F46E5; color: #ffffff; font-size: 11px; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; }
  .desktop-user-button { border: none; background: transparent; color: #17224d; display: inline-flex; align-items: center; gap: 10px; cursor: pointer; }
  .desktop-user-button > div { width: 48px !important; height: 48px !important; }

  .desktop-page-intro { display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; padding: 32px 34px 14px; }
  .desktop-page-intro-copy { min-width: 0; }
  .desktop-page-intro h1 { margin: 0 0 8px; font-size: 26px; line-height: 1.1; font-weight: 850; letter-spacing: 0; color: #080f2d; }
  .desktop-page-intro p { margin: 0; color: #53617f; font-size: 15px; line-height: 1.5; }
  .desktop-page-intro-actions { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }

  .desktop-content-grid { display: grid; grid-template-columns: minmax(560px, 1fr) 460px; align-items: stretch; min-height: 0; }
  .desktop-timeline-board { position: relative; padding: 12px 32px 34px; border-right: 1px solid #e8ebf4; min-width: 0; display: flex; flex-direction: column; }
  .desktop-detail-panel { background: rgba(253,250,245,0.98); padding: 26px; display: flex; flex-direction: column; gap: 16px; min-width: 0; }

  .desktop-board-head { display: flex; align-items: center; justify-content: flex-end; gap: 20px; margin-bottom: 18px; }
  .desktop-board-actions { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
  .desktop-filter-chip,
  .desktop-filter-button { height: 38px; padding: 0 16px; border: 1px solid rgba(231,222,208,0.98); background: rgba(252,249,244,0.98); color: #17224d; border-radius: 10px; display: inline-flex; align-items: center; gap: 8px; font: inherit; font-size: 13px; font-weight: 600; cursor: pointer; }
  .desktop-filter-chip.active { background: #f3efff; border-color: #e4d8ff; color: #4F46E5; }
  .desktop-filter-button { margin-left: auto; }

  .desktop-timeline-list { position: relative; flex: 1; min-height: 0; display: flex; flex-direction: column; gap: 0; padding: 0; }
  .desktop-timeline-row { display: grid; grid-template-columns: 96px minmax(0, 1fr); gap: 18px; align-items: stretch; }
  .desktop-timeline-row.removing { opacity: 0; transform: translateX(12px); transition: opacity 0.25s ease, transform 0.25s ease; }
  .desktop-rail-column { position: relative; padding-top: 21px; text-align: left; }
  .desktop-rail-column::after { content: ""; position: absolute; right: 8px; top: 0; bottom: -1px; width: 1px; background: rgba(190,119,22,0.28); }
  .desktop-timeline-row:last-of-type .desktop-rail-column::after { bottom: 22px; }
  .desktop-rail-time { font-size: 16px; font-weight: 800; line-height: 1; color: #080f2d; }
  .desktop-rail-duration { margin-top: 10px; color: #53617f; font-size: 13px; text-align: center; width: 58px; }
  .desktop-rail-dot { position: absolute; right: 3px; top: 25px; width: 11px; height: 11px; border-radius: 999px; border: 2px solid #ffffff; box-shadow: 0 0 0 1px rgba(18,26,61,0.06); z-index: 1; }
  .desktop-rail-dot.active { box-shadow: 0 0 0 4px rgba(100,38,255,0.15); }

  .desktop-toat-card { min-width: 0; min-height: 74px; border: 1px solid rgba(231,222,208,0.98); border-radius: 14px; background: linear-gradient(180deg, rgba(254,251,246,0.98), rgba(248,241,232,0.96)); padding: 14px 18px; display: grid; grid-template-columns: 50px minmax(0, 1fr) auto; gap: 16px; align-items: center; text-align: left; cursor: pointer; transition: border-color 0.15s, box-shadow 0.15s, background 0.15s; margin-bottom: -1px; }
  .desktop-toat-card:hover { border-color: rgba(200,185,165,0.90); box-shadow: 0 18px 42px rgba(53,39,25,0.09); z-index: 2; }
  .desktop-toat-card.active { border-color: rgba(79,70,229,0.28); background: linear-gradient(135deg, rgba(79,70,229,0.06), rgba(248,241,232,0.80)); box-shadow: 0 18px 48px rgba(53,39,25,0.10); z-index: 3; }
  .desktop-toat-icon { width: 50px; height: 50px; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 12px 25px rgba(18,26,61,0.10); }
  .desktop-toat-copy { min-width: 0; display: grid; gap: 6px; }
  .desktop-toat-copy strong { font-size: 15px; font-weight: 800; letter-spacing: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #080f2d; }
  .desktop-toat-copy span { color: #53617f; font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .desktop-toat-tags { display: flex; align-items: center; justify-content: flex-end; gap: 10px; flex-wrap: wrap; }
  .desktop-toat-chip { min-height: 30px; border-radius: 9px; padding: 0 13px; display: inline-flex; align-items: center; justify-content: center; background: #f3efff; border: 1px solid #e7ddff; color: #4F46E5; font-size: 12px; font-weight: 700; white-space: nowrap; }
  .desktop-toat-chip.action { background: #fff4ec; border-color: #ffd8bd; color: #f05a16; }
  .desktop-toat-chip.plain { background: #effaf3; border-color: #d9f2df; color: #15843d; }

  .desktop-end-card { margin: auto 190px 0 0; min-height: 100px; border: 1px solid #ece2ff; border-radius: 18px; background: radial-gradient(circle at 76% 63%, rgba(245,158,11,0.42), transparent 13%), linear-gradient(135deg, #ffffff, #fbf7ff 62%, #fff1ea); box-shadow: 0 20px 52px rgba(18,26,61,0.06); display: grid; grid-template-columns: 52px minmax(0, 1fr) 170px; align-items: center; gap: 18px; padding: 20px 24px; overflow: hidden; }
  .desktop-end-icon { width: 48px; height: 48px; border-radius: 999px; background: #ffffff; color: #4F46E5; display: inline-flex; align-items: center; justify-content: center; box-shadow: 0 14px 32px rgba(100,38,255,0.12); }
  .desktop-end-card h2 { margin: 0 0 8px; font-size: 17px; color: #080f2d; }
  .desktop-end-card p { margin: 0; color: #53617f; font-size: 14px; }
  .desktop-end-art { position: relative; height: 74px; }
  .desktop-end-art::before { content: ""; position: absolute; right: 40px; bottom: 8px; width: 58px; height: 58px; border-radius: 999px; background: linear-gradient(135deg, #ffd36d, #ff4e86); }
  .desktop-end-art span { position: absolute; right: -24px; bottom: 3px; width: 170px; height: 26px; border-radius: 50%; background: linear-gradient(90deg, rgba(124,58,237,0.13), rgba(236,72,153,0.2)); transform: rotate(-4deg); }

  .desktop-floating-capture { position: absolute; right: 32px; bottom: 36px; width: 156px; border-radius: 999px; background: rgba(252,249,244,0.98); border: 1px solid rgba(231,222,208,0.90); box-shadow: 0 22px 56px rgba(18,26,61,0.15); display: flex; align-items: center; justify-content: space-between; padding: 8px; z-index: 5; }
  .desktop-keyboard-capture { width: 54px; height: 54px; border-radius: 999px; border: none; background: #f5f2ff; color: #4F46E5; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; }
  .desktop-mic-capture { width: 62px; height: 62px; border-radius: 999px; border: none; background: radial-gradient(circle at 30% 20%, #fde68a 0%, rgba(253,230,138,0.45) 22%, transparent 42%), linear-gradient(135deg, #4F46E5 0%, #8b5cf6 42%, #ec4899 74%, #fb7185 100%); color: #ffffff; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 12px 28px rgba(236,72,153,0.28); }

  .desktop-detail-hero,
  .desktop-action-row,
  .desktop-detail-card,
  .desktop-file-card { border: 1px solid rgba(231,222,208,0.90); border-radius: 18px; background: linear-gradient(180deg, rgba(254,251,246,0.98), rgba(248,241,232,0.92)); box-shadow: 0 12px 35px rgba(53,39,25,0.06); }
  .desktop-detail-hero { position: relative; min-height: 174px; padding: 22px 22px 18px; display: grid; grid-template-columns: 56px minmax(0, 1fr); gap: 16px; align-items: start; overflow: hidden; }
  .desktop-detail-more { position: absolute; right: 18px; top: 18px; width: 36px; height: 36px; border-radius: 10px; border: none; background: rgba(255,255,255,0.72); color: #17224d; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; }
  .desktop-detail-icon { width: 56px; height: 56px; border-radius: 13px; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 14px 32px rgba(18,26,61,0.14); }
  .desktop-detail-hero-copy { display: grid; gap: 12px; padding-right: 34px; }
  .desktop-detail-hero-copy h2 { margin: 0; font-size: 21px; line-height: 1.2; color: #080f2d; letter-spacing: 0; }
  .desktop-detail-hero-copy p { margin: 0; color: #53617f; font-size: 14px; }
  .desktop-detail-time-pill { width: fit-content; min-height: 32px; padding: 0 12px; border-radius: 10px; background: rgba(255,255,255,0.86); border: 1px solid rgba(100,38,255,0.08); color: #17224d; display: inline-flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; }
  .desktop-detail-primary { grid-column: 2; justify-self: end; align-self: end; min-height: 42px; padding: 0 20px; border-radius: 10px; color: #ffffff; text-decoration: none; background: linear-gradient(135deg, #4F46E5, #7c3aed); display: inline-flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 800; box-shadow: 0 14px 30px rgba(100,38,255,0.22); }
  .desktop-action-row { padding: 12px; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; }
  .desktop-quick-action { border: none; background: transparent; min-width: 0; min-height: 72px; border-radius: 14px; color: #53617f; font: inherit; font-size: 12px; font-weight: 700; display: grid; place-items: center; gap: 7px; cursor: pointer; }
  .desktop-quick-action span { width: 36px; height: 36px; border-radius: 10px; display: inline-flex; align-items: center; justify-content: center; }
  .desktop-quick-action.done { color: #16a34a; }
  .desktop-quick-action.done span { background: #eaf9ef; }
  .desktop-quick-action.delay { color: #2563eb; }
  .desktop-quick-action.delay span { background: #eef5ff; }
  .desktop-quick-action.schedule { color: #4F46E5; }
  .desktop-quick-action.schedule span { background: #f2edff; }
  .desktop-quick-action.copy span { background: #f3f5f9; }
  .desktop-quick-action:disabled { opacity: 0.5; cursor: default; }

  .desktop-detail-card { padding: 18px; display: grid; gap: 15px; }
  .desktop-detail-card h3 { margin: 0; font-size: 15px; font-weight: 800; color: #080f2d; }
  .desktop-detail-card p { margin: 0; color: #17224d; font-size: 13px; line-height: 1.55; }
  .desktop-field-row { display: grid; grid-template-columns: 88px minmax(0, 1fr) auto; gap: 12px; align-items: center; font-size: 13px; }
  .desktop-field-row span { color: #53617f; }
  .desktop-field-row strong { color: #17224d; font-size: 13px; font-weight: 600; min-width: 0; }
  .desktop-field-row strong i { display: inline-block; width: 10px; height: 10px; border-radius: 999px; margin-right: 8px; background: #4F46E5; }
  .desktop-field-row button,
  .desktop-field-row a,
  .desktop-ping-card button { border: none; background: transparent; color: #4F46E5; font: inherit; font-size: 13px; font-weight: 700; text-decoration: none; display: inline-flex; align-items: center; gap: 5px; cursor: pointer; }
  .desktop-people-card { gap: 13px; }
  .desktop-people-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  .desktop-avatar-stack { display: flex; align-items: center; }
  .desktop-avatar-stack span { width: 38px; height: 38px; border-radius: 999px; border: 2px solid rgba(253,250,245,0.98); margin-left: -8px; background: linear-gradient(135deg, #f5ede2, #fdf8f2); color: #17224d; display: inline-flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 800; box-shadow: 0 8px 20px rgba(18,26,61,0.08); }
  .desktop-avatar-stack span:first-child { margin-left: 0; }
  .desktop-people-row strong { color: #17224d; font-size: 13px; }
  .desktop-stat-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
  .desktop-stat-grid div { display: grid; gap: 5px; }
  .desktop-stat-grid strong { font-size: 13px; color: #080f2d; }
  .desktop-stat-grid span { font-size: 12px; color: #53617f; }
  .desktop-list-preview { display: grid; gap: 8px; }
  .desktop-list-preview p { padding-left: 16px; position: relative; }
  .desktop-list-preview p::before { content: ""; position: absolute; left: 0; top: 8px; width: 6px; height: 6px; border-radius: 999px; background: #22c55e; }
  .desktop-file-card { min-height: 78px; padding: 16px; display: grid; grid-template-columns: 46px minmax(0, 1fr) 28px 28px; align-items: center; gap: 12px; }
  .desktop-file-icon { width: 46px; height: 46px; border-radius: 12px; color: #ffffff; background: linear-gradient(135deg, #3b82f6, #2563eb); display: inline-flex; align-items: center; justify-content: center; }
  .desktop-file-card strong { display: block; color: #17224d; font-size: 13px; margin-bottom: 5px; }
  .desktop-file-card span { color: #53617f; font-size: 12px; }
  .desktop-file-card button { border: none; background: transparent; color: #53617f; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; }
  .desktop-ping-card { display: flex; align-items: center; justify-content: space-between; }
  .desktop-ping-card > div { display: flex; align-items: center; gap: 12px; color: #4F46E5; }
  .desktop-ping-card h3 { margin-bottom: 6px; }
  .desktop-detail-archive { height: 40px; border-radius: 12px; border: 1px solid #f4d3d3; color: #dc2626; background: #fff8f8; font: inherit; font-size: 13px; font-weight: 700; cursor: pointer; }
  .desktop-detail-archive:disabled { opacity: 0.5; cursor: default; }

  .desktop-capture-overlay {
    position: fixed;
    inset: 0;
    z-index: 60;
    display: grid;
    place-items: center;
    padding: 28px;
    background: rgba(244, 247, 252, 0.62);
    backdrop-filter: blur(10px) saturate(0.72);
  }

  .desktop-capture-modal {
    width: min(478px, calc(100vw - 44px));
    max-height: calc(100vh - 44px);
    overflow-y: auto;
    border-radius: 24px;
    background: rgba(255, 255, 255, 0.98);
    border: 1px solid rgba(232, 235, 244, 0.9);
    box-shadow: 0 34px 95px rgba(18, 26, 61, 0.22);
    padding: 34px 36px 32px;
    color: #080f2d;
  }

  .desktop-capture-modal.type-mode {
    width: min(520px, calc(100vw - 44px));
  }

  .desktop-capture-modal.review-mode {
    position: relative;
    width: min(940px, calc(100vw - 44px));
    padding: 0;
    background: transparent;
    border: none;
    box-shadow: none;
  }

  .desktop-capture-close.review-close {
    position: absolute;
    right: 18px;
    top: 18px;
    z-index: 2;
    width: 40px;
    height: 40px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.92);
    border: 1px solid rgba(121, 130, 159, 0.18);
    color: #171336;
    font-size: 24px;
    font-weight: 300;
  }

  .desktop-capture-sr-title {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  .desktop-capture-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 22px;
    margin-bottom: 24px;
  }

  .desktop-capture-header h2 {
    margin: 0 0 12px;
    font-size: 25px;
    font-weight: 850;
    line-height: 1.05;
    letter-spacing: 0;
  }

  .desktop-capture-header p {
    margin: 0;
    color: #53617f;
    font-size: 15px;
    line-height: 1.48;
  }

  .desktop-capture-close {
    width: 36px;
    height: 36px;
    border-radius: 999px;
    border: 1px solid #e8ebf4;
    background: #ffffff;
    color: #17224d;
    font: inherit;
    font-size: 27px;
    line-height: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 10px 25px rgba(18, 26, 61, 0.04);
  }

  .desktop-capture-listening {
    display: grid;
    justify-items: center;
    gap: 10px;
    margin-bottom: 20px;
  }

  .desktop-capture-status-row {
    display: inline-flex;
    align-items: center;
    gap: 9px;
    color: #4F46E5;
    font-size: 14px;
    font-weight: 750;
  }

  .desktop-capture-status-wave {
    height: 20px;
    display: inline-flex;
    align-items: center;
    gap: 2px;
  }

  .desktop-capture-status-wave i {
    display: block;
    width: 2px;
    height: 12px;
    border-radius: 99px;
    background: currentColor;
  }

  .desktop-capture-status-wave i:nth-child(2) { height: 18px; }
  .desktop-capture-status-wave i:nth-child(3) { height: 9px; }
  .desktop-capture-status-wave i:nth-child(4) { height: 14px; }

  .desktop-capture-visual-wrap {
    position: relative;
    width: 100%;
    min-height: 246px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .desktop-capture-visualizer {
    position: relative;
    width: 184px;
    height: 184px;
    border-radius: 999px;
    display: grid;
    place-items: center;
  }

  .desktop-capture-ring {
    position: absolute;
    inset: 0;
    border-radius: 999px;
    pointer-events: none;
  }

  .desktop-capture-ring.one {
    background: conic-gradient(from 180deg, #4F46E5, #8b5cf6, #ec4899, #ff6b4a, #4F46E5);
    box-shadow: 0 18px 42px rgba(100, 38, 255, 0.12), 0 20px 58px rgba(236, 72, 153, 0.16);
  }

  .desktop-capture-ring.two {
    inset: 7px;
    background: #ffffff;
  }

  .desktop-capture-ring.three {
    inset: -48px;
    border: 1px dotted rgba(100, 38, 255, 0.12);
    box-shadow:
      0 0 0 26px rgba(100, 38, 255, 0.025),
      0 0 0 52px rgba(245, 158, 11, 0.025),
      0 0 0 78px rgba(236, 72, 153, 0.018);
  }

  .desktop-capture-core {
    position: relative;
    z-index: 2;
    width: 166px;
    height: 166px;
    border-radius: 999px;
    background: radial-gradient(circle, #ffffff 0%, #fbfbff 72%, #f6f7fb 100%);
    display: grid;
    place-items: center;
    box-shadow: inset 0 0 22px rgba(18, 26, 61, 0.045);
  }

  .desktop-capture-visual-bars {
    height: 86px;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .desktop-capture-visual-bars span {
    width: 7px;
    border-radius: 999px;
    background: linear-gradient(180deg, #4F46E5, #ec4899, #ff5f57);
    animation: desktopCaptureBars 1.12s ease-in-out infinite;
  }

  .desktop-capture-visual-bars span:nth-child(2n) { animation-delay: -0.18s; }
  .desktop-capture-visual-bars span:nth-child(3n) { animation-delay: -0.34s; }

  .desktop-capture-side-wave {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .desktop-capture-side-wave.left { left: 0; color: #8b5cf6; }
  .desktop-capture-side-wave.right { right: 0; color: #ff6b4a; }

  .desktop-capture-side-wave span {
    width: 2px;
    border-radius: 99px;
    background: currentColor;
    opacity: 0.85;
    animation: desktopSideWave 1.4s ease-in-out infinite;
  }

  .desktop-capture-side-wave span:nth-child(2n) { animation-delay: -0.2s; }
  .desktop-capture-side-wave span:nth-child(3n) { animation-delay: -0.38s; }

  .desktop-capture-timer {
    color: #4F46E5;
    font-size: 16px;
    font-weight: 850;
    font-variant-numeric: tabular-nums;
  }

  .desktop-transcript-card {
    border: 1px solid #e3e7f1;
    border-radius: 18px;
    background: linear-gradient(180deg, #ffffff, #fdfdff);
    padding: 17px 19px;
    box-shadow: 0 16px 42px rgba(18, 26, 61, 0.04);
    margin-bottom: 12px;
  }

  .desktop-transcript-label {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #4F46E5;
    font-size: 12px;
    font-weight: 800;
    margin-bottom: 10px;
  }

  .desktop-transcript-label span {
    width: 7px;
    height: 7px;
    border-radius: 99px;
    background: #4F46E5;
    box-shadow: 0 0 0 4px rgba(100, 38, 255, 0.12);
  }

  .desktop-transcript-card p {
    margin: 0;
    color: #080f2d;
    font-size: 16px;
    line-height: 1.45;
    font-weight: 520;
  }

  .desktop-type-capture-card {
    border: 1px solid #e3e7f1;
    border-radius: 20px;
    background: linear-gradient(180deg, #ffffff, #fdfdff);
    padding: 18px;
    box-shadow: 0 16px 42px rgba(18, 26, 61, 0.04);
    margin-bottom: 14px;
    display: grid;
    gap: 12px;
  }

  .desktop-type-capture-card > span {
    color: #4F46E5;
    font-size: 12px;
    font-weight: 850;
    text-transform: uppercase;
    letter-spacing: 0.07em;
  }

  .desktop-type-capture-card > strong {
    color: #dc2626;
    font-size: 13px;
    line-height: 1.45;
  }

  .desktop-type-capture-card textarea {
    width: 100%;
    min-height: 190px;
    resize: vertical;
    border: 1px solid #e5e8f2;
    border-radius: 16px;
    background: #fbfcff;
    color: #080f2d;
    font: inherit;
    font-size: 15px;
    line-height: 1.55;
    padding: 16px;
    outline: none;
  }

  .desktop-type-capture-card textarea:focus {
    border-color: #cfc4ff;
    box-shadow: 0 0 0 4px rgba(100, 38, 255, 0.08);
  }

  .desktop-type-capture-card textarea:disabled {
    opacity: 0.62;
    cursor: wait;
  }

  .desktop-privacy-pill {
    width: fit-content;
    min-height: 28px;
    margin: 0 auto 15px;
    padding: 0 13px;
    border-radius: 999px;
    background: #f1ebff;
    color: #4F46E5;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    font-size: 12px;
    font-weight: 750;
  }

  .desktop-capture-tip {
    border: 1px solid #ede8fb;
    border-radius: 16px;
    background: #fbf9ff;
    padding: 13px 15px;
    display: flex;
    align-items: flex-start;
    gap: 11px;
    color: #4F46E5;
    margin-bottom: 22px;
  }

  .desktop-capture-tip > span {
    width: 32px;
    height: 32px;
    border-radius: 10px;
    background: #f1ebff;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .desktop-capture-tip strong {
    display: block;
    color: #17224d;
    font-size: 13px;
    margin-bottom: 3px;
  }

  .desktop-capture-tip p {
    margin: 0;
    color: #53617f;
    font-size: 13px;
  }

  .desktop-capture-actions {
    display: grid;
    grid-template-columns: 1fr 82px 1fr;
    align-items: center;
    gap: 24px;
  }

  .desktop-capture-secondary {
    min-height: 42px;
    border-radius: 11px;
    border: 1px solid #dfe4ef;
    background: #ffffff;
    color: #17224d;
    font: inherit;
    font-size: 13px;
    font-weight: 750;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 9px;
    cursor: pointer;
  }

  .desktop-capture-live-mic {
    position: relative;
    width: 82px;
    height: 82px;
    border-radius: 999px;
    border: 4px solid #ffffff;
    background: radial-gradient(circle at 32% 20%, #fde68a 0%, rgba(253, 230, 138, 0.45) 22%, transparent 42%), linear-gradient(135deg, #4F46E5 0%, #8b5cf6 36%, #ec4899 68%, #ff5f57 100%);
    color: #ffffff;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 0 0 6px rgba(100, 38, 255, 0.08), 0 20px 45px rgba(236, 72, 153, 0.34);
    animation: desktopLiveMic 1.55s ease-in-out infinite;
  }

  .desktop-capture-live-mic:disabled {
    opacity: 0.58;
    cursor: wait;
    animation: none;
  }

  .desktop-capture-primary-wide {
    min-height: 50px;
    border-radius: 14px;
    border: none;
    background: linear-gradient(135deg, #4F46E5, #8b5cf6 56%, #ec4899);
    color: #ffffff;
    font: inherit;
    font-size: 14px;
    font-weight: 850;
    cursor: pointer;
    box-shadow: 0 16px 36px rgba(100, 38, 255, 0.24);
  }

  .desktop-capture-primary-wide:disabled,
  .desktop-capture-secondary:disabled {
    opacity: 0.52;
    cursor: not-allowed;
  }

  @keyframes desktopCaptureBars {
    0%, 100% { transform: scaleY(0.72); opacity: 0.82; }
    50% { transform: scaleY(1.08); opacity: 1; }
  }

  @keyframes desktopSideWave {
    0%, 100% { transform: scaleY(0.72); opacity: 0.5; }
    50% { transform: scaleY(1.08); opacity: 0.95; }
  }

  @keyframes desktopLiveMic {
    0%, 100% { box-shadow: 0 0 0 6px rgba(100, 38, 255, 0.08), 0 20px 45px rgba(236, 72, 153, 0.34); }
    50% { box-shadow: 0 0 0 12px rgba(236, 72, 153, 0.10), 0 26px 58px rgba(236, 72, 153, 0.42); }
  }

  .desktop-empty-state,
  .desktop-empty-detail { min-height: 240px; display: grid; place-content: center; text-align: center; gap: 8px; }
  .desktop-empty-state h2,
  .desktop-empty-detail h2 { margin: 0; font-size: 20px; color: #17224d; }
  .desktop-empty-state p,
  .desktop-empty-detail p { margin: 0; color: #53617f; font-size: 14px; }

  @media (max-width: 1280px) {
    .desktop-page-intro { padding: 28px 24px 12px; }
    .desktop-content-grid { grid-template-columns: minmax(500px, 1fr) 420px; }
    .desktop-app-topbar { grid-template-columns: minmax(220px, 340px) minmax(320px, 1fr) auto; gap: 18px; padding: 0 22px; }
    .desktop-end-card { margin-right: 178px; }
    .desktop-floating-capture { right: 24px; }
  }
`;