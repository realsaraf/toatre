import { SignalIcon, WifiIcon, BatteryIcon } from "./LandingIcons";
import { pm } from "./landing.styles";

export function PhoneMockup() {
  return (
    <div style={pm.wrap}>
      {/* Outer frame */}
      <div className="landing-phone-frame" style={pm.frame}>
        {/* Status bar */}
        <div style={pm.statusBar}>
          <span style={pm.time}>9:41</span>
          <div style={pm.statusIcons}>
            <SignalIcon />
            <WifiIcon />
            <BatteryIcon />
          </div>
        </div>

        {/* Dynamic island */}
        <div style={pm.island} />

        <div style={pm.screen}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/phone-splash.png" alt="" style={pm.splashImage} aria-hidden />
        </div>
      </div>

      {/* Reflection glow */}
      <div style={pm.glow} />
    </div>
  );
}

/* ─── Inline SVG logos & icons ───────────────────────────────────────────── */
