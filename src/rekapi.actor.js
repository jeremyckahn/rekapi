;(function rekapiActor (global) {

  var gk;
  
  gk = global.Kapi;
  
  gk.Actor = function Actor (kapi, config) {
    config = config || {};
    
    this.constructor.call(this, {
      'fps': kapi.config.fps
      ,'initialState': config.initialState
    });
    
    _.extend(this, {
      'setup': config.setup || gk.noop
      ,'draw': config.draw || gk.noop
      ,'teardown': config.teardown || gk.noop
    });
    
    return this;
  };
  
  gk.Actor.prototype = Tweenable.prototype;

} (this));