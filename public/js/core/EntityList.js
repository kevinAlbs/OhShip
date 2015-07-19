/*
A step in the right direction.
Need to consider the following:
- How to handle when Entities change bodies without removing themselves?
- How to iterate over bodies
- Ultimately, how to hash an entity without relying on body id?
*/
define([], function(){
	var EntityList = function(){
		var that = this
			, map = {} // maps entity id to entity
			, body_map = {} //maps body id to entity
			;

		that.add = function(entity){
			var id = entity.getId();
			if (body_map.hasOwnProperty(id))
				throw "Id " + id + " already in body_map";
			body_map[id] = entity;
			if (map.hasOwnProperty(id))
				throw "Id " + id + " already in map";
			map[id] = entity;

			var ids = entity.getBodyIds();
			console.log(ids);
			ids.forEach(function(id){
				if (body_map.hasOwnProperty(id))
					throw "Id " + id + " already in body_map";
				body_map[id] = entity;
			});
			return entity;
		};

		that.remove = function(entity){
			var id = entity.getId();
			if (map.hasOwnProperty(id))
				throw "Id " + id + " already in map";
			delete map[id];
			var ids = entity.getBodyIds();
			ids.forEach(function(id){
				if (!body_map.hasOwnProperty(id))
					throw "Id " + id + " not in body_map";
				delete body_map[id];
			});
		}

		that.forEach = function(fn, ctx){
			for(var p in map) {
				if (map.hasOwnProperty(p)) {
					fn.call(ctx, map[p]);
				}
			}
		};

		that.contains = function(entity) {
			return map.hasOwnProperty(entity.id);
		}

		that.fromBodyId = function(bodyId){
			if (body_map.hasOwnProperty(bodyId)) {
				return body_map[bodyId];
			}
			return null;
		}

		return that;
	};
	return EntityList;
});