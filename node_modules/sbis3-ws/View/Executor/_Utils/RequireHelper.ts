/// <amd-module name="View/Executor/_Utils/RequireHelper" />

const myRequireHash = {};

// require.defined returns current module if you call it with '.'
function checkModuleName(name) {
   return name.indexOf('<') === -1 && name.indexOf('>') === -1 && name.indexOf('/') > -1 && name !== '.';
}

export function defined(name) {
   let res = false;

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
         const mod = require(name);

         //It's possible that module is defined but not ready yet because it waits for its own dependencies.
         //If we start to build templates until this process ends we'd receive not exactly module body here.
         //We can get undefined or an empty object instead.
         if (mod === undefined || (mod && typeof mod === 'object' && Object.keys(mod).length === 0)) {
            return false;
         }

         myRequireHash[name] = mod;
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
