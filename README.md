# 🛸 New Tie Fighter - 3D Arcade Game

A high-fidelity 3D TIE Fighter arcade experience built with Three.js. Navigate through asteroid belts, destroy containers, and experience the thrill of the Empire's finest starfighter.

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v14 or higher)
- npm (comes with Node.js)

### Installation
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

### Local Development
To start the local development server:
```bash
npm start
```
The game will be available at `http://localhost:3000`.

## 🎮 Controls
- **Mouse**: Steer the TIE Fighter (Click to lock cursor)
- **W / S**: Increase / Decrease Speed
- **Space**: Fire Lasers
- **ESC**: Unlock cursor

## 🛠️ Technology Stack
- **Engine**: [Three.js](https://threejs.org/) (r174 via CDN)
- **Rendering**: PBR pipeline with Cinematic Bloom and HDRI environments.
- **Architecture**: Modular ES Modules in `src/`.
- **Backend**: Express (for static file serving during development).

## 🌐 Deployment
This project is configured for automatic deployment via **GitHub Actions** to **GitHub Pages**.

### Manual Push to GitHub
1. Create a repository on GitHub.
2. Link your local repo:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/new-tie-fighter.git
   git branch -M main
   git push -u origin main
   ```
The GitHub Action will automatically trigger and deploy your game.

---
*Built for the Empire.*
