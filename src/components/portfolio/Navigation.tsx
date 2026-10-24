import Image from "next/image";
import Link from "next/link";
import { navigationLinks } from "./portfolio-data";

export default function Navigation() {
  return (
    <header className="portfolio-navigation">
      <Link className="portfolio-wordmark" href="/#home" aria-label="Arun U R home">
        <Image
          className="portfolio-logo"
          src="/logo-transparent.png"
          alt=""
          width={44}
          height={44}
          priority
        />
        <span>ARUN U R</span>
      </Link>

      <nav aria-label="Main navigation">
        <ul>
          {navigationLinks.map((link) => (
            <li key={link.label}>
              <Link href={link.href}>{link.label}</Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
