import { ToatreMark } from "@/components/ToatreMark";
import Image from "next/image";
import { s } from "./_styles";

export function ShareFooter() {
  return (
    <footer style={s.footer}>
      <a
        href="https://toatre.com"
        target="_blank"
        rel="noopener noreferrer"
        style={{ ...s.footerBrand, gap: 8, alignItems: "center" }}
      >
        <Image
          src="/icon.png"
          alt=""
          width={32}
          height={32}
          style={{ borderRadius: 8, flexShrink: 0 }}
        />
        <ToatreMark width={64} />
      </a>
      <p style={s.footerTagline}>Your mic-first personal timeline.</p>
      <a
        href="https://toatre.com"
        target="_blank"
        rel="noopener noreferrer"
        style={s.footerLink}
      >
        Create your own toats →
      </a>
    </footer>
  );
}
