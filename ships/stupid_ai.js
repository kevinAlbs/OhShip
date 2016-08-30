// Deterministic AI used for testing a server.
(function(){
    'use strict';
    let WebSocket = require('ws')
    , Config = require('./config')
    , ClientMessage = require('./shared/client_message')
    , ServerResponse = require('./shared/server_response')
    , ws = new WebSocket("ws://" + Config.uri)
    , messagesSent = 0
    , kTimeBetweenMessages = 1000
    , playerId = null
    , leftEngine = 0
    , rightEngine = 0
    ;

    ws.on('message', (raw) => {
        let json = ServerResponse.decode(raw);
        console.log(playerId + ' recieved ' + json.type);
        switch (json.type) {
            case ServerResponse.type.kWelcome:
                play(json.id);
                break;
        }
    });

    function sendJson(json) {
        ws.send(ClientMessage.encode(json));
        messagesSent++;
    }

    function makeMove() {
        leftEngine += .01;
        leftEngine %= 1;
        rightEngine += .01;
        rightEngine %= 1;
        sendJson({
            type: ClientMessage.type.kShipUpdate,
            leftEngine: leftEngine,
            rightEngine: rightEngine
        })
    }

    function play(id) {
        playerId = id;
        sendJson({
            type: ClientMessage.type.kJoin,
            nickname: "stupidAI" + playerId
        });
        setInterval(makeMove, kTimeBetweenMessages);
    }

    setInterval(() => {
        console.log("Sent " + messagesSent);
        messagesSent = 0;
    }, 3000);
}());