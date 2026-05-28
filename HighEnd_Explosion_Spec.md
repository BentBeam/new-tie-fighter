# 💥 High-End Cinematic Explosion Specification
**Target Audience: Developer Agent**
*Document created by Senior 3D Visual Artist*

The current explosions look "retro" because they are using the default untextured `THREE.PointsMaterial`, which renders as sharp squares. To achieve a modern, AAA cinematic explosion that interacts with our new PBR/HDRI environment, please implement the following three systems natively in `src/systems/ParticleSystem.js`.

---

## 1. Soft Particle Textures (No more squares!)
We need to apply an alpha map to the particles so they render as soft, glowing orbs instead of hard squares. Since we don't want to load external image files for simple sparks, we can generate a soft radial gradient procedurally via an off-screen Canvas!

**Task:** In `ParticleSystem.js` constructor, generate a texture and apply it to the material.
```javascript
// Add this helper method to ParticleSystem class
_createParticleTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const context = canvas.getContext('2d');
    
    // Create soft radial gradient
    const gradient = context.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.3, 'rgba(255,255,255,0.8)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    
    context.fillStyle = gradient;
    context.fillRect(0, 0, 32, 32);
    
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
}
```
**Apply the texture:** In `_renderSystem`, update the `PointsMaterial` to include:
```javascript
const material = new THREE.PointsMaterial({
    size: size,
    vertexColors: true,
    map: this._createParticleTexture(), // <-- Apply the soft texture
    transparent: true,
    opacity: opacity,
    sizeAttenuation: useAttenuation,
    blending: THREE.AdditiveBlending,
    depthWrite: false
});
```

---

## 2. Dynamic Impact Lighting (The "Flash")
A real explosion illuminates the environment. With our PBR materials, a single incredibly bright frame of light will cast beautiful reflections on the TIE fighter and surrounding containers.

**Task:** Add a `PointLight` when an explosion occurs that fades out quickly.
1. Add an array `this.explosionLights = [];` in the constructor.
2. In `createExplosion(position)`:
```javascript
// Create intense, short-lived flash
const flashDist = 150;
const flashIntensity = 10.0; // Very high because it's brief
const light = new THREE.PointLight(0xffaa00, flashIntensity, flashDist);
light.position.copy(position);
this.scene.add(light);

this.explosionLights.push({
    light: light,
    life: 0.3,     // Fades out entirely in 0.3 seconds
    maxLife: 0.3
});
```
3. In `updateExplosions(deltaTime)`:
```javascript
// Decay lights
for (let i = this.explosionLights.length - 1; i >= 0; i--) {
    const el = this.explosionLights[i];
    el.life -= deltaTime;
    
    // Decay intensity exponentially
    const power = el.life / el.maxLife;
    el.light.intensity = 10.0 * Math.pow(power, 2);
    
    if (el.life <= 0) {
        this.scene.remove(el.light);
        el.light.dispose();
        this.explosionLights.splice(i, 1);
    }
}
```

---

## 3. High-Velocity Sparks vs. Core Fire
To make the explosion look less uniform, we should separate particles into two behaviors in `createExplosion()`:
- **Core Fire:** 50 particles that move slowly (`speed: 10-20`), stay close, and are large.
- **Micro-Sparks:** 30 particles that shoot out extremely fast (`speed: 60-100`), die much faster (`life: 0.2`), and are tiny. This gives the explosion "spikes" of debris, breaking up the perfect spherical shape! (The Developer Agent can achieve this by dividing the current loop into two smaller loops with different speed/size properties).
