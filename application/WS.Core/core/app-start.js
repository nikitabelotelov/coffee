define('Core/app-start', [
   'require',
   'Core/Control',
   'View/Request',
   'Env/Env',
   'Core/Themes/ThemesController',
   'native-css'

], function(require, Control, Request, Env) {
   'use strict';

   function createControl(control, config, dom) {
      var configReady = config||{};
      if (typeof window && window.wsConfig){
         for (var i in window.wsConfig){
            if (window.wsConfig.hasOwnProperty(i)) {
               configReady[i] = window.wsConfig[i];
            }
         }
      }
      var _getChildContext = control.prototype._getChildContext;
      control.prototype._getChildContext = function(){
         var base = _getChildContext?_getChildContext.call(this):{};
         if (typeof window && window.startContextData){
            for (var i in window.startContextData){
               if (window.startContextData.hasOwnProperty(i) && !base.hasOwnProperty(i)) {
                  base[i] = window.startContextData[i];
               }
            }
         }
         return base;
      };
      Control.createControl(control, configReady, dom);
   }

   var module = function(config) {
      if (typeof window !== 'undefined' && window.receivedStates) {
         //для совместимости версий. чтобы можно было влить контролы и WS одновременно
         window.__hasRequest = true;
         var sr = Request.getCurrent().stateReceiver;
         sr && sr.deserialize(window.receivedStates);
      }

      var dom = document.getElementById('root');
      if (module._shouldStart) {
         var dcomp = dom.attributes["data-component"];
         require([dcomp?dcomp.value:undefined, dom.attributes["component"].value], function(result, component) {
            if (result) {
               config = config || {};
               config.application = dom.attributes["component"].value;
            }
            config.buildnumber = window.buildnumber;
            createControl(result || component, config, dom);
         });
      }
   };
   module.createControl = createControl;
   module._shouldStart = true;
   Env.constants.saveLastState = false; // Need for compatibility with old controls
   // Lib/NavigationController/NavigationController check this constant and if it's true it scroll to last state.
   // We don't need it when we have new routing.
   return module;
});
