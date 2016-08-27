// Temporary debugging input logic.
document.getElementById('debug-controls').innerHTML = 
    "<table>" + 
    "<tr><td>Left Engine</td><td><input id='slider-left' type='range' min='-7' max='7' step='1' ></td></tr>" +
    "<tr><td>Right Engine</td><td><input id='slider-right' type='range' min='-7' max='7' step='1'></td></tr>" +
    "<tr><td>Cannon</td><td><input id='slider-cannon' type='range' min='-180' max='180' step='1'></td></tr>" +
    "<tr><td colspan=2><button id='btn-fire'>Fire Cannon</button></td></tr>" +
    "</table>"
    ;

document.getElementById('slider-left').addEventListener('change', function(ev) {
    sendJson({
        type: ClientMessage.type.kShipUpdate,
        leftEngine: parseInt(ev.target.value) / 7
    });
});

document.getElementById('slider-cannon').addEventListener('change', function(ev) {
    sendJson({
        type: ClientMessage.type.kShipUpdate,
        cannonRotation: parseInt(ev.target.value) * Math.PI / 180
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