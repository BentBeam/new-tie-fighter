# 🛡️ Force Field Shield Specification
**Target Audience: Developer Agent**
*Document created by Senior 3D Visual Artist*

To achieve a true "High End" sci-fi shield (a round force field that is nearly invisible in the center but glows brightly at the edges), we cannot use standard materials. We must use a **Custom ShaderMaterial** to calculate the mathematical "Fresnel Effect" (Rim Lighting), combined with UI and logic updates.

Please implement the following directly into `src/entities/Container.js`.

---

## 1. Logic & State Variables
Containers now need shield variables. In the constructor:
- `this.shieldHealth = 10;`
- `this.maxShieldHealth = 10;`
- `this.shieldImpactIntensity = 0;` (Used to flash the shield when hit)

---

## 2. The Shield Mesh (Custom Fresnel Shader)
Inside `_createMesh()`, after building the `BoxGeometry`, add a `SphereGeometry` wrapper surrounding the box.

**Task:** Create this exact `ShaderMaterial`.
```javascript
const shieldGeometry = new THREE.SphereGeometry(3.5, 32, 32);

// High-End Fresnel Shader
const shieldMaterial = new THREE.ShaderMaterial({
    uniforms: {
        color: { value: new THREE.Color(0x00ffff) }, // Cyan glow
        impact: { value: 0.0 } // Flashes to 1.0 when hit
    },
    vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPositionNormal;
        void main() {
            // Calculate normal pointing towards camera
            vNormal = normalize(normalMatrix * normal);
            vPositionNormal = normalize((modelViewMatrix * vec4(position, 1.0)).xyz);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform vec3 color;
        uniform float impact;
        varying vec3 vNormal;
        varying vec3 vPositionNormal;

        void main() {
            // Fresnel calculation (edges glow, center is transparent)
            float fresnel = pow(0.7 - dot(vNormal, vPositionNormal), 3.0);
            
            // Add impact flash and clamp
            float alpha = clamp(fresnel + (impact * 0.8), 0.0, 1.0);
            
            // If impacted, multiply color heavily so Bloom pass picks it up!
            vec3 finalColor = color * (1.0 + impact * 3.0);
            
            gl_FragColor = vec4(finalColor, alpha);
        }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.FrontSide
});

const shieldMesh = new THREE.Mesh(shieldGeometry, shieldMaterial);
this.shieldMesh = shieldMesh; // Store reference so we can update uniforms
containerGroup.add(shieldMesh);
```

---

## 3. UI Update: Dual Health Bars
Inside `_createHealthMeter()`, we must now generate a stacked bar setup.
- Keep the current background and `fill` (Hull Health).
- **Task:** Create a second fill plane situated slightly higher on the Y axis (e.g., `y: 0.25`). Color it cyan (`0x00ffff`).
- Store both references: `meterGroup.userData.hullFill` and `meterGroup.userData.shieldFill`.

---

## 4. Hit Interaction & Damage Priority
Update `takeDamage(amount)` to handle the shield first:
1. If `this.shieldHealth > 0`:
   - Subtract damage from `shieldHealth`.
   - Set `this.shieldMaterial.uniforms.impact.value = 1.0;` (Triggers the bright flash!)
   - Scale down the `shieldFill` UI bar.
   - If `shieldHealth <= 0`, hide the shield: `this.shieldMesh.visible = false;` and apply any leftover damage to the hull.
2. If `this.shieldHealth <= 0`:
   - Damage applies directly to the Hull as it previously did.

## 5. Animation (The Fade Out)
In the `update(deltaTime)` loop, add a line to slowly fade the shield flash back to zero after it gets hit.
```javascript
// Slowly cool down the impact flash
if (this.shieldMesh && this.shieldMesh.material.uniforms.impact.value > 0) {
    this.shieldMesh.material.uniforms.impact.value -= deltaTime * 3.0; // Fades in ~0.3s
    if (this.shieldMesh.material.uniforms.impact.value < 0) {
        this.shieldMesh.material.uniforms.impact.value = 0;
    }
}
```

### Result
This will result in an invisible sphere that has a faint, glowing blue outline. Upon laser impact, the entire sphere instantly flares up into a blinding blue orb that interacts with the post-processing Bloom, before quickly fading back into a ghostly outline.
