"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import {
  AdditiveBlending,
  DoubleSide,
  RingGeometry,
  ShaderMaterial,
} from "three";

const vertexShader = /* glsl */ `
  varying float vRadius;
  varying float vAngle;

  void main() {
    vRadius = length(position.xy);
    vAngle = atan(position.y, position.x);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uTime;
  varying float vRadius;
  varying float vAngle;

  float hash(vec2 point) {
    return fract(sin(dot(point, vec2(127.1, 311.7))) * 43758.5453);
  }

  float noise(vec2 point) {
    vec2 cell = floor(point);
    vec2 fraction = fract(point);
    vec2 blend = fraction * fraction * (3.0 - 2.0 * fraction);
    return mix(
      mix(hash(cell), hash(cell + vec2(1.0, 0.0)), blend.x),
      mix(hash(cell + vec2(0.0, 1.0)), hash(cell + vec2(1.0, 1.0)), blend.x),
      blend.y
    );
  }

  float turbulence(vec2 point) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int octave = 0; octave < 4; octave++) {
      value += noise(point) * amplitude;
      point = point * 2.03 + vec2(7.1, 3.7);
      amplitude *= 0.5;
    }
    return value;
  }

  void main() {
    float radial = clamp((vRadius - 0.82) / 1.58, 0.0, 1.0);
    float orbitalAngle = vAngle - uTime * (0.5 + 1.5 / (0.35 + radial));
    vec2 flowPosition = vec2(
      cos(orbitalAngle) * (2.5 + radial * 3.0),
      sin(orbitalAngle) * (2.5 + radial * 3.0)
    );
    float cloud = turbulence(flowPosition + vec2(0.0, uTime * 0.18));
    float fineCloud = noise(flowPosition * 8.0 + vec2(uTime * 0.45, -uTime * 0.2));
    float filaments = 0.5 + 0.5 * sin(
      vAngle * 84.0 + radial * 39.0 + cloud * 8.0 - uTime * (1.4 + 1.8 / (0.4 + radial))
    );
    float clump = smoothstep(0.34, 0.82, cloud * 0.78 + fineCloud * 0.34);
    float innerHeat = exp(-pow((radial - 0.045) / 0.11, 2.0));
    float orangeBand = exp(-pow((radial - 0.2) / 0.21, 2.0));
    float violetBand = exp(-pow((radial - 0.48) / 0.29, 2.0));

    vec3 deepBlue = vec3(0.16, 0.3, 0.82);
    vec3 violet = vec3(0.43, 0.31, 0.92);
    vec3 amber = vec3(1.0, 0.43, 0.18);
    vec3 hotWhite = vec3(1.0, 0.84, 0.67);
    vec3 color = mix(deepBlue, violet, 1.0 - smoothstep(0.18, 0.55, radial));
    color = mix(color, amber, orangeBand * 0.82);
    color = mix(color, hotWhite, innerHeat * 0.92);

    float edgeFade = smoothstep(0.0, 0.055, radial) * (1.0 - smoothstep(0.9, 1.0, radial));
    float inwardHeating = 0.52 + 0.9 * exp(-radial * 2.6);
    float turbulentBrightness = 0.48 + clump * 0.78 + filaments * (0.13 + fineCloud * 0.22);
    float doppler = 0.76 + 0.5 * pow(max(0.0, sin(vAngle)), 2.0);
    float brightness = inwardHeating * turbulentBrightness * doppler;
    float alpha = edgeFade * (0.18 + brightness * (0.34 + violetBand * 0.08));

    gl_FragColor = vec4(color * brightness, min(alpha, 0.86));
  }
`;

const outerGlowFragmentShader = /* glsl */ `
  varying float vRadius;

  void main() {
    float fadeIn = smoothstep(2.12, 2.42, vRadius);
    float fadeOut = 1.0 - smoothstep(2.58, 2.84, vRadius);
    float glow = fadeIn * fadeOut;
    gl_FragColor = vec4(vec3(0.23, 0.38, 0.9), glow * 0.12);
  }
`;

export default function AccretionDisk() {
  const materialRef = useRef<ShaderMaterial>(null);
  const geometry = useMemo(() => new RingGeometry(0.82, 2.4, 256, 2), []);
  const outerGlowGeometry = useMemo(() => new RingGeometry(2.12, 2.84, 256, 2), []);
  const diskUniforms = useMemo(() => ({ uTime: { value: 0 } }), []);

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = clock.elapsedTime;
    }
  });

  return (
    <group rotation={[1.31, 0.03, -0.08]}>
      <mesh geometry={outerGlowGeometry} renderOrder={1}>
        <shaderMaterial
          vertexShader={vertexShader}
          fragmentShader={outerGlowFragmentShader}
          transparent
          depthWrite={false}
          side={DoubleSide}
          blending={AdditiveBlending}
        />
      </mesh>
      <mesh geometry={geometry} renderOrder={2}>
        <shaderMaterial
          ref={materialRef}
          uniforms={diskUniforms}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          transparent
          depthWrite={false}
          side={DoubleSide}
          blending={AdditiveBlending}
        />
      </mesh>
    </group>
  );
}
