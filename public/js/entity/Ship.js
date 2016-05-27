define(["entity/Entity", "core/Collision"], function(Entity, Collision){
  /*
  @param opt {Object}
  {
    x,y, {Number} Center point of ship
    angle, {Number} In radians
  }
  */
  var Ship = function(game, opt){
      Entity.call(this);
      var that = this
          ;
      that._game = game;
      that._body = null;
      that._left_engine = null;
      that._right_engine = null;
      this._left_loaded = true;
      this._right_loaded = true;

      var x = opt.x;
      var y = opt.y;

      that._left_engine = game.add.sprite(x - 15, y + 30, "engine");
      game.physics.p2.enable(that._left_engine, !true);
      that._left_engine.body.angle = 0;

      that._right_engine = game.add.sprite(x + 15, y + 30, "engine");
      game.physics.p2.enable(that._right_engine, !true);
      that._right_engine.body.angle = 0;

      that._body = game.add.sprite(x, y, "body");
      //need to instantiate to specify mass (last param)
      that._body.body = new Phaser.Physics.P2.Body(game, that._body, x, y, 20);
      that._body.body.debug = !true;
      that._body.anchor.set(0.5);
      that._body.body.clearShapes();
      that._body.body.loadPolygon("body_polygon", "body");
      // angularDamping gives angular resistance feel, as if
      // travelling through thick medium
      that._body.body.angularDamping = .9;
      that._body.body.damping = .5;
      
      that._body.body.setCollisionGroup(Collision.group.ship);
      that._body.body.collidesWith = [
        Collision.group.bounds,
        Collision.group.cannonball,
        Collision.group.ship
      ];
      that._body.body.collideWorldBounds = true;
      that._body.body.updateCollisionMask();
    

      game.physics.p2.createLockConstraint(that._left_engine, that._body, [-15,30]);
      game.physics.p2.createLockConstraint(that._right_engine, that._body, [15,30]);
      
      // test the difference for pixels
      var explosionBMP = game.add.bitmapData(17, 17);
      explosionBMP.ctx.drawImage(game.cache.getImage("explosion"),0,0);

      var currentBMP = game.add.bitmapData(100,100);
      currentBMP.add(this._body.texture);

      this._body.loadTexture(currentBMP);
      


  };

  Ship.prototype = Object.create(Entity.prototype);

  Ship.prototype._applyVelocity = function(engine, value){
    var that = this
        , rad = (engine.body.angle+90) * Math.PI / 180
        , y = Math.sin(rad) * value
        , x = Math.cos(rad) * value
        ;
    engine.body.setZeroVelocity();
    engine.body.moveUp(y);
    engine.body.moveLeft(x);
  };

  Ship.prototype.applyLeftVelocity = function(val){
    var that = this;
    that._applyVelocity(that._left_engine, val);
  };

  Ship.prototype.applyRightVelocity = function(val){
    var that = this;
    that._applyVelocity(that._right_engine, val);
  };

  Ship.prototype.isLoaded = function(side){
    return side == "left" ? this._left_loaded : this._right_loaded;
  };

  /*
  @return Config for cannonball or null if cannot fire
  */
  Ship.prototype.fire = function(side){
    if (!this.isLoaded(side)) return;
    var angle = (this._body.angle + 90) * Math.PI / 180;

    if (side == "left") angle += Math.PI/2;
    else angle -= Math.PI/2;

    var point = new Phaser.Point(this._body.x + Math.cos(angle) * 30,
                                 this._body.y + Math.sin(angle) * 30);
    var velocity = new Phaser.Point(Math.cos(angle) * 400,
                                     - Math.sin(angle) * 400);

    if (side == "left") this._left_loaded = false;
    else this._right_loaded = false;

    return {
      owner: this,
      point: point,
      velocity: velocity
    };
  };

  Ship.prototype.hitByCannonball = function(velocity) {
    console.log("Ship hit");
  };

  Ship.prototype.getBodyIds = function(sprite){
    var ids = [];
    ids.push(this._body.body.id, this._left_engine.body.id, this._right_engine.body.id);
    return ids;
  }

  Ship.preload = function(game){
    /*
    Static method to preload all necessary resources
    */
    game.load.image("engine", "img/engine.png");
    game.load.image("body", "img/body.png");
    game.load.physics("body_polygon", "polygon/body.json");
    game.load.image("explosion", "img/explosion.png");
  };

  return Ship;
});
