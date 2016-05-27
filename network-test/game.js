var players = {}
	io = null
	;

function addPlayer(socket) {
	var player = {
		x: 100,
		y: 100,
		hMovement: 0,
		vMovement: 0,
		actionQueue: [],
		socket: socket
	};

	players[socket.id] = player;

	socket.on('action', function (data) {
        player.actionQueue.push(data);
    });

    socket.emit('joinConfirmed', {
    	id: socket.id
    });
}

function removePlayer(socket) {
	delete players[socket.id];
}

function tick() {
	for(var id in players) {
		var pl = players[id];
		for (var i = 0; i < pl.actionQueue.length; i++) {
			var latency = Math.abs(pl.actionQueue.time - Date.now());
			// Blah blah blah... no time for more network prototype!
		}
		players[id].x += players[id].hMovement;
		players[id].y += players[id].yMovement;
	}

	sendUpdate();
	setTimeout(tick, 1000);
}

function sendUpdate() {
	var snapshot = {players: {}};
	for (var id in players) {
		snapshot.players[id] = {
			x: players[id].x,
			y: players[id].y
		}
	};
	io.emit('update', snapshot);
}

function init(socketio) {
	io = socketio;
	io.on('connection', function (socket) {
	    socket.on('join', function() {
	        addPlayer(socket);
	    });
	    socket.on('disconnect', function() {
	        removePlayer(socket);
	        socket = null;
	    });
	});

	tick();
	
	return {
		addPlayer: addPlayer,
		removePlayer: removePlayer
	};
}

module.exports = init;