# 🎨 Art Direction & Visual Overhaul Specification
**Target Audience: Developer Agent**
*Document created by Senior 3D Visual Artist*

This document outlines the technical specifications for elevating the visual fidelity of the TIE Fighter game. The goal is to move from flat geometric primitives to a modern physically-based rendering (PBR) pipeline with cinematic post-processing.

Please implement these changes into the new modular `src/` architecture.

---

## 1. Import Map & Addons Setup (`index.html`)
To achieve the visual effects, we need external Three.js modules (Loaders and Post-processing).
- **Task:** Update the ES Module import map in `index.html`.
- **Addition:** Add the unpkg CDN path for `three/addons/` that explicitly matches our r144 version:
  ```json
  "imports": {
      "three": "./js/three/three.module.js",
      "three/addons/": "https://unpkg.com/three@0.144.0/examples/jsm/"
  }
  ```

---

## 2. Rendering Pipeline & Tone Mapping (`src/core/Game.js`)
We must instruct the WebGLRenderer to process light like a film camera.
- **Task:** In the `Game.js` constructor where the `renderer` is initialized, set:
  ```javascript
  this.renderer.outputEncoding = THREE.sRGBEncoding;
  this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
  this.renderer.toneMappingExposure = 1.0;
  ```

---

## 3. HDRI Environment Setup (`src/systems/Environment.js`)
To make PBR materials (like metal and glass) look realistic, they need a high-dynamic-range image (HDRI) to reflect.
- **Task:** Import `RGBELoader` from `three/addons/loaders/RGBELoader.js`.
- **Implementation:** Load the `.hdr` space/starmap file (we downloaded a placeholder to `assets/env/space.hdr`). Once loaded, apply it to both the scene background AND environment:
  ```javascript
  const loader = new RGBELoader();
  loader.load('assets/env/space.hdr', (texture) => {
      texture.mapping = THREE.EquirectangularReflectionMapping;
      this.scene.background = texture;
      this.scene.environment = texture; // Crucial for PBR reflections
  });
  ```

---

## 4. Post-Processing: Cinematic Bloom (`src/core/Game.js`)
Space scenes require intense contrast. Lasers and engines should organically glow (bloom) over the dark background.
- **Task:** Import `EffectComposer`, `RenderPass`, and `UnrealBloomPass` from `three/addons/postprocessing/`.
- **Initialization:** Create a composer pipeline.
  ```javascript
  this.composer = new EffectComposer(this.renderer);
  this.composer.addPass(new RenderPass(this.scene, this.camera));
  
  // Settings: Low resolution for performance, high threshold so only VERY bright things glow
  const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      1.5,   // strength
      0.4,   // radius
      0.85   // threshold
  );
  this.composer.addPass(bloomPass);
  ```
- **Loop Update:** Replace `this.renderer.render()` with `this.composer.render()` in the animation loop.

---

## 5. Material & Entity Upgrades (`src/entities/`)
We are abandoning `MeshPhongMaterial` and standard colors.
- **Containers (`Container.js`):** Upgrade materials to `MeshStandardMaterial`. Set `metalness: 0.8` and `roughness: 0.2` so they beautifully reflect the new HDRI environment.
- **Lasers (`Laser.js`):** To trigger the UnrealBloomPass, the laser material needs extreme color values. Multiply the basic green color scalar so the bloom threshold captures it: 
  ```javascript
  const laserMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
  laserMaterial.color.multiplyScalar(2.5); // Forces it to glow!
  ```
- **TIE Fighter (`TieFighter.js`):** In the future, the primitive generator should be replaced entirely with a `GLTFLoader` implementation loading a `.glb` asset. For now, try pushing the `metalness` to `0.9` and `roughness` to `0.4` on the TIE materials so they reflect the new environment.

---

## 6. Visual "Juice" / Game Feel (`src/core/Game.js` or Camera System)
Visuals are also about motion.
- **Dynamic FOV (Speed Warp):** In the animation loop, smoothly interpolate (lerp) the camera's `fov`. Base FOV is 75. When flying at maximum speed, lerp towards 90 to create the illusion of high speed. *Remember to call `camera.updateProjectionMatrix()` when changing FOV.*
- **Camera Shake:** When the `fireLaser()` method fires, inject 5-10 frames of minor randomized rotational offsets to the camera (`Math.random() * 0.02`) to give the cannons physical weight.
