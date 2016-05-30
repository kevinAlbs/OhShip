var ClientShip = function(createState) {

	// Called when ship state refresh is recieved from server.
	this.setRefreshState = function(state) {
		refreshState = state;
	};

	// Called when ship state update is recieved from server.
	this.setUpdateState = function(partialState) {
		updateState = partialState;
	}

	// Interpolates current state for one frame.
	this.tick = function(delta) {
		refreshStateIfNecessary();
		updateStateIfNecessary();

		delta /= 30;

		var rotationDelta = (state.leftEngine - state.rightEngine) / 100;
		var forwardDelta = state.leftEngine + state.rightEngine;

		state.rotation += rotationDelta * delta;
		state.x += forwardDelta * Math.cos(state.rotation) * delta;
		state.y += forwardDelta * Math.sin(state.rotation) * delta;

		shipSprite.position.x = state.x;
		shipSprite.position.y = state.y;
		shipSprite.rotation = state.rotation;
	};

	function refreshStateIfNecessary() {
		if (!refreshState) return;
		// If the network state is far from the current interpolated state
		// completely replace. Otherwise, inch towards network state.
		state = refreshState;
		refreshState = null;
	}

	function updateStateIfNecessary() {
		if (!updateState) return;
		console.log('updating with', updateState);
		// This should show animations for new events, e.g. if a flag
		// color is changed, show the flag animation.
		_.extend(state, updateState);
		console.log(state);
		updateState = null;
	}
	
	// Add to rendering.
	var state = {
		x: 0,
		y: 0,
		leftEngine: 0,
		rightEngine: 0,
		rotation: 0,
		flagColor: 0xFF0000
	};

	// If present, this is the state recieved by network.
	var refreshState = null;
	var updateState = null;

	_.extend(state, createState);

	var shipTexture = PIXI.Texture.fromImage('/img/ship.png');
	var shipSprite = new PIXI.Sprite(shipTexture);
	shipSprite.anchor.x = .5;
	shipSprite.anchor.y = .5;

	shipSprite.position.x = state.x;
	shipSprite.position.y = state.y;
	shipSprite.rotation = state.rotation;

	stage.addChild(shipSprite);


};