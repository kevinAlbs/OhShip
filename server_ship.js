(function() {
    'use strict';
    let ClientMessage = require('./shared/client_message')
    , ServerResponse = require('./shared/server_response')
    , ServerCannonball = require('./server_cannonball')
    , GameConfig = require('./shared/config')
    ;
    let ServerShip = function(id, startingState) {
        let state = {
            x: Math.random() * 500 + 100,
            y: Math.random() * 300 + 100,
            leftEngine: 0,
            rightEngine: 0,
            rotation: 0,
            cannonRotation: 0, // 0-7, integer
            flagColor: 0x000000,
            sunk: false,
        }
        , currentCannonball = null
        ;

        if (startingState) {
            for (var prop in startingState) {
                if (startingState.hasOwnProperty(prop)) state[prop] = startingState[prop];
            }
        }

        if (id % 2 == 0) {
            state = {
                x: 100,
                y: 100,
                rotation: 0,
                leftEngine: 0,
                rightEngine: 0,
                cannonRotation: 0,
                flagColor: 0x000000,
                sunk: false
            }
        } else {
            state = {
                x: 300,
                y: 100,
                rotation: 0,
                leftEngine: 0,
                rightEngine: 0,
                cannonRotation: 4,
                flagColor: 0x000000,
                sunk: false
            }
        }
        

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
                var cleanedRotation = parseInt(json.cannonRotation);
                if (cleanedRotation < 0 || cleanedRotation > 7) cleanedRotation = 0;
                updateState.cannonRotation = cleanedRotation;
            }
        };

        this.attemptCannonFire = function() {
            if (currentCannonball && !currentCannonball.isSunk()) return null;
            console.log("Firing cannon!");
            currentCannonball = new ServerCannonball({
                x: state.x,
                y: state.y,
                angle: state.cannonRotation
            }, id);
            return currentCannonball;
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

            // Bound coordinates.
            state.x = Math.max(0, state.x);
            state.x = Math.min(state.x, GameConfig.worldWidth);
            state.y = Math.max(0, state.y);
            state.y = Math.min(state.y, GameConfig.worldHeight);

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