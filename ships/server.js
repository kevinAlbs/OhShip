(function() {
    'use strict';
    let server = require('http').createServer()
      , url = require('url')
      , WebSocketServer = require('ws').Server
      , wss = new WebSocketServer({ server: server, perMessageDeflate: true })
      , express = require('express')
      , app = express()
      , port = 4080
      , manager = require('./manager')(wss)
      , ServerResponse = require('./shared/server_response')
      ;

    // Sends a message to all clients. Closes client on error.
    wss.safeBroadcast = function broadcast(json) {
        let data = ServerResponse.encode(json);
        wss.clients.forEach((ws) => {
            _safeSendEncoded(ws, data);
        });
    };

    // Sends a message to one client. Closes client on error.
    wss.safeSend = function(ws, json) {
        _safeSendEncoded(ws, ServerResponse.encode(json));
    }

    function _safeSendEncoded(ws, data) {
        try {
            ws.send(data);
        } catch (e) {
            console.error('Could not send data to: ' + ws.id, data, e.message);
            ws.close();
        }
    }

    app.use(express.static('public'));
    app.use(express.static('shared'));
    app.get('/status', (req, res) => {
        res.send(manager.getStatus());
    });

    server.on('request', app);
    server.listen(port, function () { console.log('Listening on ' + server.address().port) });
    manager.start();
    // TODO Update Node, then repl may work.
    // repl = require("repl")
    // r = repl.start("node> ")
}());
