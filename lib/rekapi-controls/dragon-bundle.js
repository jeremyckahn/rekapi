/**
 * jQuery Dragon Slider.  It's a slider plugin!
 *   v0.1.0
 *   By Jeremy Kahn (jeremyckahn@gmail.com)
 *   Depends on jQuery jquery.dragon.js
 *   MIT License.
 *   For more info: https://github.com/jeremyckahn/dragon
 */

;(function ($) {

  var $win = $(window);
  var $doc = $(document.documentElement);
  var noop = $.noop || function () {};


  // CONSTANTS
  var DEFAULTS = {
    'width': 250
    ,'increment': .02
    ,'drag': $.noop
  };
  var KEY_RIGHT = 39;
  var KEY_LEFT = 37;


  /**
   * @param {jQuery} $slider
   * @param {jQuery} $handle
   * @return {number}
   */
  function getInnerSliderWidth ($slider, $handle) {
    return $slider.width() - $handle.outerWidth();
  }


  /**
   * @param {Object=} opts
   *   @param {number} width Width of the slider.
   *   @param {Function(number)} drag The drag event handler.  Receives the
   *       current slider value.
   */
  $.fn.dragonSlider = function (opts) {
    opts = opts || {};
    var defaultsCopy = $.extend({}, DEFAULTS);
    initDragonSliderEls(this, $.extend(defaultsCopy, opts));
  };


  /**
   * @param {number} val Between 0 and 1.
   */
  $.fn.dragonSliderSet = function (val, triggerDrag) {
    val = Math.min(1, val);
    val = Math.max(0, val);
    var data = this.data('dragon-slider');
    var $handle = this.find('.dragon-slider-handle');
    var scaledVal = val * getInnerSliderWidth(this, $handle);
    $handle.css('left', scaledVal);

    if (triggerDrag !== false) {
      data.drag(this.dragonSliderGet());
    }
  };


  /**
   * @return {number} Between 0 and 1.
   */
  $.fn.dragonSliderGet = function () {
    var $handle = this.find('.dragon-slider-handle');
    var left = $handle.position().left;
    return left / getInnerSliderWidth(this, $handle);
  };


  /**
   * @param {jQuery} $els
   * @param {Object} opts
   */
  function initDragonSliderEls ($els, opts) {
    $els.each(function (i, el) {
      var $el = $(el);
      $el.data('dragon-slider', $.extend({}, opts));
      var $handle = createDragHandle($el);
      $el
        .addClass('dragon-slider')
        .width(opts.width - parseInt($el.css('border-width'), 10))
        .on('mousedown', onSliderMousedown)
        .append($handle);
    });
  }


  /**
   * @param {jQuery} $container
   */
  function createDragHandle ($container) {
    var $handle = $(document.createElement('BUTTON'));
    var data = $container.data('dragon-slider');
    $handle.addClass('dragon-slider-handle');
    $handle.dragon({
      'within': $container
      ,'drag': function () {
        // Setting the gotten value to centralize the "drag" event tiggering
        $container.dragonSliderSet($container.dragonSliderGet());
      }
    });
    $handle.on('keydown', onHandleKeydown);

    return $handle;
  }


  /**
   * @param {Object} ev
   */
  function onHandleKeydown (ev) {
    var $el = $(this);
    var $parent = $el.parent();
    var current = $parent.dragonSliderGet();
    var data = $parent.data('dragon-slider');
    var increment = data.increment;
    var key = ev.which;

    if (key === KEY_LEFT) {
      $parent.dragonSliderSet(current - increment);
    } else if (key === KEY_RIGHT) {
      $parent.dragonSliderSet(current + increment);
      $parent.trigger('drag');
    }
  }


  /**
   * @param {Object} ev
   */
  function onSliderMousedown (ev) {
    if (ev.target === this) {
      var $el = $(this);
      var $handle = $el.find('.dragon-slider-handle');
      var offset = ev.clientX - $el.offset().left;
      offset -= $handle.outerWidth() / 2;
      $el.dragonSliderSet(offset / getInnerSliderWidth($el, $handle));
      $handle.trigger('mousedown', [ev.pageX, ev.pageY]);
    }
  }

} (this.jQuery));
/**
 * jQuery Dragon.  It's a dragging plugin!
 *   v0.1.3
 *   By Jeremy Kahn (jeremyckahn@gmail.com)
 *   MIT License.
 *   For more info: https://github.com/jeremyckahn/dragon
 */
;(function ($) {

  var $win = $(window);
  var $doc = $(document.documentElement);
  var noop = $.noop || function () {};


  /**
   * Options:
   *
   *   @param {boolean} noCursor Prevents the drag cursor from being "move"
   *   @param {string} axis The axis to constrain dragging to.  Either 'x' or
   *     'y'.  Disabled by default.
   *   @param {jQuery} within The jQuery'ed element's bounds to constrain the
   *     drag range within.
   *   @param {string} handle A jQuery selector for the "handle" element within
   *     the dragon element that initializes the dragging action.
   *   @param {function} dragStart Fires when dragging begins.
   *   @param {function} drag Fires for every tick of the drag.
   *   @param {function} dragEnd Fires when dragging ends.
   */
  $.fn.dragon = function (opts) {
    initDragonEls(this, opts || {});
  };


  // CONSTANTS
  $.extend($.fn.dragon, {
    'AXIS_X': 'x'
    ,'AXIS_Y': 'y'
  });


  function initDragonEls ($els, opts) {
    opts.axis = opts.axis || {};
    $els.attr('draggable', 'true');
    $els.on('dragstart', preventDefault);

    if (!opts.noCursor) {
      if (opts.handle) {
        $els.find(opts.handle).css('cursor', 'move');
      } else {
        $els.css('cursor', 'move');
      }
    }

    $els.each(function (i, el) {
      var $el = $(el);
      var position = $el.position();
      var top = position.top;
      var left = position.left;

      $el
        .css({
          'top': top
          ,'left': left
          ,'position': 'absolute'
        })
        .data('dragon', {})
        .data('dragon-opts', opts);

      if (opts.handle) {
        $el.on('mousedown', opts.handle, $.proxy(onMouseDown, $el));
      } else {
        $el.on('mousedown', $.proxy(onMouseDown, $el));
      }

    });
  }


  /**
   * @param {Object} evt
   * @param {number=} opt_pageX Can be used if evt.pageX is falsy (if the event
   *     was synthesized)
   * @param {number=} opt_pageY Can be used if evt.pageY is falsy (if the event
   *     was synthesized)
   */
  function onMouseDown (evt, opt_pageX, opt_pageY) {
    var data = this.data('dragon');
    var onMouseUpInstance = $.proxy(onMouseUp, this);
    var onMouseMoveInstance = $.proxy(onMouseMove, this);
    var initialPosition = this.position();
    this.data('dragon', {
      'onMouseUp': onMouseUpInstance
      ,'onMouseMove': onMouseMoveInstance
      ,'isDragging': true
      ,'left': initialPosition.left
      ,'top': initialPosition.top
      ,'grabPointX': initialPosition.left -
         (typeof evt.pageX === 'number' ? evt.pageX : opt_pageX)
      ,'grabPointY': initialPosition.top -
         (typeof evt.pageY === 'number' ? evt.pageY : opt_pageY)
    });

    $doc
      .on('mouseup', onMouseUpInstance)
      .on('blur', onMouseUpInstance)
      .on('mousemove', onMouseMoveInstance);

    $doc.on('selectstart', preventSelect);
    fire('dragStart', this, evt);
  }


  function onMouseUp (evt) {
    var data = this.data('dragon');
    data.isDragging = false;

    $doc.off('mouseup', data.onMouseUp)
      .off('blur', data.onMouseUp)
      .off('mousemove', data.onMouseMove)
      .off('selectstart', preventSelect);

    delete data.onMouseUp;
    delete data.onMouseMove;
    fire('dragEnd', this, evt);
  }


  function onMouseMove (evt) {
    var data = this.data('dragon');
    var opts = this.data('dragon-opts');
    var newCoords = {};

    if (opts.axis !== $.fn.dragon.AXIS_X) {
      newCoords.top = evt.pageY + data.grabPointY;
    }

    if (opts.axis !== $.fn.dragon.AXIS_Y) {
      newCoords.left = evt.pageX + data.grabPointX;
    }

    if (opts.within) {
      // omg!
      var offset = this.offset();
      var width = this.outerWidth(true);
      var height = this.outerHeight(true);
      var container = opts.within;
      var containerWidth = container.innerWidth();
      var containerHeight = container.innerHeight();
      var containerOffset = container.offset();
      var containerPaddingTop = parseInt(container.css('paddingTop'), 10);
      var containerTop = containerOffset.top + containerPaddingTop;
      var containerBottom = containerTop + containerHeight;
      var containerPaddingLeft = parseInt(container.css('paddingLeft'), 10);
      var containerLeft = containerOffset.left + containerPaddingLeft;
      var containerRight = containerLeft + containerWidth;
      var marginLeft = parseInt(this.css('marginLeft'), 10);
      var marginTop = parseInt(this.css('marginTop'), 10);
      var marginBottom = parseInt(this.css('marginBottom'), 10);
      var marginRight = parseInt(this.css('marginRight'), 10);
      var minDistanceLeft = containerPaddingLeft - marginLeft;
      var minDistanceRight = containerWidth + marginRight;
      var minDistanceTop = containerPaddingTop - marginTop;
      var minDistanceBottom = containerHeight + marginBottom;

      if (newCoords.left < minDistanceLeft
          || offset.left < containerLeft) {
        newCoords.left = minDistanceLeft;
      }

      if (newCoords.left + width > minDistanceRight
          || offset.left > containerRight) {
        newCoords.left = minDistanceRight - width;
      }

      if (newCoords.top < minDistanceTop
          || offset.top < containerTop) {
        newCoords.top = minDistanceTop;
      }

      if (newCoords.top + height > minDistanceBottom
          || offset.top > containerBottom) {
        newCoords.top = minDistanceBottom - height;
      }
    }

    this.css(newCoords);
    fire('drag', this, evt);
  }


  // This event handler fixes some craziness with the startselect event breaking
  // the cursor style.
  // http://forum.jquery.com/topic/chrome-text-select-cursor-on-drag
  function preventSelect(evt) {
    preventDefault(evt);
    if (window.getSelection) {
      window.getSelection().removeAllRanges();
    } else if (document.selection) {
      document.selection.clear();
    }
  }


  function preventDefault (evt) {
    evt.preventDefault();
  }


  // Yep, you only get to bind one event handler.  Much faster this way.
  function fire (event, $el, evt) {
    var handler = $el.data('dragon-opts')[event];
    // Patch the proxied Event Object
    evt.target = $el[0];
    handler && handler(evt);
  }

} (this.jQuery));
