;(function rekapiCore (global) {
  
  if (!_) {
    throw 'underscore.js is required for Rekapi.';
  }
  
  if (!Tweenable) {
    throw 'shifty.js is required for Rekapi.';
  }
  
  var gr;
  
  gr = global.Rekapi || function Rekapi () {
    
  };
  
  global.Rekapi = gr;
  
} (this));