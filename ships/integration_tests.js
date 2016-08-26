// TODO: after prototype.
(function() {
    let WebSocket = require('ws')
    , uri = 'ws://localhost:4080'
    ;

    function connect(callback) {
        let ws = new WebSocket('ws://localhost:' + port);
        ws.on('open', callback(ws));     
    }

    let tests = [];
    tests.push("connectAndDisconnect", function(ws) {
        ws.close();
    });

    ws.on('open')
    tests.forEach((test) => { connect(test); });
}());