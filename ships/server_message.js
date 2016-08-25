function ServerMessage() {}

ServerMessage.type = {
    kWelcome : 0,
    kShipUpdate: 1,
    kRefresh : 2
};

ServerMessage.fromData = function(data) {
    return JSON.parse(data);
};

ServerMessage.fromJSON = function(json) {
    return JSON.stringify(json);
}

ServerMessage.fromError = function(msg) {
    return JSON.stringify({e: msg});
}

if (module) module.exports = ServerMessage;