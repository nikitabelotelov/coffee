/// <amd-module name="View/Executor/_Expressions/Attr" />

import * as eventExpressions from './Event';
import { isAttr, checkAttr } from './AttrHelper';
import * as FocusHelper from './Focus';

export { isAttr, checkAttr };

var spacesRE = /\s+/g;

function getClass(attr1, attr2) {
   var attr1Class = attr1.class || attr1['attr:class'];
   var attr2Class = attr2.class || attr2['attr:class'];
   var result = attr1Class ? (attr2Class + ' ' + attr1Class) : attr2Class;
   if (typeof result === 'string') {
      result = result.replace(spacesRE, ' ').trim();
   }
   return result;
}

function finalizeAttr(attributes) {
   var finalAttr = {};
   for (var attribute in attributes) {
      if (isAttr(attribute)) {
         finalAttr[attribute.split(':')[1]] = attributes[attribute];
      } else if (eventExpressions.isEvent(attribute)) {
         finalAttr[attribute] = attributes[attribute];
      }
   }
   return finalAttr;
}

/**
 * Функция мержит атрибуты
 * @param attr1 - родительские атрибуты
 * @param attr2 - собственные атрибуты
 * @returns объект со смерженными атрибутами
 */
function processFinalAttributes(attr1, attr2) {
   var finalAttr: any = {};
   for (var name in attr1) {
      if (attr1.hasOwnProperty(name)) {
         finalAttr[name] = attr1[name];
      }
   }
   for (var name in attr2) {
      if (attr2.hasOwnProperty(name) && attr2[name] !== undefined && attr2[name] !== 'undefined') {
         if (name === 'class') {
            finalAttr.class = getClass(finalAttr, attr2);
         } else if (eventExpressions.isEvent(name)) {
            finalAttr[name] = finalAttr[name] ? attr2[name].concat(finalAttr[name]) : attr2[name];
         } else if (!finalAttr.hasOwnProperty(name)) {
            finalAttr[name] = attr2[name];
         }
      }
   }
   for (name in finalAttr) {
      if (finalAttr.hasOwnProperty(name) && (finalAttr[name] === undefined || finalAttr[name] === 'undefined')) {
         delete finalAttr[name];
      }
   }
   return finalAttr;
}
export { processFinalAttributes as joinAttrs };

/**
 * Функция обрезает attr: и мержит атрибуты
 * @param attr1 - родительские атрибуты
 * @param attr2 - собственные атрибуты
 * @param clean - если false, то добавляем attr: ко всем атрибутам
 * @returns объект со смерженными атрибутами
 */
export function processMergeAttributes(attr1, attr2, clean?, isevent?) {
   attr1 = attr1 || {};
   attr2 = attr2 || {};
   var attr1IsAttr = false,
      attr2IsAttr = false;
   if (checkAttr(attr1)) {
      attr1 = finalizeAttr(attr1);
      attr1IsAttr = true;
   }
   if (checkAttr(attr2)) {
      attr2 = finalizeAttr(attr2);
      attr2IsAttr = true;
   }
   var attrs = processFinalAttributes(attr1, attr2);
   if (!clean && (attr1IsAttr || attr2IsAttr)) {
      var attrs2 = {};
      for (var key in attrs) {
         if (!isevent) {
            attrs2['attr:' + key] = attrs[key];
         } else {
            attrs2[key] = attrs[key];
         }
      }
      return attrs2;
   }

   // Значения атрибутов для системы фокусов сбрасываются на дефолтные значения
   FocusHelper.resetDefaultValues(attrs, attr2);

   return attrs;
}

/**
 * Функция обрезает attr: и мержит атрибуты
 * @param attr1 - родительские атрибуты
 * @param attr2 - собственные атрибуты
 * @returns объект со смерженными атрибутами
 */
export function mergeAttrs(attr1, attr2) {
   attr1 = attr1 || {};
   attr2 = attr2 || {};

   var finalAttr: any = {},
      empt,
      name;
   for (name in attr1) {
      if (attr1.hasOwnProperty(name) && attr1[name] !== undefined && attr1[name] !== 'undefined' &&
         attr1[name] !== null) {
         finalAttr[name.replace('attr:', '')] = attr1[name] !== '' ? attr1[name] : undefined;
      }
   }
   for (name in attr2) {
      if (attr2.hasOwnProperty(name) && attr2[name] !== undefined && attr2[name] !== 'undefined' &&
         attr2[name] !== null) {
         if (name === 'attr:class' || name === 'class') {
            finalAttr.class = getClass(finalAttr, attr2);
         } else {
            empt = name.replace('attr:', '');
            if (!finalAttr.hasOwnProperty(empt) || ((empt === 'ws-creates-context' || empt === 'ws-delegates-tabfocus') && finalAttr[empt] === 'default')) {
               finalAttr[empt] = attr2[name] ? attr2[name] : undefined;
            }
         }
      }
   }

   // Значения атрибутов для системы фокусов сбрасываются на дефолтные значения
   FocusHelper.resetDefaultValues(finalAttr, attr2);
   return finalAttr;
}

export function mergeEvents(events1, events2) {
   var finalAttr = {}, name;
   for (name in events1) {
      if (events1.hasOwnProperty(name)) {
         finalAttr[name] = events1[name];
      }
   }
   for (name in events2) {
      if (events2.hasOwnProperty(name)) {
         finalAttr[name] = finalAttr[name] ? events2[name].concat(finalAttr[name]) : events2[name];
      }
   }
   return finalAttr;
}