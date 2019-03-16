define('Browser/_Event/Server/worker/define.worker', [
    'require',
    'exports'
], function (require, exports) {
    'use strict';
    var exports1 = {};
    var guid = generateGUID();
    var modules = Object.create(null);
    modules['require'] = req;
    modules['exports'] = exports1;
    exports1['getGUID'] = function () {
        return guid;
    };
    function generateGUID() {
        function s4() {
            return Math.floor((1 + Math.random()) * 65536).toString(16).substring(1);
        }
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
    }
    var paths = {
        'Browser/_Event/Server/native/': '../native/',
        'Browser/_Event/Server/worker/': './'
    };    /**
     * Заглушка define для поддержки AMD в worker
     * @param name
     * @param dependences <strong>Не поддерживаем зависимости</strong>
     * @param module
     */
    /**
     * Заглушка define для поддержки AMD в worker
     * @param name
     * @param dependences <strong>Не поддерживаем зависимости</strong>
     * @param module
     */
    self['define'] = function (name, dependences, module) {
        name = name.toLocaleLowerCase();
        var deps = [];
        if (dependences instanceof Array) {
            deps = self['require'](dependences);
        }
        modules[name] = module.apply(self, deps);
    };
    function requireOne(name) {
        var regName = name.toLocaleLowerCase();
        if (regName in modules) {
            return modules[regName];
        }
        var path = name;
        for (var tmpl in paths) {
            if (!paths.hasOwnProperty(tmpl)) {
                return;
            }
            path = path.replace(tmpl, paths[tmpl]);
        }    // @ts-ignore
        // @ts-ignore
        importScripts(path + '.js');
        if (regName in modules) {
            return modules[regName];
        }
        console.error('Module ' + name + ' is not imported yet. (' + path + ')');    // eslint-disable-line no-console
    }
    // eslint-disable-line no-console
    self['require'] = req;
    function req(arg) {
        if (typeof arg == 'string') {
            return requireOne(arg);
        }
        if (!(arg instanceof Array)) {
            console.error('Wrong argument ' + arg);    // eslint-disable-line no-console
            // eslint-disable-line no-console
            return;
        }
        var result = [];
        for (var _i = 0, arg_1 = arg; _i < arg_1.length; _i++) {
            var name = arg_1[_i];
            result.push(requireOne(name));
        }
        return result;
    }
});