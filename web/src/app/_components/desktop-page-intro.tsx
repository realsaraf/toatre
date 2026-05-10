import type { ReactNode } from "react";

export function DesktopPageIntro({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle: string;
  actions?: ReactNode;
}) {
  return (
    <section className="desktop-page-intro">
      <div className="desktop-page-intro-copy">
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      {actions ? <div className="desktop-page-intro-actions">{actions}</div> : null}
    </section>
  );
}
