import { ToatreMark } from "@/components/ToatreMark";
import { s } from "./_styles";

export function ShareNav() {
  return (
    <nav style={s.nav}>
      <a href="https://toatre.com" style={s.navBrand} aria-label="Toatre home">
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
