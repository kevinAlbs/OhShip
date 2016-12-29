// AI players send ClientMessages to server to use the same code path, but do not recieve messages
// and instead use the game data structures directly to avoid redundancy.

let ClientMessage = require('./shared/client_message')
;

function StupidAI(id){
    function handleRespawn(delta, messages) {
        // Wait to respawn.
        deathTimer -= delta;
        if (deathTimer <= 0) {
            deathTimer = kDeathTime;
            messages.push({
                id: id,
                type: ClientMessage.type.kSpawn
            });
        }
    }

    function attackNearest(ship, playerMap, delta, messages) {
        atkTimer -= delta;
        if (atkTimer > 0) return;
        atkTimer = kAtkTime;
        // Get the closest ship.
        let closestShip = null, closestDist = Number.MAX_VALUE, closestDiffs = [];
        playerMap.forEach((otherPlayer, otherPlayerId) => {
            if (otherPlayerId == id) return;
            let otherShip = otherPlayer.ship;
            if (!otherShip) return;
            let px = ship.getState().x, py = ship.getState().y;
            let ox = otherShip.getState().x, oy = otherShip.getState().y;
            let xDiff = ox - px, yDiff = oy - py;
            let sqDist = Math.pow(xDiff, 2) + Math.pow(yDiff, 2);
            if (sqDist < closestDist) {
                closestDist = sqDist;
                closestShip = ship;
                closestDiffs = [yDiff, xDiff];
            }
        });
        if (closestShip && closestDist < Math.pow(700, 2)) {
            // Aim towards this ship.
            let angleDeg = Math.atan2(...closestDiffs) * 180 / Math.PI;
            if (angleDeg < 0) angleDeg += 360;
            
            let closestEighth = Math.round(angleDeg / (360/8));
            if (closestEighth == 8) closestEighth = 0;
            
            // Move towards closest eigth.
            let currentEigth = ship.getState().cannonRotation;
            var diff = closestEighth - currentEigth;
            if (diff != 0) {
                // Move in direction of diff unless abs is greater than 4, in which case other direction
                // is faster.
                diff = (Math.abs(diff) > 4 ? -1 : 1) * Math.sign(diff);
                var newRotation = currentEigth + diff;
                if (newRotation == 8) newRotation = 0;
                else if (newRotation == -1) newRotation = 7;
                messages.push({
                    id: id,
                    type: ClientMessage.type.kShipUpdate,
                    cannonRotation: newRotation
                });
            } else if (ship.canFireCannon()) {
                // Fire!
                messages.push({
                    id: id,
                    type: ClientMessage.type.kCannonFire
                });
            }

        }
    }

    function changeMovement(ship, delta, messages) {
        moveTimer -= delta;
        if (moveTimer > 0) return;
        moveTimer = kMoveTime;
        let setting = presetEngineValues[Math.floor(presetEngineValues.length * Math.random())];
        var sx = ship.getState().x, sy = ship.getState().y;
        let lSign = Math.random() < .5 ? -1 : 1;
        let rSign = Math.random() < .5 ? -1 : 1;
        let l = setting.l * lSign;
        let r = setting.r * rSign;
        messages.push({
            id: id,
            type: ClientMessage.type.kShipUpdate,
            leftEngine: l,
            rightEngine: r
        });
    }

    // Returns client messages.
    this.act = function(delta, game) {
        let messages = [];
        // TODO: do not call every time if confident they don't get reassigned.
        let playerMap = game._getPlayerMap();
        let cannonballs = game._getCannonballs();
        let player = playerMap.get(id);
        if (!player) return messages;
        let ship = player.ship;
        if (!ship) handleRespawn(delta, messages);
        else {
            attackNearest(ship, playerMap, delta, messages);
            changeMovement(ship, delta, messages);
        }
        return messages;
    }

    const kDeathTime = 2500
    , kAtkTime = 2000
    , kMoveTime = 10500
    ;

    let deathTimer = kDeathTime
    , atkTimer = kAtkTime // rate limit attacking
    , moveTimer = 0 // Initially zero to start moving on spawn
    , presetEngineValues = [{l: .15, r: .3}, {l: .3, r: .45}, {l: 1, r: .6}, {l: .15, r: .15}]
    ;
};

module.exports = StupidAI;