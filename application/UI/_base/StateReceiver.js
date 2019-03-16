/// <amd-module name="UI/_base/StateReceiver" />
define('UI/_base/StateReceiver', [
    'require',
    'exports',
    'Core/Serializer',
    'Env/Env',
    'View/Executor/Utils'
], function (require, exports, Serializer, Env_1, Utils_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    function getDepsFromSerializer(slr) {
        var moduleInfo;
        var deps = {};
        var modules = slr._linksStorage;
        var parts;
        for (var key in modules) {
            if (modules.hasOwnProperty(key)) {
                moduleInfo = modules[key];
                if (moduleInfo.module) {
                    parts = Serializer.parseDeclaration(moduleInfo.module);
                    deps[parts.name] = true;
                }
            }
        }
        var addDeps = slr._depsStorage || {};
        for (var j in addDeps) {
            if (addDeps.hasOwnProperty(j)) {
                deps[j] = true;
            }
        }
        return deps;
    }
    var StateReceiver = /** @class */
    function () {
        function StateReceiver() {
            this.receivedStateObjectsArray = {};
            this.deserialized = {};
        }
        StateReceiver.prototype.serialize = function () {
            var slr;
            var serializedMap = {};
            var allAdditionalDeps = {};
            var allRecStates = this.receivedStateObjectsArray;
            for (var key in allRecStates) {
                if (allRecStates.hasOwnProperty(key)) {
                    var receivedState = allRecStates[key].getState();
                    if (receivedState) {
                        serializedMap[key] = receivedState;
                    }
                }
            }
            slr = new Serializer();
            var serializedState = JSON.stringify(serializedMap, slr.serialize);
            Utils_1.Common.componentOptsReArray.forEach(function (re) {
                serializedState = serializedState.replace(re.toFind, re.toReplace);
            });
            serializedState = serializedState.replace(/\\"/g, '\\\\"');
            var addDeps = getDepsFromSerializer(slr);
            for (var dep in addDeps) {
                if (addDeps.hasOwnProperty(dep)) {
                    allAdditionalDeps[dep] = true;
                }
            }
            return {
                serialized: serializedState,
                additionalDeps: allAdditionalDeps
            };
        };
        StateReceiver.prototype.deserialize = function (str) {
            var slr = new Serializer();
            try {
                this.deserialized = JSON.parse(str, slr.deserialize);
            } catch (e) {
                Env_1.IoC.resolve('ILogger').error('Deserialize', 'Cant\'t deserialize ' + str);
            }
        };
        StateReceiver.prototype.register = function (key, inst) {
            if (this.deserialized[key]) {
                inst.setState(this.deserialized[key]);
                delete this.deserialized[key];
            }
            this.receivedStateObjectsArray[key] = inst;
        };
        StateReceiver.prototype.unregister = function (key) {
            delete this.receivedStateObjectsArray[key];
        };
        return StateReceiver;
    }();
    exports.default = StateReceiver;
});