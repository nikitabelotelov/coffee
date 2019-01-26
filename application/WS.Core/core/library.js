/**
 * Work with libraries
 * @author Мальцев А.А.
 */
define('Core/library', [
   'require'
], function(
   require
) {
   'use strict';

   var library = {
      /**
       * Loads module from the the library
       * @function
       * @name Core/library#load
       * @param {String} name Module name like 'Library/Name:Path.To.Module' or just 'Module/Name'
       * @param {Function} [loader] Modules loader (current RequireJS instance by default)
       * @return {Promise<*>} Loaded module
       */
      load: function(name, loader) {
         if (!name) {
            throw new Error('Module name must be specified');
         }

         if (!loader) {
            loader = require;
         }
         var parsed = library.parse(name);

         return new Promise(function(resolve, reject) {
            loader([parsed.name], function(library) {
               var mod = library;

               var processed = [];
               parsed.path.forEach(function(property) {
                  processed.push(property);
                  if (mod && typeof mod === 'object' && property in mod) {
                     mod = mod[property];
                  } else {
                     reject(new ReferenceError('Cannot find module "' + processed.join('.') + '" in library "' + parsed.name + '".'));
                  }
               });

               resolve(mod);
            }, reject);
         });
      },

      /**
       * Parses module declaration include library name name and path.
       * @function
       * @name Core/library#parse
       * @param {String} name Module name like 'Library/Name:Path.To.Module' or just 'Module/Name'
       * @return {Object} {name: string = 'Library/Name', path: string[] = ['Path', 'To', 'Module']}
       */
      parse: function(name) {
         var parts = String(name || '').split(':', 2);
         return {
            name: parts[0],
            path: parts[1] ? parts[1].split('.') : []
         };
      }
   };

   return library;
});
