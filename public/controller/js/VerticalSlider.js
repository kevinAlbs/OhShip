function VerticalSlider(el){
  var that = this;
  el = $(el);
  var grabber = el.find(".grabber")
      , area = el.find(".clickarea")
      , change_callbacks = []
      , mouse_pressed = false
      ;

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

  /*
  Event for touch/mouse move (normal NOT jquery event)
  @param type String either "mouse" or "touch"
  */
  function move(e, type){
      if(type == "mouse" && !mouse_pressed){
        return;
      }
      var coords = getCoords(e, type)
          , grabber_height = grabber.height()
          , height = el.height()
          , bar_y = el.offset().top
          , max_y = height - grabber_height
          ;

      //move move yo ass to the cursor
      var new_y = coords.y - bar_y - grabber_height/2
      if(new_y < 0){
        new_y = 0;
      } else if (new_y > max_y){
        new_y = max_y;
      }
      grabber.css("top",  new_y + "px");
      notifyCallbacks(new_y / max_y);
    
  }


  function moveMouse(e){
    move(e, "mouse");
  }

  function moveTouch(e){
    move(e, "touch");
  }

  function mouseDown(e){
    mouse_pressed = true;
  }

  function mouseUp(e){
    mouse_pressed = false;
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

  area[0].addEventListener("mousedown", mouseDown);
  area[0].addEventListener("mouseup", mouseUp);
  area[0].addEventListener("mousemove", moveMouse);
  area[0].addEventListener("touchmove", moveTouch);

  return that;
}
