// Responsible for parsing incoming client messages into JSON.
// Shared between server and client.
(function() {
    'use strict';
    var ClientMessage = {
        type: {
            kCannonFire : 0,
            kShipUpdate: 1,
            kSetNickname: 2,
            kJoin: 3,
            kRequestRefresh: 4,
            kObserve: 5,
            kLeave: 6,
            kSpawn: 7,
        },
        // Used by the client.
        encode: function (json) {
            return JSON.stringify(json);
        },
        // Used by the server. Returns null if malformed.
        decode: function(data) {
            try { return JSON.parse(data); }
            catch (e) { return null; }
        }
    }

    if (typeof module !== 'undefined') module.exports = ClientMessage;
    else if (window) window.ClientMessage = ClientMessage;
}());