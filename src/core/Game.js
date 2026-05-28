import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { GameConfig } from '../utils/Constants.js';
import { AudioSystem } from './AudioSystem.js';
import { Controls } from '../systems/Controls.js';
import { Environment } from '../systems/Environment.js';
import { ParticleSystem } from '../systems/ParticleSystem.js';
import { UIManager } from '../ui/UIManager.js';
import { ResultsScreen } from '../ui/ResultsScreen.js';
import { TieFighter } from '../entities/TieFighter.js';
import { Container } from '../entities/Container.js';
import { Asteroid } from '../entities/Asteroid.js';
import { Laser } from '../entities/Laser.js';

export class Game {
    constructor() {
        console.log('🚀 TIE Fighter Game (Modular/r184) Loading...');
        
        // Setup Three.js core
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000011);
        // Minskad FOV för att undvika fish-eye på extrema kanter
        this.camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 10000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        
        // r184 specific settings & Post-Processing Setup
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;
        
        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(new RenderPass(this.scene, this.camera));
        
        const bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            1.0,   // strength (Minskad från 1.5 för renare, mer subtil glow)
            0.4,   // radius
            0.85   // threshold
        );
        this.composer.addPass(bloomPass);
        
        // Game state
        this.speedLevels = GameConfig.SPEED_LEVELS;
        this.currentSpeedLevel = GameConfig.DEFAULT_SPEED_LEVEL;
        this.velocity = new THREE.Vector3();
        this.gameStarted = false;
        
        // Gauntlet / Container system
        this.containers = [];
        this.containersDestroyed = 0;
        this.levelCompleted = false;
        this.showResults = false;
        this.endMarker = null;
        this.cameraShake = 0;
        
        // Timer system
        this.startTime = null;
        this.endTime = null;
        this.completionTime = 0;
        this.timerStarted = false;

        // Weapons
        this.laserPool = [];
        this.canFire = true;
        this.laserHeat = 0;
        this.weaponJammed = false;
        this.lastShotTime = 0;
        
        // Caches for GC optimization
        this._laserBox = new THREE.Box3();
        this._containerBox = new THREE.Box3();
        this._laserSize = new THREE.Vector3(1, 1, 3);
        
        // Time management
        this.clock = new THREE.Clock();
        
        // Load Systems & Entities
        this.audioSystem = new AudioSystem();
        this.controls = new Controls();
        this.environment = new Environment(this.scene);
        this.particleSystem = new ParticleSystem(this.scene);
        this.tieFighterObject = new TieFighter(this.scene);
        this.tieFighter = this.tieFighterObject.mesh;
        
        // UI
        this.uiManager = new UIManager(this);
        this.resultsScreen = new ResultsScreen(this);

        this.init();
    }

    init() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        // Ensure composer also receives the correct resolution and pixel density
        this.composer.setSize(window.innerWidth, window.innerHeight);
        this.composer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.getElementById('container').appendChild(this.renderer.domElement);
        
        this._createContainerGauntlet();
        this._setupLaserPool();
        this._setupCamera();
        
        window.addEventListener('resize', () => this._onWindowResize());
        
        document.getElementById('loading').style.display = 'none';
        
        // Start the clock implicitly when first called
        this.clock.start();
        this.animate();
    }

    startGame() {
        if (this.gameStarted) return;
        this.gameStarted = true;
        
        this.audioSystem.stopDarthTheme();
        this.audioSystem.playBackgroundMusic();
        this.uiManager.hideStartScreen();
        
        // Uppstartssekvens-ljuden spelas nu gemensamt!
        this.audioSystem.playSound('flyby', 1.0);
        this.audioSystem.playSound('initiate', 0.8);
        
        const lockFunc = document.body.requestPointerLock || 
                         document.body.mozRequestPointerLock || 
                         document.body.webkitRequestPointerLock;
        if (lockFunc) lockFunc.call(document.body);
    }

    restartLevel() {
        const resultsScreenEl = document.getElementById('results-screen');
        if (resultsScreenEl) resultsScreenEl.remove();
        
        this.audioSystem.stopBackgroundMusic();
        this.audioSystem.stopDarthTheme();
        this.audioSystem.playBackgroundMusic();
        
        // Uppstartssekvens-ljuden även vid omstart!
        this.audioSystem.playSound('flyby', 1.0);
        this.audioSystem.playSound('initiate', 0.8);
        
        this.containersDestroyed = 0;
        this.levelCompleted = false;
        this.showResults = false;
        
        this.startTime = null;
        this.endTime = null;
        this.completionTime = 0;
        this.timerStarted = false;
        
        this.containers.forEach(container => container.cleanup());
        this.containers = [];
        
        if (this.endMarker) {
            this.scene.remove(this.endMarker);
        }
        
        this.tieFighter.position.set(0, 0, 0);
        this.tieFighter.rotation.set(0, 0, 0); // reset rotation
        this.velocity.set(0, 0, 0);
        this.controls.mouseTarget = { x: 0, y: 0 };
        this.controls.mouseCurrent = { x: 0, y: 0 };
        
        // Reset Spelmekanik
        this.currentSpeedLevel = GameConfig.DEFAULT_SPEED_LEVEL;
        this.laserHeat = 0;
        this.weaponJammed = false;
        this.lastShotTime = 0;
        this.canFire = true;
        
        this._createContainerGauntlet();
    }

    _createContainerGauntlet() {
        for (let i = 0; i < GameConfig.TOTAL_CONTAINERS; i++) {
            let obstacle;
            if (i > 0 && i % 4 === 0) {
                obstacle = new Asteroid(this.scene, i, 36, 50, 30); // Ökat avstånd (var 18)
            } else {
                obstacle = new Container(this.scene, i, 36, 15, 8); // Ökat avstånd (var 18)
            }
            this.containers.push(obstacle);
        }
        this._createEndMarker();
    }

    _setupLaserPool() {
        for (let i = 0; i < 100; i++) {
            this.laserPool.push(new Laser(this.scene));
        }
    }

    _createEndMarker() {
        const markerGroup = new THREE.Group();
        const torusGeometry = new THREE.TorusGeometry(12, 0.8, 6, 6);
        const torusMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x15f2fd,
            emissive: 0x004466,
            shininess: 100,
            transparent: true,
            opacity: 0.9
        });
        const torus = new THREE.Mesh(torusGeometry, torusMaterial);
        markerGroup.add(torus);
        markerGroup.position.set(0, 0, -60 - (GameConfig.TOTAL_CONTAINERS * 36) - 30);
        
        this.endMarker = markerGroup;
        this.scene.add(markerGroup);
    }

    _setupCamera() {
        this.camera.position.set(0, 4, 7);
        this.camera.lookAt(0, 0, 0);
    }

    _onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.composer.setSize(window.innerWidth, window.innerHeight);
    }

    _fireLaser() {
        if (!this.canFire || this.weaponJammed) return;
        
        // Blockera skjutande och öka värmen
        this.canFire = false;
        this.laserHeat += 7.5; // Överhettas hälften så snabbt som innan
        this.lastShotTime = performance.now();
        
        if (this.laserHeat >= 100) {
            this.laserHeat = 100;
            this.weaponJammed = true; // Vapnet överhettat!
        }
        
        setTimeout(() => { this.canFire = true; }, GameConfig.FIRE_RATE);
        
        this.audioSystem.playSound('laser', 0.3);
        this.cameraShake = 0.5; // Inject Juice: screen shake on firing
        
        const spawnPositions = this.tieFighterObject.getLaserSpawnPositions();
        const direction = new THREE.Vector3(0, 0, -1);
        direction.applyQuaternion(this.tieFighter.quaternion);

        spawnPositions.forEach(pos => {
            // Find an inactive laser
            const laser = this.laserPool.find(l => !l.active);
            if (laser) {
                laser.fire(pos, direction);
            }
        });
    }

    _updateTIEFighter(deltaTime) {
        // Speed control
        const speedChange = this.controls.consumeSpeedChange();
        if (speedChange === 1 && this.currentSpeedLevel < this.speedLevels.length - 1) {
            this.currentSpeedLevel++;
        } else if (speedChange === -1 && this.currentSpeedLevel > 0) {
            this.currentSpeedLevel--;
        }
        const targetSpeed = this.speedLevels[this.currentSpeedLevel];

        // Smooth velocity
        const forwardDirection = new THREE.Vector3(0, 0, -1);
        forwardDirection.applyQuaternion(this.tieFighter.quaternion);
        const targetVelocity = forwardDirection.clone().multiplyScalar(targetSpeed);
        this.velocity.lerp(targetVelocity, GameConfig.ACCELERATION);
        this.tieFighter.position.add(this.velocity.clone().multiplyScalar(deltaTime));

        // Pitch & Yaw based on mouse
        this.tieFighter.rotation.x = this.controls.mouseCurrent.y * 1.0;
        this.tieFighter.rotation.y = -this.controls.mouseCurrent.x * 1.5;
        this.tieFighter.rotation.z = -this.controls.mouseCurrent.x * 1.0;

        // Asteroid Collision Check
        if (this.gameStarted && !this.levelCompleted) {
            for (let container of this.containers) {
                // Nu kollar vi krockar för BÅDE Asteroid och Kub
                if (!container.destroyed) {
                    const dist = this.tieFighter.position.distanceTo(container.mesh.position);
                    const collisionRadius = container.isAsteroid ? 3.5 : 4.0;
                    if (dist < collisionRadius) { 
                        this.cameraShake = 1.0;
                        this.startTime -= 10000; // 10s penalty
                        this.audioSystem.playSound('explosion2', 0.8); // Ihålig metallisk träff
                        
                        // Bounce the ship back a bit
                        this.tieFighter.position.z += 5;
                        this.velocity.z *= -0.5;
                        
                        // Destroy asteroid to prevent multiple hits
                        container.destroy();
                        this.particleSystem.createExplosion(container.mesh.position);
                    }
                }
            }
        }

        // Update particles
        this.particleSystem.updateExplosions(deltaTime);

        // Timer check
        if (!this.timerStarted && this.tieFighter.position.length() > 5.0) {
            this.timerStarted = true;
            this.startTime = Date.now();
        }

        // End marker check
        if (this.gameStarted && !this.levelCompleted) {
            if (this.endMarker && this.tieFighter.position.z < this.endMarker.position.z + 5) {
                this.levelCompleted = true;
                this.endTime = Date.now();
                this.completionTime = (this.endTime - this.startTime) / 1000;
                this.showResults = true;
                this.controls.isMouseLocked = false;
                if (document.pointerLockElement) {
                    document.exitPointerLock();
                }
                this.resultsScreen.displayResults(this.containersDestroyed, GameConfig.TOTAL_CONTAINERS, this.completionTime);
            }
        }
    }

    _updateLasers(deltaTime) {
        if (this.controls.consumeFireRequest()) {
            this._fireLaser();
        }

        for (let i = 0; i < this.laserPool.length; i++) {
            const laser = this.laserPool[i];
            if (!laser.active) continue;

            const isAlive = laser.update(deltaTime);

            if (!isAlive || this._checkLaserCollisions(laser)) {
                laser.destroy();
            }
        }
    }

    _checkLaserCollisions(laser) {
        this._laserBox.setFromCenterAndSize(laser.mesh.position, this._laserSize);

        for (let container of this.containers) {
            if (!container.destroyed) {
                this._containerBox.setFromObject(container.mesh);
                if (this._laserBox.intersectsBox(this._containerBox)) {
                    
                    const result = container.takeDamage(1);
                    
                    if (result.destroyed) {
                        // Olika döds-ljud för Asteroid/Kub
                        if (container.isAsteroid) {
                            this.audioSystem.playSound('explosion2', 0.8);
                        } else {
                            this._playExplosionSound(); 
                        }
                        
                        this.particleSystem.createExplosion(container.mesh.position);
                        this.containersDestroyed++;
                        if (this.containersDestroyed === GameConfig.TOTAL_CONTAINERS) {
                            this.audioSystem.playSound('darth', 0.8, false);
                        }
                        container.cleanup(); // remove from scene immediately
                    } else {
                        // Olika träff-ljud beroende på Träff-yta!
                        if (result.hitType === 'shield') {
                            this.audioSystem.playSound('shieldHit', 0.8);
                        } else {
                            this.audioSystem.playSound('hullHit', 0.8);
                        }
                    }
                    return true; // Laser hit
                }
            }
        }
        return false;
    }

    _playExplosionSound() {
        this.audioSystem.playSound('explosion', 0.5);
    }

    _updateHealthMeterBillboards() {
        this.containers.forEach(container => {
            if (!container.destroyed && container.healthMeter) {
                container.healthMeter.position.copy(container.mesh.position);
                container.healthMeter.position.y += 3;
                container.healthMeter.lookAt(this.camera.position);
            }
        });
    }

    _updateObstacles(deltaTime) {
        this.containers.forEach(container => {
            if (container.update) container.update(deltaTime);
        });
    }

    _updateCamera(deltaTime) {
        const speed = this.velocity.length();
        const speedNormalized = Math.min(speed / GameConfig.MAX_VELOCITY, 1);
        const speedDist = speedNormalized * 3;
        
        // Dynamic FOV for speed illusion
        const targetFOV = 65 + (speedNormalized * 20);
        this.camera.fov += (targetFOV - this.camera.fov) * deltaTime * 4;
        this.camera.updateProjectionMatrix();
        
        const cameraOffset = new THREE.Vector3(
            this.controls.mouseCurrent.x * 2,
            4 + this.controls.mouseCurrent.y * 1,
            6 + speedDist
        );
        
        const targetPosition = this.tieFighter.position.clone().add(cameraOffset);
        this.camera.position.lerp(targetPosition, 0.08);
        
        const lookAtTarget = this.tieFighter.position.clone();
        lookAtTarget.add(new THREE.Vector3(0, 0, -5)); // Tittar lite rakare in
        this.camera.lookAt(lookAtTarget);
        
        // Screen Shake Application
        if (this.cameraShake > 0) {
            this.cameraShake -= deltaTime * 2;
            if (this.cameraShake < 0) this.cameraShake = 0;
            this.camera.position.x += (Math.random() - 0.5) * this.cameraShake;
            this.camera.position.y += (Math.random() - 0.5) * this.cameraShake;
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        if (!this.gameStarted) {
            this.clock.getDelta(); // flush delta so first frame isn't huge
            this.composer.render();
            return;
        }
        
        const deltaTime = Math.min(this.clock.getDelta(), 0.1); // Cap delta to avoid large jumps if tab is inactive
        
        this.controls.update(deltaTime);
        this.tieFighterObject.update(this.clock.elapsedTime); // <-- Fix for pulsating engine glow
        this._updateTIEFighter(deltaTime);
        this._updateLasers(deltaTime);
        this._updateObstacles(deltaTime);
        this._updateHealthMeterBillboards();
        this._updateCamera(deltaTime);
        
        this.environment.updateRotation(this.tieFighter);
        this.uiManager.updateCrosshair(this.tieFighter, this.camera);
        
        // Vapnets nedkylning (Startar nu efter 0.2 sek och svalnar blixtsnabbt)
        if (performance.now() - this.lastShotTime > 200) {
            if (this.laserHeat > 0) {
                this.laserHeat -= deltaTime * 150;
                if (this.laserHeat <= 0) {
                    this.laserHeat = 0;
                    this.weaponJammed = false; // Klick! Vapen redo
                }
            }
        }
        
        // Uppdatera Warp Partiklar och UI
        const currentSpeed = this.velocity.z * -1;
        if (this.particleSystem.updateWarpParticles) {
            this.particleSystem.updateWarpParticles(deltaTime, currentSpeed, this.camera);
        }

        if (this.uiManager && this.tieFighter) {
            // Nu spottar vi ut ALL nya data till UIManager
            this.uiManager.updateHUD(
                this.currentSpeedLevel, // Skickar index (0,1,2) för växel UI
                this.tieFighter.position,
                this.containersDestroyed,
                GameConfig.TOTAL_CONTAINERS,
                this.levelCompleted,
                this.laserHeat,
                this.weaponJammed
            );
        }
        this.uiManager.updateTimerDisplay(
            this.timerStarted,
            this.levelCompleted,
            this.startTime,
            this.completionTime
        );

        this.composer.render();
    }
}
