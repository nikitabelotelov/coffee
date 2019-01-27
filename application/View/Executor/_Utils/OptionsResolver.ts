/// <amd-module name="View/Executor/_Utils/OptionsResolver" />

// @ts-ignore
import * as IoC from 'Core/IoC';
// @ts-ignore
import * as constants from 'Core/constants';

/**
 * Применить дефолтные опции конструктора
 * @param cfg
 */
export function resolveDefaultOptions(cfg, defaultOptions) {
   for (var key in defaultOptions) {
      if (typeof cfg[key] === 'undefined') {
         cfg[key] = defaultOptions[key];
      }
   }
}

export function validateOptions(controlClass, cfg, optionsTypes, parentName) {
   for (var key in optionsTypes) {
      var result = optionsTypes[key].call(null, cfg[key]);
      if (result instanceof Error) {
         result.message = '"' + key + '"' + " option error: " + result.message;
         IoC.resolve('ILogger').error(result, '\nIn component ' +
            controlClass.prototype._moduleName +
            '\nParent name ' + parentName);
         return false;
      }
   }
   return true;
}

export function resolveOptions(controlClass, cfg, parentName) {
   var defaultOptions = controlClass.getDefaultOptions && controlClass.getDefaultOptions();
   resolveDefaultOptions(cfg, defaultOptions);
   if (!constants.isProduction) { // Disable options validation in production-mode to optimize
      var optionsTypes = controlClass.getOptionTypes && controlClass.getOptionTypes();
      return validateOptions(controlClass, cfg, optionsTypes, parentName);
   } else {
      return true;
   }
}

export function resolveInheritOptions(controlClass, attrs, controlProperties, fromCreateControl?) {
   if (!controlClass) {
      return;
   }
   var inheritOptions = (controlClass._getInheritOptions && controlClass._getInheritOptions(controlClass)) || {};

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