/**
 * Created by ps.borisov on 05.05.2017.
 */
define('Core/helpers/vital/processImagePath', [
   'require',
   'Env/Env',
   'Core/helpers/getVersionedLink'
], function(
   requirejs,
   Env,
   getVersionedLink
) {
   /**
    * Модуль, в котором описана функция <b>processImagePath(path)</b>.
    *
    * @class Core/helpers/vital/processImagePath
    * @public
    * @author Крайнов Д.О.
    */

   var global = this || (0, eval)('this');// eslint-disable-line no-eval
   var isServer = typeof window === 'undefined';

   return function processImagePath(path) {
      if (typeof path === 'string') {
         if (isServer) {
            var nodePath = require('path');
         }

         if (path.indexOf('ws:/') === 0) {
            var replaceTo = Env.constants.wsRoot + 'img/themes/wi_scheme';
            if (isServer) {
               //constants.wsRoot начинается со слеша
               replaceTo = nodePath.join(Env.constants.wsRoot, 'img/themes/wi_scheme');
            }
            path = path.replace('ws:', replaceTo);

            if (/(jpg|png|gif|svg)$/.test(path)) {
               path = getVersionedLink(path);
            }
         } else if (path.indexOf('/') > -1) {
            path = requirejs.toUrl(path);
            if (isServer) {
               var baseUrl = global.wsConfig._baseUrl || '';
               if (path.startsWith(baseUrl)) {
                  path = path.slice(baseUrl.length);
               }
               if (!path.startsWith('/')) {
                  path = '/' + path;
               }
            }
         }
      }

      return path;
   };
});
