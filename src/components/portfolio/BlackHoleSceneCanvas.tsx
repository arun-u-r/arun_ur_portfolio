"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  BufferAttribute,
  BufferGeometry,
  Group,
  ShaderMaterial,
  Vector2,
} from "three";
import type { SceneInteraction } from "./BlackHoleScene";
import AccretionDisk from "./AccretionDisk";
import ParticleField from "./ParticleField";
import { seededRandom } from "./seeded-random";

interface BlackHoleSceneCanvasProps {
  interactionRef: React.RefObject<SceneInteraction>;
}

const starVertexShader = /* glsl */ `
  attribute vec2 aPosition;
  attribute float aSize;
  attribute float aBrightness;
  attribute float aSeed;

  uniform float uTime;
  varying float vBrightness;

  void main() {
    float twinkle = 0.94 + 0.06 * sin(uTime * (0.25 + aSeed * 0.4) + aSeed * 6.283);
    gl_Position = vec4(aPosition, 0.999, 1.0);
    gl_PointSize = aSize;
    vBrightness = aBrightness * twinkle;
  }
`;

const starFragmentShader = /* glsl */ `
  varying float vBrightness;

  void main() {
    float radius = length(gl_PointCoord - vec2(0.5));
    if (radius > 0.5) discard;
    float glow = exp(-radius * radius * 22.0);
    gl_FragColor = vec4(vec3(0.72, 0.8, 1.0) * glow, glow * vBrightness);
  }
`;

const dustVertexShader = /* glsl */ `
  attribute vec2 aPosition;
  attribute float aSize;
  attribute float aSeed;
  attribute float aSpeed;
  attribute vec3 aColor;

  uniform float uTime;
  uniform vec2 uCenter;

  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    float cycle = fract(aSeed + uTime * aSpeed);
    float drift = smoothstep(0.0, 0.96, cycle);
    vec2 inward = uCenter - aPosition;
    vec2 tangent = normalize(vec2(-inward.y, inward.x) + vec2(0.0001));
    vec2 position = mix(aPosition, uCenter, drift * 0.14);
    position += tangent * sin(cycle * 6.283 + aSeed * 8.0) * 0.004;

    gl_Position = vec4(position, 0.998, 1.0);
    gl_PointSize = aSize * (0.9 + drift * 0.45);
    vColor = aColor;
    vAlpha = smoothstep(0.0, 0.06, cycle) *
      (1.0 - smoothstep(0.93, 1.0, cycle)) *
      (0.14 + drift * 0.08);
  }
`;

const dustFragmentShader = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    float radius = length(gl_PointCoord - vec2(0.5));
    if (radius > 0.5) discard;
    float haze = exp(-radius * radius * 12.0);
    gl_FragColor = vec4(vColor * haze, vAlpha * haze);
  }
`;

function StarField({ count }: { count: number }) {
  const materialRef = useRef<ShaderMaterial>(null);
  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 2);
    const sizes = new Float32Array(count);
    const brightness = new Float32Array(count);
    const seeds = new Float32Array(count);

    for (let index = 0; index < count; index += 1) {
      positions[index * 2] = seededRandom(index, 1) * 2 - 1;
      positions[index * 2 + 1] = seededRandom(index, 2) * 2 - 1;
      sizes[index] = 0.8 + seededRandom(index, 3) * 1.5;
      brightness[index] = 0.14 + seededRandom(index, 4) * 0.28;
      seeds[index] = seededRandom(index, 5);
    }

    const stars = new BufferGeometry();
    stars.setAttribute("aPosition", new BufferAttribute(positions, 2));
    stars.setAttribute("aSize", new BufferAttribute(sizes, 1));
    stars.setAttribute("aBrightness", new BufferAttribute(brightness, 1));
    stars.setAttribute("aSeed", new BufferAttribute(seeds, 1));
    return stars;
  }, [count]);

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = clock.elapsedTime;
    }
  });

  return (
    <points geometry={geometry} frustumCulled={false} renderOrder={-2}>
      <shaderMaterial
        ref={materialRef}
        uniforms={{ uTime: { value: 0 } }}
        vertexShader={starVertexShader}
        fragmentShader={starFragmentShader}
        transparent
        depthWrite={false}
      />
    </points>
  );
}

function DustField({
  count,
  centerOffset,
}: {
  count: number;
  centerOffset: [number, number];
}) {
  const materialRef = useRef<ShaderMaterial>(null);
  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 2);
    const sizes = new Float32Array(count);
    const seeds = new Float32Array(count);
    const speeds = new Float32Array(count);
    const colors = new Float32Array(count * 3);

    for (let index = 0; index < count; index += 1) {
      positions[index * 2] = seededRandom(index, 10) * 1.94 - 0.97;
      positions[index * 2 + 1] = seededRandom(index, 11) * 1.94 - 0.97;
      sizes[index] = 1.4 + seededRandom(index, 12) * 3.2;
      seeds[index] = seededRandom(index, 13);
      speeds[index] = 0.0015 + seededRandom(index, 14) * 0.002;
      const color = seededRandom(index, 15) > 0.72
        ? [0.58, 0.48, 0.88]
        : [0.34, 0.48, 0.72];
      colors.set(color, index * 3);
    }

    const dust = new BufferGeometry();
    dust.setAttribute("aPosition", new BufferAttribute(positions, 2));
    dust.setAttribute("aSize", new BufferAttribute(sizes, 1));
    dust.setAttribute("aSeed", new BufferAttribute(seeds, 1));
    dust.setAttribute("aSpeed", new BufferAttribute(speeds, 1));
    dust.setAttribute("aColor", new BufferAttribute(colors, 3));
    return dust;
  }, [count]);

  useFrame(({ clock, size }) => {
    const material = materialRef.current;
    if (!material) return;

    material.uniforms.uTime.value = clock.elapsedTime;
    (material.uniforms.uCenter.value as Vector2).set(
      (centerOffset[0] / size.width) * 2,
      (centerOffset[1] / size.height) * 2,
    );
  });

  return (
    <points geometry={geometry} frustumCulled={false} renderOrder={-1}>
      <shaderMaterial
        ref={materialRef}
        uniforms={{ uTime: { value: 0 }, uCenter: { value: new Vector2() } }}
        vertexShader={dustVertexShader}
        fragmentShader={dustFragmentShader}
        transparent
        depthWrite={false}
      />
    </points>
  );
}

interface BlackHoleProps extends BlackHoleSceneCanvasProps {
  particleCount: number;
  starCount: number;
  motion: number;
}

function BlackHole({
  interactionRef,
  particleCount,
  starCount,
  motion,
}: BlackHoleProps) {
  const groupRef = useRef<Group>(null);
  const { viewport } = useThree();
  const xOffset = viewport.width > 8 ? viewport.width * 0.16 : 0;
  const yOffset = viewport.width > 8 ? 0.04 : -0.85;
  const scale = viewport.width > 8 ? 1.18 : 0.84;

  useFrame(() => {
    if (!groupRef.current) return;
    const cursor = interactionRef.current.cursor;
    groupRef.current.position.x = xOffset + cursor.x * 0.035;
    groupRef.current.position.y = yOffset + cursor.y * 0.022;
    groupRef.current.rotation.y = cursor.x * 0.012;
    groupRef.current.rotation.x = -cursor.y * 0.009;
  });

  return (
    <>
      <StarField count={starCount} />
      <DustField
        count={Math.round(starCount * 0.68)}
        centerOffset={[xOffset, yOffset]}
      />
      <group ref={groupRef} scale={scale}>
        <ParticleField
          count={particleCount}
          motion={motion}
          interactionRef={interactionRef}
          centerOffset={[xOffset, yOffset]}
        />
        <AccretionDisk />
        <mesh scale={0.77} renderOrder={5}>
          <sphereGeometry args={[1, 64, 64]} />
          <meshBasicMaterial color="#000000" />
        </mesh>
      </group>
    </>
  );
}

export default function BlackHoleSceneCanvas({
  interactionRef,
}: BlackHoleSceneCanvasProps) {
  const [quality, setQuality] = useState({
    particles: 9000,
    stars: 1500,
    dpr: 1.5,
    reducedMotion: false,
  });

  useEffect(() => {
    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateQuality = () => {
      const mobile = window.innerWidth < 760;
      const lowPower = (navigator.hardwareConcurrency || 8) <= 4;
      setQuality({
        particles: mobile || lowPower ? 2600 : 7600,
        stars: mobile || lowPower ? 750 : 1800,
        dpr: mobile || lowPower ? 1 : 1.5,
        reducedMotion: motionPreference.matches,
      });
    };

    updateQuality();
    window.addEventListener("resize", updateQuality);
    motionPreference.addEventListener("change", updateQuality);

    return () => {
      window.removeEventListener("resize", updateQuality);
      motionPreference.removeEventListener("change", updateQuality);
    };
  }, []);

  return (
    <Canvas
      className="black-hole-canvas"
      camera={{ position: [0, 0, 10], fov: 42, near: 0.1, far: 50 }}
      dpr={quality.dpr}
      frameloop={quality.reducedMotion ? "demand" : "always"}
      gl={{
        alpha: true,
        antialias: false,
        powerPreference: "high-performance",
      }}
      fallback={<div className="black-hole-fallback" />}
      aria-hidden="true"
    >
      <BlackHole
        interactionRef={interactionRef}
        particleCount={quality.particles}
        starCount={quality.stars}
        motion={quality.reducedMotion ? 0 : 1}
      />
    </Canvas>
  );
}
