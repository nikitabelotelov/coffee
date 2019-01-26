/// <amd-module name="View/Executor/_Utils/Vdom" />

// @ts-ignore
import * as Request from 'View/Request';
// @ts-ignore
import * as Logger from 'View/Logger';
// @ts-ignore
import * as Inferno from 'View/Runner/Vdom/third-party/inferno';

import { ContextResolver } from '../Expressions';
import { resolveInheritOptions } from './OptionsResolver';
import { isString } from './Common';

var
   receivedName = '',
   configName = 'cfg-';

/**
 * Для того чтобы всегда брать верхний компонент из конфига
 * @param configId
 * @returns {*}
 */
function findTopConfig(configId) {
   return (configId + '').replace(configName, '').split(',')[0];
}

function fillCtx(control, vnode, resolvedCtx) {
   control._saveContextObject(resolvedCtx);
   control.saveFullContext(ContextResolver.wrapContext(control, vnode.context || {}));
}

/**
 * Для того что бы звать сам метод, если он есть или с готовым состоянием
 * @param stateVar
 * @param control
 * @param vnode
 * @param serializer
 * @returns {*}
 */
function getStateReadyOrCall(stateVar, control, vnode, serializer) {
   var data,
      srec = Request.getCurrent().stateReceiver;

   if (srec && srec.register) {
      srec.register(stateVar, {
         setState: function (rState) {
            data = rState;
         },
         getState: function () {
            return {};
         }
      });
   }


   /* Compat layer. For page without Controls.Application */
   if (!data && window["inline" + stateVar]) {
      data = JSON.parse(window["inline" + stateVar], serializer.deserialize);
      if (window["inline" + stateVar]) {
         window["inline" + stateVar] = undefined;
      }
   }

   var ctx = ContextResolver.resolveContext(control.constructor, vnode.context || {}, control),
      res;

   try {
      res = data ? control._beforeMount(
         vnode.controlProperties,
         ctx,
         data
      ) : control._beforeMount(vnode.controlProperties, ctx);
   } catch (error) {
      Logger.catchLifeCircleErrors('_beforeMount', error);
   }

   if (res && res.then) {
      res.then(function (resultDef) {
         fillCtx(control, vnode, ctx);
         return resultDef;
      });
   } else {
      fillCtx(control, vnode, ctx);
   }

   if (!vnode.inheritOptions) {
      vnode.inheritOptions = {};
   }
   resolveInheritOptions(vnode.controlClass, vnode, vnode.controlProperties);
   control.saveInheritOptions(vnode.inheritOptions);

   if (srec && srec.unregister) {
      srec.unregister(stateVar);
   }

   return res;
}


export function htmlNode(tagName, props, children, key, ref?) {
   var vnode = Inferno.createVNode(getFlagsForElementVnode(tagName),
      tagName,
      (props && props.attributes && props.attributes.class) || '',
      children,
      children && children.length ? (key ? 8 : 4) : 0,
      props.attributes,
      key,
      ref);
   vnode.hprops = props;
   return vnode;
}

export function textNode(text, key?) {
   return Inferno.createTextVNode(text, key);
}

export function controlNode(controlClass, controlProperties, key) {
   return {
      controlClass: controlClass,
      controlProperties: controlProperties,
      key: key,
      controlNodeIdx: -1
   };
}

export function isVNodeType(vnode) {
   return vnode && (!isString(vnode.children) && typeof vnode.children !== 'number') && vnode.hasOwnProperty('dom');
   // return vnode && typeof vnode === 'object' && vnode.type === 'VirtualNode';
}

export function isTextNodeType(vnode) {
   return vnode && (isString(vnode.children) || typeof vnode.children === 'number') && vnode.hasOwnProperty('dom');
   // return vnode && typeof vnode === 'object' && vnode.type === 'VirtualText';
}

export function isControlVNodeType(vnode) {
   return vnode && typeof vnode === 'object' && 'controlClass' in vnode;
}

export function isTemplateVNodeType(vnode) {
   return vnode && typeof vnode === 'object' && vnode.type === 'TemplateNode';
}

/**
 * Получаем state из сгенерированного script
 * @param controlNode
 * @param vnode
 * @param Slr
 * @returns {*}
 */
export function getReceivedState(controlNode, vnode, srlz) {
   var control = controlNode.control,
      rstate = controlNode.key ? findTopConfig(controlNode.key) : '';
   if (control._beforeMount) {
      return getStateReadyOrCall(rstate, control, vnode, srlz);
   }
}

export function getFlagsForElementVnode(...args) {
   return Inferno.getFlagsForElementVnode.apply(Inferno, [].slice.call(arguments));
}

export function patch(...args) {
   return Inferno.patch.apply(Inferno, [].slice.call(arguments));
}

export function render(...args) {
   return Inferno.render.apply(Inferno, [].slice.call(arguments));
}

export function createRenderer(...args) {
   return Inferno.createRenderer.apply(Inferno, [].slice.call(arguments));
}