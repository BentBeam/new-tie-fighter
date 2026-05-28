export const GameConfig = {
    SPEED_LEVELS: [6, 13, 20], // Speed levels 1 (Normal), 2 (Fast), 3 (Warp)
    DEFAULT_SPEED_LEVEL: 1, // Startar spelet på index 1, d.v.s. hastighet 13
    MAX_VELOCITY: 20,
    ROTATION_SPEED: 0.0075, // Trögare och mjukare styrning (var 0.015)
    ACCELERATION: 0.08,
    DAMPING: 0.98,
    FIRE_RATE: 200, // milliseconds between shots
    TOTAL_CONTAINERS: 13, // Halverat från 25
    MAX_TRAIL_PARTICLES: 100,
    SPARKLE_PARTICLE_MAX: 50,
};
