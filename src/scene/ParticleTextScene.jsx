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

    float horizontalGlow = exp(-pow((position.x - uLightX) * 0.66, 2.0));
    float verticalGlow = exp(-pow(position.y * 0.28, 2.0));

    vColor = color;
    vBackLight = horizontalGlow * verticalGlow;

    float perspectiveSize = uPointSize * aScale * (8.0 / max(2.0, -viewPosition.z));
    gl_PointSize = clamp(perspectiveSize, 2.0, 17.0);
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

    float core = smoothstep(0.5, 0.12, distanceToCenter);
    float halo = smoothstep(0.5, 0.0, distanceToCenter);
    vec3 backLightColor = vec3(0.76, 0.88, 1.0);
    vec3 litColor = mix(vColor, backLightColor, vBackLight * 0.62);
    float alpha = (core * 0.84 + halo * 0.16) * uOpacity;

    gl_FragColor = vec4(litColor * (1.0 + vBackLight * 1.35), alpha);
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
  canvas.width = 1040;
  canvas.height = 600;

  const context = canvas.getContext("2d", { willReadFrequently: true });
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#ffffff";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = "900 205px Arial, Helvetica, sans-serif";
  context.fillText("HOLA", canvas.width / 2, 190);
  context.fillText("MUNDO", canvas.width / 2, 420);

  const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
  const sampleStep = deviceMode === "mobile" ? 8 : deviceMode === "tablet" ? 6 : 5;
  const maxParticles = deviceMode === "mobile" ? 2400 : deviceMode === "tablet" ? 3500 : 4700;
  const candidates = [];

  for (let y = 0; y < canvas.height; y += sampleStep) {
    for (let x = 0; x < canvas.width; x += sampleStep) {
      const alpha = pixels[(y * canvas.width + x) * 4 + 3];
      if (alpha > 120) candidates.push([x, y]);
    }
  }

  const count = Math.min(candidates.length, maxParticles);
  const base = new Float32Array(count * 3);
  const explosion = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const scales = new Float32Array(count);
  const cyan = new THREE.Color("#58d8ff");
  const blue = new THREE.Color("#4e7cff");
  const violet = new THREE.Color("#b956ff");
  const magenta = new THREE.Color("#ff5de4");
  const pearl = new THREE.Color("#f5fbff");
  const color = new THREE.Color();
  const worldScale = 0.0091;
  const candidateStride = candidates.length / count;

  for (let i = 0; i < count; i += 1) {
    const [pixelX, pixelY] = candidates[Math.floor(i * candidateStride)];
    const index = i * 3;
    const randomA = seededRandom(i * 11 + 1);
    const randomB = seededRandom(i * 11 + 2);
    const randomC = seededRandom(i * 11 + 3);
    const randomD = seededRandom(i * 11 + 4);
    const randomE = seededRandom(i * 11 + 5);
    const randomF = seededRandom(i * 11 + 6);
    const baseX = (pixelX - canvas.width / 2) * worldScale;
    const baseY = (canvas.height / 2 - pixelY) * worldScale;
    const baseZ = (randomA - 0.5) * 0.18;

    base[index] = baseX;
    base[index + 1] = baseY;
    base[index + 2] = baseZ;

    let directionX = baseX * 0.18 + (randomB - 0.5) * 0.82;
    let directionY = baseY * 0.19 + (randomC - 0.5) * 0.82;
    let directionZ = (randomD - 0.5) * 1.4;
    const directionLength = Math.hypot(directionX, directionY, directionZ) || 1;
    const speed = 0.72 + randomE * 0.92;

    explosion[index] = (directionX / directionLength) * speed;
    explosion[index + 1] = (directionY / directionLength) * speed;
    explosion[index + 2] = (directionZ / directionLength) * speed;

    const verticalMix = clamp01((baseY + 2.8) / 5.6);
    const horizontalMix = clamp01((baseX + 4.0) / 8.0);

    if (verticalMix > 0.53) {
      color.lerpColors(blue, cyan, horizontalMix);
    } else {
      color.lerpColors(violet, magenta, horizontalMix);
    }

    if (i % 21 === 0) color.lerp(pearl, 0.72);

    colors[index] = color.r;
    colors[index + 1] = color.g;
    colors[index + 2] = color.b;
    scales[i] = 0.66 + randomF * 0.9;
  }

  return { base, colors, count, explosion, scales };
}

function createDustGeometry(deviceMode) {
  const count = deviceMode === "mobile" ? 110 : 210;
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count; i += 1) {
    const index = i * 3;
    positions[index] = (seededRandom(i * 3 + 101) - 0.5) * 13;
    positions[index + 1] = (seededRandom(i * 3 + 102) - 0.5) * 7.2;
    positions[index + 2] = -2.4 + seededRandom(i * 3 + 103) * 4.8;
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
  const glowBeamRef = useRef();
  const pointLightRef = useRef();
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const interactionPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), []);
  const pointerNdc = useMemo(() => new THREE.Vector2(), []);
  const pointerWorld = useMemo(() => new THREE.Vector3(), []);
  const uniforms = useMemo(
    () => ({
      uLightX: { value: -4.4 },
      uOpacity: { value: 0 },
      uPointSize: { value: deviceMode === "mobile" ? 8.4 : 9.7 },
    }),
    [deviceMode],
  );

  useEffect(() => () => {
    geometry.dispose();
    dustGeometry.dispose();
  }, [dustGeometry, geometry]);

  useFrame((state, delta) => {
    const progress = progressRef.current;
    const reveal = smoothRange(progress, 0.79, 0.865);

    if (progress < 0.755) {
      if (materialRef.current) materialRef.current.uniforms.uOpacity.value = 0;
      if (glowBeamRef.current) glowBeamRef.current.material.opacity = 0;
      if (pointLightRef.current) pointLightRef.current.intensity = 0;
      if (dustRef.current) dustRef.current.material.opacity = 0;
      return;
    }

    const lightJourney = smoothRange(progress, 0.835, 0.94);
    const explosionProgress = smoothRange(progress, 0.94, 1);
    const explosionDistance = Math.pow(explosionProgress, 1.28) * 8.5;
    const finalFade = 1 - smoothRange(progress, 0.986, 1);
    const opacity = reveal * finalFade;
    const lightX = THREE.MathUtils.lerp(-4.35, 4.35, lightJourney);
    const positionAttribute = geometry.attributes.position;
    const positions = positionAttribute.array;
    const pointer = pointerRef.current;
    let pointerIsAvailable = false;

    if (pointer.active && reveal > 0.65 && explosionProgress < 0.08) {
      pointerNdc.set(pointer.x * 2, pointer.y * 2);
      raycaster.setFromCamera(pointerNdc, camera);
      pointerIsAvailable = Boolean(raycaster.ray.intersectPlane(interactionPlane, pointerWorld));
    }

    const response = 1 - Math.exp(-delta * 12);
    const interactionRadius = deviceMode === "mobile" ? 1.08 : 0.9;

    for (let i = 0; i < particleData.count; i += 1) {
      const index = i * 3;
      let targetX = particleData.base[index];
      let targetY = particleData.base[index + 1];
      let targetZ = particleData.base[index + 2];

      if (pointerIsAvailable) {
        const deltaX = targetX - pointerWorld.x;
        const deltaY = targetY - pointerWorld.y;
        const distance = Math.hypot(deltaX, deltaY);

        if (distance < interactionRadius && distance > 0.001) {
          const force = Math.pow(1 - distance / interactionRadius, 2) * 0.82;
          targetX += (deltaX / distance) * force;
          targetY += (deltaY / distance) * force;
          targetZ += force * 0.7;
        }
      }

      if (explosionProgress > 0) {
        const spiral = Math.sin(explosionProgress * Math.PI) * 0.44;
        targetX += particleData.explosion[index] * explosionDistance
          - particleData.explosion[index + 1] * spiral;
        targetY += particleData.explosion[index + 1] * explosionDistance
          + particleData.explosion[index] * spiral
          - explosionProgress * explosionProgress * 1.05;
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

    const lightY = Math.sin(lightJourney * Math.PI) * 0.22;
    const lightVisibility = opacity * (1 - explosionProgress);

    if (glowBeamRef.current) {
      glowBeamRef.current.position.x = lightX;
      glowBeamRef.current.material.opacity = lightVisibility * 0.045;
    }

    if (pointLightRef.current) {
      pointLightRef.current.position.set(lightX, lightY, -0.52);
      pointLightRef.current.intensity = lightVisibility * 8.8;
    }

    if (dustRef.current) {
      dustRef.current.rotation.y += delta * 0.016;
      dustRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.08) * 0.02;
      dustRef.current.material.opacity = smoothRange(progress, 0.7, 0.82) * finalFade * 0.18;
    }
  });

  return (
    <group>
      <points geometry={dustGeometry} ref={dustRef}>
        <pointsMaterial
          color="#799bd0"
          depthWrite={false}
          opacity={0}
          size={deviceMode === "mobile" ? 0.038 : 0.026}
          sizeAttenuation
          transparent
        />
      </points>

      <mesh ref={glowBeamRef} position={[-4.35, 0, -1.0]}>
        <planeGeometry args={[0.55, 7]} />
        <meshBasicMaterial
          blending={THREE.AdditiveBlending}
          color="#5f8dff"
          depthWrite={false}
          opacity={0}
          side={THREE.DoubleSide}
          transparent
        />
      </mesh>

      <pointLight ref={pointLightRef} color="#78a8ff" distance={9} intensity={0} decay={2} />

      <points geometry={geometry}>
        <shaderMaterial
          ref={materialRef}
          transparent
          depthWrite={false}
          vertexColors
          blending={THREE.AdditiveBlending}
          uniforms={uniforms}
          vertexShader={PARTICLE_VERTEX_SHADER}
          fragmentShader={PARTICLE_FRAGMENT_SHADER}
          toneMapped={false}
        />
      </points>
    </group>
  );
}
