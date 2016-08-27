var socket = require('socket.io-client')('http://localhost');
var SimpleAI = function() {
	// Connect to server.
	// Do a random move every so often.
	console.log("Playing");
	socket.emit("play", {});
	socket.on('ship', function(data) {console.log(data); });
	socket.on('meta', function(data) {console.log(data); });
	socket.on('welcome', function(data) {console.log(data); });
	
	function act() {
		socket.emit('user-action', {
			leftEngine: Math.random(),
			rightEngine: Math.random()
		})
	}
	setTimeout(act, 1000);
};

module.exports = SimpleAI;