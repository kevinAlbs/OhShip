// Global static game config known by both server and client.
(function(){
	var cfg = {
		worldWidth: 2000,
		worldHeight: 2000,
		shipWidth: 64,
		shipHeight: 128,
		shipRadius: 128, // the larger of the two dimensions
	};
	if (typeof module !== 'undefined') module.exports = cfg;
	else if (window) window.GameConfig = cfg;
}());