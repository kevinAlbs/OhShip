// Responsible for pooling and emitting particles.
var ParticleEmitter = function(texture) {
    var freeParticles = [];
    var useParticles = [];
    // Each particle object has
    // sprite
    // lifetime, 0 means dead/unused, otherwise positive number in seconds
    // x/yVel, velocities

    this.create = function(amount, options) {
        for (var i = 0; i < amount; i++) {
            freeParticles.push({
                sprite: PIXI.Sprite.from(texture),
                lifetime: 0
            });
        }
    };

    this.emit = function(container, amount, point, options) {
        // Grab from free particles. TODO
    };

    this.emitRect = function(container, x, y, width, height, options) {
        var xStep = options.xStep || 1;
        var yStep = options.yStep || 1;
        var emitParticles = [];
        var freeLeft = freeParticles.length > 0;
        for (var i = 0; i < height; i += yStep) {
            for (var j = 0; j < width; j += xStep) {
                var particle = freeLeft ? freeParticles[0] : useParticles[0];
                if (freeLeft) {
                    useParticles.push(freeParticles.shift());
                    freeLeft = freeParticles.length > 0;
                } else {
                    // Move recently used particle to back of useParticles.
                    useParticles.push(useParticles.shift());
                }
                particle.sprite.x = x + i;
                particle.sprite.y = y + j;
                if (options.explode) {
                    // Velocity is function of manhattan distance with some randomness.
                    var centerI = height / 2;
                    var centerJ = width / 2;
                    particle.yVel = ((Math.random() - .5) / 500);
                    particle.xVel = ((Math.random() - .5) / 500);
                    particle.lifetime = 1000 + (Math.random() - .5) * 1000;
                } else {
                    particle.xVel = options.xVel || 0;
                    particle.yVel = options.yVel || 0;
                    particle.lifetime = options.lifetime || 1000;
                }
                
                // Based on src, setParent just adds to container, which will move the child if
                // it is already added to another container.
                particle.sprite.setParent(container);
            }
        }
    };

    this.tick = function(delta) {
        // Loop over all currently active particles and tick them.
        for (var i = 0; i < useParticles.length; i++) {
            var particle = useParticles[i];
            particle.sprite.x += delta * particle.xVel;
            particle.sprite.y += delta * particle.yVel;
            particle.lifetime -= delta;
            if (particle.lifetime <= 0) {
                useParticles.splice(i, 1);
                freeParticles.push(particle);
                // TODO: is parent not a public property of PIXI.Sprite. If not, why not?
                particle.sprite.parent.removeChild(particle.sprite);
            }
        };
    };
    return this;
}