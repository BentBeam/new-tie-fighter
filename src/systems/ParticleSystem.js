import * as THREE from 'three';
import { GameConfig } from '../utils/Constants.js';

export class ParticleSystem {
    constructor(scene) {
        this.scene = scene;
        this.explosionParticles = [];
        this.explosionLights = []; // To track dynamic impact lights
        
        this.explosionSystem = null;
        this.warpSystem = null;
        this.warpData = [];
        
        this.particleTexture = this._createParticleTexture();
    }

    _createParticleTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const context = canvas.getContext('2d');
        
        const gradient = context.createRadialGradient(16, 16, 0, 16, 16, 16);
        gradient.addColorStop(0, 'rgba(255,255,255,1)');
        gradient.addColorStop(0.3, 'rgba(255,255,255,0.8)');
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        
        context.fillStyle = gradient;
        context.fillRect(0, 0, 32, 32);
        
        return new THREE.CanvasTexture(canvas);
    }

    // ----------------------------------------
    // WARP SPEED PARTICLES
    // ----------------------------------------
    initWarpSystem(parent) {
        const count = 250;
        const positions = new Float32Array(count * 6); // 2 vertices per line
        
        for (let i = 0; i < count; i++) {
            const x = (Math.random() - 0.5) * 150;
            const y = (Math.random() - 0.5) * 150;
            const z = -Math.random() * 200;
            
            positions[i * 6] = x;
            positions[i * 6 + 1] = y;
            positions[i * 6 + 2] = z;
            positions[i * 6 + 3] = x;
            positions[i * 6 + 4] = y;
            positions[i * 6 + 5] = z - 2; 
            
            this.warpData.push({ x, y, z, speed: Math.random() * 60 + 50 });
        }
        
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const material = new THREE.LineBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        });
        
        this.warpSystem = new THREE.LineSegments(geometry, material);
        if (parent) {
            parent.add(this.warpSystem);
        } else {
            this.scene.add(this.warpSystem);
        }
    }
    
    updateWarpParticles(deltaTime, currentSpeed, parent) {
        if (!this.warpSystem) this.initWarpSystem(parent);
        
        // Fartränder syns mest i högsta växeln (t.ex. > 10)
        let effectiveSpeed = Math.max(0, currentSpeed); // Förhindra korruption vid krock
        let intensity = Math.max(0, (effectiveSpeed - 10) / 10); 
        this.warpSystem.material.opacity = intensity * 0.2; 
        if (intensity <= 0) return;
        
        const positions = this.warpSystem.geometry.attributes.position.array;
        
        for (let i = 0; i < this.warpData.length; i++) {
            const data = this.warpData[i];
            
            // Linjen flyger mot kameran
            data.z += (data.speed + effectiveSpeed * 6) * deltaTime;
            
            // Loopa runt sträcken tryggt för att förhindra de flyger iväg ur bild för evigt!
            if (data.z > 20) {
                data.z = -200 - Math.random() * 50;
                data.x = (Math.random() - 0.5) * 150;
                data.y = (Math.random() - 0.5) * 150;
            } else if (data.z < -300) {
                data.z = 20;
            }
            
            // Dynamisk strech-effekt - ju snabbare desto längre sträck!
            const stretch = 2 + (effectiveSpeed * 1.5);
            
            positions[i * 6] = data.x;
            positions[i * 6 + 1] = data.y;
            positions[i * 6 + 2] = data.z;
            
            positions[i * 6 + 3] = data.x;
            positions[i * 6 + 4] = data.y;
            positions[i * 6 + 5] = data.z - stretch;
        }
        
        this.warpSystem.geometry.attributes.position.needsUpdate = true;
    }

    createExplosion(position) {
        // 1. Dynamic Impact Light (Flash)
        const flashDist = 150;
        const flashIntensity = 10.0;
        const light = new THREE.PointLight(0xffaa00, flashIntensity, flashDist);
        light.position.copy(position);
        this.scene.add(light);

        this.explosionLights.push({
            light: light,
            life: 0.3,
            maxLife: 0.3
        });
        
        // 2. Core Fire (Slow, Large)
        for (let i = 0; i < 50; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 10 + 10;
            const angleZ = (Math.random() - 0.5) * Math.PI;
            
            const direction = new THREE.Vector3(
                Math.cos(angle) * Math.cos(angleZ),
                Math.sin(angle) * Math.cos(angleZ),
                Math.sin(angleZ)
            );
            
            this.explosionParticles.push({
                position: position.clone(),
                velocity: direction.multiplyScalar(speed),
                life: 0.5 + Math.random() * 0.5,
                maxLife: 1.0,
                isMicroSpark: false
            });
        }
        
        // 3. Micro-Sparks (Fast, Small)
        for (let i = 0; i < 30; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 40 + 60;
            const angleZ = (Math.random() - 0.5) * Math.PI;
            
            const direction = new THREE.Vector3(
                Math.cos(angle) * Math.cos(angleZ),
                Math.sin(angle) * Math.cos(angleZ),
                Math.sin(angleZ)
            );
            
            this.explosionParticles.push({
                position: position.clone(),
                velocity: direction.multiplyScalar(speed),
                life: 0.1 + Math.random() * 0.1,
                maxLife: 0.2,
                isMicroSpark: true
            });
        }
    }

    updateExplosions(deltaTime) {
        // Handle Dynamic Flash Lights
        for (let i = this.explosionLights.length - 1; i >= 0; i--) {
            const el = this.explosionLights[i];
            el.life -= deltaTime;
            
            const power = el.life / el.maxLife;
            el.light.intensity = 10.0 * Math.pow(Math.max(0, power), 2);
            
            if (el.life <= 0) {
                this.scene.remove(el.light);
                el.light.dispose();
                this.explosionLights.splice(i, 1);
            }
        }
        
        // Handle Particles
        for (let i = this.explosionParticles.length - 1; i >= 0; i--) {
            const p = this.explosionParticles[i];
            p.life -= deltaTime;
            p.position.add(p.velocity.clone().multiplyScalar(deltaTime));
            if (p.life <= 0) {
                this.explosionParticles.splice(i, 1);
            }
        }
        
        this._renderSystem('explosion', this.explosionParticles, 1.5, 1.0, true, (p) => {
            const lifeRatio = p.life / p.maxLife;
            // Hot white to Yellow to Orange to Dark Red
            if (lifeRatio > 0.8) {
                return { r: 1.0, g: 1.0, b: 0.8, alpha: lifeRatio };
            } else if (lifeRatio > 0.4) {
                return { r: 1.0, g: 0.6 * lifeRatio, b: 0.1, alpha: lifeRatio };
            } else {
                return { r: 0.8 * lifeRatio, g: 0.2 * lifeRatio, b: 0.0, alpha: lifeRatio };
            }
        });
    }

    _renderSystem(type, particles, size, opacity, useAttenuation, colorFunc) {
        const systemProp = `${type}System`;
        
        if (this[systemProp]) {
            this.scene.remove(this[systemProp]);
            this[systemProp].geometry.dispose();
            this[systemProp].material.dispose();
            this[systemProp] = null;
        }
        
        if (particles.length === 0) return;
        
        const positions = [];
        const colors = [];
        
        particles.forEach(p => {
            positions.push(p.position.x, p.position.y, p.position.z);
            const c = colorFunc(p);
            // Push RGB channels
            colors.push(c.r, c.g, c.b);
        });
        
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        
        const material = new THREE.PointsMaterial({
            size: size,
            vertexColors: true,
            map: this.particleTexture, // Adderat den mjuka radiala alfan!
            transparent: true,
            opacity: opacity,
            sizeAttenuation: useAttenuation,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        this[systemProp] = new THREE.Points(geometry, material);
        this.scene.add(this[systemProp]);
    }
}
