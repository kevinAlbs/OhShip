var ServerShip = function(uniqueId) {
	var state = {
		x: Math.random() * 100,
		y: Math.random() * 100,
		leftEngine: 0,
		rightEngine: 0,
		rotation: 0,
		flagColor: 0x000000
	};

	var updateState = {};
	var hasUpdated = false;
	var id = uniqueId;

	this.applyUserAction = function(action) {
		state.leftEngine = action.data.leftEngine;
		state.rightEngine = action.data.rightEngine;
		hasUpdated = true;
		console.log(action);
		updateState = {
			leftEngine: action.data.leftEngine,
			rightEngine: action.data.rightEngine
		};
	};

	this.getState = function(){
		return state;
	};

	this.getId = function() {
		return id;
	};

	// Returns non-deterministic updates from last frame.
	// I.e. will not return position since this should be deterministic.
	this.getAndClearUpdate = function(){
		hasUpdated = false;
		return updateState;
	};

	this.hasUpdated = function() {
		return hasUpdated;
	}

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