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

  var PRERENDER_GRANULARITY = 100;
  function generatePathPoints (x1, y1, x2, y2, easeX, easeY) {
    var points = [];
    var from = {
        'x': x1
        ,'y': y1
      };
    var to = {
        'x': x2
        ,'y': y2
      };
    var easing = {
      'x': easeX
      ,'y': easeY
    };
    var i, point;
    for (i = 0; i <= PRERENDER_GRANULARITY; i++) {
      point = Tweenable.util.interpolate(
          from, to, (1 / PRERENDER_GRANULARITY) * i, easing);
      points.push(point);
    }

    return points;
  }

  var prerenderedPath;
  function generatePathPrerender (x1, y1, x2, y2, easeX, easeY) {
    prerenderedPath = document.createElement('canvas');
    prerenderedPath.width = kapi.canvasWidth();
    prerenderedPath.height = kapi.canvasHeight();
    var ctx = prerenderedPath.ctx = prerenderedPath.getContext('2d');
    var points = generatePathPoints.apply(this, arguments);

    var previousPoint;
    ctx.beginPath();
    _.each(points, function (point) {
      if (previousPoint) {
        ctx.lineTo(point.x, point.y);
      } else {
        ctx.moveTo(point.x, point.y);
      }

      previousPoint = point;
    });
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#fa0';
    ctx.stroke();
    ctx.closePath();
  }

  var ease = $('.ease');
  ease.on('keyup', function (evt) {
    var el = $(evt.target);
    var val = el.val();
    var easename = el.data('easename');
    var lastValid = el.data('lastvalidfn');

    if (lastValid === val) {
      return;
    }

    try {
      eval('Tweenable.prototype.formula.' + easename
          + ' = function (x) {return ' + val + '}');
      el.data('lastvalidfn', val);
      el.removeClass('error');
      updatePath();
    } catch (ex) {
      eval('Tweenable.prototype.formula.' + easename
          + ' = function (x) {return ' + lastValid + '}');
      el.addClass('error');
    }
  });

  ease.each(function (i, el) {
    el = $(el);
    var easename = el.data('easename');
    var fn = Tweenable.prototype.formula[easename];
    var fnString = getFormulaFromEasingFunc(fn);
    el.val(fnString);
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

    actor.kapi._recalculateAnimationLength();
    animationDuration = toMillisecond;
  }

  var canvas = $('canvas')[0];
  var kapi = new Kapi({
      'context': canvas
      ,'height': 400
      ,'width': 500
    })
    ,circle = new Kapi.CanvasActor({
      'render': function (canvas_context, state) {

        if (isPathShowing && prerenderedPath) {
          canvas_context.drawImage(prerenderedPath, 0, 0);
        }

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

  var crosshairs = {
    'from': $('.crosshair.from')
    ,'to': $('.crosshair.to')
  };

  crosshairs.from.add(crosshairs.to).dragon({
    'within': crosshairs.from.parent()
    ,'drag': handleDrag
    ,'dragEnd': handleDragStop
  });

  function updatePath () {
    var fromCoords = getCrosshairCoords(crosshairs.from);
    var toCoords = getCrosshairCoords(crosshairs.to);
    generatePathPrerender(fromCoords.x, fromCoords.y, toCoords.x, toCoords.y,
        selects._from.val(), selects._to.val());
  }

  function handleDrag (evt, ui) {
    var target = $(evt.target);
    var pos = target.data('pos');
    var timeToModify = pos === 'from' ? 0 : animationDuration;
    circle.modifyKeyframe(timeToModify, getCrosshairCoords(crosshairs[pos]));
    kapi
      .canvasClear()
      .redraw();
    updatePath();
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

  // TODO: This is reeeeeeeally sloppy, just attaching the selects to $ instance
  // itself. Clean this silliness up.
  selects._from = selects.filter('#x-easing');
  selects._to = selects.filter('#y-easing');

  selects.each(function (i, el) {
    initSelect($(el));
  });

  selects.on('change', function (evt) {
    var target = $(evt.target);
    var easingObj = {};
    easingObj[target.data('axis')] = target.val();
    circle.modifyKeyframe(animationDuration, {}, easingObj)
    updatePath();
    kapi
      .canvasClear()
      .redraw();
  });

  var showPath = $('#show-path');
  var isPathShowing = true;
  showPath.on('change', function (evt) {
    var checked = showPath.attr('checked');
    isPathShowing = !!checked;
    kapi.redraw();
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
  updatePath();
  kapi.play();

});
