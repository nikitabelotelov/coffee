/// <amd-module name="Core/load-contents" />

/* global requirejs */
//@ts-ignore
import merge = require('Core/core-merge');
//@ts-ignore
import constants = require('Core/constants');

const RESOURCES_FOLDER = 'resources';
interface loadOptions {
   service?:string,
   resources?:string,
   preferSource?:boolean,
}
/**
 * Загружает метаданные сервиса в приложение
 * @param {Object} contents Метаданные сервиса в формате JSON
 * @param {Boolean} [replace=false] Заменять ли содержимое.
 * @param {Object} [options] опции для указания пути до service (/, /auth/ etc.) и resources (resources, myresources).
 */
export = function (contents, replace = false, options = <loadOptions>{}) {
   const global = (0, eval)('this');

   if (replace) {
      constants.hosts = [];
      constants.jsPackages = {};
      constants.xmlPackages = {};
      constants.xmlContents = {};
      constants.hdlBindings = {};
      constants.services = {};
      constants.modules = {};
      constants.htmlNames = {};
      constants.jsModules = {};
      constants.dictionary = {};
      constants.availableLanguage = {};
   }

   // Формируем options
   options.service = removeLeadingSlash(removeTrailingSlash(options.service || '/'));
   options.resources = removeLeadingSlash(removeTrailingSlash(options.resources || RESOURCES_FOLDER));

   function removeLeadingSlash(path) {
      if (path) {
         const head = path[0];
         if (head === '/' || head === '\\') {
            return path.substr(1);
         }
      }
      return path;
   }

   function removeTrailingSlash(path) {
      if (path) {
         const tail = path.substr(path.length - 1);
         if (tail === '/' || tail === '\\') {
            return path.substr(0, path.length - 1);
         }
      }
      return path;
   }

   function pathjoin(path1, path2) {
      if (path1 !== '') {
         const head = path1[0];

         if (head !== '/' && head !== '\\' && path1.charAt(1) !== ':' && path1.indexOf('http:') < 0) {
            path1 = `/${path1}`;
         }
      }
      let path = '';
      if (!path1 && /[a-z]+:\/{2}/i.test(path2)) {
         path = path2;
      } else {
         path = `${path1}/${path2}`;
      }
      if (constants.appRoot && path.indexOf(constants.appRoot) === 0) {
         path = path.replace(constants.appRoot, '/');
      }
      return path;
   }

   if (contents) {
      const contentsCopy = { ...contents };

      // Detect base path to the resources
      let basePath = options.service === '' && options.resources === ''
         ? options.resources
         : pathjoin(options.service, options.resources);

      if (basePath && !options.service) {
         basePath = removeLeadingSlash(basePath);
      }

      // Processing buildnumber, patch and dictionary for every module
      const buildNumber = contentsCopy.buildnumber;
      const dictionary = {};
      const paths = {};
      if (contentsCopy.modules) {
         Object.keys(contentsCopy.modules).forEach((name) => {
            if (name === 'Core') {
               return;
            }

            const config = contentsCopy.modules[name];

            if (buildNumber && !config.hasOwnProperty('buildnumber')) {
               config.buildnumber = buildNumber;
            }

            paths[name] = config.hasOwnProperty('path') ? config.path : `${basePath}/${name}`;

            if (config.hasOwnProperty('dict')) {
               config.dict.forEach((dict) => {
                  const dictFile = dict.indexOf('.css') > 0 ? dict : `${dict}.json`;
                  dictionary[`${name}.${dictFile}`] = true;
               });
            }
         });
      }

      contentsCopy.dictionary = dictionary;

      // TODO: get rid of this
      contentsCopy.requirejsPaths = paths;

      // Translate local contents to the constants and global contents
      const mergeConfig = {
         preferSource: options.preferSource || false
      };
      merge(constants, contentsCopy, mergeConfig);
      if (global.contents) {
         merge(global.contents, contentsCopy, mergeConfig);
      }

      // Re-set modules paths to RequireJS config
      //@ts-ignore
      requirejs.config({paths: constants.requirejsPaths});
   }
}