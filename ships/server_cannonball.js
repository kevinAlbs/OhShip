function ServerCannonball(startingState, playerId) {
    var state = startingState;
    console.log(state);

    var kTargetDistance = 450,
        distanceLeft = kTargetDistance,
        speed = .5,
        sunk = false;

    this.tick = function(delta) {
        if (sunk) return;
        state.x += speed * delta * Math.cos(state.angle);
        state.y += speed * delta * Math.sin(state.angle);
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