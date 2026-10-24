import BlackHoleScene from "@/components/portfolio/BlackHoleScene";
import { AboutSection, ContactSection } from "@/components/portfolio/AboutContactSections";
import HeroContent from "@/components/portfolio/HeroContent";
import OrbitalFooter from "@/components/portfolio/OrbitalFooter";
import ProjectsSection from "@/components/portfolio/ProjectsSection";

export default function Home() {
  return (
    <>
      <main className="portfolio-page">
        <section id="home" className="portfolio-home" aria-label="Home">
          <BlackHoleScene />
          <div className="hero-vignette" aria-hidden="true" />
          <HeroContent />
        </section>
        <ProjectsSection />
        <AboutSection />
        <ContactSection />
      </main>
      <OrbitalFooter />
    </>
  );
}
