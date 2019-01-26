define('Types/_formatter/jsonReviver', [
    'require',
    'exports',
    'Core/IoC'
], function (require, exports, IoC) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var DataRegExp = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:[0-9\.]+Z$/;
    var unresolvedInstances = [];
    var unresolvedInstancesId = [];
    var instanceStorage = {};
    function resolveInstances() {
        var Module, name;
        for (var i = 0; i < unresolvedInstances.length; i++) {
            var item = unresolvedInstances[i];
            var instance = null;
            if (instanceStorage[item.value.id]) {
                instance = instanceStorage[item.value.id];
            } else if (item.value.module) {
                try {
                    name = item.value.module;    //@ts-ignore
                    //@ts-ignore
                    Module = requirejs(name);
                    if (!Module) {
                        throw new Error('The module "' + name + '" is not loaded yet.');
                    }
                    if (!Module.prototype) {
                        throw new Error('The module "' + name + '" is not a constructor.');
                    }
                    if (typeof Module.prototype.fromJSON !== 'function') {
                        throw new Error('The prototype of module "' + name + '" don\'t have fromJSON() method.');
                    }
                    instance = Module.fromJSON ? Module.fromJSON.call(Module, item.value) : Module.prototype.fromJSON.call(Module, item.value);
                } catch (e) {
                    IoC.resolve('ILogger').error('Serializer', 'Can\'t create an instance of "' + name + '". ' + e.toString());
                    instance = null;
                }
                instanceStorage[item.value.id] = instance;
            }
            item.scope[item.name] = item.value = instance;
        }
    }
    function jsonReviver(name, value) {
        var result = value;
        if (value instanceof Object && value.hasOwnProperty('$serialized$')) {
            switch (value.$serialized$) {
            case 'inst':
                unresolvedInstances.push({
                    scope: this,
                    name: name,
                    value: value
                });
                unresolvedInstancesId.push(value.id);
                break;
            case '+inf':
                result = Infinity;
                break;
            case '-inf':
                result = -Infinity;
                break;
            case 'undef':
                result = undefined;
                break;
            case 'NaN':
                result = NaN;
                break;
            default:
                throw new Error('Unknown serialized type "' + value.$serialized$ + '" detected');
            }
        }
        if (typeof result === 'string') {
            if (DataRegExp.test(result)) {
                var dateValue = new Date(result);
                return dateValue;
            }
        }    //Resolve links and instances at root
        //Resolve links and instances at root
        if (name === '' && Object.keys(this).length === 1) {
            resolveInstances();
            unresolvedInstances = [];
            unresolvedInstancesId = [];
        }
        return result;
    }
    exports.default = jsonReviver;
});