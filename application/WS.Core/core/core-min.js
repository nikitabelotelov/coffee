define('Core/core-min', [
   'Core/core-ready',
   'Core/core-init-min',
   'bootup-min',
   'Env/Env'
], function(cReady, cInit, bootup, Env) {
   'use strict';

   cReady.dependOn(cInit);
   Env.constants._isMinimalCore = true;

   bootup();
   return {};
});