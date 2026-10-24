import Link from "next/link";
import { heroContent } from "./portfolio-data";

export default function HeroContent() {
  return (
    <div className="hero-content">
      <div className="hero-copy">
        <p className="hero-eyebrow">
          <span aria-hidden="true" />
          {heroContent.eyebrow}
        </p>
        <h1>
          {heroContent.headline.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </h1>
        <p className="hero-description whitespace-pre-line">{heroContent.description}</p>

        <div className="hero-actions">
          <Link className="hero-button hero-button-primary" href="#projects">
            Explore Projects
            <span aria-hidden="true">↗</span>
          </Link>
          <Link className="hero-button hero-button-secondary" href="#contact">
            Contact Me
            <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </div>

      <div className="hero-coordinate" aria-hidden="true">
        <span className="font-normal text-neutral-500 tracking-[0.25em]">export</span>
        <span className="font-normal text-neutral-500 tracking-[0.35em] drop-shadow-[0_0_12px_rgba(255,255,255,0.3)]">DEFAULT ME;</span>
      </div>

      <a className="hero-scroll" href="#projects">
        <span className="scroll-line" aria-hidden="true" />
        <span>Scroll to explore</span>
      </a>
    </div>
  );
}
