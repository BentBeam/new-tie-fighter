import * as THREE from 'three';

export class TieFighter {
    constructor(scene) {
        this.scene = scene;
        
        this.laserPositions = [
            // Fästa tätt ihop på nedre framkanten av den sfäriska cockpiten (radie 1.0)
            new THREE.Vector3(-0.4, -0.6, -0.8),
            new THREE.Vector3(0.4, -0.6, -0.8)
        ];
        
        this.mesh = this._createMesh();
        
        this.scene.add(this.mesh);
        this.mesh.position.set(0, 0, 0);
    }

    _createMesh() {
        const tieFighter = new THREE.Group();
        
        const cockpitGeometry = new THREE.SphereGeometry(1, 16, 16);
        const cockpitMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            metalness: 0.9,
            roughness: 0.4
        });
        
        const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
        cockpit.castShadow = true;
        cockpit.receiveShadow = true;
        tieFighter.add(cockpit);
        
        const wingGeometry = new THREE.CylinderGeometry(2, 2, 0.2, 6);
        wingGeometry.rotateZ(Math.PI / 2);
        const wingMaterial = new THREE.MeshStandardMaterial({
            color: 0x444444,
            metalness: 0.9,
            roughness: 0.4
        });
        
        const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
        leftWing.position.set(-1.7, 0, 0);
        leftWing.castShadow = true;
        leftWing.receiveShadow = true;
        tieFighter.add(leftWing);
        
        const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
        rightWing.position.set(1.7, 0, 0);
        rightWing.castShadow = true;
        rightWing.receiveShadow = true;
        tieFighter.add(rightWing);
        
        const connectorMaterial = new THREE.MeshStandardMaterial({
            color: 0x444444,
            metalness: 0.9,
            roughness: 0.4,
            flatShading: false
        });
        
        const leftConnectorGeometry = new THREE.CylinderGeometry(0.25, 0.5, 0.9, 16, 1, false);
        leftConnectorGeometry.rotateZ(Math.PI / 2);
        const leftConnector = new THREE.Mesh(leftConnectorGeometry, connectorMaterial);
        leftConnector.position.set(-1.25, 0, 0);
        leftConnector.castShadow = true;
        leftConnector.receiveShadow = true;
        tieFighter.add(leftConnector);
        
        const rightConnectorGeometry = new THREE.CylinderGeometry(0.25, 0.5, 0.9, 16, 1, false);
        rightConnectorGeometry.rotateZ(-Math.PI / 2);
        const rightConnector = new THREE.Mesh(rightConnectorGeometry, connectorMaterial);
        rightConnector.position.set(1.25, 0, 0);
        rightConnector.castShadow = true;
        rightConnector.receiveShadow = true;
        tieFighter.add(rightConnector);
        
        const exhaustGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.1, 6);
        const exhaustMaterial = new THREE.MeshStandardMaterial({
            color: 0x0088ff,
            emissive: 0x00aaff,
            emissiveIntensity: 15.0, // <-- Massive increase
            transparent: true,
            opacity: 1.0 // Make it solid for pure bloom
        });
        
        this.engineGlow = new THREE.Mesh(exhaustGeometry, exhaustMaterial);
        this.engineGlow.position.set(0, 0, 1.05);
        this.engineGlow.rotateX(Math.PI / 2);
        this.engineGlow.scale.set(1, 1, 0.667);
        tieFighter.add(this.engineGlow);
        
        // Create an engine glow light
        const engineLight = new THREE.PointLight(0x0088ff, 3.0, 15);
        engineLight.position.set(0, 0, 1.5);
        tieFighter.add(engineLight);
        
        // Save references for pulsating animation
        this.engineMaterial = exhaustMaterial;
        this.engineLight = engineLight;
        
        // -------------------------------------------------------------
        // NEW GREEBLING (Structural Detailing)
        // -------------------------------------------------------------
        
        // 1. Viewport Glass (Cockpit Window)
        const windowGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.1, 16);
        windowGeo.rotateX(Math.PI / 2);
        const windowMat = new THREE.MeshStandardMaterial({ 
            color: 0x010101, // Extremly dark
            roughness: 0.05, // Glossy glass
            metalness: 0.8
        });
        const viewport = new THREE.Mesh(windowGeo, windowMat);
        viewport.position.set(0, 0, -0.92);
        tieFighter.add(viewport);
        
        // 2. Viewport Spider-web Frame
        const frameMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.9, roughness: 0.6 });
        const vFrameGeo = new THREE.BoxGeometry(0.04, 0.8, 0.15);
        const vFrame = new THREE.Mesh(vFrameGeo, frameMat);
        vFrame.position.set(0, 0, -0.93);
        tieFighter.add(vFrame);
        
        const hFrameGeo = new THREE.BoxGeometry(0.8, 0.04, 0.15);
        const hFrame = new THREE.Mesh(hFrameGeo, frameMat);
        hFrame.position.set(0, 0, -0.93);
        tieFighter.add(hFrame);
        
        const d1Frame = new THREE.Mesh(hFrameGeo, frameMat);
        d1Frame.rotation.z = Math.PI / 4;
        d1Frame.position.set(0, 0, -0.93);
        tieFighter.add(d1Frame);
        
        const d2Frame = new THREE.Mesh(hFrameGeo, frameMat);
        d2Frame.rotation.z = -Math.PI / 4;
        d2Frame.position.set(0, 0, -0.93);
        tieFighter.add(d2Frame);

        // 3. Laser Cannon Muzzles
        const cannonGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.8, 8);
        cannonGeo.rotateX(Math.PI / 2);
        const cannonMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.8, roughness: 0.5 });
        
        const leftCannon = new THREE.Mesh(cannonGeo, cannonMat);
        leftCannon.position.copy(this.laserPositions[0]);
        tieFighter.add(leftCannon);
        
        const rightCannon = new THREE.Mesh(cannonGeo, cannonMat);
        rightCannon.position.copy(this.laserPositions[1]);
        tieFighter.add(rightCannon);
        
        // 4. EdgesGeometry for Solar Panel outlines
        const edges = new THREE.EdgesGeometry(wingGeometry);
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
        
        const leftWingGrid = new THREE.LineSegments(edges, lineMaterial);
        leftWingGrid.scale.set(1.01, 1.01, 1.01); 
        leftWing.add(leftWingGrid); 
        
        const rightWingGrid = new THREE.LineSegments(edges, lineMaterial);
        rightWingGrid.scale.set(1.01, 1.01, 1.01); 
        rightWing.add(rightWingGrid); 

        // 5. Wing Hubs (Små hexagoner i centrum på in/utsidan av vingarna)
        // Ytterligare 20% uppskalning av radie (0.42 -> 0.50). Tjocklek 0.32.
        const hubGeometry = new THREE.CylinderGeometry(0.50, 0.50, 0.32, 6); 
        hubGeometry.rotateZ(Math.PI / 2);
        const hubMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.9, roughness: 0.6 });
        
        const leftHub = new THREE.Mesh(hubGeometry, hubMaterial);
        leftWing.add(leftHub);
        
        const rightHub = new THREE.Mesh(hubGeometry, hubMaterial);
        rightWing.add(rightHub);

        // 6. Wing Spokes (Smala rektanglar ut från navet)
        // Extruderade starkare! Tjocklek (på X-axeln) 0.28. 
        // Bytte utsträckning till Z-axeln (3.95) så att den avfyras mot vingarnas yttre kanter helt naturligt utan extra-rotation!
        const spokeMaterial = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, metalness: 0.9, roughness: 0.7 });
        const spokeGeo = new THREE.BoxGeometry(0.28, 0.12, 3.95); 
        
        // Skapa de tre tvärgående strålarna som utgör den 6-axlade stjärnan
        for (let i = 0; i < 3; i++) {
            const leftSpoke = new THREE.Mesh(spokeGeo, spokeMaterial);
            // Eftersom Z pekar mot CylinderGeometrys hörn, behöver vi noll rotationsoffset!!
            leftSpoke.rotation.x = i * (Math.PI / 3);
            leftWing.add(leftSpoke);
            
            const rightSpoke = new THREE.Mesh(spokeGeo, spokeMaterial);
            rightSpoke.rotation.x = i * (Math.PI / 3);
            rightWing.add(rightSpoke);
        }

        return tieFighter;
    }

    update(time) {
        // Skapa en pulserande effekt för motorn
        if (this.engineMaterial && this.engineLight) {
            // Snabb flimmer + långsam baspuls
            const pulse = Math.sin(time * 20.0) * 0.15 + Math.sin(time * 3.0) * 0.1;
            
            // Variera extrem-bloomen mellan 11.0 och 19.0
            this.engineMaterial.emissiveIntensity = 15.0 + (pulse * 25.0); 
            
            // Variera den fysiska lampans styrka mellan 2.0 och 4.0
            this.engineLight.intensity = 3.0 + (pulse * 4.0);
        }
    }

    getLaserSpawnPositions() {
        return this.laserPositions.map(pos => {
            const worldPosition = pos.clone();
            worldPosition.applyMatrix4(this.mesh.matrixWorld);
            return worldPosition;
        });
    }
}
