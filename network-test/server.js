var express = require('express')
    , app = express()
    , server = require('http').Server(app)
    , io = require('socket.io')(server)
    , port = 8888
    , game = require('./game')(io)
    ;

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

server.listen(port);
console.log("Listening on port " + port);
