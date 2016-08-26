// Responsible for encoding and decoding responses from the server.
// Shared between server and client.
(function() {
    'use strict';
    let ServerResponse = {
        type: {
            kWelcome : 0,
            kShipUpdate: 1,
            kRefresh : 2,
            kShipCreate: 3,
            kJoin: 4,
            kError: 5,
            kSpawn: 6
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

    if (typeof module !== 'undefined') module.exports = ServerResponse;
    else if (window) window.ServerResponse = ServerResponse;
}());