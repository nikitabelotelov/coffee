define('Env/_Env/loadContents', [
    'require',
    'exports',
    'tslib',
    'Core/core-merge',
    'Env/_Env/constants'
], function (require, exports, tslib_1, merge, constants_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var RESOURCES_FOLDER = 'resources';
    function removeLeadingSlash(path) {
        if (path) {
            var head = path[0];
            if (head === '/' || head === '\\') {
                return path.substr(1);
            }
        }
        return path;
    }
    function removeTrailingSlash(path) {
        if (path) {
            var tail = path.substr(path.length - 1);
            if (tail === '/' || tail === '\\') {
                return path.substr(0, path.length - 1);
            }
        }
        return path;
    }    /**
     * Загружает метаданные сервиса в приложение
     * @param {Object} contents Метаданные сервиса в формате JSON
     * @param {Boolean} [replace=false] Заменять ли содержимое.
     * @param {Object} [options] опции для указания пути до service (/, /auth/ etc.) и resources (resources, myresources).
     */
    /**
     * Загружает метаданные сервиса в приложение
     * @param {Object} contents Метаданные сервиса в формате JSON
     * @param {Boolean} [replace=false] Заменять ли содержимое.
     * @param {Object} [options] опции для указания пути до service (/, /auth/ etc.) и resources (resources, myresources).
     */
    function default_1(contents, replace, options) {
        if (replace === void 0) {
            replace = false;
        }
        if (options === void 0) {
            options = {};
        }
        var global = (0, eval)('this');
        if (replace) {
            // @ts-ignore
            constants_1.default.hosts = [];    // @ts-ignore
            // @ts-ignore
            constants_1.default.jsPackages = {};    // @ts-ignore
            // @ts-ignore
            constants_1.default.xmlPackages = {};    // @ts-ignore
            // @ts-ignore
            constants_1.default.xmlContents = {};    // @ts-ignore
            // @ts-ignore
            constants_1.default.hdlBindings = {};    // @ts-ignore
            // @ts-ignore
            constants_1.default.services = {};    // @ts-ignore
            // @ts-ignore
            constants_1.default.modules = {};    // @ts-ignore
            // @ts-ignore
            constants_1.default.htmlNames = {};    // @ts-ignore
            // @ts-ignore
            constants_1.default.jsModules = {};    // @ts-ignore
            // @ts-ignore
            constants_1.default.dictionary = {};    // @ts-ignore
            // @ts-ignore
            constants_1.default.availableLanguage = {};
        }    // Формируем options
             // @ts-ignore
        // Формируем options
        // @ts-ignore
        options.service = removeLeadingSlash(removeTrailingSlash(options.service || '/'));    // @ts-ignore
        // @ts-ignore
        options.resources = removeLeadingSlash(removeTrailingSlash(options.resources || RESOURCES_FOLDER));
        if (contents) {
            var contentsCopy_1 = tslib_1.__assign({}, contents);    // Processing buildnumber, patch and dictionary for every module
            // Processing buildnumber, patch and dictionary for every module
            var buildNumber_1 = contentsCopy_1.buildnumber;
            var dictionary_1 = {};
            if (contentsCopy_1.modules) {
                Object.keys(contentsCopy_1.modules).forEach(function (name) {
                    var config = contentsCopy_1.modules[name];
                    if (buildNumber_1 && !config.hasOwnProperty('buildnumber')) {
                        config.buildnumber = buildNumber_1;
                    }
                    if (config.hasOwnProperty('dict')) {
                        config.dict.forEach(function (dict) {
                            var dictFile = dict.indexOf('.css') > 0 ? dict : dict + '.json';
                            dictionary_1[name + '.' + dictFile] = true;
                        });
                    }
                });
            }
            contentsCopy_1.dictionary = dictionary_1;    // Translate local contents to the constants and global contents
            // Translate local contents to the constants and global contents
            var mergeConfig = {
                // @ts-ignore
                preferSource: options.preferSource || false
            };
            merge(constants_1.default, contentsCopy_1, mergeConfig);
            if (global.contents) {
                merge(global.contents, contentsCopy_1, mergeConfig);
            }
        }
    }
    exports.default = default_1;
});