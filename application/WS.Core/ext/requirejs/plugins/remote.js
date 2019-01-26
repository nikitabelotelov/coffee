define('remote', function() {
   'use strict';

   return {
      load: function () {
         throw new Error('Plugin "remote" is no longer exits. Please require module without plugin.');
      }
   }
});
