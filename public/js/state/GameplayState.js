define(["entity/Ship"], function(Ship){
  var GameplayState = function(game){
      var that = {}
          , cursors
          , ship
          ;
      that.preload = function(){
        Ship.preload(game);
      };

      that.create = function(){
        cursors = game.input.keyboard.createCursorKeys();
        game.physics.startSystem(Phaser.Physics.P2JS);
        ship = new Ship(game);
      };

      that.update = function(){
        if (cursors.up.isDown) {
          ship.applyLeftVelocity(50);
        } else if (cursors.down.isDown) {
          ship.applyLeftVelocity(-50);
        }
        if (cursors.left.isDown) {
            ship.applyRightVelocity(-50);
        } else if (cursors.right.isDown) {
            ship.applyRightVelocity(50);
        }
      };
      return that;
  }
  return GameplayState;
});
