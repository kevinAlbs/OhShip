// The server ship will send updates if it hasn't been updated since 
var ServerShip = function(uniqueId, data) {
	var state = {
		x: Math.random() * 300,
		y: Math.random() * 300,
		leftEngine: 0,
		rightEngine: 0,
		rotation: 0,
		flagColor: 0x000000,
		sunk: false,
		name: "" // TODO
	};

	var updateState = {};
	var hasUpdated = false;
	var id = uniqueId;
	var MAX_FRAMES_WITHOUT_UPDATE = 100; // 3 seconds.
	var framesSinceLastUpdate = 0;

	this.applyUserAction = function(action) {
		state.leftEngine = action.data.leftEngine;
		state.rightEngine = action.data.rightEngine;
		hasUpdated = true;
		updateState = {
			leftEngine: action.data.leftEngine,
			rightEngine: action.data.rightEngine
		};
	};

	this.sink = function() {
		state.sunk = true;
		updateState.sunk = true;
		hasUpdated = true;
	}

	this.getState = function(){
		return state;
	};

	this.getId = function() {
		return id;
	};

	this.getUpdateIfNeeded = function(){
		if (hasUpdated || framesSinceLastUpdate >= MAX_FRAMES_WITHOUT_UPDATE) {
			console.log("Ship " + id + " is sending update");
			// Add interpolated properties.
			updateState.x = state.x;
			updateState.y = state.y;
			updateState.rotation = state.rotation;
			hasUpdated = false;
			framesSinceLastUpdate = 0;
			return updateState;
		} else {
			framesSinceLastUpdate++;
			return null;
		}
	};

	this.tick = function(delta) {
		delta /= 30;
		
		var rotationDelta = (state.leftEngine - state.rightEngine) / 100;
		var forwardDelta = state.leftEngine + state.rightEngine;

		state.rotation += rotationDelta * delta;
		state.x += forwardDelta * Math.cos(state.rotation) * delta;
		state.y += forwardDelta * Math.sin(state.rotation) * delta;

	}

	return this;
};

module.exports = ServerShip;