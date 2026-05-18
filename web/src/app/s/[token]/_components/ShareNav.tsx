import { ToatreMark } from "@/components/ToatreMark";
import Image from "next/image";
import { s } from "./_styles";

export function ShareNav() {
  return (
    <nav className="share-nav" style={s.nav}>
      <a href="https://toatre.com" style={s.navBrand} aria-label="Toatre home">
        <Image
          src="/icon.png"
          alt=""
          width={28}
          height={28}
          style={{ borderRadius: 7, flexShrink: 0 }}
          priority
        />
        <ToatreMark width={72} />
      </a>
      <a
        href="https://toatre.com"
        target="_blank"
        rel="noopener noreferrer"
        style={s.navCta}
      >
        Get the app
      </a>
    </nav>
  );
}
