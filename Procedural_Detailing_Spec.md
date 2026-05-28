# 🛠️ Procedural Detailing & Texturing Strategy
**Target Audience: Developer Agent**
*Document created by Senior 3D Visual Artist*

Since we are currently utilizing a procedurally generated model built from primitives in `src/entities/TieFighter.js`, we have some fantastic opportunities to dramatically increase the visual detail (often called "greebling") using pure code and basic textures, before relying on an external `.glb` file.

Here is the specification for taking the procedural tie fighter to the next level.

---

## 1. Texture Mapping on Primitives (`TextureLoader`)
Because Three.js automatically generates UV coordinates for `SphereGeometry` and `CylinderGeometry`, we can map textures directly onto them!
- **Task:** Load generic seamless textures (like a "scratched metal" normal map or "solar panel" texture) and apply them to the currently flat `MeshStandardMaterial`.
- **Implementation:**
  ```javascript
  const textureLoader = new THREE.TextureLoader();
  const hullNormalMap = textureLoader.load('path/to/scratched-metal-normal.jpg');
  hullNormalMap.wrapS = THREE.RepeatWrapping;
  hullNormalMap.wrapT = THREE.RepeatWrapping;
  hullNormalMap.repeat.set(4, 4); // Tile the texture
  
  // Apply to Cockpit & Wings
  cockpitMaterial.normalMap = hullNormalMap;
  cockpitMaterial.normalScale = new THREE.Vector2(0.5, 0.5); // Tune intensity
  ```

---

## 2. Structural Greebling (Adding Physical Details)
A TIE fighter isn't just a perfect sphere and flat hexagons. It's built from mechanical parts. The Developer Agent should add the following physical primitives to `TieFighter.js`:

### A. The Cockpit Viewport (The Glass Window)
The signature look of a TIE is the flat dark window on the front.
- **Task:** Add a slightly flattened cylinder exactly on the front of the sphere (`z: -0.95`).
- **Material:** Highly reflective "glass" material. 
  ```javascript
  const windowGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.1, 16);
  windowGeo.rotateX(Math.PI / 2);
  const windowMat = new THREE.MeshStandardMaterial({ 
      color: 0x050505, // Almost black
      roughness: 0.05, // Highly glossy
      metalness: 0.8   // Reflects HDRI heavily
  });
  const viewport = new THREE.Mesh(windowGeo, windowMat);
  viewport.position.set(0, 0, -0.95);
  tieFighter.add(viewport);
  ```

### B. Viewport Frame (Spider-web support bars)
- **Task:** Add intersecting thin boxes across the viewport to mimic the classic spider-web frame.

### C. Laser Cannons (Physical Mounts)
Currently, `getLaserSpawnPositions()` is defined at `(-2, 0, -1)` and `(2, 0, -1)`, but there are no physical gun barrels there.
- **Task:** Add two long, thin `THREE.CylinderGeometry` objects at those exact coordinates on the bottom corners of the cockpit/wings, protruding forward. Color them dark gunmetal (`0x222222`).

---

## 3. Wing "Solar Panel" Details (Edges)
The inside/outside of TIE wings have a grid pattern. Instead of texturing, we can cheat this via geometry edges!
- **Task:** Use `EdgesGeometry` to trace the outline of the wing geometry. It creates a sleek, high-tech grid look when layered over the flat wing surface.
  ```javascript
  const edges = new THREE.EdgesGeometry(wingGeometry);
  const lineMaterial = new THREE.LineBasicMaterial({ color: 0x111111, linewidth: 2 });
  
  // Attach to both left and right wings
  const leftWingGrid = new THREE.LineSegments(edges, lineMaterial);
  leftWing.add(leftWingGrid); // Local space
  ```

---

## Conclusion for Dev Agent
By stacking physical primitives (viewport, laser cannons) on top of the base sphere, and applying a tiled regular noise/normal map to the materials, the procedural TIE Fighter will transition from a "programmer art placeholder" into a genuinely detailed, textured low-poly ship without ever touching Blender.
