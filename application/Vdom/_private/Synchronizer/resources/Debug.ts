/// <amd-module name="Vdom/_private/Synchronizer/resources/Debug" />

import { getVNodeChidlren } from './VdomMarkup';
import { Vdom } from 'View/Executor/Utils';
import { DirtyKind } from './DirtyChecking';
// @ts-ignore
import * as tclosure from 'View/Executor/TClosure';
// @ts-ignore
import * as ObjIsEmpty from 'Core/helpers/Object/isEmpty';

/* eslint-disable no-console */
var
   maxDebugLineCount = 20,
   patchTypes = {
      0: 'NONE',
      1: 'VTEXT',
      2: 'VNODE',
      3: 'WIDGET',
      4: 'PROPS',
      5: 'ORDER',
      6: 'INSERT',
      7: 'REMOVE',
      8: 'THUNK',
      VirtualNode: 'VirtualNode'
   };

export function vdomToHTML(vdom, context) {
   var matchHtmlRegExp = /["'&<>]/;

   var voidElements = {
      area: true,
      base: true,
      br: true,
      col: true,
      embed: true,
      hr: true,
      img: true,
      input: true,
      keygen: true,
      link: true,
      meta: true,
      param: true,
      source: true,
      track: true,
      wbr: true
   };

   function escapeHtml(string) {
      var
         str = '' + string,
         match = matchHtmlRegExp.exec(str);

      if (!match) {
         return str;
      }

      var
         escape,
         html = '',
         index,
         lastIndex = 0;

      for (index = match.index; index < str.length; index++) {
         switch (str.charCodeAt(index)) {
            case 34: // "
               escape = '&quot;';
               break;
            case 38: // &
               escape = '&amp;';
               break;
            case 39: // '
               escape = '&#39;';
               break;
            case 60: // <
               escape = '&lt;';
               break;
            case 62: // >
               escape = '&gt;';
               break;
            default:
               continue;
         }

         if (lastIndex !== index) {
            html += str.substring(lastIndex, index);
         }

         lastIndex = index + 1;
         html += escape;
      }

      return lastIndex !== index ? html + str.substring(lastIndex, index) : html;
   }

   var prefixAttribute = memoizeString(function (name) {
      return escapeHtml(name) + '="';
   });

   function escapeAttributeValue(attrValue) {
      attrValue = attrValue !== undefined && attrValue !== null ? attrValue.toString() : '';
      return attrValue.replace('"', '&quot;');
   }

   /**
    * Create attribute string.
    *
    * @param {String} name The name of the property or attribute
    * @param {*} value The value
    * @param {Boolean} [isAttribute] Denotes whether `name` is an attribute.
    * @return {?String} Attribute string || null if not a valid property or custom attribute.
    */
   function createAttribute(name, value, isAttribute) {
      if (isAttribute) {
         if (value == null) {
            return '';
         }

         return prefixAttribute(name) + escapeAttributeValue(value) + '"';
      }
      // return null if `name` is neither a valid property nor an attribute
      return null;
   }

   /**
    * Memoizes the return value of a function that accepts one string argument.
    *
    * @param {function} callback
    * @return {function}
    */
   function memoizeString(callback) {
      var cache = {};
      return function (string) {
         if (cache.hasOwnProperty(string)) {
            return cache[string];
         } else {
            return (cache[string] = callback.call(this, string));
         }
      };
   }

   function toHTML(node) {
      if (!node) {
         return '';
      }

      if (Vdom.isControlVNodeType(node)) {
         return tclosure.getMarkupGenerator(false).createWsControl(
            node.controlClass,
            node.controlProperties,
            {
               internal: node.controlInternalProperties, // служебные опции контрола
               attributes: node.controlAttributes,
               events: node.controlEvents,
               key: node.key,
               context: node.context,
               inheritOptions: node.inheritOptions
            },
            context
         );
      }
      if (Vdom.isTemplateVNodeType(node)) {
         return tclosure
            .getMarkupGenerator(false)
            .createTemplate(node.template, node.attributes && node.controlProperties, node.attributes, context);
      } else if (Vdom.isVNodeType(node)) {
         return openTag(node) + tagContent(node) + closeTag(node);
      } else if (Vdom.isTextNodeType(node)) {
         return String(node.children);
      } else if (Array.isArray(node)) {
         var result = '';
         for (var i = 0; i < node.length; i++) {
            result += toHTML(node[i]);
         }
         return result;
      } else if (typeof node === 'string') {
         return node;
      }

      return '';
   }

   function openTag(node) {
      var
         props = node.hprops,
         ret = '<' + node.type.toLowerCase(),
         value,
         css,
         attrProp,
         styleProp;

      value = props['attributes'];
      for (attrProp in value) {
         if (
            value.hasOwnProperty(attrProp) &&
            value[attrProp] !== null &&
            value[attrProp] !== undefined &&
            value[attrProp] !== ''
         ) {
            ret += ' ' + createAttribute(attrProp, value[attrProp], true);
         }
      }

      /*if (node.hasOwnProperty('key')) {
         ret += ' ' + createAttribute('key', node.key, true);
      }*/

      value = props['style'];
      css = '';
      for (styleProp in value) {
         if (value.hasOwnProperty(styleProp) && value[styleProp] !== null) {
            css += styleProp + ': ' + value[styleProp] + ';';
         }
      }
      if (css !== '') {
         ret += ' ' + createAttribute('style', css, true);
      }

      return ret + '>';
   }

   function tagContent(node) {
      var innerHTML = node.properties && node.properties.innerHTML;

      if (innerHTML) {
         return innerHTML;
      } else {
         var
            ret = '',
            children = node.children,
            ln = (children && children.length) || 0,
            i,
            child;

         for (i = 0; i !== ln; i++) {
            child = children[i];
            ret += toHTML(child);
         }
         return ret;
      }
   }

   function closeTag(node) {
      var tag = node.type.toLowerCase();
      return voidElements[tag] ? '' : '</' + tag + '>';
   }

   return toHTML(vdom);
}

function measureFn(fn) {
   return function () {
      var
         ts = Date.now(),
         res = fn.apply(this, arguments);

      return {
         value: res,
         time: Date.now() - ts
      };
   };
}

export function logRebuildChanges(dirties, changes) {
   function logNodes(title, nodes) {
      if (nodes.length) {
         console.group(title);
         try {
            nodes.forEach(function (node) {
               logControlNode(dirties, node);
            });
         } finally {
            console.groupEnd();
         }
      }
   }

   var
      created = changes.createdNodes.slice(0, maxDebugLineCount),
      updatedChanged = changes.updatedChangedNodes.slice(0, maxDebugLineCount),
      updatedUnchanged = changes.updatedUnchangedNodes.slice(0, maxDebugLineCount),
      destroyed = changes.destroyedNodes.slice(0, maxDebugLineCount);

   console.log('------------------');
   logNodes('Созданы', created);
   logNodes('Обновлены - изменены по опциям', updatedChanged);
   logNodes('Обновлены - не изменены', updatedUnchanged);
   logNodes('Удалены', destroyed);
}

export function logVNode(dirties, recursive, vnode) {
   var
      titleArr,
      arr = [];

   if (Vdom.isControlVNodeType(vnode)) {
      logControlNode(dirties, vnode.controlNode);
   } else {
      titleArr = [Vdom.isVNodeType(vnode) ? vnode.tagName : Vdom.isTextNodeType(vnode) ? vnode.text : '???'];
      if (vnode.key !== undefined) {
         titleArr.push[vnode.key];
      }

      arr = [titleArr.join('/')];
      if (Vdom.isVNodeType(vnode)) {
         arr.push(ObjIsEmpty(vnode.properties) ? '' : vnode.properties);
      }

      if (recursive) {
         console.group.apply(console, arr);
         try {
            getVNodeChidlren(vnode).forEach(logVNode.bind(undefined, dirties, recursive));
         } finally {
            console.groupEnd();
         }
      } else {
         console.log.apply(console, arr);
      }
   }
}

export function logControlNode(dirties, node) {
   var
      control = node.control,
      name = control.get('name'),
      markup = node.markup,
      id = node.id,
      dirty = dirties[id] || DirtyKind.NONE,
      dirtyStr = dirty === DirtyKind.NONE ? [] : dirty === DirtyKind.DIRTY ? ['D'] : ['C'],
      arr;

   arr = (name ? [name] : []).concat([control.describe()]);
   if (node.key !== undefined) {
      arr.push(node.key);
   }

   arr = arr.concat(dirtyStr);

   console.log(arr.join('/'), node.id, control.getRawData());
}

export function logRebuild(dirties, oldRoots, newRoots, changes, applyResults, cfg) {
   applyResults = applyResults || {};
   for (var key in applyResults) {
      if (applyResults.hasOwnProperty(key)) {
         var
            val = applyResults[key],
            toHtmlFn = measureFn(vdomToHTML.bind(undefined, val.value.a)),
            toHtml = toHtmlFn(),
            patchStat = {};

         for (var field in val.value) {
            if (val.value.hasOwnProperty(field)) {
               var
                  patch = val.value[field],
                  type = 'type' in patch ? patchTypes[patch.type] : '????';
               if (type) {
                  patchStat[type] = patchStat.hasOwnProperty(type) ? patchStat[type] + 1 : 1;
               }
            }
         }

         console.group('PATCH: time = ' + val.time, true);
         console.log(patchStat, val.value);
         console.log('toHTML: time = ', toHtml.time, toHtml.value.length);
         console.groupEnd();
      }
   }

   if (!cfg.silent && oldRoots) {
      oldRoots.forEach(function (oldRoot, i) {
         var newRoot = newRoots[i];

         console.groupCollapsed('Старое', i);
         try {
            logControlNode(dirties, oldRoot);
         } finally {
            console.groupEnd();
         }

         console.groupCollapsed('Новое', i);
         try {
            logControlNode({}, newRoot);
         } finally {
            console.groupEnd();
         }
      });

      logRebuildChanges(dirties, changes);
   }
}

export function withLogRebuild(fn, cfg) {
   return function () {
      var
         timeStart = Date.now(),
         time,
         res;
      try {
         res = fn.call(this, measureFn);
      } finally {
         time = Date.now() - timeStart;

         if (res) {
            logRebuild(res.dirties, res.oldRoots, res.newRoots, res.rebuildChanges, res.applyResults, cfg);
         }

         console.log('Время перестроения - ', time);
      }
      return res;
   };
}
