/// <amd-module name="View/Executor/_Utils/ConfigResolver" />

// @ts-ignore
import * as cMerge from 'Core/core-merge';
// @ts-ignore
import { constants as cConstants } from 'Env/Env';

import { plainMerge } from './Common';
import { Scope } from '../Expressions';

function hasOwnPropertyCheck(obj, prop) {
   return obj && obj.hasOwnProperty && obj.hasOwnProperty(prop);
}

function detectObjectAsParent(obj) {
   if (obj && obj.hasOwnProperty && !obj.global) {
      if (obj['__$$__originObject']) {
         obj = obj['__$$__originObject'];
      }
      if (hasOwnPropertyCheck(obj, '_options')) {
         return obj;
      } else {
         return detectObjectAsParent(Object.getPrototypeOf(obj));
      }
   }
   return null;
}

export function calcParent(obj, currentPropertyName, data) {
   return obj.viewController || (typeof (currentPropertyName) !== "undefined" ?
      (data[currentPropertyName]
         && hasOwnPropertyCheck(data[currentPropertyName], 'parent')
         && hasOwnPropertyCheck(data[currentPropertyName].parent, '_template') ? data[currentPropertyName].parent : detectObjectAsParent(obj)) : detectObjectAsParent(obj));
}

function parentEnabled(parent, obj, currentPropertyName, data, attrs) {
   if (!cConstants.compat) {
      return true;
   }
   var
      enabled = true;

   if (parent) {
      // Если известен родитель, узнаем, enabled ли он
      enabled = !parent.isEnabled || parent.isEnabled();
   } else if (data) {
      if (currentPropertyName && data[currentPropertyName]) {
         // Если текущий компонент находится внутри контентной опции, проверяем, был ли задан
         // enabled или parentEnabled для нее
         if (data[currentPropertyName].enabled !== undefined) {
            enabled = data[currentPropertyName].enabled;
         } else if (data[currentPropertyName].parentEnabled !== undefined) {
            enabled = data[currentPropertyName].parentEnabled;
         } else if (attrs && attrs.internal && attrs.internal.hasOwnProperty('parentEnabled')) {
            enabled = attrs.internal.parentEnabled;
         }
      } else {
         // Если мы не внутри контентной опции, смотрим на значение enabled в scope
         if (data.enabled !== undefined) {
            enabled = data.enabled;
         } else if (data.parentEnabled !== undefined) {
            enabled = data.parentEnabled;
         } else if (attrs && attrs.internal && attrs.internal.hasOwnProperty('parentEnabled')) {
            enabled = attrs.internal.parentEnabled;
         }
      }
   } else {
      // По умолчанию считаем enabled true
      enabled = true;
   }

   return enabled;
}

export function resolveControlCfg(data, templateCfg, attrs) {
   var internal = templateCfg.internal || {}, insertedData;
   var enabledFromContent = undefined;
   var needDelete = false;
   data = Scope.calculateScope(data, plainMerge);

   // если есть контентные данные, мы должны добавить их к существующим данным
   if (templateCfg.data && templateCfg.data[Scope.propertyNameToIdentifyIsolatedScope]) {
      // на нужно пропатчить все области видимости для шаблонов, которые генерируется
      // во время создания конфига для контрола
      insertedData = templateCfg.data[templateCfg.data[Scope.propertyNameToIdentifyIsolatedScope]];
      // Здесь не нужно прокидывать опции в старые контролы, поэтому будем прокидывать только для контента
      if (insertedData && templateCfg.data[Scope.propertyNameToIdentifyIsolatedScope] !== "content") {
         delete insertedData.enabled;
      };
      if (insertedData && insertedData.hasOwnProperty("enabled")) {
         enabledFromContent = insertedData.enabled;
      }
      // если в шаблон, в котором в корне лежит контрол, передали scope="{{ ... }}", в котором лежат
      // все опции старого контрола, тогда их не нужно пропускать, потому что все опции контрола переданного
      // через ... будут инициализировать контрол, который лежит внутри такого шаблона
      if (insertedData && !insertedData.hasOwnProperty('parent') &&
         (!insertedData.hasOwnProperty('element') || !insertedData.element || insertedData.element.length === 0)) {
         data = cMerge(data, insertedData, {
            rec: !(templateCfg.viewController && templateCfg.viewController._template),//для vdomных детей не клонируем объекты внутрь
            // копируем без замены свойств, потому что например может прилететь свойство content, которое перетрет указанное.
            // Так например падает тест test_04_panel_move_record, при попытке перемещения записи не строится дерево,
            // потмоу что прилетает content = '' и перетирает заданный content в шаблоне
            preferSource: true,
            ignoreRegExp: /(^on:|^content$)/ig //проигнорируем events потому что они летят через атрибуты на дом элементы
            // и content, потому что content в каждой функции должен быть свой
         });
      }
   }

   // вычисляем служебные опции для контрола - его физического и логического родителей,
   // видимость и активированность родителя
   internal.logicParent = templateCfg.viewController;

   if (cConstants.compat) {
      internal.parent = calcParent(templateCfg.ctx, templateCfg.pName, templateCfg.data);
      internal.parentEnabled = parentEnabled(internal.parent, templateCfg.ctx, templateCfg.pName, templateCfg.data, attrs) && (enabledFromContent === undefined ? true : enabledFromContent);
   }
   internal.hasOldParent = attrs && attrs.internal && attrs.internal.isOldControl;

   // user - прикладные опции, internal - служебные
   return { user: data, internal: internal };
}
