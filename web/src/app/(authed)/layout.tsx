import { redirect } from "next/navigation";
import Link from "next/link";
import { getAppRouterSession } from "@/lib/auth/session";

export default async function AuthedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let isAuthed = false;
  try {
    const session = await getAppRouterSession();
    isAuthed = Boolean(session.firebaseUid);
  } catch {
    // If session check fails (e.g. SESSION_SECRET not configured), treat as
    // unauthenticated and redirect to login rather than crashing.
    isAuthed = false;
  }

  if (!isAuthed) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen flex" style={{ background: "var(--color-bg)" }}>
      {/* Sidebar */}
      <aside
        className="w-56 shrink-0 flex flex-col py-8 px-5 border-r"
        style={{ borderColor: "var(--color-border)" }}
      >
        <Link
          href="/timeline"
          className="text-xl font-bold tracking-tight brand-gradient-text mb-10"
          aria-label="toatre home"
        >
          toatre
        </Link>
        <nav className="flex flex-col gap-1">
          <NavLink href="/timeline">Timeline</NavLink>
          <NavLink href="/capture">Capture</NavLink>
          <NavLink href="/people">People</NavLink>
          <NavLink href="/settings">Settings</NavLink>
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="px-3 py-2 rounded-lg text-sm font-medium transition-colors"
      style={{ color: "var(--color-text-secondary)" }}
    >
      {children}
    </Link>
  );
}
