define(["entity/Entity", "core/Collision"], function(Entity, Collision){
  var Cannonball = function(game, opt){
      Entity.call(this);
      var that = this
          ;
      var x = opt.point.x;
      var y = opt.point.y;

      that._owner = opt.owner || null;
      that._ball = game.add.sprite(x, y, "cannonball");
      //need to instantiate to specify mass (last param)
      that._ball.body = new Phaser.Physics.P2.Body(game, that._ball, x, y, 5);
      that._ball.body.clearShapes();
      that._ball.body.addCircle(8, 0, 0);
      that._ball.body.fixedRotation = true;
      that._ball.body.debug = true;
      that._ball.anchor.set(0.5);
      that._ball.body.moveRight(opt.velocity.x);
      that._ball.body.moveUp(opt.velocity.y);
      that._ball.body.setCollisionGroup(Collision.group.cannonball);
      that._ball.body.collidesWith = [
        Collision.group.ship
      ]
      that._ball.body.updateCollisionMask();
  };

  Cannonball.prototype = Entity.prototype;

  Cannonball.prototype.isOwnedBy = function(ship) {
    return ship == this._owner;
  };

  Cannonball.prototype.getBodyIds = function(){
    return [this._ball.body.id]
  };

  Cannonball.prototype.addContactListener = function(listener) {
    var that = this;
    that._ball.body.onBeginContact.add(function(other_body) {
      listener.call(window, that, other_body);
    });
  }

  Cannonball.preload = function(game){
    /*
    Static method to preload all necessary resources
    */
    game.load.image("cannonball", "img/cannonball.png");
  };

  return Cannonball;
});
