import * as THREE from 'three';

export class Container {
    constructor(scene, index, spacing, lateralSpread, verticalSpread) {
        this.scene = scene;
        this.index = index;
        this.destroyed = false;
        this.health = 5;
        this.maxHealth = 5;
        // Shield Variables
        this.shieldHealth = 10;
        this.maxShieldHealth = 10;
        
        this.mesh = this._createMesh(index, spacing, lateralSpread, verticalSpread);
        this.scene.add(this.mesh);
        
        this.healthMeter = this._createHealthMeter();
        this.scene.add(this.healthMeter);
        
        // Physics drift - Only rotation! No translation
        this.rotVelocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.5,
            (Math.random() - 0.5) * 0.5,
            (Math.random() - 0.5) * 0.5
        );
        // Helt statisk position!
        this.velocity = new THREE.Vector3(0, 0, 0);
    }

    _createMesh(index, spacing, lateralSpread, verticalSpread) {
        const containerGroup = new THREE.Group();
        
        const bodyGeometry = new THREE.BoxGeometry(2.5, 2.5, 2.5);
        const bodyMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x555577,
            metalness: 0.8,
            roughness: 0.2
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        containerGroup.add(body);
        
        // ----------------------------------------
        // High-End Shield Mesh (Fresnel Shader)
        // ----------------------------------------
        const shieldGeometry = new THREE.SphereGeometry(3.5, 32, 32);
        
        const shieldMaterial = new THREE.ShaderMaterial({
            uniforms: {
                color: { value: new THREE.Color(0x00ffff) }, // Cyan glow
                impact: { value: 0.0 } // 1.0 when hit
            },
            vertexShader: `
                varying vec3 vNormal;
                varying vec3 vViewPosition;
                void main() {
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    vViewPosition = -mvPosition.xyz;
                    vNormal = normalize(normalMatrix * normal);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                uniform vec3 color;
                uniform float impact;
                varying vec3 vNormal;
                varying vec3 vViewPosition;
        
                void main() {
                    vec3 normal = normalize(vNormal);
                    vec3 viewDir = normalize(vViewPosition);
                    
                    // Korrekt Fresnel (1.0 vid kanten, 0.0 i mitten)
                    float fresnel = 1.0 - max(dot(viewDir, normal), 0.0);
                    // Skärp effekten, pressa bort opaciteten från centrum!
                    fresnel = pow(fresnel, 4.0);
                    
                    // Minska bas-opaciteten för att de inte ska kännas som fasta klot
                    float alpha = fresnel * 0.4 + (impact * 0.7);
                    
                    vec3 finalColor = color * (1.0 + impact * 5.0);
                    
                    gl_FragColor = vec4(finalColor, clamp(alpha, 0.0, 1.0));
                }
            `,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            side: THREE.FrontSide
        });
        
        const shieldMesh = new THREE.Mesh(shieldGeometry, shieldMaterial);
        this.shieldMesh = shieldMesh; // Store reference
        containerGroup.add(shieldMesh);
        
        containerGroup.position.set(
            (Math.random() - 0.5) * lateralSpread,
            (Math.random() - 0.5) * verticalSpread,
            -60 - (index * spacing)
        );
        
        containerGroup.rotation.set(
            Math.random() * Math.PI * 0.3,
            Math.random() * Math.PI * 2,
            Math.random() * Math.PI * 0.3
        );
        
        return containerGroup;
    }

    _createHealthMeter() {
        const meterGroup = new THREE.Group();
        
        // Utvidgad bakgrund för att rymma två bars!
        const bgGeometry = new THREE.PlaneGeometry(2, 0.6);
        const bgMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x222222, transparent: true, opacity: 0.9, side: THREE.DoubleSide
        });
        const background = new THREE.Mesh(bgGeometry, bgMaterial);
        meterGroup.add(background);
        
        // 1. Hull Fill (Vit/Grön - i botten)
        const hullGeometry = new THREE.PlaneGeometry(1.8, 0.2);
        const hullMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
        const hullFill = new THREE.Mesh(hullGeometry, hullMaterial);
        hullFill.position.set(0, -0.15, 0.02);
        meterGroup.add(hullFill);
        
        // 2. Shield Fill (Cyan - i toppen)
        const shieldGeometry = new THREE.PlaneGeometry(1.8, 0.2);
        const shieldMaterial = new THREE.MeshBasicMaterial({ color: 0x00ffff, side: THREE.DoubleSide });
        const shieldFill = new THREE.Mesh(shieldGeometry, shieldMaterial);
        shieldFill.position.set(0, 0.15, 0.02);
        meterGroup.add(shieldFill);
        
        meterGroup.userData.hullFill = hullFill;
        meterGroup.userData.shieldFill = shieldFill;
        meterGroup.userData.isBillboard = true;
        
        return meterGroup;
    }

    update(deltaTime) {
        if (this.destroyed) return;
        
        // Drift and rotate slowly
        this.mesh.rotation.x += this.rotVelocity.x * deltaTime;
        this.mesh.rotation.y += this.rotVelocity.y * deltaTime;
        this.mesh.rotation.z += this.rotVelocity.z * deltaTime;
        
        // Cool down the shield impact flash
        if (this.shieldMesh && this.shieldMesh.visible) {
            let impact = this.shieldMesh.material.uniforms.impact.value;
            if (impact > 0) {
                impact -= deltaTime * 3.0; // Bleeds out over ~0.3s
                this.shieldMesh.material.uniforms.impact.value = Math.max(0, impact);
            }
        }
    }

    takeDamage(amount) {
        if (this.destroyed) return { destroyed: false, hitType: 'hull' };
        
        let hitType = 'hull'; // Track what we hit for sound!
        
        // Sköld -> Hull hierarchy!
        if (this.shieldHealth > 0) {
            hitType = 'shield';
            this.shieldHealth -= amount;
            
            // Flash the shader flare!
            if (this.shieldMesh && this.shieldMesh.visible) {
                this.shieldMesh.material.uniforms.impact.value = 1.0;
            }
            
            // Hantera overflow om lasern slår sönder skölden helt
            if (this.shieldHealth <= 0) {
                const overflow = Math.abs(this.shieldHealth);
                this.health -= overflow; // Ta rest-skada på skrovet
                this.shieldHealth = 0;
                this.shieldMesh.visible = false; // Stäng av kraftfältet!
            }
        } else {
            // Ingen sköld kvar? Skada direkt på kroppen
            this.health -= amount;
        }
        
        // Uppdatera Dubbla UI Bars
        if (this.healthMeter) {
            const hFill = this.healthMeter.userData.hullFill;
            const sFill = this.healthMeter.userData.shieldFill;
            
            // Shield UI
            if (sFill) {
                const shieldRatio = Math.max(0, this.shieldHealth / this.maxShieldHealth);
                sFill.scale.x = shieldRatio > 0 ? shieldRatio : 0.001; 
                sFill.position.x = -0.9 * (1 - shieldRatio);
                if (shieldRatio === 0) sFill.visible = false;
            }
            
            // Hull UI
            if (hFill) {
                const hullRatio = Math.max(0, this.health / this.maxHealth);
                hFill.scale.x = hullRatio > 0 ? hullRatio : 0.001;
                hFill.position.x = -0.9 * (1 - hullRatio);
                
                if (hullRatio > 0.5) hFill.material.color.setHex(0x00ff00);
                else if (hullRatio > 0.2) hFill.material.color.setHex(0xffff00);
                else hFill.material.color.setHex(0xff0000);
            }
        }
        
        if (this.health <= 0) {
            this.destroy();
            return { destroyed: true, hitType: hitType }; 
        }
        return { destroyed: false, hitType: hitType };
    }

    destroy() {
        if (this.destroyed) return;
        this.destroyed = true;
        // Clean up from scene happens in Game.js later
    }

    cleanup() {
        if (this.mesh.parent) {
            this.mesh.parent.remove(this.mesh);
        }
        
        // Traversera och rensa ALLA unika barns material, särskilt ShaderMaterial
        this.mesh.traverse((node) => {
            if (node.geometry) node.geometry.dispose();
            if (node.material) {
                if (Array.isArray(node.material)) node.material.forEach(m => m.dispose());
                else node.material.dispose();
            }
        });
        
        if (this.healthMeter && this.healthMeter.parent) {
            this.healthMeter.parent.remove(this.healthMeter);
            this.healthMeter.traverse((node) => {
                if (node.geometry) node.geometry.dispose();
                if (node.material) node.material.dispose();
            });
        }
    }
}
