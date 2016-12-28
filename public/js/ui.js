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

    function onRespawnPressed() {
        sendJson({
            type: ClientMessage.type.kSpawn
        });
        setScreen('controls');
    }

    function onKeyUp(e) {
        // Only accept keyboard input for controls screen.
        if (controls.getAttribute('data-showing') !== 'controls') return;
        if (keyMap.hasOwnProperty(e.keyCode)) {
            console.log("Forwarding key up event");
            keyMap[e.keyCode](e.shiftKey);
        }
    }

    function tick(delta) {
        // Animate any keys necessary.
        for (keyId in animatedKeys) {
            if (!animatedKeys.hasOwnProperty(keyId)) continue;
            var ratio = animatedKeys[keyId].timeLeft / kKeyFadeTime;
            var b = Math.floor(Math.max(0, 255 * ratio));
            var els = animatedKeys[keyId].els;
            for (var i = 0; i < els.length; i++) {
                els[i].style.backgroundColor = "rgb(0," + b + "," + b + ")";
            }
            if (animatedKeys[keyId].timeLeft <= 0) {
                delete animatedKeys[keyId];
            } else {
                animatedKeys[keyId].timeLeft -= delta;
            }
        }
    }

    function animateKey(keyLetter, shiftPressed) {
        var keyId = (shiftPressed ? 'shift' : '') + keyLetter;
        animatedKeys[keyId] = {
            timeLeft: kKeyFadeTime,
            els: document.querySelectorAll('[data-key=' + keyId + ']')
        };
    }

    function init() {
        playScreen.btn.addEventListener('click', onPlayPressed);
        respawnScreen.btn.addEventListener('click', onRespawnPressed);

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
            animateKey("q", shift);
        };
        keyMap[keyCodes.W] = function(shift) {
            var increment = shift ? (-1/7) : (1/7);
            currentState.rightEngine = bound(currentState.rightEngine + increment, -1, 1);
            sendJson({
                type: ClientMessage.type.kShipUpdate,
                rightEngine: currentState.rightEngine
            });
            animateKey("w", shift);
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
            animateKey("p", shift);
        };
        keyMap[keyCodes.SPACE] = function() {
            sendJson({
                type: ClientMessage.type.kCannonFire
            });
            animateKey("spacebar", false);
        };
    }

    var controls = document.getElementById('controls')
    , playScreen = {
        btn: document.getElementById('play-btn'),
        nick: document.getElementById('play-nick')
    }
    , respawnScreen = {
        btn: document.getElementById('respawn-btn')
    }
    , currentState = {
        leftEngine: 0,
        rightEngine: 0,
        cannonRotation: 0
    }
    , keyMap = {} // Maps keycodes to handler functions
    , animatedKeys = {} // Maps key ids to currently animated keys
    , kKeyFadeTime = 250
    ;

    return {
        init: init,
        setScreen: setScreen,
        tick: tick
    };
}());