"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  ShaderMaterial,
  Vector2,
} from "three";
import type { SceneInteraction } from "./BlackHoleScene";
import { seededRandom } from "./seeded-random";

const vertexShader = /* glsl */ `
  attribute float aAngle;
  attribute float aRadius;
  attribute float aSpeed;
  attribute float aSeed;
  attribute float aSize;
  attribute float aDepth;
  attribute vec3 aColor;

  uniform float uTime;
  uniform float uMotion;
  uniform float uPulseTime;
  uniform vec2 uCursor;
  uniform vec2 uViewport;
  uniform vec2 uCenterOffset;

  varying vec3 vColor;
  varying float vBrightness;
  varying float vAlpha;

  void main() {
    float cycle = fract(aSeed + uTime * uMotion * (0.008 + aSpeed * 0.005));
    float inward = pow(cycle, 1.28);
    float initialAngle = aAngle;
    float xDirection = cos(initialAngle);
    float yDirection = sin(initialAngle);
    float horizontalLimit = (xDirection > 0.0
      ? uViewport.x * 0.5 - uCenterOffset.x
      : uViewport.x * 0.5 + uCenterOffset.x) / max(abs(xDirection), 0.001);
    float verticalLimit = (yDirection > 0.0
      ? uViewport.y * 0.5 - uCenterOffset.y
      : uViewport.y * 0.5 + uCenterOffset.y) / max(abs(yDirection) * 0.88, 0.001);
    float edgeRadius = min(horizontalLimit, verticalLimit) * 0.96;
    float startRadius = mix(1.45, edgeRadius, aRadius);
    float radius = mix(startRadius, 0.76, inward);
    float distanceToHorizon = max(startRadius - 0.76, 0.01);
    float infallProgress = clamp((startRadius - radius) / distanceToHorizon, 0.0, 1.0);
    float orbitalSpeed = (0.28 + aSpeed * 0.65) * (1.0 + infallProgress * 0.55);
    float orbitalTime = uTime * uMotion * 0.55;
    float angle = initialAngle + orbitalTime * orbitalSpeed;

    vec3 position = vec3(
      cos(angle) * radius,
      sin(angle) * radius * 0.88 + aDepth * 0.24,
      sin(angle) * radius * 0.12 + aDepth
    );

    vec2 cursorDelta = position.xy - uCursor;
    float cursorInfluence = exp(-length(cursorDelta) * 1.65);
    vec2 cursorTangent = normalize(vec2(-cursorDelta.y, cursorDelta.x) + vec2(0.0001));
    position.xy += cursorTangent * cursorInfluence * 0.1 * sin(orbitalTime * 2.0 + aSeed * 6.283);

    float pulseAge = uTime - uPulseTime;
    float pulseStrength = 1.0 - smoothstep(0.0, 1.15, pulseAge);
    float pulseRadius = 0.88 + max(pulseAge, 0.0) * 2.2;
    float pulseRing = exp(-pow((length(position.xy) - pulseRadius) / 0.12, 2.0)) * pulseStrength;
    position.xy += normalize(position.xy + vec2(0.0001)) * pulseRing * 0.11;

    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * viewPosition;
    gl_PointSize = aSize * (1.0 + inward * 0.85) * (8.0 / max(1.0, -viewPosition.z));

    vColor = aColor;
    vBrightness = 0.42 + inward * 1.15 + pulseRing * 2.1;
    vAlpha = smoothstep(0.0, 0.045, cycle) * (1.0 - smoothstep(0.94, 1.0, cycle));
  }
`;

const fragmentShader = /* glsl */ `
  varying vec3 vColor;
  varying float vBrightness;
  varying float vAlpha;

  void main() {
    float radius = length(gl_PointCoord - vec2(0.5));
    if (radius > 0.5) discard;

    float core = exp(-radius * radius * 34.0);
    float halo = exp(-radius * radius * 13.0);
    float intensity = (core * 0.75 + halo * 0.65) * vBrightness;
    gl_FragColor = vec4(vColor * intensity, vAlpha * halo);
  }
`;

interface ParticleFieldProps {
  count: number;
  motion: number;
  interactionRef: React.RefObject<SceneInteraction>;
  centerOffset: [number, number];
}

const palette = [
  [0.25, 0.66, 1],
  [0.48, 0.38, 1],
  [0.68, 0.58, 1],
  [1, 0.56, 0.31],
] as const;

export default function ParticleField({
  count,
  motion,
  interactionRef,
  centerOffset,
}: ParticleFieldProps) {
  const materialRef = useRef<ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMotion: { value: motion },
      uPulseTime: { value: -100 },
      uCursor: { value: new Vector2(100, 100) },
      uViewport: { value: new Vector2(1, 1) },
      uCenterOffset: { value: new Vector2() },
    }),
    [motion],
  );

  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const angles = new Float32Array(count);
    const radii = new Float32Array(count);
    const speeds = new Float32Array(count);
    const seeds = new Float32Array(count);
    const sizes = new Float32Array(count);
    const depths = new Float32Array(count);
    const colors = new Float32Array(count * 3);

    for (let index = 0; index < count; index += 1) {
      const color = palette[Math.floor(seededRandom(index, 0) * palette.length)];
      angles[index] = seededRandom(index, 1) * Math.PI * 2;
      radii[index] = 0.02 + seededRandom(index, 2) * 0.98;
      speeds[index] = 0.15 + seededRandom(index, 3) * 0.95;
      seeds[index] = seededRandom(index, 4);
      sizes[index] = 1.6 + seededRandom(index, 5) * 4.2;
      depths[index] = (seededRandom(index, 6) - 0.5) * 2.2;
      colors.set(color, index * 3);
    }

    const particles = new BufferGeometry();
    particles.setAttribute("position", new BufferAttribute(positions, 3));
    particles.setAttribute("aAngle", new BufferAttribute(angles, 1));
    particles.setAttribute("aRadius", new BufferAttribute(radii, 1));
    particles.setAttribute("aSpeed", new BufferAttribute(speeds, 1));
    particles.setAttribute("aSeed", new BufferAttribute(seeds, 1));
    particles.setAttribute("aSize", new BufferAttribute(sizes, 1));
    particles.setAttribute("aDepth", new BufferAttribute(depths, 1));
    particles.setAttribute("aColor", new BufferAttribute(colors, 3));
    return particles;
  }, [count]);

  useFrame(({ clock, viewport }) => {
    const material = materialRef.current;
    if (!material) return;

    const time = clock.elapsedTime;
    material.uniforms.uTime.value = time;
    material.uniforms.uViewport.value.set(viewport.width, viewport.height);
    material.uniforms.uCenterOffset.value.set(centerOffset[0], centerOffset[1]);
    material.uniforms.uCursor.value.set(
      interactionRef.current.cursor.x * viewport.width * 0.5 - centerOffset[0],
      interactionRef.current.cursor.y * viewport.height * 0.5 - centerOffset[1],
    );

    if (interactionRef.current.pulseRequested) {
      material.uniforms.uPulseTime.value = time;
      interactionRef.current.pulseRequested = false;
    }
  });

  return (
    <points geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
      />
    </points>
  );
}
