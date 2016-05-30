var express = require('express')
    , app = express()
    , server = require('http').Server(app)
    , io = require('socket.io')(server)
    , port = 8888
    , Game = require('./game')
    , game = new Game(io)
    ;

app.use(express.static('public'));

server.listen(port);
console.log("Listening on port " + port);