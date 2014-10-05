require.config({
  paths: {
    underscore: '../dist/lodash.min'
    ,shifty: '../dist/shifty.min'
    ,rekapi: '../dist/rekapi.min'
  }
});

require(['rekapi'], function (Rekapi) {

  /**
   * @param {Object} arrayLike
   * @return {Array}
   */
  function toArray (arrayLike) {
    return Array.prototype.slice.call(arrayLike);
  }

  /**
   * @param {string}
   * @return {Array.<HTMLElement>}
   */
  function $ (selector) {
    return toArray(document.querySelectorAll(selector));
  }

  /**
   * @param {number} topRange
   * @return {number}
   */
  function randomInt (topRange) {
    return parseInt(Math.random() * topRange, 10);
  }

  /**
   * @return {string}
   */
  function getRandomColor () {
    return ['rgb('
        ,randomInt(255), ','
        ,randomInt(255), ','
        ,randomInt(255), ')'].join('');
  }

  var rekapi = new Rekapi(document.body);
  var lis = $('li');

  lis.forEach(function (li, i) {
    var durationVariance = Math.random() * 250;
    var actor = rekapi.addActor({ context: li });
    actor
      .keyframe(0, {
        transform: 'translateZ(1000px) rotateY(0deg)'
        ,background: 'rgb(0,0,0)'
        ,opacity: 0
      }).keyframe(1000 + durationVariance, {
        transform: 'translateZ(0px) rotateY(0deg)'
        ,opacity: 1
      }, 'bouncePast')
      .wait(1500)
      .keyframe(2500, {
        background: getRandomColor()
      }, 'easeOutCubic')
      .wait(3250)
      .keyframe(4000, {
        transform: 'translateZ(0px) rotateY(' + (i === 5 ? 720 : 0) + 'deg)'
        ,opacity: 1
      }, 'easeOutCubic')
      .wait(4500)
      .keyframe(4950 + (25 * i), {
        transform: 'translateZ(1000px) rotateY(' + (i === 5 ? 720 : 0) + 'deg)'
        ,opacity: 0
      }, 'swingFrom');
  });

  rekapi.play();
});
