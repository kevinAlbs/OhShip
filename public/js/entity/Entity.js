define([], function(game){
	var ID = 0;
	function nextID(){
		return ID++;
	}
	var Entity = function(){
		var that = this;
		that._id = nextID();
		return that;
	};
	Entity.prototype.getId = function() {
		return this._id;
	}
	Entity.prototype.getBodyIds = function(){
			console.log("getBodyIds not implemented for entity");
	}
	return Entity;
})