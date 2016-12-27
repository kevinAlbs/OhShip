(function() {
    'use strict';

    let ServerResponse = require('./shared/server_response')
    , ClientMessage = require('./shared/client_message')
    , ServerShip = require('./server_ship')
    , GameConfig = require('./shared/config')
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
            cannonballs = cannonballs.filter((cannonball) => {
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
            //console.log("Game.onClientMessage", id, json);
            switch (json.type) {
                case ClientMessage.type.kJoin:
                    // TODO: check that nickname is available.
                    // Only allow alphanumerics
                    var nick = json.nickname;
                    if (typeof(nick) !== 'string') nick = "player" + id;
                    nick = nick.replace(/[^A-Z0-9]/ig, '');
                    if (nick.length == 0) nick = "player" + id;
                    console.log("Player " + nick + " has joined");
                    if (playerMap.has(id)) return; // TODO: errors.
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
            // Find a spawn location within a 100 pixel padding of the boundary not intersecting other ships.
            // TODO: Replace this with something more sophisticated.
            var trialsLeft = 3;
            function getSpawnCoordinates() {
                var sx = GameConfig.shipRadius + Math.random() * (GameConfig.worldWidth - 2 * GameConfig.shipRadius);
                var sy = GameConfig.shipRadius + Math.random() * (GameConfig.worldHeight - 2 * GameConfig.shipRadius);
                var tooClose = false;
                // Check if other ships are too close.
                for (var player of playerMap.entries()) {
                    var ship = player.ship;
                    if (!ship) continue;
                    var shipState = ship.getState(), shipX = shipState.x, shipY = shipState.y;
                    if (Math.pow(shipX - sx, 2) + Math.pow(shipY - sy, 2) < Math.pow(GameConfig.shipRadius, 2)) {
                        tooClose = true;
                        break;
                    }
                }
                if (tooClose && trialsLeft > 0) {
                    trialsLeft--;
                    return getSpawnCoordinates();
                }
                return {x: sx, y: sy};
            }
            var startingState = getSpawnCoordinates();
            player.ship = new ServerShip(id, startingState);
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

