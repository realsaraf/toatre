"use client";

import { DesktopToggle } from "./DesktopToggle";

interface DesktopExtraSectionProps {
  bookingCollectEmailFirst: boolean;
  bookingHideFromSearch: boolean;
  bookingPasswordProtect: boolean;
  bookingUtmParams: boolean;
  onCollectEmailFirstChange: (value: boolean) => void;
  onHideFromSearchChange: (value: boolean) => void;
  onPasswordProtectChange: (value: boolean) => void;
  onUtmParamsChange: (value: boolean) => void;
}

export function DesktopExtraSection({
  bookingCollectEmailFirst,
  bookingHideFromSearch,
  bookingPasswordProtect,
  bookingUtmParams,
  onCollectEmailFirstChange,
  onHideFromSearchChange,
  onPasswordProtectChange,
  onUtmParamsChange,
}: DesktopExtraSectionProps) {
  return (
    <section className="desktop-settings-card" id="desktop-toatlink-extra">
      <div className="desktop-card-head">
        <div>
          <h2>Extra options</h2>
          <p>Advanced controls for privacy and conversion.</p>
        </div>
      </div>
      <div className="desktop-field-stack">
        <DesktopToggle
          checked={bookingCollectEmailFirst}
          onChange={onCollectEmailFirstChange}
          title="Collect email before showing availability"
          description="Ask for email before revealing open slots"
        />
        <DesktopToggle
          checked={bookingHideFromSearch}
          onChange={onHideFromSearchChange}
          title="Hide Toat Link from search engines"
          description="Discourage indexing of your public booking page"
        />
        <DesktopToggle
          checked={bookingPasswordProtect}
          onChange={onPasswordProtectChange}
          title="Password protect your page"
          description="Require a password before a visitor can book"
        />
        <DesktopToggle
          checked={bookingUtmParams}
          onChange={onUtmParamsChange}
          title="Add UTM parameters to bookings"
          description="Track where bookings come from"
          badge="Pro"
        />
      </div>
    </section>
  );
}
