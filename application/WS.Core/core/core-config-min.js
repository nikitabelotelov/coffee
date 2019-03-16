define('Core/core-config-min', [
   
   'Env/Env',
   'Core/core-merge'
], function(Env, cMerge) {

   /**
    * Код конфигурирования ядра и запуска загрузки минимально необходимого набора компонентов
    *
    * ВНИМАНИЕ!!!
    * Пожалуйста, не добавляйте ничего после него. Все классы и т.п. должны быть выше этих строк.
    */

   "use strict";
   var global = (function(){ return this || (1,eval)('this') }());
   // New style configuration scheme

   //fasttemplate doesn't support (3.7.4.200)
   global.wsConfig && delete global.wsConfig.fasttemplate;

   var bindings = global.wsBindings || {};

   for (var iface in bindings) {
      if (bindings.hasOwnProperty(iface)) {
         var
            target = bindings[iface],
            single = false;
         if (target.single) {
            target = target.name;
            single = true;
         }
         if (single) {
            Env.IoC.bindSingle(iface, target);
         } else {
            Env.IoC.bind(iface, target);
         }
      }
   }

   cMerge(Env.constants, global.wsConfig || {}, {rec: false});
});