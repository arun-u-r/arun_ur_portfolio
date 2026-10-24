"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef } from "react";
import { Vector2 } from "three";

export interface SceneInteraction {
  cursor: Vector2;
  pulseRequested: boolean;
}

const BlackHoleSceneCanvas = dynamic(
  () => import("./BlackHoleSceneCanvas"),
  {
    ssr: false,
    loading: () => <div className="scene-loading" aria-hidden="true" />,
  },
);

export default function BlackHoleScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const interactionRef = useRef<SceneInteraction>({
    cursor: new Vector2(2, 2),
    pulseRequested: false,
  });

  useEffect(() => {
    const updateCursor = (event: PointerEvent) => {
      const bounds = containerRef.current?.getBoundingClientRect();
      if (!bounds || bounds.width === 0 || bounds.height === 0) return;

      interactionRef.current.cursor.set(
        ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
        1 - ((event.clientY - bounds.top) / bounds.height) * 2,
      );
    };

    const triggerPulse = (event: PointerEvent) => {
      const bounds = containerRef.current?.getBoundingClientRect();
      const target = event.target;
      if (
        !bounds ||
        event.clientX < bounds.left ||
        event.clientX > bounds.right ||
        event.clientY < bounds.top ||
        event.clientY > bounds.bottom ||
        (target instanceof Element && target.closest("a, button"))
      ) {
        return;
      }

      interactionRef.current.pulseRequested = true;
    };

    window.addEventListener("pointermove", updateCursor, { passive: true });
    window.addEventListener("pointerdown", triggerPulse, { passive: true });

    return () => {
      window.removeEventListener("pointermove", updateCursor);
      window.removeEventListener("pointerdown", triggerPulse);
    };
  }, []);

  return (
    <div ref={containerRef} className="black-hole-scene" aria-hidden="true">
      <BlackHoleSceneCanvas interactionRef={interactionRef} />
    </div>
  );
}
