(function() {
    'use strict';
    let ClientMessage = require('./shared/client_message')
    , ServerResponse = require('./shared/server_response')
    ;
    let ServerShip = function(id) {
        let state = {
            x: Math.random() * 300,
            y: Math.random() * 300,
            leftEngine: 0,
            rightEngine: 0,
            rotation: 0,
            cannonRotation: 0,
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
            switch(json.type) {
                case ClientMessage.type.kLeftEngine:
                    state.leftEngine = json.value;
                    hasUpdated = true;
                    updateState.leftEngine = json.value;
                    break;
                case ClientMessage.type.kRightEngine:
                    state.rightEngine = json.value;
                    hasUpdated = true;
                    updateState.rightEngine = json.value;
                    break;
                default:
                    console.log(
                        'Unexpected message passed to ServerShip.applyClientMessage', json);
                    return;
            }
        };

        this.sink = function() {
            state.sunk = true;
            return {id: id, type: ServerMessage.type.kShipUpdate, data: {sunk: true} };
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

            state.rotation += rotationDelta * delta;
            state.x += forwardDelta * Math.cos(state.rotation) * delta;
            state.y += forwardDelta * Math.sin(state.rotation) * delta;

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