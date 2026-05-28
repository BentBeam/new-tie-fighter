import { GameConfig } from '../utils/Constants.js';

export class Controls {
    constructor() {
        this.keys = {};
        this.mouseCurrent = { x: 0, y: 0 };
        this.mouseTarget = { x: 0, y: 0 };
        this.isMouseLocked = false;
        this.fireRequested = false;
        this.speedLevelChange = 0; // +1 for increase, -1 for decrease

        this._setupListeners();
    }

    _setupListeners() {
        document.addEventListener('keydown', (event) => {
            this.keys[event.code] = true;
            if (event.code === 'KeyW') this.speedLevelChange = 1;
            if (event.code === 'KeyS') this.speedLevelChange = -1;
            if (event.code === 'Space') {
                event.preventDefault();
                this.fireRequested = true;
            }
        });

        document.addEventListener('keyup', (event) => {
            this.keys[event.code] = false;
        });

        document.addEventListener('click', () => {
            document.body.requestPointerLock = document.body.requestPointerLock || 
                                             document.body.mozRequestPointerLock || 
                                             document.body.webkitRequestPointerLock;
            if (document.body.requestPointerLock) {
                document.body.requestPointerLock();
            }
        });

        document.addEventListener('pointerlockchange', () => {
            this.isMouseLocked = document.pointerLockElement === document.body;
            const statusElement = document.getElementById('status');
            if (statusElement && !statusElement.textContent.includes('ALL TARGETS')) {
                statusElement.textContent = this.isMouseLocked ? 'Flight Mode' : 'Ready';
            }
        });

        document.addEventListener('mousemove', (event) => {
            if (this.isMouseLocked) {
                this.mouseTarget.x += event.movementX * GameConfig.ROTATION_SPEED;
                this.mouseTarget.y += event.movementY * GameConfig.ROTATION_SPEED;
                
                // Radiell begränsning (cappas till ungefär halva skärmen i radie)
                const maxRadius = 0.6; 
                const currentRadius = Math.sqrt(this.mouseTarget.x * this.mouseTarget.x + this.mouseTarget.y * this.mouseTarget.y);
                
                if (currentRadius > maxRadius) {
                    this.mouseTarget.x = (this.mouseTarget.x / currentRadius) * maxRadius;
                    this.mouseTarget.y = (this.mouseTarget.y / currentRadius) * maxRadius;
                }
            }
        });
    }

    consumeSpeedChange() {
        const change = this.speedLevelChange;
        this.speedLevelChange = 0;
        return change;
    }

    consumeFireRequest() {
        if (this.fireRequested) {
            this.fireRequested = false;
            return true;
        }
        return false;
    }

    update(deltaTime) {
        // Smoothly interpolate current mouse to target mouse, framerate independent
        const lerpFactor = 1.0 - Math.exp(-15 * deltaTime);
        this.mouseCurrent.x += (this.mouseTarget.x - this.mouseCurrent.x) * lerpFactor;
        this.mouseCurrent.y += (this.mouseTarget.y - this.mouseCurrent.y) * lerpFactor;
    }
}
