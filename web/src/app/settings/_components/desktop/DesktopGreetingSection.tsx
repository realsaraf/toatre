"use client";

interface DesktopGreetingSectionProps {
  bookingGreetingMessage: string;
  onGreetingMessageChange: (value: string) => void;
}

export function DesktopGreetingSection({ bookingGreetingMessage, onGreetingMessageChange }: DesktopGreetingSectionProps) {
  return (
    <section className="desktop-settings-card" id="desktop-toatlink-greeting">
      <div className="desktop-card-head">
        <div>
          <h2>Greeting message</h2>
          <p>The first thing visitors see on your Toat Link.</p>
        </div>
        <span className="desktop-counter">{bookingGreetingMessage.length}/200</span>
      </div>
      <div className="desktop-editor-toolbar">
        {["B", "I", "🔗", "•", "1.", "↶", "↷"].map((item) => (
          <button key={item} type="button">{item}</button>
        ))}
      </div>
      <textarea
        value={bookingGreetingMessage}
        onChange={(event) => onGreetingMessageChange(event.target.value.slice(0, 200))}
        className="desktop-editor-textarea"
        rows={5}
        placeholder={"Hey! 👋\nI help founders, engineers and creators think through AI products and systems.\n\nBook a 1-on-1 session with me."}
      />
      <div className="desktop-card-foot">
        <span></span>
        <button type="button" className="ghost">Use template ▾</button>
      </div>
    </section>
  );
}
