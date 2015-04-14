define([],
  function(){
    function PhaserGame(w,h,el) {
      var game = new Phaser.Game(w,h,Phaser.AUTO,el);
      return game;
    }
    return PhaserGame;
  });
