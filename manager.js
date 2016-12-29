/*
Messaging should be
1. User connects
2. Server sends kWelcome with a unique id for the connection
3. Client sends either kJoin or (not implemented yet) kObserve to signify how they will be interacting.
    kJoin is sent along with optional nickname.
4. Bi-directional communication through other data messaging
*/
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
        const kMaxConnections = 5
        , kFixedDelta = 100
        ;

        let _idCounter = 0
        , clientMap = new Map()
        , game = new Game(idFactory)
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

        function idFactory() {
            return _idCounter++;
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
                wss.safeSend(ws, {type: ServerResponse.type.kError, data: {
                    maxReached: kMaxConnections,
                    message: 'The maximum number of players has been reached'
                }});
                ws.close();
                return;
            }
            ws.id = idFactory();
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
            if (json === null) return;
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

        function addAIPlayer() {
            var aiId = idFactory();
            bufferedClientMessages.push({
                id: aiId,
                type: ClientMessage.type.kJoin
            });
            bufferedClientMessages.push({
               id: aiId,
               type: ClientMessage.type.kSpawn 
            });
        }

        function removeAIPlayer() {

        }

        return {
            getStatus: getStatus,
            start: start
        };
    };

    module.exports = Manager;
}());
