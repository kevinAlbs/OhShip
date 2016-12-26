// Temporary debugging input logic.
document.getElementById('debug-controls').innerHTML = 
    "<table>" + 
    "<tr><td>Left Engine</td><td><input id='slider-left' type='range' min='-7' max='7' step='1' ></td></tr>" +
    "<tr><td>Right Engine</td><td><input id='slider-right' type='range' min='-7' max='7' step='1'></td></tr>" +
    "<tr><td colspan=2><button id='move-cannon-left'>Cannon Left</button><button id='btn-fire'>Fire Cannon</button><button id='move-cannon-right'>Cannon Right</button></td></tr>" +
    "</table>"
    ;

document.getElementById('slider-left').addEventListener('change', function(ev) {
    sendJson({
        type: ClientMessage.type.kShipUpdate,
        leftEngine: parseInt(ev.target.value) / 7
    });
});

document.getElementById('move-cannon-left').addEventListener('mouseup', function(ev) {
    sendJson({
        type: ClientMessage.type.kShipUpdate,
        cannonRotation: (playerMap.get(playerId).ship.getState().cannonRotation + 1) % 8
    });
});

document.getElementById('move-cannon-right').addEventListener('mouseup', function(ev) {
    sendJson({
        type: ClientMessage.type.kShipUpdate,
        cannonRotation: (playerMap.get(playerId).ship.getState().cannonRotation - 1) % 8
    });
});

document.getElementById('slider-right').addEventListener('change', function(ev) {
    sendJson({
        type: ClientMessage.type.kShipUpdate,
        rightEngine: parseInt(ev.target.value) / 7
    });
});

document.getElementById('btn-fire').addEventListener('mouseup', function(ev) {
    sendJson({
        type: ClientMessage.type.kCannonFire,
        rightEngine: parseInt(ev.target.value) / 7
    });
});