function ClientMessage() {}

ClientMessage.type = {
    kCannonFire : 0,
    kCannonMove : 1,
    kEngineLeft : 2,
    kEngineRight: 3,
    kSetNickname: 4,
    kPlay: 5,
};

ClientMessage.fromData = function(data) {
    return JSON.parse(data);
};

ClientMessage.fromJSON = function(json) {
    return JSON.stringify(json);
}

if (module) module.exports = ClientMessage;