(function() {
   var global = (function () { return this || (1, eval)('this') }());

   if (typeof window !== 'undefined') {
      global._callbackStorage = global._callbackStorage || [];
      global._singleStoreStorage = global._singleStoreStorage || [];
      global._withCompStorage = global._withCompStorage || [];
   }


   require(['Core/core']);

})();
