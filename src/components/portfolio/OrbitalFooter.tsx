"use client";

import { useEffect, useRef, type PointerEvent } from "react";

export default function OrbitalFooter() {
  const clickTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (clickTimeout.current !== null) clearTimeout(clickTimeout.current);
  }, []);

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse") return;

    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;

    event.currentTarget.style.setProperty("--footer-tilt-x", `${x * 7}deg`);
    event.currentTarget.style.setProperty("--footer-tilt-y", `${y * -7}deg`);
  };

  const handlePointerLeave = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.style.removeProperty("--footer-tilt-x");
    event.currentTarget.style.removeProperty("--footer-tilt-y");
    event.currentTarget.classList.remove("is-pressed");
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    const orbitalName = event.currentTarget;
    const bounds = orbitalName.getBoundingClientRect();
    orbitalName.style.setProperty(
      "--footer-click-x",
      `${event.clientX - bounds.left}px`,
    );
    orbitalName.style.setProperty(
      "--footer-click-y",
      `${event.clientY - bounds.top}px`,
    );
    orbitalName.classList.add("is-pressed");
    orbitalName.classList.remove("is-clicking");
    void orbitalName.offsetWidth;
    orbitalName.classList.add("is-clicking");

    if (clickTimeout.current !== null) clearTimeout(clickTimeout.current);
    clickTimeout.current = setTimeout(() => {
      orbitalName.classList.remove("is-clicking");
      clickTimeout.current = null;
    }, 700);
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.classList.remove("is-pressed");
  };

  return (
    <footer className="portfolio-footer">
      <div className="footer-starfield" aria-hidden="true" />
      <div className="footer-inner">
        <div
          className="orbital-name"
          aria-label="ARUN URAJ orbital footer"
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <a
            className="footer-github"
            href="https://github.com/arun-u-r"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Visit Arun U R on GitHub"
          >
            <span className="footer-sun" aria-hidden="true" />
          </a>
          <svg viewBox="0 0 260 260" aria-hidden="true">
            <defs>
              <path
                id="footer-name-outer-path"
                d="M 130,130 m -111,0 a 111,111 0 1,1 222,0 a 111,111 0 1,1 -222,0"
              />
              <path
                id="footer-name-inner-path"
                d="M 130,130 m -82,0 a 82,82 0 1,0 164,0 a 82,82 0 1,0 -164,0"
              />
            </defs>
            <text className="footer-name-ring footer-name-ring-outer">
              <textPath href="#footer-name-outer-path" startOffset="0%">
                Turn on  ✦ Tune in ✦ Drop out ✦
              </textPath>
            </text>
            <text className="footer-name-ring footer-name-ring-inner">
              <textPath href="#footer-name-inner-path" startOffset="0%">
                ARUN UR ✧ ARUN UR ✧ ARUN UR ✧
              </textPath>
            </text>
          </svg>
          <span className="footer-comet" aria-hidden="true" />
        </div>
        <div className="footer-meta">
          <span>© 2026 ARUN U R</span>
          <a href="#home">Back to top <span aria-hidden="true">↑</span></a>
        </div>
      </div>
    </footer>
  );
}
