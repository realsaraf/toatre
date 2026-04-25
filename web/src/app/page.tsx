export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="text-center max-w-lg">
        <h1 className="text-5xl font-bold tracking-tight mb-3 brand-gradient-text">
          toatre
        </h1>
        <p className="text-lg mb-8" style={{ color: "var(--color-text-secondary)" }}>
          Your mic-first personal timeline. Speak — Toatre handles the rest.
        </p>
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          Coming soon to iOS and Android.
        </p>
      </div>
    </main>
  );
}