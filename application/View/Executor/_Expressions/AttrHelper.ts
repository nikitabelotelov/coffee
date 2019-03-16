/// <amd-module name="View/Executor/_Expressions/AttrHelper" />

export function isAttr(string) {
   return string.indexOf('attr:') === 0;
}

export function checkAttr(attrs) {
   for (var key in attrs) {
      if (isAttr(key)) {
         return true;
      }
   }
   return false;
}
