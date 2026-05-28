import * as THREE from 'three';

export class UIManager {
    constructor(game) {
        this.game = game; // reference to main game instance
        this.startScreen = document.getElementById('start-screen');
        this.speedElement = document.getElementById('speed'); // Kan vara null nu, det är okej
        this.altitudeElement = document.getElementById('altitude');
        this.timerElement = document.getElementById('timer');
        this.targetsElement = document.getElementById('targets');
        this.statusElement = document.getElementById('status');
        this.crosshairElement = document.getElementById('crosshair');
        
        // Diegetic HUD elements
        this.heatMeterElement = document.getElementById('heat-meter');
        this.heatTrackElement = document.querySelector('.heat-fill-track');
        this.speedMeterElement = document.getElementById('speed-meter');
        
        this.missionTime = 0;
        this._initStartScreen();
    }

    _initStartScreen() {
        const startButton = document.getElementById('start-button');
        const soundToggle = document.getElementById('sound-toggle');
        
        if (startButton) {
            startButton.addEventListener('click', () => {
                this.game.startGame();
            });
        }
        
        if (soundToggle) {
            soundToggle.addEventListener('click', () => {
                const isEnabled = this.game.audioSystem.toggleSound();
                soundToggle.textContent = isEnabled ? 'SOUND: ON' : 'SOUND: OFF';
            });
        }
        
        const startDarthOnInteraction = () => {
            if (!this.game.gameStarted) {
                this.game.audioSystem.playDarthTheme();
            }
            document.removeEventListener('click', startDarthOnInteraction);
            document.removeEventListener('keydown', startDarthOnInteraction);
        };
        
        document.addEventListener('click', startDarthOnInteraction);
        document.addEventListener('keydown', startDarthOnInteraction);

        // Also allow Enter key to start
        document.addEventListener('keydown', (event) => {
            if (!this.game.gameStarted && event.code === 'Enter') {
                this.game.startGame();
            }
        });
    }

    hideStartScreen() {
        if (this.startScreen) {
            this.startScreen.style.display = 'none';
        }
    }

    updateHUD(speedLevelIndex, tieFighterPos, containersDestroyed, totalContainers, levelCompleted, laserHeat, weaponJammed) {
        if (!this.game.gameStarted) return;
        
        // Update diegetic speed (Left wing) fylls upp dynamiskt till 33, 66 eller 100%
        if (this.speedMeterElement) {
            const percentages = [33, 66, 100];
            const height = percentages[speedLevelIndex] || 33;
            this.speedMeterElement.style.height = `${height}%`;
        }

        // Update diegetic heat (Right wing)
        if (this.heatMeterElement) {
            this.heatMeterElement.style.height = `${laserHeat}%`;
        }
        if (this.heatTrackElement) {
            this.heatTrackElement.classList.toggle('jammed', weaponJammed);
        }
        
        // Update altitude display
        if (this.altitudeElement && tieFighterPos) {
            this.altitudeElement.textContent = Math.abs(tieFighterPos.y).toFixed(0);
        }
        
        // Update targets
        if (this.targetsElement) {
            this.targetsElement.textContent = `Targets: ${containersDestroyed}/${totalContainers} destroyed (${totalContainers - containersDestroyed} remaining)`;
        }
        
        // Update status based on game state
        if (this.statusElement) {
            if (levelCompleted) {
                this.statusElement.textContent = 'MISSION COMPLETE';
                this.statusElement.className = 'status-success';
            } else if (containersDestroyed === totalContainers) {
                this.statusElement.textContent = 'ALL TARGETS DESTROYED - PROCEED TO END MARKER';
                this.statusElement.className = 'status-success';
            } else {
                this.statusElement.textContent = this.game.controls.isMouseLocked ? 'Flight Mode' : 'DESTROY ALL CONTAINERS';
                this.statusElement.className = 'status-normal';
            }
        }
    }

    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    updateTimerDisplay(timerStarted, levelCompleted, startTime, completionTime) {
        if (!this.timerElement) return;

        if (timerStarted && !levelCompleted) {
            const currentTime = Date.now();
            const elapsedTime = (currentTime - startTime) / 1000;
            this.timerElement.textContent = this.formatTime(elapsedTime);
        } else if (levelCompleted && completionTime > 0) {
            this.timerElement.textContent = this.formatTime(completionTime);
        }
    }

    updateCrosshair(tieFighter, camera) {
        if (!tieFighter || !this.crosshairElement) return;

        const forwardDistance = 50;
        const forwardDirection = new THREE.Vector3(0, 0, -1);
        forwardDirection.applyQuaternion(tieFighter.quaternion);
        
        const crosshairTarget = tieFighter.position.clone();
        crosshairTarget.add(forwardDirection.multiplyScalar(forwardDistance));
        
        const screenPosition = crosshairTarget.clone();
        screenPosition.project(camera);
        
        const x = (screenPosition.x * 0.5 + 0.5) * window.innerWidth;
        const y = (screenPosition.y * -0.5 + 0.5) * window.innerHeight;
        
        this.crosshairElement.style.left = x + 'px';
        this.crosshairElement.style.top = y + 'px';
        this.crosshairElement.style.transform = 'translate(-50%, -50%)';
        
        const isVisible = screenPosition.z < 1 && 
                         x > -50 && x < window.innerWidth + 50 && 
                         y > -50 && y < window.innerHeight + 50;
        this.crosshairElement.style.display = isVisible ? 'block' : 'none';
    }
}
