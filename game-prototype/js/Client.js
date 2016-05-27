var Client = (function(){
	var socket;
	this.sendEvent = function() {};
	this.onMessage = function() {};

	this.init = function() {
		if (Config.get('network') == 'local') socket = LocalServer;
		else socket = new SocketIO(Config.get('server'));
	};
}());