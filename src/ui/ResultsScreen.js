export class ResultsScreen {
    constructor(game) {
        this.game = game;
    }

    displayResults(containersDestroyed, totalContainers, completionTime) {
        const resultsDiv = document.createElement('div');
        resultsDiv.id = 'results-screen';
        resultsDiv.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            color: #15f2fd;
            font-family: 'Michroma', 'Courier New', monospace;
            z-index: 1000;
        `;
        
        const destructionRate = (containersDestroyed / totalContainers) * 100;
        
        let timeScore = 100;
        if (completionTime > 0) {
            if (completionTime <= 60) timeScore = 100;
            else if (completionTime <= 90) timeScore = 90;
            else if (completionTime <= 120) timeScore = 75;
            else if (completionTime <= 150) timeScore = 60;
            else timeScore = 40;
        }
        
        const combinedScore = (destructionRate * 0.7) + (timeScore * 0.3);
        const percentage = Math.round(combinedScore);
        
        let grade = 'F';
        if (percentage >= 90) grade = 'A';
        else if (percentage >= 80) grade = 'B';
        else if (percentage >= 70) grade = 'C';
        else if (percentage >= 60) grade = 'D';

        resultsDiv.innerHTML = `
            <h1 style="color: #15f2fd; font-size: 3em; margin-bottom: 30px; font-family: 'Michroma', 'Courier New', monospace;">MISSION COMPLETE</h1>
            <div style="font-size: 1.5em; text-align: center; line-height: 1.8; font-family: 'Michroma', 'Courier New', monospace; color: white;">
                <p><span style="color: #15f2fd;">Containers Destroyed:</span> ${containersDestroyed} / ${totalContainers} (${Math.round(destructionRate)}%)</p>
                <p><span style="color: #15f2fd;">Completion Time:</span> ${this.game.uiManager.formatTime(completionTime)}</p>
                <p><span style="color: #15f2fd;">Time Performance:</span> ${Math.round(timeScore)}%</p>
                <p><span style="color: #15f2fd;">Overall Score:</span> ${percentage}%</p>
                <p><span style="color: #15f2fd;">Grade:</span> <span style="color: ${grade === 'A' ? 'white' : grade === 'F' ? '#ff0000' : '#ffaa00'}; font-size: 2em;">${grade}</span></p>
            </div>
            <button id="restart-button" style="
                margin-top: 40px;
                padding: 15px 40px;
                font-size: 1.5em;
                font-family: 'Michroma', 'Courier New', monospace;
                background: transparent;
                color: #15f2fd;
                border: 2px solid #15f2fd;
                cursor: pointer;
                transition: all 0.3s ease;
                text-transform: uppercase;
                letter-spacing: 0.1em;
            ">RESTART MISSION</button>
        `;
        
        document.body.appendChild(resultsDiv);
        
        const restartButton = document.getElementById('restart-button');
        restartButton.addEventListener('click', () => {
            this.game.restartLevel();
        });
        
        restartButton.addEventListener('mouseenter', () => {
            restartButton.style.background = '#15f2fd';
            restartButton.style.color = '#000';
            restartButton.style.boxShadow = '0 0 30px #15f2fd';
            restartButton.style.transform = 'scale(1.05)';
        });
        
        restartButton.addEventListener('mouseleave', () => {
            restartButton.style.background = 'transparent';
            restartButton.style.color = '#15f2fd';
            restartButton.style.boxShadow = 'none';
            restartButton.style.transform = 'scale(1)';
        });
    }
}
