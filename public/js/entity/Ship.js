define([], function(){
  var Ship = function(game){
      var that = this
          ;
      that._body = null;
      that._left_engine = null;
      that._right_engine = null;

      that._left_engine = game.add.sprite(20, 100, "engine");
      game.physics.p2.enable(that._left_engine, true);
      that._left_engine.body.angle = 90;

      that._right_engine = game.add.sprite(70, 100, "engine");
      game.physics.p2.enable(that._right_engine, true);
      that._right_engine.body.angle = 90;

      that._body = game.add.sprite(50, 70, "body");
      //need to instantiate to specify mass (last param)
      that._body.body = new Phaser.Physics.P2.Body(game, that._body, 30, 70, 20);
      that._body.body.debug = true;
      that._body.anchor.set(0.5);

      game.physics.p2.createLockConstraint(that._left_engine, that._body, [-30,30]);
      game.physics.p2.createLockConstraint(that._right_engine, that._body, [30,30]);
  };

  Ship.prototype._applyVelocity = function(engine, value){
    var that = this
        , rad = (engine.body.angle+90) * Math.PI / 180
        , y = Math.sin(rad) * value
        , x = Math.cos(rad) * value
        ;
    engine.body.setZeroVelocity();
    engine.body.moveUp(y);
    engine.body.moveLeft(x);
  }

  Ship.prototype.applyLeftVelocity = function(val){
    var that = this;
    that._applyVelocity(that._left_engine, val);
  };

  Ship.prototype.applyRightVelocity = function(val){
    var that = this;
    that._applyVelocity(that._right_engine, val);
  };

  Ship.preload = function(game){
    /*
    Static method to preload all necessary resources
    */
    game.load.image("engine", "img/engine.png");
    game.load.image("body", "img/body.png");
  }

  return Ship;
});
