var UI = (function(){
  var that = {}
      ;

  function toggleFullScreen() {
    var doc = window.document;
    var docEl = $("#container")[0];

    var requestFullScreen = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen || docEl.msRequestFullscreen;
    var cancelFullScreen = doc.exitFullscreen || doc.mozCancelFullScreen || doc.webkitExitFullscreen || doc.msExitFullscreen;

    if(!doc.fullscreenElement && !doc.mozFullScreenElement && !doc.webkitFullscreenElement && !doc.msFullscreenElement) {
      requestFullScreen.call(docEl);
    }
    else {
      cancelFullScreen.call(doc);
    }
    window.setTimeout(function(){WINDOW_RESIZE.fixWindow();}, 1000);
  }

  that.left_slider = new VerticalSlider(document.querySelector("#left_lever"));
  that.right_slider = new VerticalSlider(document.querySelector("#right_lever"));
  that.feedback = function(msg){
    $("#middle_section").html(msg);
  }
  $("#btn-fullscreen").on("click", toggleFullScreen);

  return that;
}());
