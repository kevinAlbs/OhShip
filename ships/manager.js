(function(){
    'use strict';
    let Game = require('./game')
    , ServerResponse = require('./shared/server_response')
    , ClientMessage = require('./shared/client_message')
    ;

    // Responsible for managing client connections and forwarded decoded messages to/from game.
    function Manager(wss) {
        'use strict';
        const kMaxConnections = 65536 // should be high since observers don't add much load.
        , kFixedDelta = 100
        ;

        let _idCounter = 0
        , counters = {
            refresh: 0,
            incoming: 0,
            outgoing: 0 // excludes refresh messages
        }
        , clientMap = new Map()
        , game = new Game()
        , bufferedClientMessages = []
        ;

        function getStatus() {
            return {
                time: Date().toString(),
                numConnections: clientMap.size,
                counters: counters
            };
        }
        
        function _tick() {
            console.log("Tick");
            let startTime = Date.now();
            // Apply all user messages to game.
            while (bufferedClientMessages.length > 0) {
                counters.incoming++;
                game.applyClientMessage(bufferedClientMessages.shift());
            }

            let serverUpdates = game.tick(kFixedDelta);

            // Broadcast pending updates to all sockets.
            serverUpdates.forEach((json) => {
                counters.outgoing++;
                wss.safeBroadcast(json);
            });

            // If any players need a refresh, send it here.
            game.forEachPlayerRequestingRefresh((id, refreshJson) => {
                // If this client has disconnected, then skip it.
                if (!clientMap.has(id)) return true;
                // TODO: check if we're at maximum network bandwidth capacity and defer to later.
                wss.safeSend(clientMap.get(id), refreshJson);
                counters.refresh++;
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
                ws.send(ServerResponse.fromError(
                    'Cannot connect, maximum number of connections reached'));
                return;
            }
            ws.id = _idCounter++;
            clientMap.set(ws.id, ws);
            console.log('Connection made ' + ws.id);

            ws.on('message', _onMessage);
            ws.on('close', _onClose);
            ws.on('error', _onError);
            wss.safeSend(ws, {type: ServerResponse.type.kWelcome, id: ws.id});
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
