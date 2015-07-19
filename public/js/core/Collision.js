/*
Methods for defining listeners for collision handling
*/
define([], function(){
	var that = {}
		,game = null
		,listeners = []
		;
	that.init = function(_game) {
		game = _game;
		that.group = {
			ship : game.physics.p2.createCollisionGroup(),
			cannonball : game.physics.p2.createCollisionGroup(),
			bounds : game.physics.p2.boundsCollisionGroup
		};
		game.physics.p2.onBeginContact.add(onCollision);
	};

	/*
	groupA and groupB are references of entity lists, responsible by the caller
	Entities are required to impement the bodyEqual function.
	*/
	that.listenFor = function(listA, listB, fn) {
		listeners.push({
			listA: listA,
			listB: listB,
			fn: fn
		});
	};

	function onCollision(bodyA,bodyB,shapeA,shapeB,contactEq) {
		// TODO: why do we need parent?
		bodyA = bodyA.parent;
		bodyB = bodyB.parent;
		listeners.forEach(function(listener){
			var entityA = listener.listA.fromBodyId(bodyA.id)
				, entityB
				;
			if (entityA) {
				entityB = listener.listB.fromBodyId(bodyB.id);
				if (entityB) {
					listener.fn.call(window, entityA, entityB, bodyA, bodyB, shapeA, shapeB);
				}
			} else {
				entityA = listener.listA.fromBodyId(bodyB.id);
				if (entityA) {
					entityB = listener.listB.fromBodyId(bodyA.id);
					if (entityB) {
						listener.fn.call(window, entityA, entityB, bodyA, bodyB, shapeA, shapeB);
					}
					return;
				}
			}
		});
	}

	return that;
});