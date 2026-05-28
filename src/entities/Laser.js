import * as THREE from 'three';

export class Laser {
    constructor(scene) {
        this.scene = scene;
        this.active = false;
        
        const laserGeometry = new THREE.CylinderGeometry(0.05, 0.05, 3, 8);
        const laserMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x00ff00,
            transparent: true,
            opacity: 0.9
        });
        laserMaterial.color.multiplyScalar(3.0); // Bloom trigger
        this.mesh = new THREE.Mesh(laserGeometry, laserMaterial);
        
        // Tight radius with linear decay creates the traveling neon glow
        this.light = new THREE.PointLight(0x00ff00, 10, 15, 1); 
        this.light.castShadow = false;
        this.mesh.add(this.light);
        
        this.mesh.visible = false;
        this.userData = {
            direction: new THREE.Vector3(),
            speed: 50,
            life: 0
        };
        
        this.scene.add(this.mesh);
    }

    fire(startPosition, direction) {
        this.active = true;
        this.mesh.visible = true;
        this.mesh.position.copy(startPosition);
        
        this.userData.direction.copy(direction);
        this.userData.life = 2.0;

        // Orient laser
        const lookTarget = this.mesh.position.clone().add(direction);
        this.mesh.lookAt(lookTarget);
        this.mesh.rotateX(Math.PI / 2);
    }

    update(deltaTime) {
        if (!this.active) return false;

        this.userData.life -= deltaTime;
        if (this.userData.life <= 0) {
            this.destroy();
            return false;
        }
        
        const movement = this.userData.direction.clone().multiplyScalar(this.userData.speed * deltaTime);
        this.mesh.position.add(movement);
        return true;
    }

    destroy() {
        if (!this.active) return;
        this.active = false;
        this.mesh.visible = false;
    }
}
