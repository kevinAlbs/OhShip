function VerticalSlider(el){
  var that = this;
  el = $(el);
  var state = "sleep" //valid states are sleep, awake (like focused), and active (being touched)
      , grabber = el.find(".grabber")
      , area = el.find(".clickarea")
      , change_callbacks = []
      , grace_scale = 1 //scaling factor of width for grace area
      ;

  /*
  The grace_scale specifies the area where finger/cursor can be and still have
  have the slider remain active. This is multiplied by the bar width.
  @param x float
  */
  function inGraceArea(x){
    var bar_x_center = el.offset().left + el.width()/2
        , width = el.width()
        ;
    if(Math.abs(x - bar_x_center) > width * grace_scale){
        return false;
    }
    return true;
  }

  /*
  @param e object event object
  @param type string either "mouse" or "touch"
  @return {x:float,y:float} for event click/touch
  */
  function getCoords(e, type){
    var x = null
        , y = null
        ;
    if(type == "mouse"){
      y = e.pageY;
      x = e.pageX;
    } else if (type == "touch"){
      console.log(e);
      //use most recent touch
      for(var i = 0; i < e.changedTouches.length; i++){
        if(e.changedTouches[i].target == area[0]){
          y = e.changedTouches[i].pageY;
          x = e.changedTouches[i].pageX;
        }
      }
    }
    return {"x" : x, "y" : y};
  }

  function awaken(e, type){
    var coords = getCoords(e, type);
    if(inGraceArea(coords.x)){
      console.log("Awaken");
      state = "awake";
    }
  }

  /*
  Event for touch/mouse move (normal NOT jquery event)
  @param type String either "mouse" or "touch"
  */
  function activate(e, type){
    if(state == "awake" || state == "active"){
      var coords = getCoords(e, type)
          , grabber_height = grabber.height()
          , height = el.height()
          , bar_y = el.offset().top
          , max_y = height - grabber_height
          ;

      if(!inGraceArea(coords.x)){
        sleep();
        return;
      }

      //move move yo ass to the cursor
      var new_y = coords.y - bar_y
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

  function awakenMouse(e){
    awaken(e, "mouse");
  }

  function awakenTouch(e){
    awaken(e, "touch");
  }

  function sleep(){
      state = "sleep";
  }

  /*
  @param ratio float range is [0,1]
  */
  function notifyCallbacks(ratio){
    for(var i = 0; i < change_callbacks.length; i++){
      change_callbacks[i].call(window, ratio);
    }
  }

  that.onChange = function(callback){
    change_callbacks.push(callback);
  }

  document.body.addEventListener("touchstart", awakenTouch);
  document.body.addEventListener("mousedown", awakenMouse);
  document.body.addEventListener("touchmove", activateTouch);
  document.body.addEventListener("mousemove", activateMouse);

  /*
  This ought to change so it doesn't put all to sleep if only one is released
  */
  $(document.body).on("mouseup", sleep);

  return that;
}
