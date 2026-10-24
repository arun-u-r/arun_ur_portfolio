"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { AdditiveBlending, Group, ShaderMaterial } from "three";

const surfaceVertexShader = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormal;

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const surfaceFragmentShader = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormal;
  uniform float uTime;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
      f.y
    );
  }

  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int octave = 0; octave < 5; octave++) {
      value += noise(p) * amplitude;
      p *= 2.03;
      amplitude *= 0.5;
    }
    return value;
  }

  void main() {
    vec2 mapUv = vec2(vUv.x * 13.0 + uTime * 0.012, vUv.y * 7.0);
    float landNoise = fbm(mapUv + vec2(fbm(mapUv * 0.7) * 1.8));
    float landMask = smoothstep(0.49, 0.54, landNoise);
    float coast = smoothstep(0.47, 0.505, landNoise) * (1.0 - landMask);

    vec3 ocean = vec3(0.018, 0.105, 0.24);
    vec3 land = mix(vec3(0.13, 0.31, 0.27), vec3(0.36, 0.35, 0.25), smoothstep(0.56, 0.7, landNoise));
    float latitude = abs(vUv.y - 0.5) * 2.0;
    float ice = smoothstep(0.78, 0.96, latitude);
    land = mix(land, vec3(0.65, 0.76, 0.78), ice * 0.82);

    vec3 normal = normalize(vNormal);
    vec3 lightDirection = normalize(vec3(-0.48, 0.18, 0.86));
    float daylight = max(dot(normal, lightDirection), 0.0);
    float cityNoise = fbm(mapUv * 5.7);
    float cityLights = (1.0 - smoothstep(0.02, 0.18, daylight)) *
      smoothstep(0.68, 0.76, cityNoise) * landMask;

    vec3 surface = mix(ocean, land, landMask);
    surface = mix(surface, vec3(0.72, 0.78, 0.66), coast * 0.5);
    surface *= 0.13 + daylight * 0.92;
    surface += vec3(1.0, 0.52, 0.2) * cityLights * 0.8;
    surface += vec3(0.06, 0.19, 0.3) * pow(1.0 - max(dot(normal, vec3(0.0, 0.0, 1.0)), 0.0), 2.0);

    gl_FragColor = vec4(surface, 1.0);
  }
`;

const cloudFragmentShader = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormal;
  uniform float uTime;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(41.7, 289.3))) * 951.1357);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
      f.y
    );
  }

  void main() {
    float cloud = noise(vec2(vUv.x * 28.0 + uTime * 0.018, vUv.y * 13.0));
    cloud += noise(vec2(vUv.x * 56.0 - uTime * 0.012, vUv.y * 27.0)) * 0.35;
    float bands = smoothstep(0.49, 0.76, cloud) * smoothstep(0.08, 0.28, abs(vUv.y - 0.5));
    float light = 0.28 + max(dot(normalize(vNormal), normalize(vec3(-0.48, 0.18, 0.86))), 0.0) * 0.72;
    gl_FragColor = vec4(vec3(0.72, 0.84, 0.98), bands * light * 0.42);
  }
`;

const atmosphereFragmentShader = /* glsl */ `
  varying vec3 vNormal;

  void main() {
    vec3 viewDirection = vec3(0.0, 0.0, 1.0);
    float rim = pow(1.0 - max(dot(normalize(vNormal), viewDirection), 0.0), 2.4);
    gl_FragColor = vec4(vec3(0.22, 0.55, 1.0), rim * 0.56);
  }
`;

function Earth() {
  const planetRef = useRef<Group>(null);
  const surfaceRef = useRef<ShaderMaterial>(null);
  const cloudsRef = useRef<ShaderMaterial>(null);
  const surfaceUniforms = useMemo(() => ({ uTime: { value: 0 } }), []);
  const cloudUniforms = useMemo(() => ({ uTime: { value: 0 } }), []);

  useFrame(({ clock }) => {
    const time = clock.elapsedTime;
    if (surfaceRef.current) surfaceRef.current.uniforms.uTime.value = time;
    if (cloudsRef.current) cloudsRef.current.uniforms.uTime.value = time;
    if (planetRef.current) {
      planetRef.current.rotation.y = time * 0.035;
      planetRef.current.rotation.x = Math.sin(time * 0.06) * 0.025;
    }
  });

  return (
    <group ref={planetRef} position={[0.75, -0.04, 0]}>
      <mesh>
        <sphereGeometry args={[1.03, 96, 64]} />
        <shaderMaterial
          ref={surfaceRef}
          vertexShader={surfaceVertexShader}
          fragmentShader={surfaceFragmentShader}
          uniforms={surfaceUniforms}
        />
      </mesh>
      <mesh scale={1.014}>
        <sphereGeometry args={[1.03, 96, 64]} />
        <shaderMaterial
          ref={cloudsRef}
          vertexShader={surfaceVertexShader}
          fragmentShader={cloudFragmentShader}
          uniforms={cloudUniforms}
          transparent
          depthWrite={false}
        />
      </mesh>
      <mesh scale={1.075}>
        <sphereGeometry args={[1.03, 96, 64]} />
        <shaderMaterial
          vertexShader={surfaceVertexShader}
          fragmentShader={atmosphereFragmentShader}
          transparent
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

function EarthFlight({ animate }: { animate: boolean }) {
  const flightRef = useRef<Group>(null);

  useFrame(({ clock, camera }) => {
    const time = clock.elapsedTime;
    const progress = animate ? Math.min(time / 24, 1) : 0;
    const eased = progress * progress * (3 - 2 * progress);
    camera.position.z = 4.8 - eased * 0.85;
    camera.position.x = animate ? Math.sin(time * 0.08) * 0.08 : 0;
    camera.lookAt(0.35, 0, 0);
    if (flightRef.current) {
      flightRef.current.position.y = animate ? Math.sin(time * 0.12) * 0.035 : 0;
    }
  });

  return (
    <group ref={flightRef}>
      <Earth />
      <mesh position={[-3.5, 2, -3]}>
        <sphereGeometry args={[0.12, 12, 12]} />
        <meshBasicMaterial color="#d9e7ff" transparent opacity={0.8} />
      </mesh>
      <mesh position={[3.2, -1.9, -2]}>
        <sphereGeometry args={[0.08, 12, 12]} />
        <meshBasicMaterial color="#aabaff" transparent opacity={0.65} />
      </mesh>
    </group>
  );
}

export default function EarthScene({ animate }: { animate: boolean }) {
  return (
    <Canvas
      className="earth-canvas"
      camera={{ position: [0, 0, 4.8], fov: 42 }}
      dpr={[1, 1.5]}
      frameloop={animate ? "always" : "never"}
      gl={{ alpha: true, antialias: false, powerPreference: "low-power" }}
      aria-hidden="true"
    >
      <EarthFlight animate={animate} />
    </Canvas>
  );
}
