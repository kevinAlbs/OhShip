// // Simulates the websocket server in receiving messages from client,
// // running server simulation, and responding with messages.

// // NOTE: This should be done later.
// var DebugSocket = (function() {
//     var this = {}
//         , shipMap = {}
//         // Unique id
//         , uid = 1
//         // The client event handler for when messages are "recieved"
//         , messageEventHandler = null
//         , outgoingMessageBuffer = []
//         , messageHandlers = {
//             'meta': onMetaData,
//             'ship': onShipData
//         }
//         ;

//     // Replaces the socket.io call
//     this.emit = function(event, message) {
//         if (!(message.dataType in messageHandlers))
//             throw 'Unknown data type recieved';
//         messageHandlers[message.dataType](
//             message.event, message.dataId, message.data);
//     };

//     // Replaces the socket.io call
//     this.on = function(event, fn) {
//         // This differs in socket.io implementation since
//         // only assuming one event 'data' and one binding function
//         if (messageEventHandler) throw 'Handler already bound';
//         messageEventHandler = fn;
//     };

//     function tick() {
//         // Simulate.
//         // Send pending messages.
//         sendMessages();
//     }

//     function pushMessage(message) {
//         outgoingMessageBuffer.push(message);
//     }

//     // "Sends" all network messages.
//     function sendMessages() {
//         if (!messageEventHandler) return;
//         _.each(outgoingMessageBuffer, function(message) {
//             messageEventHandler(message);
//         });
//     }

//     function onMetaData(event, id, data) {
//         if (event == 'play') {
//             // Create new server ship.
//             var shipId = uniqueId();
//             var ship = new ServerShip();
//             shipMap[shipId] = ship;

//             pushMessage({
//                 dataType: 'meta',
//                 event: 'init',
//                 data: {id: shipId}
//             });

//             pushMessage({
//                 dataType: 'ship',
//                 event: 'create',
//                 data: ship.getState()
//             });
//         }
//     }

//     function onShipData(event, id, data) {

//     }

//     function uniqueId() {
//         return uid++;
//     }

// }());