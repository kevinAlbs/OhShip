(function(){
    'use strict';
    let Game = require('./game')
    , Stats = require('./stats')
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
        , clientMap = new Map()
        , game = new Game()
        , bufferedClientMessages = []
        ;

        function getStatus() {
            return {
                time: Date().toString(),
                numConnections: clientMap.size,
                stats: Stats.getJson()
            };
        }

        function start() {
            wss.on('connection', _onConnect);
            _tick();
        }
        
        function _tick() {
            let startTime = Date.now();
            // Apply all user messages to game.
            while (bufferedClientMessages.length > 0) {
                Stats.inc("incoming");
                game.applyClientMessage(bufferedClientMessages.shift());
            }

            let serverUpdates = game.tick(kFixedDelta);
            if (serverUpdates.length > 0) {
                // Broadcast pending updates to all sockets.
                wss.safeBroadcast({
                    type: ServerResponse.type.kBufferedUpdates,
                    data: serverUpdates
                });

                Stats.inc("outgoing");
                Stats.inc("server_updates", serverUpdates.length);
            }

            // If any players need a refresh, send it here.
            game.forEachPlayerRequestingRefresh((id, refreshJson) => {
                // If this client has disconnected, then skip it.
                if (!clientMap.has(id)) return true;
                // TODO: check if we're at maximum network bandwidth capacity and defer to later.
                wss.safeSend(clientMap.get(id), refreshJson);
                Stats.inc("refresh");
                return true;
            });
            let endTime = Date.now();
            let diff = endTime - startTime;
            if (diff > kFixedDelta) {
                console.error("Frame took " + diff + "ms, max is " + kFixedDelta + "ms");
                Stats.inc("framesExceeded");
            }
            Stats.tick(Math.max(kFixedDelta, diff));
            Stats.push("frameTime", diff);
            Stats.push("numFrames", diff);
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
            //console.log("Recieved", message);
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

        return {
            getStatus: getStatus,
            start: start
        };
    };

    module.exports = Manager;
}());
