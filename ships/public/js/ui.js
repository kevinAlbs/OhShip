var UI = (function(){
    function setScreen(name) {
        controls.setAttribute('data-showing', name);
    }

    function onPlayPressed() {
        var nick = playScreen.nick.value.trim();
        if (nick.length == 0) nick = null;
        play(nick);
        setScreen('controls');
    }

    function onKeyUp(e) {
        console.log(e);
        // Only accept keyboard input for controls screen.
        if (controls.getAttribute('data-showing') !== 'controls') return;
        if (keyMap.hasOwnProperty(e.keyCode)) {
            console.log("Forwarding key up event");
            keyMap[e.keyCode](e.shiftKey);
        }
    }

    function init() {
        playScreen.btn.addEventListener('click', onPlayPressed);
        document.addEventListener('keyup', onKeyUp);
        var keyCodes = {
            Q: 81,
            W: 87,
            O: 79,
            P: 80,
            SPACE: 32
        };
        keyMap[keyCodes.Q] = function(shift) {
            var increment = shift ? (-1/7) : (1/7);
            currentState.leftEngine = bound(currentState.leftEngine + increment, -1, 1);
            sendJson({
                type: ClientMessage.type.kShipUpdate,
                leftEngine: currentState.leftEngine
            });
        };
        keyMap[keyCodes.W] = function(shift) {
            var increment = shift ? (-1/7) : (1/7);
            currentState.rightEngine = bound(currentState.rightEngine + increment, -1, 1);
            sendJson({
                type: ClientMessage.type.kShipUpdate,
                rightEngine: currentState.rightEngine
            });
        };
        keyMap[keyCodes.P] = function(shift) {
            var increment = shift ? -1 : 1;
            currentState.cannonRotation = currentState.cannonRotation + increment;
            if (currentState.cannonRotation < 0) currentState.cannonRotation += 8;
            else if (currentState.cannonRotation > 7) currentState.cannonRotation -= 8;
            sendJson({
                type: ClientMessage.type.kShipUpdate,
                cannonRotation: currentState.cannonRotation
            });
        };
        keyMap[keyCodes.SPACE] = function() {
            sendJson({
                type: ClientMessage.type.kCannonFire
            });
        };
    }

    var controls = document.getElementById('controls')
    , playScreen = {
        btn: document.getElementById('play-btn'),
        nick: document.getElementById('play-nick')
    }
    , currentState = {
        leftEngine: 0,
        rightEngine: 0,
        cannonRotation: 0
    }
    , keyMap = {} // Maps keycodes to handler functions
    ;

    return {
        init: init,
        setScreen: setScreen
    };
}());