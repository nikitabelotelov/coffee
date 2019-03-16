/// <amd-module name="Vdom/_private/Synchronizer/resources/VdomMarkup" />
// @ts-ignore
import { coreDebug } from 'Env/Env';
import { Vdom } from 'View/Executor/Utils';
// @ts-ignore
import * as flatten from 'Core/helpers/Array/flatten';
import { ListMonad } from '../../Utils/Monad';
import { setControlNodeHook } from './Hooks';

export function getVNodeChidlren(vnode, getFromTemplateNodes?) {
   if (getFromTemplateNodes) {
      return vnode.children || [];
   } else {
      return Vdom.isVNodeType(vnode) ? (vnode.children === null ? [] : vnode.children) : [];
   }
}

export function mapVNode(fn, controlNode, vnode, setHookToVNode?, nodeArray?, modify?) {
   /* mapVNode must be refactor
    * recursive dom with many root kills browser
    * */
   if (vnode.stopped) {
      return vnode;
   }
   //Template node doesn't have properties, and we must set controlNodeHook to first child element
   if (setHookToVNode && Vdom.isTemplateVNodeType(vnode) && vnode.children && vnode.children[0]) {
      vnode.children[0] = mapVNode(fn, controlNode, vnode.children[0], setHookToVNode);
      return vnode;
   }

   // Markup Decorator builds tree of outer correspondence with too many root nodes.
   // This kills browser, so mapping should be stopped.
   // Will be removed in project https://online.sbis.ru/opendoc.html?guid=11776bc8-39b7-4c55-b5b5-5cc2ea8d9fbe.
   if (Vdom.isVNodeType(vnode)) {
      if (controlNode.control && controlNode.control._moduleName === 'Controls/Decorator/Markup') {
         if (vnode.children && vnode.children[0]) {
            vnode.children[0].stopped = true;
         }
      }
      var
         newNodeArgs = fn(vnode.type, vnode.hprops, vnode.children, vnode.key, controlNode, vnode.ref, vnode),
         sameNode =
            vnode.type === newNodeArgs[0] &&
            vnode.props === newNodeArgs[1] &&
            vnode.children === newNodeArgs[2] &&
            vnode.key === newNodeArgs[3];
      if (modify) {
         /**
          * We have to modify exisiting vnode, so we don't lose object link
          */
         vnode.type = newNodeArgs[0];
         vnode.props = newNodeArgs[1];
         vnode.children = newNodeArgs[2];
         vnode.key = newNodeArgs[3];

         // Only attach control hook to vnode if it wasn't attached already
         // for the same control
         if (!vnode.hookedInvControlIds || vnode.hookedInvControlIds.indexOf(controlNode.id) === -1) {
            vnode.ref = newNodeArgs[4];
            if (vnode.hookedInvControlIds) {
               // Keep track of control node ids that already have a control
               // node hook attached
               vnode.hookedInvControlIds.push(controlNode.id);
            }
         }
      } else {
         return sameNode ? vnode : Vdom.htmlNode.apply(Vdom, newNodeArgs);
      }
   } else {
      return vnode;
   }
}
function getFirst(template) {
   return Array.isArray(template) ? template[0] : template;
}
function mapVNodeChildren(recursive, vnode, mapFn, filterFn, getFromTemplateNodes?) {
   function join(vnode) {
      var mapped = filterFn(vnode) ? [mapFn(vnode)] : [];
      return recursive ? mapped.concat(ListMonad.join(getVNodeChidlren(vnode, getFromTemplateNodes), join)) : mapped;
   }

   return ListMonad.join(getVNodeChidlren(vnode, getFromTemplateNodes), join);
}

function identity(v) {
   return v;
}
function collectChildControlVNodes(vnode, getFromTemplateNodes?) {
   return mapVNodeChildren(true, vnode, identity, Vdom.isControlVNodeType, getFromTemplateNodes);
}

function collectChildTemplateVNodes(vnode) {
   return mapVNodeChildren(true, vnode, identity, Vdom.isTemplateVNodeType);
}

export function getMarkupDiff(oldNode, newNode, ignoreLinkEqual?) {
   var
      result = {
         create: [],
         createTemplates: [],
         destroy: [],
         destroyTemplates: [],
         update: [],
         updateTemplates: [],
         vnodeChanged: false
      },
      childrenResult,
      oldChildren,
      newChildren,
      childLn,
      i,
      oldChild,
      newChild;

   function reorder(oldChildren, newChildren) {
      function haveKeys(children) {
         if (children) {
            for (var i = 0, length = children.length; i !== length; i++) {
               if (children[i].key !== undefined) {
                  return true;
               }
            }
         }
         return false;
      }

      function keyIndex(children) {
         var
            keys = {},
            free = [],
            length = children.length;

         for (var i = 0; i < length; i++) {
            var child = children[i],
               key = child.key;

            if (key !== undefined) {
               keys[key] = i;
            } else {
               free.push(i);
            }
         }

         return { keys: keys, free: free };
      }

      var
         result,
         oldKeys,
         newKeys,
         newFree,
         newFreeLn,
         oldKI,
         newKI,
         i,
         freeIndex,
         lastFreeIndex,
         oldLength,
         newLength,
         oldChild;

      if (haveKeys(oldChildren) && haveKeys(newChildren)) {
         oldKI = keyIndex(oldChildren);
         newKI = keyIndex(newChildren);
         oldKeys = oldKI.keys;
         oldLength = oldChildren.length;
         newKeys = newKI.keys;
         newLength = newChildren.length;
         newFree = newKI.free;
         newFreeLn = newFree.length;

         freeIndex = 0;
         result = new Array(length);

         for (i = 0; i !== oldLength; i++) {
            oldChild = oldChildren[i];
            if (oldChild.key !== undefined) {
               if (newKeys.hasOwnProperty(oldChild.key)) {
                  result[i] = newChildren[newKeys[oldChild.key]];
               } else {
                  result[i] = null;
               }
            } else if (freeIndex !== newFreeLn) {
               result[i] = newChildren[newFree[freeIndex]];
               freeIndex++;
            } else {
               result[i] = null;
            }
         }

         lastFreeIndex = freeIndex !== newFreeLn ? newFree[freeIndex] : newLength;
         for (i = 0; i !== newLength; i++) {
            newChild = newChildren[i];
            if (newChild.key !== undefined) {
               if (!oldKeys.hasOwnProperty(newChild.key)) {
                  result.push(newChild);
               }
            } else if (i >= lastFreeIndex) {
               result.push(newChildren[i]);
            }
         }
      } else {
         result = newChildren;
      }
      return result;
   }

   function isEqualNode(n1, n2) {
      var
         isControl1 = n1 && Vdom.isControlVNodeType(n1),
         isControl2 = n2 && Vdom.isControlVNodeType(n2),
         isTemplate1 = n1 && Vdom.isTemplateVNodeType(n1),
         isTemplate2 = n2 && Vdom.isTemplateVNodeType(n2),
         resultTemplate = isTemplate1 === isTemplate2,
         result = isControl1 === isControl2;

      if (result) {
         if (isControl1) {
            result = n1.controlClass === n2.controlClass && n1.key === n2.key;
         } else {
            result = n1.type === n2.type;
            if (result && Vdom.isVNodeType(n1)) {
               result = n1.tagName === n2.tagName && n1.namespace === n2.namespace && n1.key === n2.key;
            }
         }
      } else if (resultTemplate) {
         if (isTemplate1) {
            result = n1.template === n2.template && n1.key === n2.key;
         } else {
            result = n1.type === n2.type && n1.compound === n2.compound;

            if (result && Vdom.isVNodeType(n1)) {
               result = n1.tagName === n2.tagName && n1.namespace === n2.namespace && n1.key === n2.key;
            }
         }
      }

      return result;
   }

   function concatResults(result, partName, part) {
      result[partName] = result[partName].concat(part);
   }

   if (oldNode !== newNode || ignoreLinkEqual) {
      coreDebug.checkAssertion(!!newNode, 'newNode !== null');

      if (isEqualNode(oldNode, newNode)) {
         if (Vdom.isControlVNodeType(newNode)) {
            if (oldNode.controlNodeIdx === -1) {
               result.create.push(newNode);
            } else {
               result.update.push({
                  oldNode: oldNode,
                  newNode: newNode
               });
            }
         } else if (Vdom.isTemplateVNodeType(newNode)) {
            if (!newNode.children && newNode === oldNode) {
               result.createTemplates.push(newNode);
            } else {
               result.updateTemplates.push({
                  oldNode: oldNode,
                  newNode: newNode
               });
            }
         } else {
            oldChildren = getVNodeChidlren(oldNode);
            newChildren = reorder(oldChildren, getVNodeChidlren(newNode));

            childLn = Math.max(oldChildren.length, newChildren.length);
            var
               newChildrenOffset = 0,
               wasReordered = newChildren !== newNode.children;
            if (oldChildren.length !== newChildren.length) {
               result.vnodeChanged = true;
            }
            for (i = 0; i !== childLn; i++) {
               oldChild = oldChildren[i];
               if (oldChild && oldChild.key === 'vdom-focus-in' && !wasReordered) {
                  newChildrenOffset++;
                  continue;
               }
               newChild = newChildren[i - newChildrenOffset];

               if (oldChild && newChild) {
                  childrenResult = getMarkupDiff(oldChild, newChild, ignoreLinkEqual);
                  result.vnodeChanged = result.vnodeChanged || childrenResult;
                  concatResults(result, 'create', childrenResult.create);
                  concatResults(result, 'destroy', childrenResult.destroy);
                  concatResults(result, 'update', childrenResult.update);
                  concatResults(result, 'createTemplates', childrenResult.createTemplates);
                  concatResults(result, 'destroyTemplates', childrenResult.destroyTemplates);
                  concatResults(result, 'updateTemplates', childrenResult.updateTemplates);
               } else if (oldChild) {
                  if (Vdom.isControlVNodeType(oldChild)) {
                     concatResults(result, 'destroy', [oldChild]);
                  } else if (Vdom.isTemplateVNodeType(newNode)) {
                     concatResults(result, 'destroy', collectChildControlVNodes(oldChild, true));
                  } else {
                     concatResults(result, 'destroy', collectChildControlVNodes(oldChild, true));
                  }
               } else {
                  if (Vdom.isControlVNodeType(newChild)) {
                     concatResults(result, 'create', [newChild]);
                  } else if (Vdom.isTemplateVNodeType(newChild)) {
                     concatResults(result, 'createTemplates', [newChild]);
                  } else {
                     concatResults(result, 'create', collectChildControlVNodes(newChild));
                     concatResults(result, 'createTemplates', collectChildTemplateVNodes(newChild));
                  }
               }
            }
         }
      } else {
         result.vnodeChanged = true;

         if (Vdom.isControlVNodeType(newNode)) {
            result.create.push(newNode);
         } else if (Vdom.isTemplateVNodeType(newNode)) {
            result.createTemplates.push(newNode);
         } else {
            concatResults(result, 'create', collectChildControlVNodes(newNode));
            concatResults(result, 'createTemplates', collectChildTemplateVNodes(newNode));
         }

         if (oldNode) {
            if (Vdom.isControlVNodeType(oldNode)) {
               result.destroy.push(oldNode);
            } else if (Vdom.isTemplateVNodeType(oldNode)) {
               concatResults(result, 'destroy', collectChildControlVNodes(oldNode, true));
            } else {
               concatResults(result, 'destroy', collectChildControlVNodes(oldNode, true));
            }
         }
      }
   }

   return result;
}

function hasChangedFields(newObj, oldObj) {
   var key;

   // check if any properties were removed or changed
   for (key in oldObj) {
      if (oldObj.hasOwnProperty(key)) {
         if (!newObj.hasOwnProperty(key) || newObj[key] !== oldObj[key]) {
            return true;
         }
      }
   }

   // check if there are any new properties
   for (key in newObj) {
      if (newObj.hasOwnProperty(key) && !oldObj.hasOwnProperty(key)) {
         return true;
      }
   }

   return false;
}

function arePropertiesChanged(newProps, oldProps) {
   return (
      hasChangedFields(newProps.attributes, oldProps.attributes) ||
      hasChangedFields(newProps.events, oldProps.events) ||
      hasChangedFields(newProps.hooks, oldProps.hooks)
   );
}

export function getFullMarkup(controlNodes, vnode, ignoreInnerComponent, currentFullMarkup?, parentNode?) {
   var
      result,
      i,
      children,
      ln,
      childMarkup,
      newChildren,
      childrenAfter,
      changed = false;

   if (Vdom.isControlVNodeType(vnode)) {
      if (ignoreInnerComponent) {
         return vnode;
      }
      result = controlNodes[vnode.controlNodeIdx].fullMarkup;
      /**
       * In case of invisible node we have to hold on to parent dom node
       */
      if (result && result.type && result.type === 'invisible-node') {
         if (parentNode && parentNode.type) {
            // Invisible control node is attached to a parent vnode, which
            // should keep track of every invisible control attached to it
            if (!parentNode.hookedInvControlIds) {
               parentNode.hookedInvControlIds = [];
            }
            mapVNode(
               setControlNodeHook(controlNodes[vnode.controlNodeIdx]),
               controlNodes[vnode.controlNodeIdx],
               parentNode,
               true,
               false,
               true
            );
         }
         result = Vdom.textNode('', controlNodes[vnode.controlNodeIdx].key);
      }
   } else if (Vdom.isTemplateVNodeType(vnode) && !vnode.children) {
      result = vnode;
   } else if (
      (!Vdom.isTemplateVNodeType(vnode) && !Vdom.isVNodeType(vnode)) ||
      !vnode.children ||
      vnode.children.length === 0
   ) {
      result = vnode;
   } else {
      i = 0;
      children = Vdom.isTemplateVNodeType(vnode) ? vnode.children : getVNodeChidlren(vnode);

      ln = children.length;

      while (i !== ln) {
         childMarkup = getFullMarkup(controlNodes, children[i], ignoreInnerComponent, undefined, vnode);
         if (childMarkup.changed) {
            changed = true;
         }
         if (childMarkup !== children[i]) {
            break;
         }

         i++;
      }

      //    childMarkup = flatten(childMarkup, true);

      if (i === ln) {
         result = vnode;
         if (!changed && currentFullMarkup) {
            if (result.children && currentFullMarkup.children) {
               if (result.children.length !== currentFullMarkup.children.length) {
                  changed = true;
               } else {
                  for (var chi = 0; chi < result.children.length; chi++) {
                     if (
                        result.children[chi] !== currentFullMarkup.children[chi] ||
                        (currentFullMarkup.children[chi] && currentFullMarkup.children[chi].changed)
                     ) {
                        changed = true;
                        break;
                     }
                  }
               }
            }
         }
      } else {
         childrenAfter = children.slice(i + 1).map(function (item) {
            /*function map has 3 arguments, but function getFullMarkup has another 3 arguments*/
            var fullMarkup = getFullMarkup(controlNodes, item, ignoreInnerComponent, undefined, vnode);
            if (fullMarkup.changed) {
               changed = true;
            }
            return fullMarkup;
         });
         childrenAfter = flatten(childrenAfter, true);
         newChildren = children
            .slice(0, i)
            .concat(Array.isArray(childMarkup) ? childMarkup : [childMarkup])
            .concat(childrenAfter);

         if (Vdom.isTemplateVNodeType(vnode)) {
            /*for template node we must create new template node
             *with full markup from controlNodes
             *DOMJS knows how create this nodes
             */
            var obj = {
               compound: false,
               children: newChildren,
               childrenForDiff: vnode.children,
               template: vnode.template,
               controlProperties: vnode.controlProperties,
               parentControl: vnode.parentControl,
               attributes: vnode.attributes,
               context: vnode.context,
               changed: true,
               type: 'TemplateNode',
               optionsVersions: vnode.optionsVersions
            };
            return obj.children;
         }

         if (currentFullMarkup) {
            // check if any of the children have changed
            if (!changed) {
               if (
                  (!currentFullMarkup.children && newChildren) ||
                  currentFullMarkup.children.length !== newChildren.length
               ) {
                  changed = true;
               } else {
                  for (var chi = 0; chi < currentFullMarkup.children.length; chi++) {
                     if (currentFullMarkup.children[chi] !== newChildren[chi] || newChildren[chi].changed) {
                        changed = true;
                        break;
                     }
                  }
               }
            }

            // check if any of the properties have changed
            if (!changed) {
               changed = arePropertiesChanged(vnode.hprops, currentFullMarkup.hprops);
            }

            if (changed) {
               result = Vdom.htmlNode(vnode.type, vnode.hprops, newChildren, vnode.key, vnode.ref);
               result.changed = true;
            } else {
               result = currentFullMarkup;
            }
         } else {
            result = Vdom.htmlNode(vnode.type, vnode.hprops, newChildren, vnode.key, vnode.ref);
            result.changed = true;
         }
      }
   }
   if (Vdom.isTemplateVNodeType(result)) {
      if (result.children) {
         result = result.children;
      } else {
         Vdom.textNode('', result.attributes.key);
      }
   }

   if (changed) {
      result.changed = true;
   }

   return result;
}

function createErrVNode(err, key) {
   return Vdom.htmlNode(
      'span',
      {},
      [Vdom.textNode(err, (key || 'err_' + Math.trunc(Math.random() * 1000)) + '_inner_text')],
      key || 'err_' + Math.trunc(Math.random() * 1000)
   );
}

export function getDecoratedMarkup(controlNode, isRoot) {
   //Теперь передададим еще и атрибуты, которые нам дали сверху для построения верстки
   //там они будут мержиться
   var
      markupRes = controlNode.control._getMarkup(controlNode.key, isRoot, {
         key: controlNode.key,
         attributes: controlNode.attributes,
         events: controlNode.events,
         inheritOptions: controlNode.inheritOptions,
         templateContext: controlNode.templateContext,
         internal: controlNode.internal,
         domNodeProps: controlNode.domNodeProps
      }),
      result;

   if (Vdom.isVNodeType(markupRes)) {
      result = mapVNode(controlNode.markupDecorator, controlNode, markupRes);
   } else if (Vdom.isControlVNodeType(markupRes)) {
      result = mapVNode(controlNode.markupDecorator, controlNode, markupRes);
   } else {
      result = markupRes;
   }

   if (
      !Vdom.isControlVNodeType(result) &&
      !Vdom.isVNodeType(result) &&
      !Vdom.isTemplateVNodeType(result)
   ) {
      result = createErrVNode('control._getMarkup должен отдавать dom-узел', controlNode.key);
   }

   return result;
}
