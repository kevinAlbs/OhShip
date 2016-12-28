function ServerCannonball(startingState, playerId) {
    var state = startingState;

    var kTargetDistance = 450,
        distanceLeft = kTargetDistance,
        speed = .5,
        sunk = false;

    this.tick = function(delta) {
        if (sunk) return;
        // Angles are given in eighths.
        var angle = state.angle * 2 * Math.PI / 8;
        state.x += speed * delta * Math.cos(angle);
        state.y += speed * delta * Math.sin(angle);
        distanceLeft -= speed * delta;
        if (distanceLeft <= 0) sunk = true;
    }

    this.getState = function() {
        return state;
    }

    this.isSunk = function() {
        return sunk;
    }

    this.getPlayerId = function() {
        return playerId;
    }

    return this;
}

module.exports = ServerCannonball;