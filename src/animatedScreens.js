import { CanvasTexture, LinearFilter, SRGBColorSpace } from "three";

const codeLines = [
  ['import { Canvas } from "@react-three/fiber";', "#c792ea"],
  ['import { Studio } from "./Studio";', "#c792ea"],
  ["", "#cbd5e1"],
  ["export function Workspace() {", "#82aaff"],
  ["  const scene = useStudio();", "#cbd5e1"],
  ["  const camera = scene.camera;", "#cbd5e1"],
  ["", "#cbd5e1"],
  ["  return (", "#c792ea"],
  ['    <Canvas shadows camera={camera}>', "#89ddff"],
  ['      <Studio lighting="evening" />', "#c3e88d"],
  ["      <AnimatedScreens />", "#89ddff"],
  ["    </Canvas>", "#89ddff"],
  ["  );", "#c792ea"],
  ["}", "#82aaff"],
  ["", "#cbd5e1"],
  ["async function loadScene() {", "#82aaff"],
  ['  const model = await load("studio.glb");', "#c3e88d"],
  ["  model.enableReflections();", "#cbd5e1"],
  ["  return model;", "#c792ea"],
  ["}", "#82aaff"],
];

function drawEditor(context, elapsed) {
  const width = context.canvas.width;
  const height = context.canvas.height;
  context.fillStyle = "#101821";
  context.fillRect(0, 0, width, height);
  context.fillStyle = "#1c2734";
  context.fillRect(0, 0, width, 38);
  context.font = "16px monospace";
  context.fillStyle = "#b8c7d9";
  context.fillText("studio.jsx    /    workspace", 24, 25);
  context.fillStyle = "#58d6c7";
  context.fillRect(16, 36, 145, 2);

  context.save();
  context.beginPath();
  context.rect(0, 44, width, height - 76);
  context.clip();
  const cycle = elapsed % 24;
  const scroll = Math.max(0, cycle - 8) * 20;
  const activeLine = Math.min(codeLines.length - 1, Math.floor(cycle * 2));
  context.font = "19px monospace";
  codeLines.forEach(([text, color], index) => {
    const top = 72 + index * 27 - scroll;
    if (index > activeLine) return;
    context.fillStyle = "#53657c";
    context.fillText(String(index + 1).padStart(2, " "), 18, top);
    context.fillStyle = color;
    const characters = index === activeLine ? Math.floor((cycle * 2 % 1) * text.length) : text.length;
    const visibleText = text.slice(0, characters);
    context.fillText(visibleText, 65, top);
    if (index === activeLine && Math.floor(elapsed * 2) % 2 === 0) {
      context.fillStyle = "#e2e8f0";
      context.fillRect(66 + context.measureText(visibleText).width, top - 17, 2, 21);
    }
  });
  context.restore();
  context.fillStyle = "#173d4a";
  context.fillRect(0, height - 26, width, 26);
  context.fillStyle = "#a7e8dc";
  context.font = "14px monospace";
  context.fillText("main    ✓ Ready                      JavaScript JSX", 18, height - 8);
}

export function animateScreens(scene, invalidate) {
  const canvas = document.createElement("canvas");
  canvas.width = 768;
  canvas.height = 432;
  const context = canvas.getContext("2d");
  if (!context) return () => {};

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.flipY = false;
  texture.repeat.x = -1;
  texture.offset.x = 1;
  texture.generateMipmaps = false;
  texture.minFilter = LinearFilter;
  const replacements = [];
  scene.traverse((object) => {
    if (!object.isMesh) return;
    const original = object.material;
    const materials = Array.isArray(original) ? original : [original];
    const updated = materials.map((material) => {
      if (!/Pantallas.*editor de codigo/i.test(material.name)) return material;
      const animated = material.clone();
      animated.map = texture;
      animated.emissiveMap = texture;
      animated.color.set("#ffffff");
      animated.emissive.set("#ffffff");
      animated.emissiveIntensity = 0.8;
      animated.needsUpdate = true;
      return animated;
    });
    if (updated.some((material, index) => material !== materials[index])) {
      replacements.push({ object, original, created: updated.filter((material, index) => material !== materials[index]) });
      object.material = Array.isArray(original) ? updated : updated[0];
    }
  });

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let elapsed = 5;
  const redraw = () => {
    if (document.hidden) return;
    if (!reducedMotion.matches) elapsed += 0.1;
    drawEditor(context, elapsed);
    texture.needsUpdate = true;
    invalidate();
  };
  redraw();
  const timer = window.setInterval(() => {
    if (!reducedMotion.matches) redraw();
  }, 100);
  reducedMotion.addEventListener("change", redraw);

  return () => {
    window.clearInterval(timer);
    reducedMotion.removeEventListener("change", redraw);
    replacements.forEach(({ object, original, created }) => {
      object.material = original;
      created.forEach((material) => material.dispose());
    });
    texture.dispose();
  };
}
