var express = require("express")
    , app = express()
    , server = require('http').Server(app)
    , io = require("socket.io")(server)
    , current_id = 0
    , games = {} //map from game id to object containing metadata (e.g. game state, etc.)
    ;

app.use(express.static("public"));
server.listen(8000);
console.log("Listening on port 8000");

io.on("connection", function(socket){
  console.log("Socket connection made");
  socket.on("initialize", function(config){
    var type = config.type;
    if(type == "game"){
      new Game(socket, config);
    } else if (type == "controller"){
      new Controller(socket, config);
    }
  });
});

function Controller(socket, config){
  var that = this
      , game_id = config.game_id
      , player_id = -1
      ;

  if(!games.hasOwnProperty(game_id)){
    console.log("Cannot connect to non-existant game " + game_id);
    return;
  }

  player_id = games[game_id].game.addPlayer();
  socket.on("update", function(data){
    console.log("Recieving controller update for player " + player_id);
    games[game_id].game.update(player_id, data);
  });
  socket.join("controller_" + game_id);
  return that;
}

function Game(socket, config){
  /*
    Generate a new game id and room
    The id should be pseudo-random and distributed among 4 digit numbers
  */
  var that = this
      , game_id = 1234//current_id
      , player_id = -1
      ;

  that.update = function(player_id, data){
    socket.emit("update", {
      "player_id" : player_id,
      "data" : data
    });
  };

  that.addPlayer = function(){
    socket.emit("player_join", ++player_id)
    return player_id;
  };

  console.log("Game " + game_id + " initialized");
  current_id++;
  games[game_id] = {
    game : that
  };
  socket.emit("initialized", game_id);
  return that;
}
