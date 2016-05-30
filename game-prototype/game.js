var ServerShip = require('./ServerShip')
	, _ = require('underscore')
	;

function Game(io) {
	var shipMap = {}
		, userActionBuffer = []
		, outMessageBuffer = []
		, targetDelta = 60
		, prevTime = Date.now()
		;

	function tick() {
		var currentTime = Date.now();
		var delta = currentTime - prevTime;
		prevTime = currentTime;

		// TODO: Handle pending user actions.
		while (userActionBuffer.length > 0) {
			var userAction = userActionBuffer.shift();
			// TODO: enumerate all possibilites, make a simple parser.
			var ship = shipMap[userAction.shipId];
			ship.applyUserAction(userAction.action);
		}

		// Tick all ships and cannonballs, add any update states if necessary.
		_.each(shipMap, function(ship) {
			ship.tick(delta);
			if (ship.hasUpdated()) {
				outMessageBuffer.push({
					event: 'update',
					dataType: 'ship',
					dataId: ship.getId(),
					data: ship.getAndClearUpdate()
				});
			}
		});

		// TODO: If some set interval has passed, send a refresh update for each ship.

		// Broadcast all buffered messages.
		while (outMessageBuffer.length > 0) {
			var message = outMessageBuffer.shift();
			console.log('emitting', message);
			io.emit(message.dataType, message);
		}

		setTimeout(tick, targetDelta);
	}

	function sendCompleteRefresh(socket) {
		_.each(shipMap, function(ship){
			socket.emit('ship', {
				event: 'refresh',
				data: ship.getState(),
				dataId: ship.getId()
			});
		});
	}

	function onUserAction(data) {
		userActionBuffer.push({
			shipId: socket.id,
			action: data
		});
	}

	function onConnect(socket) {
		socket.on('play', function(data) {
			var ship = new ServerShip(socket.id);
			shipMap[socket.id] = ship;

			socket.emit('meta', {
				event: 'welcome',
				data: socket.id
			});

			outMessageBuffer.push({
				event: 'create',
                dataType: 'ship',
                dataId: ship.getId(),
                data: ship.getState()
            });

		});

		socket.on('user-action', onUserAction);
		socket.on('refresh-request', function() {
			sendCompleteRefresh(socket);
		});
		sendCompleteRefresh(socket);
	}

	io.on('connect', onConnect);
	tick();
	return this;
};

module.exports = Game;