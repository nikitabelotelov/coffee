/// <amd-module name="Core/helpers/Object/isEmpty" />

export = function isEmpty(obj) {
   if (obj === null || typeof (obj) !== 'object') {
      return false;
   }

   if (obj instanceof Object) {
      for (const i in obj) {
         return false;
      }
   } else if (obj instanceof Array) {
      return obj.length === 0;
   }

   return true;
}
