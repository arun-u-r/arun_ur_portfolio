"use client";

import { useEffect, useRef } from "react";
import type { MouseEvent, PointerEvent } from "react";
import { otherProjects, projects } from "./portfolio-data";

export default function ProjectsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const clickTimeoutRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (clickTimeoutRef.current !== null) {
        window.clearTimeout(clickTimeoutRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const cards = section.querySelectorAll<HTMLElement>(".project-card");
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      cards.forEach((card) => card.classList.add("is-visible"));
      return;
    }

    section.classList.add("has-reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.14 },
    );

    cards.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, []);

  const handleScenePointerMove = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType !== "mouse") return;
    const bounds = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty("--scene-x", `${event.clientX - bounds.left}px`);
    event.currentTarget.style.setProperty("--scene-y", `${event.clientY - bounds.top}px`);
  };

  const handleSceneClick = (event: MouseEvent<HTMLElement>) => {
    if (event.detail === 0) return;
    const section = event.currentTarget;
    const bounds = section.getBoundingClientRect();
    section.style.setProperty("--click-x", `${event.clientX - bounds.left}px`);
    section.style.setProperty("--click-y", `${event.clientY - bounds.top}px`);
    section.classList.remove("is-clicking");
    void section.offsetWidth;
    section.classList.add("is-clicking");
    if (clickTimeoutRef.current !== null) window.clearTimeout(clickTimeoutRef.current);
    clickTimeoutRef.current = window.setTimeout(() => {
      section.classList.remove("is-clicking");
      clickTimeoutRef.current = null;
    }, 750);
  };

  const resetScenePointer = (event: PointerEvent<HTMLElement>) => {
    event.currentTarget.style.removeProperty("--scene-x");
    event.currentTarget.style.removeProperty("--scene-y");
  };

  const handlePointerMove = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType !== "mouse") return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width;
    const y = (event.clientY - bounds.top) / bounds.height;
    event.currentTarget.style.setProperty("--pointer-x", `${x * 100}%`);
    event.currentTarget.style.setProperty("--pointer-y", `${y * 100}%`);
    event.currentTarget.style.setProperty("--magnet-x", `${(x - 0.5) * 9}px`);
    event.currentTarget.style.setProperty("--magnet-y", `${(y - 0.5) * 9}px`);
    event.currentTarget.style.setProperty("--tilt-x", `${(x - 0.5) * 5}deg`);
    event.currentTarget.style.setProperty("--tilt-y", `${(0.5 - y) * 5}deg`);
  };

  const resetPointer = (event: PointerEvent<HTMLElement>) => {
    event.currentTarget.style.removeProperty("--magnet-x");
    event.currentTarget.style.removeProperty("--magnet-y");
    event.currentTarget.style.removeProperty("--tilt-x");
    event.currentTarget.style.removeProperty("--tilt-y");
    event.currentTarget.style.removeProperty("--pointer-x");
    event.currentTarget.style.removeProperty("--pointer-y");
  };

  const renderProjectCard = (project: any, index: number) => {
    const hasImage = project.image && project.image !== "";
    const hasLive = project.liveUrl && project.liveUrl !== "" && project.liveUrl !== "#";
    const hasGithub = project.githubUrl && project.githubUrl !== "";

    return (
      <article
        className="project-card"
        key={project.title + index}
        onPointerMove={handlePointerMove}
        onPointerLeave={resetPointer}
      >
        <div className={`project-preview preview-${(index % 6) + 1}`} aria-hidden="true">
          {hasImage ? (
            <img
              src={project.image}
              alt={project.title}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <>
              <span className="preview-orbit" />
              <span className="preview-planet" />
              <span className="preview-caption">PREVIEW PLACEHOLDER</span>
            </>
          )}
          <span className="preview-index">{String(index + 1).padStart(2, "0")}</span>
        </div>

        <div className="project-card-content">
          <div className="project-title-row">
            <h3>{project.title}</h3>
            <span className="project-status">{project.status || "EDITABLE"}</span>
          </div>

          <p>{project.description}</p>

          <ul className="project-tags" aria-label="Technologies">
            {project.technologies.map((technology: string, tagIndex: number) => (
              <li key={`${technology}-${tagIndex}`}>{technology}</li>
            ))}
          </ul>

          <div className="project-links" aria-label="Project links">
            {hasLive ? (
              <a href={project.liveUrl} target="_blank" rel="noopener noreferrer">
                Live Demo →
              </a>
            ) : (
              <span>Live demo not provided</span>
            )}
            {hasGithub ? (
              <a href={project.githubUrl} target="_blank" rel="noopener noreferrer">
                GitHub
              </a>
            ) : (
              <span>GitHub not provided</span>
            )}
          </div>
        </div>
      </article>
    );
  };

  return (
    <section
      ref={sectionRef}
      id="projects"
      className="portfolio-section projects-section"
      aria-labelledby="projects-heading"
      onPointerMove={handleScenePointerMove}
      onClick={handleSceneClick}
      onPointerLeave={resetScenePointer}
    >
      <div className="projects-atmosphere" aria-hidden="true">
        <div className="pulsar-system">
          <div className="pulsar-rotor">
            <span className="pulsar-beam pulsar-beam-top" />
            <span className="pulsar-beam pulsar-beam-bottom" />
          </div>
          <span className="pulsar-core" />
        </div>
      </div>
      <div className="cosmic-dust" aria-hidden="true" />
      <span className="project-click-ripple" aria-hidden="true" />

      <div className="section-inner">
        <div className="section-heading">
          <p className="section-eyebrow"><span /> SELECTED WORK</p>
          <h2 id="projects-heading">Projects in orbit</h2>
          <p className="section-intro">
            A collection of ideas taking shape. Scroll sideways to explore more.
          </p>
        </div>

        <div className="project-gallery">
          <span className="horizontal-scroll-hint" aria-hidden="true">
            SCROLL TO EXPLORE <span>→</span>
          </span>
          <div
            className="project-gallery-track"
            role="region"
            aria-label="Project gallery, horizontally scrollable"
            tabIndex={0}
          >
            <div className="project-page">
              <div className="project-grid">
                {projects.map((project, index) => renderProjectCard(project, index))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}