function ClientCannonball(startingState) {
    // TODO: will need to know owning ship when we implement client visual effects.
    var state = {
        x: 0,
        y: 0,
        angle: 0
    };

    var kTargetDistance = 450,
        distanceLeft = kTargetDistance,
        speed = .5,
        sunk = false;

    _.extend(state, startingState);
    console.log(state);

    this.tick = function(delta) {
        if (sunk) return;
        state.x += speed * delta * Math.cos(state.angle);
        state.y += speed * delta * Math.sin(state.angle);
        distanceLeft -= speed * delta;
        console.log(state);
        cannonballSprite.position.set(state.x, state.y);
        cannonballSprite.scale.set(Math.min(1, .5 + (distanceLeft / kTargetDistance)));
        if (distanceLeft <= 0) {
            sunk = true;
            stage.removeChild(cannonballSprite);
        }

    }

    this.isSunk = function() {
        return sunk;
    }

    var cannonballSprite = new PIXI.Sprite(PIXI.Texture.fromImage('/img/cannonball.png'));
    cannonballSprite.anchor.set(.5, .5);
    cannonballSprite.rotation = state.angle;
    stage.addChild(cannonballSprite);
    return this;
}