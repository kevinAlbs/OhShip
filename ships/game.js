(function() {
    'use strict';
    function Game() {
        let playerMap = {}
        , cannonballs = []
        ;

        function tick(delta) {

        }

        // Called before the frame begins.
        function onUserMessage(clientMessage, id) {
            if (clientMessage.type == ClientMessage.type.kPlay) {
                // TODO: check that nickname is available.
                playerMap[id] = {
                    ship: new ServerShip(clientMessage),
                    nickname: clientMessage.nickname
                };
                return;
            }

            let player = playerMap[id];
            if (!player) return; // TODO: what error handling should be done here?
            let ship = player.ship;  // may be null.
            switch (clientMessage.type) {
                case ClientMessage.type.kCannonFire:
                    if (!ship) return;
                    // TODO: check that ship exists for this player.
                    var cannonball = ship.attemptCannonFire(clientMessage);
                    if (cannonball) {
                        cannonballs.push(cannonball);
                    }
                break;
            }
        }

        function onDisconnect(id) {
            if (playerMap[id]) {
                // Kill this ship.
            }
        }

        function forEachClientRequestingRefresh(fn) {
            // If fn returns false, then stop.
        }

        return {
            onClientMessage: onClientMessage,
            onDisconnect: onDisconnect,
            getRefreshMessage: getRefreshMessage,
            getAndClearUpdates: getAndClearUpdates,
            forEachClientRequestingRefresh: forEachClientRequestingRefresh
        }
    }
    module.exports = Game;
}());

