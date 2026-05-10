"use client";

import { useSettings } from "./_hooks/useSettings";
import { MobileSettingsView } from "./_components/mobile/MobileSettingsView";
import { DesktopSettingsView } from "./_components/desktop/DesktopSettingsView";

export default function SettingsPage() {
  const settings = useSettings();
  if (!settings.user && !settings.loading) return null;
  if (settings.isDesktopViewport) {
    return <DesktopSettingsView {...settings} />;
  }
  return <MobileSettingsView {...settings} />;
}
