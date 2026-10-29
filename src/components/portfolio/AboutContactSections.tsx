"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, type PointerEvent } from "react";
import ContactForm from "./ContactForm";
import { aboutContent, skills } from "./portfolio-data";

const EarthScene = dynamic(() => import("./EarthScene"), {
  ssr: false,
  loading: () => <div className="earth-fallback" aria-hidden="true" />,
});

export function AboutSection() {
  useEffect(() => {
    const layout = document.querySelector(".about-layout");
    if (!layout) return;
    const section = layout.closest(".about-section");

    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !("IntersectionObserver" in window)
    ) {
      layout.classList.add("is-visible");
      return;
    }

    section?.classList.add("has-reveal");
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          layout.classList.add("is-visible");
          observer.disconnect();
        }
      },
      { threshold: 0.12 },
    );

    observer.observe(layout);
    return () => observer.disconnect();
  }, []);

  const handleOrbitalPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse") return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;

    event.currentTarget.style.setProperty("--parallax-x", `${x * 12}px`);
    event.currentTarget.style.setProperty("--parallax-y", `${y * 12}px`);
  };

  const resetOrbitalPointer = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.style.removeProperty("--parallax-x");
    event.currentTarget.style.removeProperty("--parallax-y");
  };

  return (
    <section
      id="about"
      className="portfolio-section about-section"
      aria-labelledby="about-heading"
    >
      <div className="about-nebula" aria-hidden="true" />
      <div className="about-starfield" aria-hidden="true" />
      <div className="section-inner about-layout">
        <div className="about-copy">
          <p className="section-eyebrow"><span /> BEYOND THE CODE</p>
          <h2 id="about-heading">The Mind Behind <br /> the Universe</h2>
          <p>{aboutContent.introduction}</p>
          <p>{aboutContent.biography}</p>
          <p className="about-vision">{aboutContent.vision}</p>

          <div className="skills-block">
            <h3>TOOLS IN MY ORBIT</h3>
            <ul className="skill-list">
              {skills.map((skill) => <li key={skill}>{skill}</li>)}
            </ul>
          </div>
        </div>

        <div
          className="identity-panel"
          role="img"
          aria-label="Developer identity illustration"
          onPointerMove={handleOrbitalPointerMove}
          onPointerLeave={resetOrbitalPointer}
        >
          <div className="identity-glow" aria-hidden="true" />
          <div className="identity-orbit identity-orbit-one" aria-hidden="true">
            <span />
          </div>
          <div className="identity-orbit identity-orbit-two" aria-hidden="true">
            <span />
          </div>
          <div className="identity-core">
            <span className="identity-monogram">UR</span>
            <span className="identity-name">ARUN U R</span>
            <span className="identity-role">CREATIVE DEVELOPER</span>
          </div>
          <span className="identity-coordinate identity-coordinate-one" aria-hidden="true">
            DEVELOPER PROFILE
          </span>
          <span className="identity-coordinate identity-coordinate-two" aria-hidden="true">
            DIGITAL CREATION
          </span>
        </div>
      </div>
    </section>
  );
}

export function ContactSection() {
  const [showEarth, setShowEarth] = useState(false);
  const [animateEarth, setAnimateEarth] = useState(
    () =>
      typeof window !== "undefined" &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotionPreference = () => {
      setAnimateEarth(!motionPreference.matches);
    };
    motionPreference.addEventListener("change", updateMotionPreference);

    const section = document.getElementById("contact");
    if (!section) {
      motionPreference.removeEventListener("change", updateMotionPreference);
      return;
    }

    if (!("IntersectionObserver" in window)) {
      return () =>
        motionPreference.removeEventListener("change", updateMotionPreference);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setShowEarth(true);
        observer.disconnect();
      },
      { rootMargin: "240px 0px" },
    );

    observer.observe(section);
    return () => {
      observer.disconnect();
      motionPreference.removeEventListener("change", updateMotionPreference);
    };
  }, []);

  return (
    <section
      id="contact"
      className="portfolio-section contact-section"
      aria-labelledby="contact-heading"
    >
      <div className="contact-atmosphere" aria-hidden="true" />
      <div className="earth-background" aria-hidden="true">
        {showEarth ? (
          <EarthScene animate={animateEarth} />
        ) : (
          <div className="earth-fallback" />
        )}
      </div>
      <div className="contact-overlay" aria-hidden="true" />
      <div className="section-inner contact-content">
        <p className="section-eyebrow"><span /> TRANSMISSION OPEN</p>
        <h2 id="contact-heading">Let&apos;s create something meaningful.</h2>
        <p>
          Have a project in mind or simply want to say hello? Send a message
          and I&apos;ll get back to you.
        </p>
        <ContactForm />
        <span className="contact-divider" aria-hidden="true" />
        <span className="contact-signoff">ARUN U R · CREATIVE DEVELOPER</span>
      </div>
    </section>
  );
}
