function VerticalSlider(el){
  var that = this;
  el = $(el);
  var state = "sleep" //valid states are sleep, awake (like focused), and active (being touched)
      , grabber = el.find(".grabber")
      , changeCallbacks = []
      ;

  function awaken(){
    state = "awake";
  }

  /*
  Event for touch/mouse move (normal NOT jquery event)
  @param type String either "mouse" or "touch"
  */
  function activate(e, type){
    if(state == "awake" || state == "active"){
      var page_y = 0
          , grabber_height = grabber.height()
          , height = el.height()
          , bar_y = el.offset().top
          , max_y = height - grabber_height
          ;
      if(type == "mouse"){
        page_y = e.pageY;
      } else if (type == "touch"){
        var page_y = -1;
        //use most recent touch
        for(var i = 0; i < e.changedTouches.length; i++){
          if(e.changedTouches[i].target == el[0] || e.changedTouches[i].target == grabber[0]){
            page_y = e.changedTouches[i].pageY;
          }
        }
        if(page_y == -1){
          return;
        }
      }
      //move move yo ass to the cursor
      var new_y = page_y - bar_y
      if(new_y < 0){
        new_y = 0;
      } else if (new_y > max_y){
        new_y = max_y;
      }
      grabber.css("top",  new_y + "px");
      notifyCallbacks(new_y / max_y);
    }
  }

  function activateMouse(e){
    activate(e, "mouse");
  }

  function activateTouch(e){
    activate(e, "touch");
  }

  function sleep(){
      state = "sleep";
  }

  /*
  @param ratio float range is [0,1]
  */
  function notifyCallbacks(ratio){
    for(var i = 0; i < changeCallbacks.length; i++){
      changeCallbacks[i].call(window, ratio);
    }
  }

  that.onChange = function(callback){
    changeCallbacks.push(callback);
  }

  el.on("touchstart", awaken).on("mousedown", awaken);
  el[0].addEventListener("touchmove", activateTouch);
  document.body.addEventListener("mousemove", activateMouse);
  $(document.body).on("touchend", sleep).on("mouseup", sleep);

  return that;
}
