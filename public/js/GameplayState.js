define([], function(){
  /* THE NEXT THING YOU DO IS CLEAN THIS SHIT UP */
  var GameplayState = function(game){
      var that = {}
          , cursors
          , left_engine
          , right_engine
          , body
          ;
      that.preload = function(){
        game.load.image("engine", "img/engine.png");
        game.load.image("body", "img/body.png");
      };
      that.create = function(){
        cursors = game.input.keyboard.createCursorKeys();

        game.physics.startSystem(Phaser.Physics.P2JS);
        left_engine = game.add.sprite(20, 100, "engine");
        game.physics.p2.enable(left_engine, true);
        left_engine.body.angle = 90;

        right_engine = game.add.sprite(70, 100, "engine");
        game.physics.p2.enable(right_engine, true);
        right_engine.body.angle = 90;

        body = game.add.sprite(50, 70, "body");
        //need to instantiate to specify mass (last param)
        body.body = new Phaser.Physics.P2.Body(game, body, 30, 70, 20);
        body.body.debug = true;
        body.anchor.set(0.5);

        game.physics.p2.createLockConstraint(left_engine, body, [-30,30]);
        game.physics.p2.createLockConstraint(right_engine, body, [30,30]);

        window.left_engine = left_engine;
      };
      that.update = function(){
        left_engine.body.setZeroVelocity();

        var rad = (left_engine.body.angle+90) * Math.PI / 180;
        var hyp = 50;
        var y = Math.sin(rad);
        var x = Math.cos(rad);

        if (cursors.up.isDown) {
            left_engine.body.moveUp(y * hyp);
            left_engine.body.moveLeft(x * hyp);
        }
        else if (cursors.down.isDown) {
            left_engine.body.moveDown(y * hyp);
            left_engine.body.moveRight(x * hyp);
        }

        rad = (right_engine.body.angle+90) * Math.PI / 180;
        y = Math.sin(rad);
        x = Math.cos(rad);

        if (cursors.left.isDown) {
            right_engine.body.moveUp(y * hyp);
            right_engine.body.moveLeft(x * hyp);
        }
        else if (cursors.right.isDown) {
            right_engine.body.moveDown(y * hyp);
            right_engine.body.moveRight(x * hyp);
        }
      };
      return that;
  }
  return GameplayState;
});
