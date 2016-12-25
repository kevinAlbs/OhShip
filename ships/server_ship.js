(function() {
    'use strict';
    let ClientMessage = require('./shared/client_message')
    , ServerResponse = require('./shared/server_response')
    , ServerCannonball = require('./server_cannonball')
    ;
    let ServerShip = function(id) {
        let state = {
            x: Math.random() * 500 + 100,
            y: Math.random() * 300 + 100,
            leftEngine: 0,
            rightEngine: 0,
            rotation: Math.random() * Math.PI * 2,
            cannonRotation: Math.random() * Math.PI * 2,
            flagColor: 0x000000,
            sunk: false,
        };

        const MAX_FRAMES_WITHOUT_UPDATE = 100
        ;

        let updateState = {}
        , hasUpdated = false
        , framesSinceLastUpdate = 0
        ;

        this.applyClientMessage = function(json) {
            if (json.hasOwnProperty('leftEngine')) {
                state.leftEngine = json.leftEngine;
                hasUpdated = true;
                updateState.leftEngine = json.leftEngine;
            }

            if (json.hasOwnProperty('rightEngine')) {
                state.rightEngine = json.rightEngine;
                hasUpdated = true;
                updateState.rightEngine = json.rightEngine;
            }

            if (json.hasOwnProperty('cannonRotation')) {
                state.cannonRotation = json.cannonRotation;
                hasUpdated = true;
                updateState.cannonRotation = json.cannonRotation;
            }
        };

        this.attemptCannonFire = function() {
            // TODO: ensure count.
            console.log("Firing cannon!");
            return new ServerCannonball({
                x: state.x,
                y: state.y,
                angle: state.cannonRotation
            }, id);
        }

        this.sink = function() {
            state.sunk = true;
            return {id: id, type: ServerResponse.type.kShipUpdate, data: {sunk: true} };
        }

        this.getState = function(){
            return state;
        };

        // Returns a ServerMessage with an update if there is one.
        this.tick = function(delta) {
            if (state.sunk) return;

            delta /= 30;
            
            var rotationDelta = (state.leftEngine - state.rightEngine) / 100;
            var forwardDelta = state.leftEngine + state.rightEngine;

            var hPi = Math.PI / 2;
            state.rotation += rotationDelta * delta;
            state.x += forwardDelta * Math.cos(state.rotation - hPi) * delta;
            state.y += forwardDelta * Math.sin(state.rotation - hPi) * delta;

            if (hasUpdated || framesSinceLastUpdate >= MAX_FRAMES_WITHOUT_UPDATE) {
                // Add interpolated properties.
                updateState.x = state.x;
                updateState.y = state.y;
                updateState.rotation = state.rotation;
                let temp = updateState;
                updateState = {};
                hasUpdated = false;
                framesSinceLastUpdate = 0;
                return {
                    id: id,
                    type: ServerResponse.type.kShipUpdate,
                    data: temp
                };
            } else {
                framesSinceLastUpdate++;
                return null;
            }
        }

        return this;
    };

    module.exports = ServerShip;
}());