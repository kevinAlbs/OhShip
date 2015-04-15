requirejs.config({
  baseUrl : "js"
});

require([
  'PhaserGame'
  , 'state/BootState'
  , 'state/GameplayState'
], function(PhaserGame, BootState, GameplayState){
    var game = new PhaserGame(800,600,document.getElementById("game"));
    //add a state for each "screen"
    game.state.add('Boot', BootState);
    game.state.add('Gameplay', GameplayState);
    game.state.start('Gameplay');
});
