/// <amd-module name="View/Executor/_Utils/RequireHelper" />

var myRequireHash = {};

// require.defined returns current module if you call it with '.'
function checkModuleName(name) {
   return name.indexOf('<') === -1 && name.indexOf('>') === -1 && name.indexOf('/') > -1 && name !== '.';
}

export function defined(name) {
   var res = false;

   if (typeof name !== 'string') {
      return false;
   }

   if (myRequireHash[name]) {
      return true;
   } else if (checkModuleName(name)) {
      // @ts-ignore
      res = require.defined(name);
      if (res) {
         // @ts-ignore
         myRequireHash[name] = require(name);
      }
   }
   return res;
}

function _require(name) {
   if (!myRequireHash[name]) {
      // @ts-ignore
      myRequireHash[name] = require(name);
   }
   return myRequireHash[name];
}
export { _require as require };
