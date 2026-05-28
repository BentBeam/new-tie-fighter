import { Game } from './core/Game.js';

// Initialize the game when page loads
window.addEventListener('load', () => {
    try {
        const game = new Game();
        // Give access over the window if needed for debugging
        window.activeGame = game;
        
        const startBtn = document.getElementById('start-button');
        if (startBtn) {
            startBtn.textContent = 'START MISSION';
            startBtn.style.opacity = '1';
            startBtn.style.pointerEvents = 'auto';
        }
        
        console.log('TIE Fighter initialized successfully');
    } catch (error) {
        console.error('Error initializing TIE Fighter:', error);
        document.getElementById('loading').innerHTML = 'Error: ' + error.message;
    }
});
