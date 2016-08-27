(function() {
    'use strict';

    let ServerResponse = require('./shared/server_response')
    , ClientMessage = require('./shared/client_message')
    , ServerShip = require('./server_ship')
    ;

    function Game() {
        let playerMap = new Map()
        , cannonballs = []
        , playersRequestingRefresh = []
        , pendingServerUpdates = []
        ;

        function tick(delta) {
            // Tick players and cannonballs, and check collisions.
            playerMap.forEach((player) => {
                let ship = player.ship;
                if (!ship) return; // TODO: set a timeout for players without ships.
                let shipUpdate = ship.tick(delta);
                if (shipUpdate) pendingServerUpdates.push(shipUpdate);
            });
            cannonballs.filter((cannonball) => {
                cannonball.tick(delta);
                playerMap.forEach((player, playerId) => {
                    let ship = player.ship;
                    if (!ship) return;
                    let shipState = ship.getState();
                    let cannonballState = cannonball.getState();
                    if (cannonball.getPlayerId() == playerId) return;
                    //console.log('Checking', playerId, shipState, cannonballState);
                    if (Math.pow(shipState.x - cannonballState.x, 2) + 
                        Math.pow(shipState.y - cannonballState.y, 2) < Math.pow(45, 2)) {
                        console.log("Detected collision");
                        pendingServerUpdates.push(ship.sink());
                        player.ship = null;
                    }
                });
                return !cannonball.isSunk();
            });
            let temp = pendingServerUpdates;
            pendingServerUpdates = [];
            return temp;
        }

        // Called before the frame begins.
        function applyClientMessage(json) {
            let id = json.id;
            let player = playerMap.has(id) ? playerMap.get(id) : null;
            let ship = player ? player.ship : null;
            console.log("Game.onClientMessage", id, json);
            switch (json.type) {
                case ClientMessage.type.kJoin:
                    // TODO: check that nickname is available.
                    console.log("Player " + json.nickname + " has joined");
                    if (playerMap.has(id)) return; // TODO: errors.
                    let newShip = new ServerShip(json);
                    playerMap.set(id, {
                        ship: null,
                        nickname: json.nickname
                    });
                    playersRequestingRefresh.push(id);
                    pendingServerUpdates.push({
                        id: id,
                        type: ServerResponse.type.kJoin,
                        nickname: json.nickname
                    });
                    _spawn(id);
                    break;
                case ClientMessage.type.kLeave:
                    if (!ship) return;
                    pendingServerUpdates.push(ship.sink());
                    playerMap.delete(id);
                    break;
                case ClientMessage.type.kSpawn:
                    _spawn(id);
                    break;
                case ClientMessage.type.kShipUpdate:
                    if (!ship) return; // TODO
                    ship.applyClientMessage(json);
                    break;
                case ClientMessage.type.kCannonFire:
                    if (!ship) return;
                    let cannonball = ship.attemptCannonFire();
                    if (cannonball) {
                        cannonballs.push(cannonball);    
                    }
                    pendingServerUpdates.push({
                        id: id,
                        type: ServerResponse.type.kCannonFire
                        // TODO: include starting coordinates/angle since client may be inexact.
                    });
                    break;
                case ClientMessage.type.kSetNickname:
                case ClientMessage.type.kRequestRefresh:
                case ClientMessage.type.kObserve:
                    // TODO.
                    console.log("Message not yet implemented");
                    break;
            }
        }

        function forEachPlayerRequestingRefresh(fn) {
            // Construct the JSON object representing the state of the game.
            let playersJson = [];
            playerMap.forEach((player, id) => {
                let ship = player.ship;
                let playerJson = {
                    id: id,
                    nickname: player.nickname
                };
                if (ship) playerJson.ship = ship.getState();
                playersJson.push(playerJson);
            });

            let refreshJson = {
                type: ServerResponse.type.kRefresh,
                data: playersJson
            };

            while (playersRequestingRefresh.length > 0) {
                let id = playersRequestingRefresh.shift();
                // If fn returns false, then stop.
                if (!fn(id, refreshJson)) return;
            }
        }

        function _spawn(id) {
            if (!playerMap.has(id)) return;
            let player = playerMap.get(id);
            if (player.ship) return; // Player is already spawned.
            player.ship = new ServerShip(id);
            pendingServerUpdates.push({
                id: id,
                type: ServerResponse.type.kSpawn,
                data: player.ship.getState()
            });
        }

        return {
            tick: tick,
            applyClientMessage: applyClientMessage,
            forEachPlayerRequestingRefresh: forEachPlayerRequestingRefresh
        }
    }
    module.exports = Game;
}());

