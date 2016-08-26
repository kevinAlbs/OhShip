// Responsible for parsing incoming client messages into JSON.
// Shared between server and client.
(function() {
    'use strict';
    let ClientMessage = {
        type: {
            kCannonFire : 0,
            kCannonMove : 1,
            kShipUpdate: 3,
            kSetNickname: 4,
            kJoin: 5,
            kRequestRefresh: 6,
            kObserve: 7,
            kLeave: 8,
            kSpawn: 9,
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