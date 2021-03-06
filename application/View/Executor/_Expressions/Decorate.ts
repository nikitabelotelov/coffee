/// <amd-module name="View/Executor/_Expressions/Decorate" />

import { checkAttr } from './AttrHelper';

/**
 * Создание объекта, для декорировния рутового узла
 * @param dataTemplateid
 * @param hasMarkup
 * @param componentName
 * @returns {{config: *, hasmarkup: *, data-component: *}}
 */
export function createRootDecoratorObject(dataTemplateid, hasMarkup, componentName, addingAttributes) {
   var obj = { 'config': dataTemplateid, 'hasMarkup': hasMarkup, 'data-component': componentName };
   for (var attr in addingAttributes) {
      if (addingAttributes.hasOwnProperty(attr)) {
         if (attr === 'config') {
            obj[attr] = addingAttributes[attr] + ',' + obj[attr];
         } else {
            obj[attr] = addingAttributes[attr];
         }
      }
   }

   if (typeof window !== 'undefined') {
      // We should be able to get component's config id before VDom mounting
      // The config attribute will be removed later
      var configKey = checkAttr(obj) ? 'attr:__config' : '__config';
      if (obj[configKey]) {
         // DOM element can have multiple VDOM components attached to it
         obj[configKey] += ',' + obj.config;
      } else {
         obj[configKey] = obj.config;
      }
   }

   return obj;
}

