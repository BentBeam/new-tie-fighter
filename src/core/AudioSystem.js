export class AudioSystem {
    constructor() {
        this.context = null;
        this.enabled = true;
        this.sounds = {
            laser: null,
            explosion: null,
            ambience: null,
            darth: null,
            flyby: null,
            initiate: null,
            shieldHit: null,
            hullHit: null,
            explosion2: null
        };
        this.ambienceSource = null;
        this.darthSource = null;
    }

    async init() {
        try {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
            await this.loadSound('laser', 'sounds/laser.mp3');
            await this.loadSound('explosion', 'sounds/explosion3.mp3');
            await this.loadSound('ambience', 'sounds/ambience1.mp3');
            await this.loadSound('darth', 'sounds/darth.mp3');
            
            // New sounds
            await this.loadSound('flyby', 'sounds/flyby.mp3');
            await this.loadSound('initiate', 'sounds/Initiate.wav');
            await this.loadSound('shieldHit', 'sounds/ShieldHit.wav');
            await this.loadSound('hullHit', 'sounds/HullHit.wav');
            await this.loadSound('explosion2', 'sounds/explosion2.mp3');
            
            console.log('Audio system initialized successfully');
        } catch (error) {
            console.error('Error initializing audio:', error);
        }
    }

    async loadSound(name, url) {
        if (!this.context) return;
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const arrayBuffer = await response.arrayBuffer();
            this.sounds[name] = await this.context.decodeAudioData(arrayBuffer);
        } catch (error) {
            console.error(`Error loading sound ${name} from ${url}:`, error);
        }
    }

    async playSound(name, volume = 1.0, loop = false) {
        if (!this.enabled || !this.context) return null;
        
        // Polla ljudfilen i upp till 2.5 sekunder om nätverket inte hunnit hämta den när ljudet anropas!
        let waitAttempts = 0;
        while (!this.sounds[name] && waitAttempts < 25) {
            await new Promise(resolve => setTimeout(resolve, 100));
            waitAttempts++;
        }
        
        // Avbryt tyst om filen (mot förmodan) aldrig dök upp
        if (!this.sounds[name]) return null;
        
        // Webbläsaren kan nolla ljudet om context fortfarande sover när man klickar för snabbt!
        if (this.context.state === 'suspended') {
            await this.context.resume();
        }
        
        try {
            const source = this.context.createBufferSource();
            source.buffer = this.sounds[name];
            
            const gainNode = this.context.createGain();
            gainNode.gain.value = volume;
            
            source.connect(gainNode);
            gainNode.connect(this.context.destination);
            
            source.loop = loop;
            source.start(0);
            
            return source;
        } catch (error) {
            console.error(`Error playing sound ${name}:`, error);
            return null;
        }
    }

    playLaserSound() {
        if (!this.enabled || !this.context) return;
        // Simple synthetic laser sound fallback
        try {
            const oscillator = this.context.createOscillator();
            const gainNode = this.context.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.context.destination);
            
            oscillator.frequency.setValueAtTime(800, this.context.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(200, this.context.currentTime + 0.1);
            
            gainNode.gain.setValueAtTime(0.1, this.context.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.1);
            
            oscillator.start(this.context.currentTime);
            oscillator.stop(this.context.currentTime + 0.1);
        } catch (e) {
            console.log('Audio not available');
        }
    }

    playBackgroundMusic() {
        if (!this.context) this.init();
        if (this.context && this.context.state === 'suspended') {
            this.context.resume();
        }
        if (!this.ambienceSource && this.enabled) {
            this.ambienceSource = this.playSound('ambience', 0.4, true);
        }
    }

    stopBackgroundMusic() {
        if (this.ambienceSource) {
            try { this.ambienceSource.stop(); } catch(e) {}
            this.ambienceSource = null;
        }
    }

    playDarthTheme() {
        if (!this.context) this.init();
        if (this.context && this.context.state === 'suspended') {
            this.context.resume();
        }
        if (!this.darthSource && this.enabled) {
            this.darthSource = this.playSound('darth', 0.5, true);
        }
    }

    stopDarthTheme() {
        if (this.darthSource) {
            try { this.darthSource.stop(); } catch(e) {}
            this.darthSource = null;
        }
    }

    toggleSound() {
        this.enabled = !this.enabled;
        if (!this.enabled) {
            this.stopBackgroundMusic();
            this.stopDarthTheme();
        }
        return this.enabled;
    }
}
