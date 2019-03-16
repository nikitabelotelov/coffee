define("Core/pathResolver", ["require", "exports", "Env/Env"], function (require, exports, Env_1) {
    "use strict";
    var // Global variables root
    global = (function () {
        return this || (0, eval)('this');
    })(), plugins = {
        'js': 0,
        'css': 0,
        'html': 0,
        'tmpl': 0,
        'wml': 0,
        'tmplstr': 0,
        'json': 0,
        'dpack': 0,
        'xml': 0
    }, isRemote = /[a-z]+:\/{2}/i, leadSlash = /^\//, jsExt = /\.js$/, anyModule = /(\w|\.)+(\?.*)?$/, jsModule = /(\w|\.)+\.module\.js(\?.*)?$/, jsModule2 = /(\.module\.js|\.js)(\?.*)?$/;
    /**
     * @name Core/pathResolver#resolveModulePath
     * @function
     * @description
     * Возвращает актуальный путь до файла с модулем
     * @param moduleName {String} - имя модуля в оглавлении
     * @returns {string}
     */
    function resolveModulePath(moduleName) {
        return [moduleName, moduleName + ".module.js"].join('/');
    }
    /**
     * @name Core/pathResolver#resolveComponentPath
     * @function
     * @description
     * Возаращает полный путь до компонента или его ресурсов по принятому короткому пути.
     * @remark
     * Метод может быть использован для определения возможности использовать компонент.
     * @param {String} path Упрощенный путь до ресурсов комопнента. Например, 'SBIS3.CONTROLS/Button/resources/images/process.gif'.
     * @example
     * <pre>
     *    var image = helpers.resolveComponentPath('SBIS3.CONTROLS/Button/resources/images/process.gif');
     * </pre>
     * @function
     * @return {String} Полный путь.
     */
    function resolveComponentPath(path) {
        var url = require.toUrl(path);
        return url || '';
    }
    /**
     * @name Core/pathResolver#pathResolver
     * @function
     * @description
     * Разрешает пути до наших модулей в зависимости от плагина
     * @param {String} name имя модуля
     * @param {String} plugin плагин
     * @return {String}
     */
    function pathResolver(name, plugin, clearAlias) {
        var path, ext;
        if (plugin === 'html') {
            ext = '.xhtml';
        }
        else {
            ext = "." + plugin;
        }
        if (name.indexOf('/') > -1) {
            var paths = name.split('/'), moduleName = paths.shift();
            path = '';
            if (path) {
                // TODO Для совместимости новых и старых имён.
                /* При переходе к новым именнам возникла проблема при вложенных ресурсах.
                 Пример:  для модуля tmpl!Cryptography/CertificateView/resources/Physic
                 он строил путь "resources/Cryptography/CertificateView/CertificateView.tmpl", а должен был
                 "resources/Cryptography/CertificateView/resources/Physic.tmpl".
                */
                if (path.search(jsModule) > -1) {
                    path = path.replace(jsModule, paths.join('/') + ext + "$2");
                }
                else {
                    path = path.replace(anyModule, paths.join('/') + ext + "$2");
                }
            }
            else {
                var regexp = new RegExp("\\" + ext + "$");
                path = name + ((plugin === 'js' || regexp.test(name)) ? '' : ext);
            }
        }
        else {
            path = '';
            if (!path) {
                throw new Error("Module " + name + " is not defined");
            }
            if (plugin !== 'js') {
                path = path.replace(jsModule2, ext + "$2");
            }
        }
        // В node.js необходимо передавать пути без лидирующего / и без расширения, тогда модуль ищется относительно baseUrl
        if (Env_1.constants.isNodePlatform) {
            path = path.replace(leadSlash, '').replace(jsExt, '');
        }
        return path;
    }
    var requirejsPathResolver = function (name, plugin, clearAlias) {
        if (!(plugin in plugins)) {
            throw new ReferenceError("Plugin " + plugin + " is not supported by Core/pathResolver");
        }
        return pathResolver(name, plugin, clearAlias);
    };
    requirejsPathResolver.resolveModulePath = resolveModulePath;
    requirejsPathResolver.resolveModule = function () { return ''; };
    requirejsPathResolver.resolveComponentPath = resolveComponentPath;
    return requirejsPathResolver;
});
