import * as THREE from 'three';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

export class Environment {
    constructor(scene) {
        this.scene = scene;
        this.stars = null;
        this.nebula = null;
        this.backgroundRotation = { x: 0, y: 0, z: 0 };
        this.previousShipRotation = { x: 0, y: 0, z: 0 };
        
        this._createStarfield();
        this._createNebula();
        this._createLighting();
        this._loadHDRI();
    }

    _loadHDRI() {
        const loader = new RGBELoader();
        loader.load('assets/env/new_test_plain32bit.hdr', (texture) => {
            texture.mapping = THREE.EquirectangularReflectionMapping;
            this.scene.background = texture;
            this.scene.environment = texture; // Crucial for PBR reflections
        });
    }

    _createLighting() {
        // Main directional light (sun)
        const sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
        sunLight.position.set(100, 100, 50);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 2048;
        sunLight.shadow.mapSize.height = 2048;
        sunLight.shadow.camera.near = 0.5;
        sunLight.shadow.camera.far = 500;
        sunLight.shadow.camera.left = -100;
        sunLight.shadow.camera.right = 100;
        sunLight.shadow.camera.top = 100;
        sunLight.shadow.camera.bottom = -100;
        this.scene.add(sunLight);
        
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4); 
        this.scene.add(ambientLight);
    }

    _createStarfield() {
        const starCount = 3000;
        const positions = new Float32Array(starCount * 3);
        const colors = new Float32Array(starCount * 4);
        
        for (let i = 0; i < starCount; i++) {
            const i3 = i * 3;
            const i4 = i * 4;
            
            const radius = 800 + Math.random() * 1200;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            
            positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i3 + 2] = radius * Math.cos(phi);
            
            const starType = Math.random();
            const brightness = 0.3 + Math.random() * 0.7;
            const opacity = 0.2 + Math.random() * 0.8;
            let r, g, b;
            
            if (starType < 0.7) {
                r = g = b = brightness;
            } else if (starType < 0.85) {
                r = brightness * (0.7 + Math.random() * 0.3);
                g = brightness * (0.8 + Math.random() * 0.2);
                b = brightness;
            } else {
                r = brightness;
                g = brightness * (0.7 + Math.random() * 0.3);
                b = brightness * (0.4 + Math.random() * 0.4);
            }
            
            colors[i4] = r;
            colors[i4 + 1] = g;
            colors[i4 + 2] = b;
            colors[i4 + 3] = opacity;
        }
        
        const starGeometry = new THREE.BufferGeometry();
        starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        starGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 4));
        
        const starMaterial = new THREE.PointsMaterial({
            size: 1.0,
            vertexColors: true,
            transparent: true,
            opacity: 1.0,
            sizeAttenuation: false,
            blending: THREE.NormalBlending
        });
        
        this.stars = new THREE.Points(starGeometry, starMaterial);
        this.scene.add(this.stars);
    }

    _createNebula() {
        const nebulaGeometry = new THREE.SphereGeometry(2000, 32, 32);
        const nebulaMaterial = new THREE.MeshBasicMaterial({
            color: 0x0a0a2a,
            transparent: true,
            opacity: 0.3,
            side: THREE.BackSide,
            depthWrite: false
        });
        this.nebula = new THREE.Mesh(nebulaGeometry, nebulaMaterial);
        this.scene.add(this.nebula);
    }

    updateRotation(tieFighter) {
        if (!tieFighter) return;
        
        const currentRotation = {
            x: tieFighter.rotation.x,
            y: tieFighter.rotation.y,
            z: tieFighter.rotation.z
        };
        
        const deltaX = currentRotation.x - this.previousShipRotation.x;
        const deltaY = currentRotation.y - this.previousShipRotation.y;
        const deltaZ = currentRotation.z - this.previousShipRotation.z;
        
        const backgroundSpeed = 0.02;
        this.backgroundRotation.x += deltaX * backgroundSpeed;
        this.backgroundRotation.y += deltaY * backgroundSpeed;
        this.backgroundRotation.z += deltaZ * backgroundSpeed;
        
        if (this.stars) {
            this.stars.rotation.x = this.backgroundRotation.x;
            this.stars.rotation.y = this.backgroundRotation.y;
            this.stars.rotation.z = this.backgroundRotation.z;
        }
        
        if (this.nebula) {
            this.nebula.rotation.x = this.backgroundRotation.x * 0.5;
            this.nebula.rotation.y = this.backgroundRotation.y * 0.5;
            this.nebula.rotation.z = this.backgroundRotation.z * 0.5;
        }
        
        this.previousShipRotation.x = currentRotation.x;
        this.previousShipRotation.y = currentRotation.y;
        this.previousShipRotation.z = currentRotation.z;
    }
}
