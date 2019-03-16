/// <amd-module name="Env/_Env/loadContents" />
// @ts-ignore
import * as merge from 'Core/core-merge';
import constants  from 'Env/_Env/constants';

const RESOURCES_FOLDER = 'resources';

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

/**
 * Загружает метаданные сервиса в приложение
 * @param {Object} contents Метаданные сервиса в формате JSON
 * @param {Boolean} [replace=false] Заменять ли содержимое.
 * @param {Object} [options] опции для указания пути до service (/, /auth/ etc.) и resources (resources, myresources).
 */
export default function(contents, replace = false, options = {}) {
    const global = (0, eval)('this');

    if (replace) {
        // @ts-ignore
        constants.hosts = [];
        // @ts-ignore
        constants.jsPackages = {};
        // @ts-ignore
        constants.xmlPackages = {};
        // @ts-ignore
        constants.xmlContents = {};
        // @ts-ignore
        constants.hdlBindings = {};
        // @ts-ignore
        constants.services = {};
        // @ts-ignore
        constants.modules = {};
        // @ts-ignore
        constants.htmlNames = {};
        // @ts-ignore
        constants.jsModules = {};
        // @ts-ignore
        constants.dictionary = {};
        // @ts-ignore
        constants.availableLanguage = {};
    }

    // Формируем options
    // @ts-ignore
    options.service = removeLeadingSlash(removeTrailingSlash(options.service || '/'));
    // @ts-ignore
    options.resources = removeLeadingSlash(removeTrailingSlash(options.resources || RESOURCES_FOLDER));

    if (contents) {
        const contentsCopy = { ...contents };

        // Processing buildnumber, patch and dictionary for every module
        const buildNumber = contentsCopy.buildnumber;
        const dictionary = {};
        if (contentsCopy.modules) {
            Object.keys(contentsCopy.modules).forEach((name) => {
                const config = contentsCopy.modules[name];

                if (buildNumber && !config.hasOwnProperty('buildnumber')) {
                    config.buildnumber = buildNumber;
                }

                if (config.hasOwnProperty('dict')) {
                    config.dict.forEach((dict) => {
                        const dictFile = dict.indexOf('.css') > 0 ? dict : `${dict}.json`;
                        dictionary[`${name}.${dictFile}`] = true;
                    });
                }
            });
        }

        contentsCopy.dictionary = dictionary;

        // Translate local contents to the constants and global contents
        const mergeConfig = {
            // @ts-ignore
            preferSource: options.preferSource || false
        };
        merge(constants, contentsCopy, mergeConfig);
        if (global.contents) {
            merge(global.contents, contentsCopy, mergeConfig);
        }
    }
}
