define('Core/PromiseLib/PromiseLib', [
   'Core/IoC',
], function(IoC, coreExtend) {
   'use strict';

   // Create promise that always resolve
   function reflect(promise) {
      return promise.then(function(result) {
            return {result: result, status: "resolved"}
         },
         function(error) {
            return {error: error, status: "rejected"}
         });
   }

   function wrapTimeout(promise, timeout) {
      var timeoutPromise = new Promise(function(resolve, reject) {
         setTimeout(function() {
            reject('Promise timeout');
         }, timeout);
      });
      return Promise.race([promise, timeoutPromise]);
   }

   return {
      reflect: reflect,
      wrapTimeout: wrapTimeout
   };
});