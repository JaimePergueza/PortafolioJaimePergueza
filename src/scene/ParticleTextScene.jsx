import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

const PARTICLE_VERTEX_SHADER = /* glsl */ `
  attribute vec3 color;
  attribute float aScale;

  uniform float uLightX;
  uniform float uPointSize;

  varying vec3 vColor;
  varying float vBackLight;

  void main() {
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;

    float horizontalGlow = exp(-pow((position.x - uLightX) * 0.72, 2.0));
    float verticalGlow = exp(-pow(position.y * 0.34, 2.0));

    vColor = color;
    vBackLight = horizontalGlow * verticalGlow;

    float perspectiveSize = uPointSize * aScale * (7.0 / max(2.0, -viewPosition.z));
    gl_PointSize = clamp(perspectiveSize, 2.0, 15.0);
    gl_Position = projectionMatrix * viewPosition;
  }
`;

const PARTICLE_FRAGMENT_SHADER = /* glsl */ `
  uniform float uOpacity;

  varying vec3 vColor;
  varying float vBackLight;

  void main() {
    vec2 centeredUv = gl_PointCoord - vec2(0.5);
    float distanceToCenter = length(centeredUv);

    if (distanceToCenter > 0.5) discard;

    float sphere = smoothstep(0.5, 0.12, distanceToCenter);
    float halo = smoothstep(0.5, 0.0, distanceToCenter);
    vec3 backLightColor = vec3(1.0, 0.72, 0.45);
    vec3 litColor = mix(vColor, backLightColor, vBackLight * 0.72);
    float alpha = (sphere * 0.82 + halo * 0.18) * uOpacity;

    gl_FragColor = vec4(litColor * (1.0 + vBackLight * 1.45), alpha);
  }
`;

function clamp01(value) {
  return THREE.MathUtils.clamp(value, 0, 1);
}

function smoothRange(value, start, end) {
  const progress = clamp01((value - start) / (end - start));
  return progress * progress * (3 - 2 * progress);
}

function seededRandom(seed) {
  const value = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return value - Math.floor(value);
}

function createTextParticles(deviceMode) {
  const canvas = document.createElement("canvas");
  canvas.width = 980;
  canvas.height = 520;

  const context = canvas.getContext("2d", { willReadFrequently: true });
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#ffffff";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = "900 190px Arial, Helvetica, sans-serif";
  context.fillText("HOLA", canvas.width / 2, 170);
  context.fillText("MUNDO", canvas.width / 2, 370);

  const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
  const sampleStep = deviceMode === "mobile" ? 8 : deviceMode === "tablet" ? 6 : 5;
  const maxParticles = deviceMode === "mobile" ? 2200 : deviceMode === "tablet" ? 3200 : 4200;
  const candidates = [];

  for (let y = 0; y < canvas.height; y += sampleStep) {
    for (let x = 0; x < canvas.width; x += sampleStep) {
      const alpha = pixels[(y * canvas.width + x) * 4 + 3];
      if (alpha > 120) candidates.push([x, y]);
    }
  }

  const count = Math.min(candidates.length, maxParticles);
  const base = new Float32Array(count * 3);
  const scatter = new Float32Array(count * 3);
  const explosion = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const scales = new Float32Array(count);
  const cyan = new THREE.Color("#66d8ff");
  const violet = new THREE.Color("#b77cff");
  const pearl = new THREE.Color("#f4fbff");
  const color = new THREE.Color();
  const worldScale = 0.009;
  const candidateStride = candidates.length / count;

  for (let i = 0; i < count; i += 1) {
    const [pixelX, pixelY] = candidates[Math.floor(i * candidateStride)];
    const index = i * 3;
    const randomA = seededRandom(i * 7 + 1);
    const randomB = seededRandom(i * 7 + 2);
    const randomC = seededRandom(i * 7 + 3);
    const randomD = seededRandom(i * 7 + 4);
    const randomE = seededRandom(i * 7 + 5);
    const randomF = seededRandom(i * 7 + 6);
    const baseX = (pixelX - canvas.width / 2) * worldScale;
    const baseY = (canvas.height / 2 - pixelY) * worldScale;
    const baseZ = (randomA - 0.5) * 0.18;

    base[index] = baseX;
    base[index + 1] = baseY;
    base[index + 2] = baseZ;

    scatter[index] = (randomB - 0.5) * 5.2;
    scatter[index + 1] = (randomC - 0.5) * 3.8;
    scatter[index + 2] = 0.8 + randomD * 4.2;

    let directionX = baseX * 0.12 + (randomB - 0.5) * 0.9;
    let directionY = baseY * 0.16 + (randomC - 0.5) * 0.9;
    let directionZ = (randomE - 0.5) * 1.35;
    const directionLength = Math.hypot(directionX, directionY, directionZ) || 1;
    const speed = 0.72 + randomF * 0.78;
    directionX = (directionX / directionLength) * speed;
    directionY = (directionY / directionLength) * speed;
    directionZ = (directionZ / directionLength) * speed;

    explosion[index] = directionX;
    explosion[index + 1] = directionY;
    explosion[index + 2] = directionZ;

    const horizontalMix = clamp01((baseX + 3.3) / 6.6);
    color.lerpColors(cyan, violet, horizontalMix);
    if (i % 19 === 0) color.lerp(pearl, 0.68);
    colors[index] = color.r;
    colors[index + 1] = color.g;
    colors[index + 2] = color.b;
    scales[i] = 0.68 + randomD * 0.82;
  }

  return { base, colors, count, explosion, scales, scatter };
}

function createDustGeometry(deviceMode) {
  const count = deviceMode === "mobile" ? 120 : 220;
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count; i += 1) {
    const index = i * 3;
    positions[index] = (seededRandom(i * 3 + 101) - 0.5) * 14;
    positions[index + 1] = (seededRandom(i * 3 + 102) - 0.5) * 8;
    positions[index + 2] = -3.5 + seededRandom(i * 3 + 103) * 4.5;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  return geometry;
}

export default function ParticleTextScene({ deviceMode, pointerRef, progressRef }) {
  const { camera } = useThree();
  const particleData = useMemo(() => createTextParticles(deviceMode), [deviceMode]);
  const geometry = useMemo(() => {
    const createdGeometry = new THREE.BufferGeometry();
    createdGeometry.setAttribute("position", new THREE.BufferAttribute(particleData.base.slice(), 3));
    createdGeometry.setAttribute("color", new THREE.BufferAttribute(particleData.colors, 3));
    createdGeometry.setAttribute("aScale", new THREE.BufferAttribute(particleData.scales, 1));
    createdGeometry.attributes.position.setUsage(THREE.DynamicDrawUsage);
    return createdGeometry;
  }, [particleData]);
  const dustGeometry = useMemo(() => createDustGeometry(deviceMode), [deviceMode]);
  const materialRef = useRef();
  const dustRef = useRef();
  const glowRef = useRef();
  const glowHaloRef = useRef();
  const pointLightRef = useRef();
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const interactionPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), []);
  const pointerNdc = useMemo(() => new THREE.Vector2(), []);
  const pointerWorld = useMemo(() => new THREE.Vector3(), []);
  const uniforms = useMemo(
    () => ({
      uLightX: { value: -4.4 },
      uOpacity: { value: 0 },
      uPointSize: { value: deviceMode === "mobile" ? 8.2 : 9.4 },
    }),
    [deviceMode],
  );

  useEffect(() => () => {
    geometry.dispose();
    dustGeometry.dispose();
  }, [dustGeometry, geometry]);

  useFrame((state, delta) => {
    const progress = progressRef.current;

    if (progress < 0.565) {
      if (materialRef.current) materialRef.current.uniforms.uOpacity.value = 0;
      if (glowRef.current) glowRef.current.material.opacity = 0;
      if (glowHaloRef.current) glowHaloRef.current.material.opacity = 0;
      if (pointLightRef.current) pointLightRef.current.intensity = 0;
      if (dustRef.current) dustRef.current.material.opacity = 0;
      return;
    }

    const reveal = smoothRange(progress, 0.59, 0.7);
    const lightJourney = smoothRange(progress, 0.67, 0.86);
    const explosionProgress = smoothRange(progress, 0.86, 1);
    const explosionDistance = Math.pow(explosionProgress, 1.35) * 7.4;
    const finalFade = 1 - smoothRange(progress, 0.965, 1);
    const opacity = reveal * finalFade;
    const lightX = THREE.MathUtils.lerp(-4.3, 4.3, lightJourney);
    const positionAttribute = geometry.attributes.position;
    const positions = positionAttribute.array;
    const pointer = pointerRef.current;
    let pointerIsAvailable = false;

    if (pointer.active && reveal > 0.8 && explosionProgress < 0.18) {
      pointerNdc.set(pointer.x * 2, pointer.y * 2);
      raycaster.setFromCamera(pointerNdc, camera);
      pointerIsAvailable = Boolean(raycaster.ray.intersectPlane(interactionPlane, pointerWorld));
    }

    const response = 1 - Math.exp(-delta * 11);
    const interactionRadius = deviceMode === "mobile" ? 1.0 : 0.82;

    for (let i = 0; i < particleData.count; i += 1) {
      const index = i * 3;
      let targetX = particleData.base[index] + particleData.scatter[index] * (1 - reveal);
      let targetY = particleData.base[index + 1] + particleData.scatter[index + 1] * (1 - reveal);
      let targetZ = particleData.base[index + 2] + particleData.scatter[index + 2] * (1 - reveal);

      if (pointerIsAvailable) {
        const deltaX = targetX - pointerWorld.x;
        const deltaY = targetY - pointerWorld.y;
        const distance = Math.hypot(deltaX, deltaY);

        if (distance < interactionRadius && distance > 0.001) {
          const force = Math.pow(1 - distance / interactionRadius, 2) * 0.68;
          targetX += (deltaX / distance) * force;
          targetY += (deltaY / distance) * force;
          targetZ += force * 0.52;
        }
      }

      if (explosionProgress > 0) {
        const spiral = Math.sin(explosionProgress * Math.PI) * 0.32;
        targetX += particleData.explosion[index] * explosionDistance
          - particleData.explosion[index + 1] * spiral;
        targetY += particleData.explosion[index + 1] * explosionDistance
          + particleData.explosion[index] * spiral
          - explosionProgress * explosionProgress * 0.72;
        targetZ += particleData.explosion[index + 2] * explosionDistance;
      }

      positions[index] = THREE.MathUtils.lerp(positions[index], targetX, response);
      positions[index + 1] = THREE.MathUtils.lerp(positions[index + 1], targetY, response);
      positions[index + 2] = THREE.MathUtils.lerp(positions[index + 2], targetZ, response);
    }

    positionAttribute.needsUpdate = true;

    if (materialRef.current) {
      materialRef.current.uniforms.uOpacity.value = opacity;
      materialRef.current.uniforms.uLightX.value = lightX;
    }

    const lightY = Math.sin(lightJourney * Math.PI * 2) * 0.34;
    const lightVisibility = opacity * (1 - explosionProgress);

    if (glowRef.current) {
      glowRef.current.position.set(lightX, lightY, -0.72);
      glowRef.current.scale.setScalar(0.75 + Math.sin(state.clock.elapsedTime * 2.4) * 0.08);
      glowRef.current.material.opacity = lightVisibility * 0.92;
    }

    if (glowHaloRef.current) {
      glowHaloRef.current.position.set(lightX, lightY, -0.84);
      glowHaloRef.current.scale.setScalar(1.3 + Math.sin(state.clock.elapsedTime * 1.6) * 0.12);
      glowHaloRef.current.material.opacity = lightVisibility * 0.14;
    }

    if (pointLightRef.current) {
      pointLightRef.current.position.set(lightX, lightY, -0.5);
      pointLightRef.current.intensity = lightVisibility * 8.5;
    }

    if (dustRef.current) {
      dustRef.current.rotation.y += delta * 0.018;
      dustRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.08) * 0.025;
      dustRef.current.material.opacity = opacity * 0.22;
    }
  });

  return (
    <group>
      <points geometry={dustGeometry} ref={dustRef}>
        <pointsMaterial
          color="#6c8fbd"
          depthWrite={false}
          opacity={0}
          size={deviceMode === "mobile" ? 0.035 : 0.025}
          sizeAttenuation
          transparent
        />
      </points>

      <mesh ref={glowHaloRef} position={[-4.3, 0, -0.84]}>
        <sphereGeometry args={[0.95, 24, 24]} />
        <meshBasicMaterial color="#447bd4" depthWrite={false} opacity={0} toneMapped={false} transparent />
      </mesh>

      <mesh ref={glowRef} position={[-4.3, 0, -0.72]}>
        <sphereGeometry args={[0.18, 24, 24]} />
        <meshBasicMaterial color="#a7c8ff" depthWrite={false} opacity={0} toneMapped={false} transparent />
      </mesh>

      <pointLight ref={pointLightRef} color="#75a8ff" distance={8} intensity={0} decay={2} />

      <points geometry={geometry} frustumCulled={false}>
        <shaderMaterial
          ref={materialRef}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          fragmentShader={PARTICLE_FRAGMENT_SHADER}
          transparent
          uniforms={uniforms}
          vertexColors
          vertexShader={PARTICLE_VERTEX_SHADER}
        />
      </points>
    </group>
  );
}
