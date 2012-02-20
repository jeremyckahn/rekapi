$(function () {

  var duration = $('#duration');
  var animationDuration = initialDuration = duration.val();

  // The code in these are deliberately using some weird formatting.  The code
  // within gets used as a string.  Like magic!
  Tweenable.prototype.formula.customEase1 =
      function (x) {return Math.pow(x, 4)};

  Tweenable.prototype.formula.customEase2 =
      function (x) {return Math.pow(x, 0.25)};

  function getFormulaFromEasingFunc (fn) {
    var fnString = fn.toString(); // An f'n string
    var indexOfReturn = fnString.indexOf('return');
    var deprefixed = fnString.slice(indexOfReturn + 7);
    var desuffixed = deprefixed.replace(/\}$/, '');
    return desuffixed;
  }

  var ease = $('.ease');
  ease.on('keyup', function (evt) {
    var el = $(evt.target);
    var val = el.val();
    var easename = el.data('easename');
    var lastValid = el.data('lastvalidfn');

    try {
      eval('Tweenable.prototype.formula.' + easename
          + ' = function (x) {return ' + val + '}');
      el.data('lastvalidfn', val);
      el.removeClass('error');
      kapi.canvas_clear();
    } catch (ex) {
      eval('Tweenable.prototype.formula.' + easename
          + ' = function (x) {return ' + lastValid + '}');
      el.addClass('error');
    }
  });

  ease.each(function (i, el) {
    el = $(el);
    var easename = el.data('easename');
    var fnString = Tweenable.prototype.formula[easename];
    el.val(getFormulaFromEasingFunc(fnString));
    el.data('lastvalidfn', fnString);
  });

  function getCrosshairCoords (crosshair) {
    var pos = crosshair.position();
    return {
      x: pos.left + crosshair.width()/2
      ,y: pos.top + crosshair.height()/2
    };
  }

  function  moveLastKeyframe (actor, toMillisecond) {
    var trackNames = actor.getTrackNames();
    var lastFrameIndex = actor.getTrackLength(trackNames[0]) - 1;

    _.each(trackNames, function (trackName) {
      actor.modifyKeyframeProperty(trackName, lastFrameIndex, {
            'millisecond': toMillisecond
          });
    });

    actor.kapi.updateInternalState();
    animationDuration = toMillisecond;
  }

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
    var timeToModify = pos === 'from' ? 0 : animationDuration;
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
    circle.modifyKeyframe(animationDuration, {}, easingObj)
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

  duration.on('keyup', function (evt) {
    var val = duration.val();
    var validVal = Math.abs(val);
    if (!isNaN(val)) {
      moveLastKeyframe(circle, validVal);
    }
  });

  duration.on('keydown', function (evt) {
    var augmentBy;
    var which = evt.which;

    if (which != 38 && which != 40) {
      return;
    }

    if (which == 38) { // up
      augmentBy = 10;
    } else if (which == 40) { // down
      augmentBy = -10;
    }

    duration.val(parseInt(animationDuration, 10) + augmentBy);
    duration.trigger('keyup');
  });

  kapi.addActor(circle);
  circle.keyframe(0, _.extend(getCrosshairCoords(crosshairs.from), {
      'color': '#777'
      ,'radius': 15
    }))
    .keyframe(initialDuration, _.extend(getCrosshairCoords(crosshairs.to), {
      'color': '#333'
    }));

  var controls = new RekapiScrubber(kapi);
  kapi.play();

});
