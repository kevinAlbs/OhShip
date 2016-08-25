(function(){
    'use strict';
    let Game = require('./game')
    , ServerMessage = require('./server_message')
    , ClientMessage = require('./client_message')
    ;

    // Responsible for managing websocket connections and gameplay initiation.
    function Manager(wss) {
        'use strict';
        const kMaxConnections = 1000;
        let _idCounter = 0
        , connectionCount = 0
        , clientMap = {},
        , game = new Game()
        , bufferedClientMessages = []
        ;
        
        function _tick() {
            // Apply all user messages to game.
            bufferedClientMessages.forEach((message) => { game.onClientMessage(message); });
            bufferedClientMessages = [];

            game.tick(30);

            // Broadcast pending updates to all sockets.
            game.getAndClearUpdates().forEach((message) => { wss.broadcast(message); });

            // If any players need a refresh, send it here.
            game.forEachClientRequestingRefresh((id) => {
                // If this client has disconnected, then skip it.
                if (!clientMap[id]) return true;
                // TODO: check if we're at maximum network bandwidth capacity and defer to later.
                clientMap[id].send(game.getRefreshMessage());
                return true;
            });
        }

        function _onConnect(ws) {
            if (connectionCount >= kMaxConnections) {
                ws.send(ServerMessage.fromError(
                    'Cannot connect, maximum number of connections reached'));
                return;
            }
            ws.id = _idCounter++;
            clientMap[ws.id] = ws;
            console.log('Connection made ' + ws.id);

            ws.on('message', _onMessage);
            ws.on('close', _onClose);
            ws.on('error', _onError);
            ws.send(ServerMessage.fromJSON({type: ServerMessage.type.kWelcome, id: ws.id}));
        }

        function _onMessage(message) {
            bufferedClientMessages.push(ClientMessage.fromData(message));
        }

        function _onClose() {
            console.log(this.id);
            console.log('Closing');
            game.onDisconnect(this.id);
            delete(clientMap[this.id]);
            connectionCount--;
        }

        function _onError() {
            // TODO.
        }

        wss.on('connection', _onConnect);
        return {};
    };

    module.exports = Manager;
}());
