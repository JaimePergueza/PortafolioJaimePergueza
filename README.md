# Proyecto web 3D

Base limpia para desarrollar una experiencia con recorrido y animaciones.

## Stack

- React 19 y Vite 6, con JavaScript y CSS.
- Three.js, React Three Fiber y Drei para las escenas 3D.
- React Three Postprocessing para efectos visuales.
- GSAP para animaciones y transiciones.

Se conservan las dependencias y el archivo de bloqueo originales.

## Desarrollo

```sh
npm install
npm run dev
```

`npm run build` genera la versión de producción en `dist/`.
`npm run preview` permite revisar esa compilación.

## Estructura

- `src/main.jsx`: entrada de React.
- `src/App.jsx`: entrada animada y vista final del interior con luz cálida, acentos LED cian, sombras y resplandor. La cámara se ajusta al formato de pantalla.
- `src/assembly.js`: secuencia de ensamblaje desde un fondo vacío, con movimiento de cámara y restauración de las transformaciones originales. Respeta la preferencia de reducir movimiento.
- `src/animatedScreens.js`: editor de código animado en las pantallas.
- `src/plantMotion.js`: brisa suave en el follaje después del ensamblaje. `plantMotionSettings` permite ajustar amplitud, velocidad y frecuencia; respeta la preferencia de reducir movimiento.
- El personaje anterior está desactivado: las raíces `Personaje_Rig` del escenario se ocultan y `Personaje_Typing.glb` no se carga. Los modelos originales se conservan para poder sustituirlos sin reexportar el laboratorio.
- `src/TypingCharacter.jsx`: personaje de Agor_2012 con animación de nueve segundos. `characterSettings` permite ajustar posición, orientación y escala; los muebles del modelo se ocultan.
- `src/chairMotion.js`: sincroniza la silla del laboratorio con el desplazamiento de la silla original de la animación, conservando las ruedas en el suelo.

## Créditos

Personaje: [Low poly man working at a table with a laptop](https://sketchfab.com/3d-models/low-poly-man-working-at-a-table-with-a-laptop-be6b2404359c474fb0ed148e1882516e), de **Agor_2012 (@Agor_)**, bajo licencia **Creative Commons Attribution (CC BY)**, según la página original. Adaptaciones: muebles y accesorios ocultos, ajustes de escala y colocación, y reproducción de la animación en bucle con la silla del laboratorio sincronizada. Detalles adicionales en `public/ATTRIBUTION.md`.
- `public/models/MiZona_estudio.glb`: escenario de Blender con texturas integradas.
- `src/styles.css`: estilos básicos.
- `vite.config.js`: configuración de Vite y ruta de GitHub Pages existente.

El contenido anterior se respalda en `D:\Experimento-respaldo-20261018-192940`.
El historial Git y la configuración de despliegue se conservan.

Al cargar se reproduce un ensamblaje de unos nueve segundos. Al terminar aparece el botón «Repetir ensamblaje». La configuración de la cámara final está en `cameraSettings`, en `src/App.jsx`.
