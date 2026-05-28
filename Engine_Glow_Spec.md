# 🚀 Engine Glow & Exhaust Specification
**Target Audience: Developer Agent**
*Document created by Senior 3D Visual Artist*

Following Star Wars lore, Twin Ion Engines (TIE) do not leave physical smoke trails or long particle streaks like traditional rockets. Instead, they emit an incredibly intense, localized optical glow. We are going to achieve this heavily through the Post-Processing Bloom pass rather than standard particles.

Please implement the following changes to modernize the engine thrust:

---

## 1. Disable Legacy Particle Trails
The 1x1 pixel trail and the sparkling particles actually detract from the cinematic realism of a TIE fighter.
- **Task:** In `src/systems/ParticleSystem.js` and `src/core/Game.js`, please disable or entirely remove the calls to `updateShipTrail()` and `createSparklingParticles()`. We are replacing them purely with high-end optical bloom.

---

## 2. Supercharge the Engine Bloom (`src/entities/TieFighter.js`)
To match and even exceed the laser's intensity, we need to push the engine's material far past the UnrealBloomPass threshold.
- **Task:** Locate the `exhaustMaterial` in `TieFighter.js`.
- **Implementation:** Drastically increase the `emissiveIntensity` to force the bloom to bleed outward heavily, creating a thick halo of blue light.
  ```javascript
  const exhaustMaterial = new THREE.MeshStandardMaterial({
      color: 0x0088ff,
      emissive: 0x00aaff, // Brighter cyan/blue base
      emissiveIntensity: 15.0, // <-- Massive increase (was 1.5)
      transparent: true,
      opacity: 1.0 // Make it fully solid
  });
  ```

---

## 3. Dynamic Environment Lighting (The "Ion" Presence)
Just like the explosions, the engines should emit actual light onto the immediate surroundings.
- **Task:** Add a physical blue light source attached to the back of the TIE Fighter that illuminates nearby containers when zooming past them.
- **Implementation:** In `TieFighter.js`, attach a `PointLight` to the `tieFighter` group just behind the engine mesh.
  ```javascript
  // Create an engine glow light
  const engineLight = new THREE.PointLight(0x0088ff, 3.0, 15); // Color, Intensity, Distance
  engineLight.position.set(0, 0, 1.5); // Just behind the exhaust mesh
  tieFighter.add(engineLight);
  ```

### Developer Note: 
With the extreme `emissiveIntensity` of `15.0`, the `EffectComposer` will render a massive, soft cyan glow around the hexagon exhaust, entirely replacing the need for 2D particles behind the ship!
