(function() {
	'use strict';
	let server = require('http').createServer()
	  , url = require('url')
	  , WebSocketServer = require('ws').Server
	  , wss = new WebSocketServer({ server: server })
	  , express = require('express')
	  , app = express()
	  , port = 4080
	  , manager = require('./manager')(wss)
	  ;

	app.use(express.static('public'));
	server.on('request', app);
	server.listen(port, function () { console.log('Listening on ' + server.address().port) });
}());
