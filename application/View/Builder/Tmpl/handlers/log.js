define('View/Builder/Tmpl/handlers/log', ['Env/Env'], function errorHandlingDefine(Env) {
   'use strict';
   return {
      generateErrorMessage: function (filename) {
         return 'Template ' + filename + ' failed to generate html.';
      },
      IoC: Env.IoC
   };
});