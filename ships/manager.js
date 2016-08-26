(function(){
    'use strict';
    let Game = require('./game')
    , ServerMessage = require('./shared/server_response')
    , ClientMessage = require('./shared/client_message')
    ;

    // Responsible for managing client connections and forwarded decoded messages to/from game.
    function Manager(wss) {
        'use strict';
        const kMaxConnections = 65536 // should be high since observers don't add much load.
        , kFixedDelta = 1000
        ;

        let _idCounter = 0
        , clientMap = new Map()
        , game = new Game()
        , bufferedClientMessages = []
        ;

        function getStatus() {
            return {
                numConnections: clientMap.size
            };
        }
        
        function _tick() {
            console.log("Tick");
            let startTime = Date.now();
            // Apply all user messages to game.
            bufferedClientMessages.forEach((json) => { game.applyClientMessage(json); });
            bufferedClientMessages = [];

            let serverUpdates = game.tick(kFixedDelta);

            // Broadcast pending updates to all sockets.
            serverUpdates.forEach((json) => { wss.safeBroadcast(json); });

            // If any players need a refresh, send it here.
            game.forEachPlayerRequestingRefresh((id, refreshJson) => {
                // If this client has disconnected, then skip it.
                if (!clientMap.has(id)) return true;
                // TODO: check if we're at maximum network bandwidth capacity and defer to later.
                wss.safeSend(clientMap.get(id), refreshJson);
                return true;
            });
            let endTime = Date.now();
            let diff = endTime - startTime;
            if (diff > kFixedDelta) {
                console.error("Frame took " + diff + "ms, max is " + kFixedDelta + "ms");
            }
            setTimeout(_tick, Math.max(kFixedDelta - diff, 1));
        }

        function _onConnect(ws) {
            if (clientMap.size >= kMaxConnections) {
                ws.send(ServerMessage.fromError(
                    'Cannot connect, maximum number of connections reached'));
                return;
            }
            ws.id = _idCounter++;
            clientMap.set(ws.id, ws);
            console.log('Connection made ' + ws.id);

            ws.on('message', _onMessage);
            ws.on('close', _onClose);
            ws.on('error', _onError);
            wss.safeSend(ws, {type: ServerMessage.type.kWelcome, id: ws.id});
        }

        function _onMessage(message) {
            console.log("Recieved", message);
            let json = ClientMessage.decode(message);
            // Augment json message with client id.
            json.id = this.id;
            bufferedClientMessages.push(json);
        }

        function _onClose() {
            console.log('Closing', this.id);
            bufferedClientMessages.push({ type: ClientMessage.type.kLeave, id: this.id });
            clientMap.delete(this.id);
        }

        function _onError() {
            // TODO.
            console.log("Socket error: TODO");
        }

        wss.on('connection', _onConnect);
        _tick();

        return {
            getStatus: getStatus
        };
    };

    module.exports = Manager;
}());
