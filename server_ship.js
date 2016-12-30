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
        , updatedState = {}
        ;

        if (startingState) {
            for (var prop in startingState) {
                if (startingState.hasOwnProperty(prop)) state[prop] = startingState[prop];
            }
        }

        // if (id % 2 == 0) {
        //     state = {
        //         x: 100,
        //         y: 100,
        //         rotation: 0,
        //         leftEngine: 0,
        //         rightEngine: 0,
        //         cannonRotation: 0,
        //         flagColor: 0x000000,
        //         sunk: false
        //     }
        // } else {
        //     state = {
        //         x: 300,
        //         y: 100,
        //         rotation: 0,
        //         leftEngine: 0,
        //         rightEngine: 0,
        //         cannonRotation: 4,
        //         flagColor: 0x000000,
        //         sunk: false
        //     }
        // }
        

        const MAX_FRAMES_WITHOUT_UPDATE = 100
        ;

        let hasUpdated = false
        , framesSinceLastUpdate = 0
        ;

        this.applyClientMessage = function(json) {
            function cleanEngineVal(val) {
                if (typeof val !== 'number') return 0;
                if (isNaN(val) || val < -1 || val > 1) return 0;
                return val;
            }

            if (json.hasOwnProperty('leftEngine')) {
                let val = cleanEngineVal(json.leftEngine);
                state.leftEngine = val;
                hasUpdated = true;
                updatedState.leftEngine = val;
            }

            if (json.hasOwnProperty('rightEngine')) {
                let val = cleanEngineVal(json.rightEngine);
                state.rightEngine = val;
                hasUpdated = true;
                updatedState.rightEngine = val;
            }

            if (json.hasOwnProperty('cannonRotation')) {
                state.cannonRotation = json.cannonRotation;
                hasUpdated = true;
                let cleanedRotation = parseInt(json.cannonRotation);
                if (isNaN(cleanedRotation) || cleanedRotation < 0 || cleanedRotation > 7) cleanedRotation = 0;
                updatedState.cannonRotation = cleanedRotation;
            }
        };

        this.canFireCannon = function() {
            return !(currentCannonball && !currentCannonball.isSunk());
        }

        this.attemptCannonFire = function() {
            if (currentCannonball && !currentCannonball.isSunk()) return null;
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
            framesSinceLastUpdate++;

            var updatedStateCopy = updatedState;

            // We send a full update every MAX_FRAMES_WITHOUT_UPDATE regardless of
            // whether the ship has changed state, since clients may lose messages.
            if (framesSinceLastUpdate >= MAX_FRAMES_WITHOUT_UPDATE) {
                // Send a full state update.
                hasUpdated = false;
                framesSinceLastUpdate = 0;
                updatedState = {};
                return {
                    id: id,
                    type: ServerResponse.type.kShipUpdate,
                    data: state
                };
            } else if (hasUpdated) {
                // Send only state which has updated
                hasUpdated = false;
                updatedState = {};
                return {
                    id: id,
                    type: ServerResponse.type.kShipUpdate,
                    data: state
                };
            } else {
                return null;
            }
        }

        return this;
    };

    module.exports = ServerShip;
}());