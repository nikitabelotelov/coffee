/// <amd-module name="View/Executor/_Utils/OptionsResolver" />
define('View/Executor/_Utils/OptionsResolver', [
    'require',
    'exports',
    'Env/Env'
], function (require, exports, Env_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });    /**
     * Применить дефолтные опции конструктора
     * @param cfg
     */
    /**
     * Применить дефолтные опции конструктора
     * @param cfg
     */
    function resolveDefaultOptions(cfg, defaultOptions) {
        for (var key in defaultOptions) {
            if (typeof cfg[key] === 'undefined') {
                cfg[key] = defaultOptions[key];
            }
        }
    }
    exports.resolveDefaultOptions = resolveDefaultOptions;
    function _validateOptions(controlClass, cfg, optionsTypes, parentName) {
        for (var key in optionsTypes) {
            var result = optionsTypes[key].call(null, cfg[key]);
            if (result instanceof Error) {
                result.message = '"' + key + '"' + ' option error: ' + result.message;
                Env_1.IoC.resolve('ILogger').error(result, '\nIn component ' + controlClass.prototype._moduleName + '\nParent name ' + parentName);
                return false;
            }
        }
        return true;
    }
    function resolveOptions(controlClass, defaultOpts, cfg, parentName) {
        resolveDefaultOptions(cfg, defaultOpts);
        return validateOptions(controlClass, cfg, parentName);
    }
    exports.resolveOptions = resolveOptions;
    function getDefaultOptions(controlClass) {
        return controlClass.getDefaultOptions ? controlClass.getDefaultOptions() : {};
    }
    exports.getDefaultOptions = getDefaultOptions;
    function validateOptions(controlClass, cfg, parentName) {
        if (!Env_1.constants.isProduction) {
            // Disable options validation in production-mode to optimize
            var optionsTypes = controlClass.getOptionTypes && controlClass.getOptionTypes();
            return _validateOptions(controlClass, cfg, optionsTypes, parentName);
        } else {
            return true;
        }
    }
    exports.validateOptions = validateOptions;
    function resolveInheritOptions(controlClass, attrs, controlProperties, fromCreateControl) {
        if (!controlClass) {
            return;
        }
        var inheritOptions = controlClass._getInheritOptions && controlClass._getInheritOptions(controlClass) || {};
        if (!attrs.inheritOptions) {
            attrs.inheritOptions = {};
        }
        var newInherit = {};
        for (var i in attrs.inheritOptions) {
            if (attrs.inheritOptions.hasOwnProperty(i)) {
                if (controlProperties[i] === undefined) {
                    controlProperties[i] = attrs.inheritOptions[i];
                }
                newInherit[i] = controlProperties[i];
            }
        }
        for (var j in inheritOptions) {
            if (inheritOptions.hasOwnProperty(j) && !newInherit.hasOwnProperty(j) && !fromCreateControl) {
                if (controlProperties.hasOwnProperty(j)) {
                    inheritOptions[j] = controlProperties[j];
                }
                newInherit[j] = inheritOptions[j];
                controlProperties[j] = inheritOptions[j];
            } else if (inheritOptions.hasOwnProperty(j) && !newInherit.hasOwnProperty(j) && fromCreateControl && controlProperties && controlProperties.hasOwnProperty(j)) {
                newInherit[j] = controlProperties[j];
            }
        }
        attrs.inheritOptions = newInherit;
    }
    exports.resolveInheritOptions = resolveInheritOptions;
});