define(["entity/Ship"
        ,"entity/Cannonball"
        ,"core/Collision"
        ,"core/EntityList"
        ], function(Ship, Cannonball, Collision, EntityList){
  var GameplayState = function(game){
      var that = {}
          , cursors = null
          , ships = new EntityList()
          , cannonballs = new EntityList()
          , players = {}
          , p1
          , p2
          ;
      that.preload = function(){
        Ship.preload(game);
        Cannonball.preload(game);
      };

      that.create = function(){
        cursors = game.input.keyboard.createCursorKeys();
        game.physics.startSystem(Phaser.Physics.P2JS);
        Collision.init(game);

        game.physics.p2.restitution = .1;
        
        game.physics.p2.setBounds(0,0,800,600,true,true,true,true,true);
        //game.physics.p2.updateBoundsCollisionGroup(true);

        p1 = ships.add(new Ship(game, {x: 50, y: 50}));
        p2 = ships.add(new Ship(game, {x: 300, y: 70}));

        Collision.listenFor(ships, cannonballs, function(){
          console.log("Hit ya");
        });

        console.log("Listening for new players");
        var socket = io.connect('http://localhost:8000');
        socket.emit("initialize", {
          "type" : "game"
        })
        socket.on("player_join", function(id){
          players[id] = ships.add(new Ship(game, {x: Math.random() * 800, y: Math.random() * 600}));
        });
        socket.on("update", function(message){
          var id = message["player_id"];
          var data = message["data"];
          console.log(data);
          if(data.hasOwnProperty("left_ratio")){
            var left = ((1 - parseFloat(data.left_ratio)) - .5) * 2;
            console.log(left * 50);
            players[id].applyLeftVelocity(left * 50);
          }

        });
      };

      that.update = function(){
        if (cursors.up.isDown) {
          p1.applyLeftVelocity(50);
        } else if (cursors.down.isDown) {
          p1.applyLeftVelocity(-50);
        }
        if (cursors.left.isDown) {
            p1.applyRightVelocity(-50);
        } else if (cursors.right.isDown) {
            p1.applyRightVelocity(50);
        }

        if (game.input.keyboard.isDown(Phaser.Keyboard.Z)) {
          makeCannonball(p1, "left");
        }
        if (game.input.keyboard.isDown(Phaser.Keyboard.X)) {
          makeCannonball(p1, "right");
        }

      };


      function makeCannonball(ship, side){
        var opt = ship.fire(side);
        if (!opt) {
          // TODO: play empty sound
          return;
        }
        var cannonball = cannonballs.add(new Cannonball(game, opt));
      }

      return that;
  }
  return GameplayState;
});
