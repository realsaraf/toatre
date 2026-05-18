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
        style={s.footerBrand}
      >
        <Image src="/icon.png" alt="" width={20} height={20} style={{ borderRadius: 5 }} />
        <ToatreMark width={52} />
      </a>
      <span style={s.footerTagline}>·  Own your slice of time.</span>
    </footer>
  );
}
