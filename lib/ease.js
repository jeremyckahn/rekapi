$(function () {

  function getCrosshairCoords (crosshair) {
    var pos = crosshair.position();
    return {
      x: pos.left + crosshair.width()/2
      ,y: pos.top + crosshair.height()/2
    };
  }

  var ANIM_LENGTH = 2000;
  var canvas = $('canvas')[0];
  var kapi = new Kapi(canvas, {
      'fps': 60
      ,'height': 400
      ,'width': 500
    })
    ,circle = new Kapi.Actor({
      'draw': function (canvas_context, state) {
        canvas_context.beginPath();
          canvas_context.arc(
            state.x || 0,
            state.y || 0,
            state.radius || 50,
            0,
            Math.PI*2,
            true);
          canvas_context.fillStyle = state.color || '#444';
          canvas_context.fill();
          canvas_context.closePath();
          return this;
        }
      });
  kapi.canvas_style('background', '#eee');

  var crosshairs = {
    'from': $('.crosshair.from')
    ,'to': $('.crosshair.to')
  };

  crosshairs.from.add(crosshairs.to).draggable({
    'containment': 'parent'
    ,'drag': handleDrag
    ,'stop': handleDragStop
  });

  function handleDrag (evt, ui) {
    var target = $(evt.target);
    var pos = target.data('pos');
    var timeToModify = pos === 'from' ? 0 : ANIM_LENGTH;
    circle.modifyKeyframe(timeToModify, getCrosshairCoords(crosshairs[pos]));
    kapi
      .canvas_clear()
      .redraw();
  }

  function handleDragStop (evt, ui) {
    handleDrag.apply(this, arguments);
  }

  function initSelect (select) {
    _.each(Tweenable.prototype.formula, function (formula, name) {
      var option = $(document.createElement('option'), {
          'value': name
        });

      option.html(name);
      select.append(option);
    });
  }

  var selects = $('#tween-controls select');

  selects.each(function (i, el) {
    initSelect($(el));
  });

  selects.on('change', function (evt) {
    var target = $(evt.target);
    var easingObj = {};
    easingObj[target.data('axis')] = target.val();
    circle.modifyKeyframe(ANIM_LENGTH, {}, easingObj)
    kapi
      .canvas_clear()
      .redraw();
  });

  var clearOnUpdate = $('#clear-on-update');
  clearOnUpdate.on('change', function (evt) {
    var checked = clearOnUpdate.attr('checked');
    kapi.config.clearOnUpdate = !!checked;
  });

  var clearCanvas = $('#clear-canvas');
  clearCanvas.on('click', function (evt) {
    kapi
    .canvas_clear()
    .redraw();
  });

  kapi.addActor(circle);
  circle.keyframe(0, _.extend(getCrosshairCoords(crosshairs.from), {
      'color': '#777'
      ,'radius': 15
    }))
    .keyframe(ANIM_LENGTH, _.extend(getCrosshairCoords(crosshairs.to), {
      'color': '#333'
    }));

  var controls = new RekapiScrubber(kapi);
  kapi.play();

});
