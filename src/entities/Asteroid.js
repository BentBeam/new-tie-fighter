import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';

export class Asteroid {
    constructor(scene, index, spacing, lateralSpread, verticalSpread) {
        this.scene = scene;
        this.index = index;
        this.destroyed = false;
        this.isAsteroid = true; // Identifier for Game.js collision
        // Dubbel hälsa mot kuberna
        this.health = 10;
        this.maxHealth = 10;
        
        this.mesh = this._createMesh(index, spacing, lateralSpread, verticalSpread);
        this.scene.add(this.mesh);
        
        this.healthMeter = this._createHealthMeter();
        this.scene.add(this.healthMeter);
        
        // Physics drift
        this.rotVelocity = new THREE.Vector3(
            (Math.random() - 0.5) * 1.0,
            (Math.random() - 0.5) * 1.0,
            (Math.random() - 0.5) * 1.0
        );
        
        // Mycket skarpare dykning inåt mot mitten! (Ökade från 0.1 till 0.45)
        this.velocity = new THREE.Vector3(
            -this.mesh.position.x * 0.45,
            -this.mesh.position.y * 0.45,
            8 + Math.random() * 5
        );
    }

    _createMesh(index, spacing, lateralSpread, verticalSpread) {
        const radius = 2.0 + Math.random() * 2.0; // Random size 2 to 4
        // Detail är ökad till 4 för en mycket rundare basgeometri!
        let geometry = new THREE.IcosahedronGeometry(radius, 4);
        
        // Svetsar ihop ALLA överlappkande ("seams") punkter. Modellen konverteras från "triangle soup" till en matematisk solid yta (Indexed).
        // Detta är hemligheten för att `computeVertexNormals()` ska kunna beräkna MJUKA skuggor över kanterna (Gouraud/Smoothed).
        geometry = BufferGeometryUtils.mergeVertices(geometry, 1e-4);
        
        const positions = geometry.attributes.position;
        const v = new THREE.Vector3();
        
        for (let i = 0; i < positions.count; i++) {
            v.fromBufferAttribute(positions, i);
            
            const noise = (Math.sin(v.x * 5) * Math.cos(v.y * 5) * Math.sin(v.z * 5)) * 0.15 
                        + (Math.sin(v.x * 2 + v.y) * 0.1);
            
            const dir = v.clone().normalize();
            v.add(dir.multiplyScalar(noise * radius)); 
            positions.setXYZ(i, v.x, v.y, v.z);
        }
        
        // Beräknar nu vinklarna för ljus. Eftersom modellen är svetsad, mjukas ljuset ut helt!
        geometry.computeVertexNormals();

        const material = new THREE.MeshStandardMaterial({
            color: 0x222222, // Mycket mörkare rymd-sten! (Innan 0x888888)
            roughness: 0.95,
            metalness: 0.05,
            flatShading: false
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        
        mesh.position.set(
            (Math.random() - 0.5) * lateralSpread,
            (Math.random() - 0.5) * verticalSpread,
            -60 - (index * spacing)
        );
        
        mesh.rotation.set(
            Math.random() * Math.PI * 2,
            Math.random() * Math.PI * 2,
            Math.random() * Math.PI * 2
        );
        
        // Add a bounding sphere representation locally for fast collision
        mesh.geometry.computeBoundingSphere();
        this.boundingSphere = mesh.geometry.boundingSphere.clone();
        
        return mesh;
    }

    _createHealthMeter() {
        const meterGroup = new THREE.Group();
        
        const bgGeometry = new THREE.PlaneGeometry(2, 0.3);
        const bgMaterial = new THREE.MeshBasicMaterial({ color: 0x222222, transparent: true, opacity: 0.9, side: THREE.DoubleSide });
        const background = new THREE.Mesh(bgGeometry, bgMaterial);
        meterGroup.add(background);
        
        const fillGeometry = new THREE.PlaneGeometry(1.8, 0.2);
        const fillMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 1.0, side: THREE.DoubleSide });
        const fill = new THREE.Mesh(fillGeometry, fillMaterial);
        fill.position.z = 0.02;
        meterGroup.add(fill);
        
        meterGroup.userData.fill = fill;
        meterGroup.userData.fillMaterial = fillMaterial;
        meterGroup.userData.isBillboard = true;
        
        return meterGroup;
    }

    update(deltaTime) {
        if (this.destroyed) return;
        
        // Drift and rotate slowly
        this.mesh.rotation.x += this.rotVelocity.x * deltaTime;
        this.mesh.rotation.y += this.rotVelocity.y * deltaTime;
        this.mesh.rotation.z += this.rotVelocity.z * deltaTime;
        
        this.mesh.position.addScaledVector(this.velocity, deltaTime);
    }

    takeDamage(amount) {
        if (this.destroyed) return { destroyed: false, hitType: 'hull' };
        
        this.health -= amount;
        
        if (this.healthMeter) {
            const ratio = Math.max(0, this.health / this.maxHealth);
            const fill = this.healthMeter.userData.fill;
            fill.scale.x = ratio;
            fill.position.x = -0.9 * (1 - ratio);
            
            if (ratio > 0.5) fill.material.color.setHex(0x00ff00);
            else if (ratio > 0.2) fill.material.color.setHex(0xffff00);
            else fill.material.color.setHex(0xff0000);
        }
        
        if (this.health <= 0) {
            this.destroy();
            return { destroyed: true, hitType: 'hull' }; 
        }
        return { destroyed: false, hitType: 'hull' };
    }

    destroy() {
        this.destroyed = true;
    }

    cleanup() {
        if (this.mesh.parent) {
            this.mesh.parent.remove(this.mesh);
        }
        if (this.healthMeter && this.healthMeter.parent) {
            this.healthMeter.parent.remove(this.healthMeter);
            this.healthMeter.children.forEach(child => {
                if(child.geometry) child.geometry.dispose();
                if(child.material) child.material.dispose();
            });
        }
        this.mesh.geometry.dispose();
        this.mesh.material.dispose();
    }
}
