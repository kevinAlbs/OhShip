// Simulates the websocket server in taking actions from client and responding with messages.
var LocalServer = (function() {
	var this = {};

	// Sends pending delta updates
	this.sendUpdates = function() {}

	// Sends full state update
	this.sendState = function(){}

	// Replaces the socket.io call
	this.emit = function(room, data) {}
}());