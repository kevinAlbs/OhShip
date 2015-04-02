/*
Adapts size of container to size of window
Parses DOM attributes to update CSS sizing
*/
var WINDOW_RESIZE = (function(){
  //size constraints
  var that = {}
      , max_width = 500
      , min_width = 300
      , max_height = 300
      , min_height = 150
      ;

  function percentToNum(perc){
    return parseInt(perc.substring(0, perc.length - 1));
  }

  function fixCSS(width, height){
    /*
    @param whole float Either the width/height value of the entire screen
    */
    function fixProperty(prop, whole){
      var prefix = "data-css-";
      $("[" + prefix + prop + "]").each(function(index){
        var perc = percentToNum($(this).attr(prefix + prop));
        var fixed_value = Math.round(whole * (perc/100));
        $(this).css(prop, fixed_value + "px");
      })
    }
    fixProperty("width", width);
    fixProperty("height", height);
    fixProperty("margin-top", height);
    fixProperty("margin-bottom", height);
    fixProperty("margin-left", width);
    fixProperty("margin-right", width);
  }

  that.fixWindow = function(){
    var ww = $(window).width();
    var wh = $(window).height();
    var width = ww > wh ? ww : wh;
    var height = ww > wh ? wh : ww;
    if(width > max_width) width = max_width;
    if(width < min_width) width = min_width;
    if(height > max_height) height = max_height;
    if(height < min_height) height = min_height;
    $("#container").width(width);
    $("#container").height(height);
    fixCSS(width, height);
  }

  window.addEventListener("orientationchange", function(){that.fixWindow();}, false);
  that.fixWindow();

  return that;
}());
