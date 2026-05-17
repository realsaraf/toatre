import { ToatreMark } from "@/components/ToatreMark";
import { s } from "./_styles";

export function ShareNotFound() {
  return (
    <div style={s.root}>
      <nav style={s.nav}>
        <a href="https://toatre.com" style={s.navBrand} aria-label="Toatre home">
          <ToatreMark width={72} />
        </a>
      </nav>
      <main style={{ ...s.main, paddingTop: 60 }}>
        <section
          style={{ ...s.card, textAlign: "center", padding: "48px 32px" }}
        >
          <p
            style={{
              margin: "0 0 8px",
              fontSize: 12,
              fontWeight: 800,
              color: "#8B5CF6",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Shared toat
          </p>
          <h1
            style={{
              margin: "0 0 12px",
              fontSize: 26,
              fontWeight: 800,
              color: "#111827",
            }}
          >
            Link not available.
          </h1>
          <p style={{ margin: 0, color: "#6B7280", fontSize: 15 }}>
            Ask the sender to share the toat again.
          </p>
        </section>
      </main>
    </div>
  );
}
