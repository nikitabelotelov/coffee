/// <amd-module name="Vdom/_private/Synchronizer/resources/DOMEnvironment" />
//@ts-ignore
import { constants, detection, IoC, coreDebug } from 'Env/Env';
// @ts-ignore
import * as findIndex from 'Core/helpers/Array/findIndex';
// @ts-ignore
import * as isNewEnvironment from 'Core/helpers/isNewEnvironment';
import runDelayed from './runDelayedRebuild';
import { mapVNode } from './VdomMarkup';
import * as Hooks from './Hooks';
import SyntheticEvent from './SyntheticEvent';
import * as TabIndex from './TabIndex';
import { Event as EventExpression, RawMarkupNode } from 'View/Executor/Expressions';
import { Common, Vdom } from 'View/Executor/Utils';
import { GeneratorVdom } from 'View/Executor/Markup';
import Environment from './Environment';
import * as SwipeController from './SwipeController';
import * as Logger from 'View/Logger';

/**
 * TODO: Изыгин
 * https://online.sbis.ru/opendoc.html?guid=6b133510-5ff0-4970-8540-d5be30e7587b&des=
 * Задача в разработку 01.06.2017 Поднять юнит тестирование VDOM Обеспечить покрытие тестами и прозрачность кода файлов…
 */
var
   assert = coreDebug.checkAssertion,
   TAB_KEY = 9,
   // fix react chrome-extension
   // DELETE AFTER 420
   // we must come up with universal solution
   simpleFixSpanBeforeBody = function simpleFixSpanBeforeBody(domNode) {
      return (
         domNode.tagName === 'SPAN' &&
         domNode.getAttribute('id') === 'warning-container' &&
         domNode.nextElementSibling &&
         domNode.nextElementSibling.tagName === 'BODY'
      );
   },
   vdomSyncSkipper = function vdomSyncSkipper(domNode, shouldIgnore, type) {
      // fix react chrome-extension, skip inserted tags
      if (simpleFixSpanBeforeBody(domNode)) {
         domNode.setAttribute('data-vdomignore', 'true');
         shouldIgnore = true;
      }
      // inserted comments by some adblocking extension
      if (type === 8) {
         shouldIgnore = true;
      }
      return shouldIgnore;
   },
   isDomNodeShouldBeIgnored = function isDomNodeShouldBeIgnored(domNode) {
      var
         type = domNode.nodeType,
         shouldIgnore = type === 1 && domNode.getAttribute('data-vdomignore');

      return shouldIgnore || vdomSyncSkipper(domNode, shouldIgnore, type);
   };

function createRecursiveVNodeMapper(fn) {
   return function recursiveVNodeMapperFn(tagName, properties, children, key, controlNode, ref) {
      var
         i,
         childrenRest,
         fnRes = fn(tagName, properties, children, key, controlNode, ref),
         newChildren = fnRes[2];

      i = findIndex(newChildren, function finderRecursiveIndex(child) {
         var newChild = mapVNode(recursiveVNodeMapperFn, controlNode, child);
         return child !== newChild;
      });

      if (i !== -1 && i !== undefined) {
         childrenRest = newChildren.slice(i).map(mapVNode.bind(self, recursiveVNodeMapperFn, controlNode));
         newChildren = newChildren.slice(0, i).concat(childrenRest);
         fnRes = [fnRes[0], fnRes[1], newChildren, fnRes[3], fnRes[4]];
      }

      return fnRes;
   };
}

function domToVDom(dom) {
   function getElementStyle(styleText) {
      var style, stylePair, styleArr, i, ln;

      if (styleText) {
         styleArr = styleText.split(';');
         ln = styleArr.length;
         if (ln) {
            for (i = 0; i !== ln; i++) {
               stylePair = styleArr[i].split(':');
               if (stylePair.length === 2) {
                  if (!style) {
                     style = {};
                  }
                  style[stylePair[0].trim()] = stylePair[1].trim();
               }
            }
         }
      }

      return style;
   }

   function getElementProps(el) {
      var
         attrs = el.attributes,
         i,
         ln = attrs.length,
         attrsObj,
         style,
         attr,
         res,
         properties,
         $key = null;

      for (i = 0; i !== ln; i++) {
         attr = attrs[i];
         if (attr.name === 'key') {
            $key = attr.value;
         } else if (attr.name === 'style') {
            style = getElementStyle(attr.value);
         } else {
            if (!attrsObj) {
               attrsObj = {};
            }
            attrsObj[attr.name] = attr.value;
         }
      }

      properties = {};
      res = {
         properties: properties
      };
      if (attrsObj) {
         properties.attributes = attrsObj;
      }

      if (style) {
         properties.style = style;
      }

      res.key = $key;

      if (el.tagName.toLowerCase() === 'input') {
         if (!properties.attributes) {
            properties.attributes = {};
         }

         if (!properties.attributes.hasOwnProperty('value')) {
            properties.attributes.value = undefined;
         }
      }

      return res;
   }

   function createVNode(domNode) {
      var
         type = domNode.nodeType,
         shouldIgnore = isDomNodeShouldBeIgnored(domNode);

      if (!shouldIgnore) {
         domNode.__WS = {}; // mark the node for vdom processing
         if (type === 1) {
            return createFromElement(domNode);
         } else if (type === 3) {
            if (domNode.data === '\n' || domNode.data === '') {
               domNode.parentNode.removeChild(domNode);
               return -1;
            }
            return Vdom.textNode(domNode.nodeValue);
         }
      }

      return null; // this node should not be processed by vdom
   }

   function createFromElement(el) {
      var
         tagName = el.tagName,
         namespace = el.namespaceURI == 'http://www.w3.org/1999/xhtml' ? null : el.namespaceURI,
         props = getElementProps(el),
         children = [],
         i,
         ln = el.childNodes.length;

      for (i = 0; i !== ln; i++) {
         var child = createVNode(el.childNodes[i]);
         if (child === -1) {
            i--;
            ln--;
         } else if (child) {
            children.push(child);
         }
      }

      var attrs = (props && props.properties && props.properties.attributes) || {};
      namespace = namespace || Common.getNamespace(attrs);
      return GeneratorVdom.createTag(tagName.toLowerCase(), props.properties, children, {
         attributes: { 'ws-creates-context': 'true' }
      });
      //    return vdom.htmlNode(tagName.toLowerCase(), props.properties, children, props.key, function () {});
   }

   return createVNode(dom);
}

function controlNodesCompoundReduce(prev, next) {
   return !(prev && next);
}

function atLeastOneControlReduce(prev, next) {
   return next.control;
}

function isControlNodesCompound(controlNodes) {
   return !controlNodes.reduce(controlNodesCompoundReduce, true);
}

function atLeasOneControl(controlNodes) {
   return controlNodes.reduce(atLeastOneControlReduce, true);
}

function isInPage(node) {
   node = node.hasOwnProperty('length') ? node[0] : node;
   return node === document.documentElement || node === document.body || node.offsetParent === null
      ? false
      : document.body.contains(node);
}

/**
 * Вычисляет controlNode для control
 * @param control
 * @returns {*}
 */
function getControlNode(control) {
   var controlNodes = control._container.length ? control._container[0].controlNodes : control._container.controlNodes;
   for (var i in controlNodes) {
      if (controlNodes[i].control === control) {
         return controlNodes[i];
      }
   }
}

function checkOpener(opener) {
   var error;

   if (opener) {
      // Component instance must have _options
      if (opener && !opener._options) {
         error =
            'Control ' +
            opener._moduleName +
            ' with name ' +
            (opener.getName && opener.getName()) +
            ' must have _options';
      }

      // if (opener.isDestroyed && opener.isDestroyed()) {
      //    error = "Control " + opener._moduleName + " with name " + (opener.getName && opener.getName()) + " was destroyed, but found as parent or opener of current control";
      // }
   }

   if (error) {
      IoC.resolve('ILogger').error(
         'DOMEnvironment',
         'Incorrect opener or parent is found! It seems that anybody set wrong opener option! ' + error
      );
   }
}

/**
 * Focus parent is a component that contains the given control
 * "logically" and receives the focus whenever the given control
 * is focused.
 * @param control Control to get the focus parent for
 * @returns Focus parent of the given control
 */
function getFocusParent(control) {
   return (control.getOpener && control.getOpener()) ||
      (control._options && control._options.opener) ||
      (control.getParent && control.getParent()) ||
      (control._options && control._options.parent);
}

/**
 * Recursively collect array of openers or parents
 * @param controlNode
 * @param array
 */
function addControlsToFlatArray(controlNode, array) {
   var control = controlNode.control;

   if (array[array.length - 1] !== control) {
      array.push(control);
   }

   // Поднимаемся по controlNode'ам, потому что у control'а нет доступа к родительскому контролу
   var next = control._options.opener || controlNode.parent;
   if (next && !next.control) {
      if (next._container) {
         checkOpener(next);
         next = getControlNode(next);
      } else {
         // если компонент невизуальный, ничего не ищем
         next = null;
      }
   }
   if (next) {
      addControlsToFlatArray(next, array);
   } else {
      next = getFocusParent(control);
      checkOpener(next);
      // может мы уперлись в кореневой VDOM и надо посмотреть, есть ли на нем wsControl, если есть - начинаем вслпывать по старому
      if (next) {
         addControlsToFlatArrayOld(next, array);
      }
   }
}
function addControlsToFlatArrayOld(control, array) {
   if (array[array.length - 1] !== control) {
      array.push(control);
   }

   var parent = getFocusParent(control);

   checkOpener(parent);

   if (parent) {
      // если найденный компонент является vdom-компонентом, начинаем всплывать по новому
      if (parent._template) {
         var container = parent._container.length ? parent._container[0] : parent._container;
         addControlsToFlatArray(container.controlNodes[0], array);
      } else {
         addControlsToFlatArrayOld(parent, array);
      }
   }
}

function goUpByControlTree(target, array?) {
   array = array || [];
   if (target && target.jquery) {
      // Unwrap jQuery element if it is present
      target = target[0];
   }
   if (target) {
      if (target.controlNodes && target.controlNodes.length) {
         // Для новых контролов
         addControlsToFlatArray(target.controlNodes[0], array);
      } else if (constants.compat && target.wsControl) {
         // Если встретили старый компонент, нужно собирать его парентов по старому API
         addControlsToFlatArrayOld(target.wsControl, array);
      } else {
         // Рекурсивно поднимаемся вверх по элементам, пока не сможем вычислить ближайший компонент
         goUpByControlTree(target.parentNode, array);
      }
   }
   return array;
}

function checkControlNodes(controlNodes, controlNode) {
   if (controlNodes && controlNodes.length > 0) {
      for (var i = 0; i < controlNodes.length; i++) {
         if (controlNode.id === controlNodes[i].id) {
            return true;
         }
      }
   }
   return false;
}

const DOMEnvironment = Environment.extend({
   constructor: function (rootDOMNode, controlStateChangedCallback, rootAttrs) {
      assert(rootDOMNode !== document, 'Корневой контрол нельзя монтировать на document');
      this._rootDOMNode = rootDOMNode;
      this._rootVNode = domToVDom(rootDOMNode);
      this._captureEventHandlers = {};
      this._markupNodeDecorator = createRecursiveVNodeMapper(Hooks.setEventHooks(this));
      this.addCaptureProcessingHandler('focus', this._handleFocusEvent);
      this.addCaptureProcessingHandler('blur', this._handleBlurEvent);
      this.addCaptureProcessingHandler('mousedown', this._handleMouseDown);
      this.addCaptureProcessingHandler('click', this._handleClick);
      this.addCaptureProcessingHandler('touchstart', this._handleTouchstart);
      this.addCaptureProcessingHandler('touchmove', this._handleTouchmove);
      this.addCaptureProcessingHandler('touchend', this._handleTouchend);
      this._handleTabKey = this._handleTabKey.bind(this);

      this._clickState = {
         detected: false,
         stage: '',
         timer: undefined,
         timeout: 500,
         target: null,
         touchCount: 0,
         timeStart: undefined
      };

      // разрешаем фокусироваться на body, чтобы мы могли зафиксировать уход фокуса из vdom-окружения и деактивировать компоненты
      if (!isNewEnvironment() && typeof window !== 'undefined') {
         document.body.tabIndex = 0;
      }

      Environment.call(this, controlStateChangedCallback, rootAttrs);
   },
   destroy: function () {

      //Кейс: в панели идет перерисовка. Панель что-то сообщает опенеру
      //опенер передает данные в контрол, который лежит вне панели
      //контрол дергает _forceUpdate и попадает в очередь перерисовки панели
      //затем панель разрушается и заказанной перерисовки контрола вне панели не случается
      this.runQueue();

      this.removeTabListener();
      this.removeCaptureEventHandler('focus');
      this.removeCaptureEventHandler('blur');
      this.removeCaptureEventHandler('mousedown');
      this.removeCaptureEventHandler('click');
      this.removeCaptureEventHandler('touchstart');
      this.removeCaptureEventHandler('touchmove');
      this.removeCaptureEventHandler('touchend');
      this._rootDOMNode = undefined;
      this._rootVNode = undefined;
      this._captureEventHandlers = {};
      this._handleTabKey = undefined;
      this.rootNodes = null;
      this._savedFocusedElement = undefined;
      DOMEnvironment.superclass.destroy.call(this);
   }
});
var proto = DOMEnvironment.prototype;

function afterMountProcess(controlNode) {
   try {
      controlNode.control._afterMount && controlNode.control._afterMount(controlNode.options, controlNode.context);
      controlNode.control._mounted = true;
      if (controlNode.control._$needForceUpdate) {
         delete controlNode.control._$needForceUpdate;
         controlNode.control._forceUpdate();
      }
   } catch (error) {
      Logger.catchLifeCircleErrors('_afterMount', error);
   }
}

/**
 * Рекурсивная функция для обхода уже примененной корневой контрол ноды и её детей, с учетом массива
 * изменных нод вообще и вызова у контролов методов _afterMount и _afterUpdate
 * @param controlNodes
 * @param rebuildChanges
 */
function callMountMethods(controlNodes, rebuildChanges) {
   controlNodes.forEach(function (controlNode) {
      if (controlNode.childrenNodes && controlNode.childrenNodes.length > 0) {
         callMountMethods(controlNode.childrenNodes, rebuildChanges);
      }
      if (~rebuildChanges.indexOf(controlNode.id)) {
         if (!controlNode.control._mounted && !controlNode.control._unmounted) {
            if (controlNode.hasCompound) {
               runDelayed(function () {
                  afterMountProcess(controlNode);
               });
            } else {
               afterMountProcess(controlNode);
            }
         } else {
            /**
             * TODO: удалить после синхронизации с контролами
             */
            try {
               controlNode.control._afterUpdate &&
                  controlNode.control._afterUpdate(
                     controlNode.oldOptions || controlNode.options,
                     controlNode.oldContext
                  );
            } catch (error) {
               Logger.catchLifeCircleErrors('_afterUpdate', error);
            }
         }
      }
   });
}

proto._handleTabKey = function (event) {
   if (!this._rootDOMNode) {
      return;
   }

   var next, res;
   if (event.keyCode === TAB_KEY) {
      next = TabIndex.findWithContexts(this._rootDOMNode, event.target, !!event.shiftKey, TabIndex.getElementProps);

      // храним состояние о нажатой клавише таба до следующего такта. Нужно, чтобы различать приход фокуса по табу или по клику
      this._isTabPressed = {
         isShiftKey: !!event.shiftKey
      };
      setTimeout(
         function () {
            this._isTabPressed = null;
         }.bind(this),
         0
      );

      if (next) {
         if (next.wsControl && next.wsControl.setActive) {
            next.wsControl.setActive(true);
         } else {
            TabIndex.focus(next);
         }
         event.preventDefault();
         event.stopImmediatePropagation();
      } else {
         if (this._rootDOMNode.wsControl) {
            res = this._rootDOMNode.wsControl._oldKeyboardHover(event);
         }
         if (res !== false) {
            // !!!!
            // this._lastElement.focus(); чтобы выйти из рута наружу, а не нативно в другой элемент внутри рута
            // тут если с шифтом вероятно нужно прокидывать в firstElement чтобы из него выйти
         } else {
            event.preventDefault();
            event.stopImmediatePropagation();
         }
      }
   }
};

proto.addTabListener = function () {
   if (this._rootDOMNode) this._rootDOMNode.addEventListener('keydown', this._handleTabKey, false);
};
proto.removeTabListener = function () {
   if (this._rootDOMNode) this._rootDOMNode.removeEventListener('keydown', this._handleTabKey);
};

proto.autofocusChanges = function autoFocusChanges(controlNode) {
   function findNodeForControlNode(rootNode, controlNode) {
      var children;
      if (checkControlNodes(rootNode.controlNodes, controlNode)) {
         return rootNode;
      }
      if (rootNode.children && rootNode.children.length > 0) {
         children = rootNode.children;
         for (var i = 0; i < children.length; i++) {
            if (children[i].controlNodes) {
               if (checkControlNodes(children[i].controlNodes, controlNode)) {
                  node = children[i];
                  return node;
               }
               findNodeForControlNode(children[i], controlNode);
            }
         }
      }
      return node;
   }

   function elementProps(element) {
      var props = TabIndex.getElementProps(element);
      props.tabStop = element.getAttribute('ws-autofocus') === 'true';
      return props;
   }

   var
      node,
      nodeToFocus,
      control = controlNode.control,
      environment = controlNode.environment,
      focusingElement;

   if (control.__$focusing && environment._rootDOMNode) {
      node = findNodeForControlNode(environment._rootDOMNode, controlNode);
      if (node) {
         nodeToFocus = TabIndex.findFirstInContext(node, undefined, elementProps);
         if (nodeToFocus) {
            TabIndex.focus(nodeToFocus);
         } else {
            TabIndex.focus(node);
         }
      }
      // до синхронизации мы сохранили __$focusing - фокусируемый элемент, а после синхронизации здесь фокусируем его.
      // если не нашли фокусируемый элемент - значит в доме не оказалось этого элемента.
      // но мы все равно отменяем скинем флаг, чтобы он не сфокусировался позже когда уже не надо
      // https://online.sbis.ru/opendoc.html?guid=e46d87cc-5dc2-4f67-b39c-5eeea973b2cc
      control.__$focusing = false;
   }
};

function fireChange(blurEvent) {
   var
      oldValue = blurEvent.target._cachedValue,
      currentValue = blurEvent.target.value;
   if (oldValue !== undefined && oldValue !== currentValue) {
      if (detection.isIE12) {
         var e = new Event('change');
      } else {
         var e = document.createEvent('Event');
         e.initEvent('change', true, true);
      }
      (e as any)._dispatchedForIE = true;
      blurEvent.target.dispatchEvent(e);
   }
   blurEvent.target._cachedValue = undefined;
}

/**
 * Сохраняем value на input'е. Это необходимо из-за особенностей работы vdom. При перерисовке мы для input'ов выполним
 * node.value = value. Из-за этого в EDGE событие change не стрельнет, потому что браузер не поймет, что текст поменялся.
 * Поэтому в EDGE будем стрелять событием change вручную
 * @param domNode - input
 */
function saveValueForChangeEvent(domNode) {
   if (detection.isIE) {
      domNode._cachedValue = domNode.value;
   }
}

// иногда фокус уходит на какой-то фейковый элемент в боди. и наша система реагирует по делу что фокус улетел.
// например, когда нужно скопировать текст в буфер обмена, текст вставляется в фейковое поле ввода на боди.
// пытаюсь исправить ситуацию, угадывая странный элемент и не обращая внимание на то что он фокусируется.
function detectStrangeElement(element) {
   if (!element) {
      return false;
   }

   if (element.classList.contains('vdom-focus-in') || element.classList.contains('vdom-focus-out')) {
      // все нормально, это служебные элементы, на них должен передаваться фокус
      return false;
   }
   // если элемент лежит в боди и у него нет потомков - считаем его фейковым,
   // не стреляем в этом случае событиями активности
   // в IE обработчик срабатывает и в том случае, когда фокус переходит прямо на body, нужно
   // не обращать на это внимание
   return (
      (element.parentElement === document.body && !element.firstChild) || (detection.isIE && element === document.body)
   );
}

proto._handleFocusEvent = function handleFocusEvent(e) {
   // запускаем обработчик только для правильного DOMEnvironment, в который прилетел фокус
   saveValueForChangeEvent(e.target);
   if (this._rootDOMNode && closest(e.target, this._rootDOMNode) && !detectStrangeElement(e.target)) {
      var relatedTarget = (!detectStrangeElement(e.relatedTarget) && e.relatedTarget) || this._savedFocusedElement;

      // if (relatedTarget && !isElementVisible(relatedTarget)) {
      //    IoC.resolve('ILogger').error("DOMEnvironment", "Previous focused element don't visible anymore. " +
      //       "You must focus another element before focused element will be invisible or removed!");
      // }

      // а это элемент, ближайший компонент которого - имеет активность 1 типа
      this._savedFocusedElement = e.target;

      notifyActivationEvents(e.target, relatedTarget, this._isTabPressed);

      // если нужна обратная совместимость
      if (constants.compat && this._rootDOMNode && this._rootDOMNode.controlNodes) {
         if (this._rootDOMNode.controlNodes[0] && this._rootDOMNode.controlNodes[0].control.isActive) {
            // если компонент уже активен, простреливаем событием onFocusInside
            if (this._rootDOMNode.controlNodes[0].control.isActive()) {
               this._rootDOMNode.controlNodes[0].control._callOnFocusInside();
            } else {
               // если еще не активен, активируем
               // @ts-ignore
               require('Lib/Control/AreaAbstract/AreaAbstract.compatible')._storeActiveChildInner.apply(
                  this._rootDOMNode.controlNodes[0].control
               );
            }
         }
      }
      this._focused = true;
   }
   captureEventHandler.call(this, e);
};
proto._handleBlurEvent = function _handleBlurEvent(e) {
   var target, relatedTarget;

   if (detection.isIE) {
      // В IE баг, из-за которого input не стреляет событием change, если перед уводом фокуса поменять value из кода
      // Поэтому стреляем событием вручную
      fireChange(e);

      if (e.relatedTarget === null) {
         // в IE есть баг что relatedTarget вообще нет, в таком случае возьмем document.body, потому что фокус уходит на него.
         relatedTarget = document.activeElement;
      }
   }

   // todo для совместимости.
   // если в старом окружении фокус на vdom-компоненте, и фокус уходит в старое окружение - стреляем
   // событиями deactivated на vdom-компонентах с которых уходит активность
   // https://online.sbis.ru/opendoc.html?guid=dd1061de-e519-438e-915d-3359290495ab
   target = e.target;
   relatedTarget = relatedTarget || e.relatedTarget;
   if (!isNewEnvironment() && relatedTarget) {

      // если у элемента, куда уходит фокус, сверху есть vdom-окружение, deactivated стрельнет в обработчике фокуса
      // иначе мы уходим непонятно куда и нужно пострелять deactivated
      var isVdomExists = closestVdom(relatedTarget);
      if (!isVdomExists) {
         notifyActivationEvents(relatedTarget, target, this._isTabPressed);
      }
   }

   captureEventHandler.call(this, e);
};
/**
 * Вычисляем состояние активности компонентов, и стреляем событием активности у тех компонентов,
 * что поменяли свое состояние
 * @param target - куда пришел фокус
 * @param relatedTarget - откуда ушел фокус
 * @param isTabPressed - true, если фокус перешел по нажатию tab
 */
function notifyActivationEvents(target, relatedTarget, isTabPressed) {
   var
      arrayMaker = goUpByControlTree(target), // Массив активированных компонентов
      relatedArrayMaker = goUpByControlTree(relatedTarget); // Массив деактивированных компонентов

   // Вычисляем общего предка
   var mutualTarget = arrayMaker.find(function (target) {
      return relatedArrayMaker.indexOf(target) !== -1;
   });

   // Меняем состояние у тех компонентов, которые реально потеряли активность
   relatedArrayMaker.find(function (control) {
      if (control !== mutualTarget) {
         var container = control._container;
         if (container && container[0]) {
            container = container[0];
         }
         // todo каким-то образом фокус улетает в IE на дочерний элемент, а deactivated зовется на его предке
         // https://online.sbis.ru/opendoc.html?guid=3dceaf87-5f2a-4730-a7bc-febe297649c5
         if (container && container.contains && container.contains(target)){
            return false;
         }
         // todo если элемент не в доме, не стреляем для контрола deactivated, потому что он уже удален
         // https://online.sbis.ru/opendoc.html?guid=0a8bd5b7-f809-4571-a6cf-ee605870594e
         // тут перерисовывается popup и фокус слетает сам, потом зовут активацию и relatedTarget берется как
         // savedFocusedElement который уже не в доме, потому что он был на попапе который удалили
         if (!closest(container, document.body)) {
            return false;
         }
         control._notify('deactivated', [
            {
               //to: arrayMaker[0],
               //from: relatedArrayMaker[0],
               isTabPressed: !!isTabPressed,
               isShiftKey: isTabPressed && isTabPressed.isShiftKey
            }
         ]);
         control._active = false;
         return false;
      } else {
         return true;
      }
   });

   // Меняем состояние у тех компонентов, которые реально получили активность
   arrayMaker.find(function (control) {
      if (control !== mutualTarget) {
         control._notify('activated', [
            {
               _$to: arrayMaker[0],
               //from: relatedArrayMaker[0],
               isTabPressed: !!isTabPressed,
               isShiftKey: isTabPressed && isTabPressed.isShiftKey
            }
         ]);
         control._active = true;
         return false;
      } else {
         return true;
      }
   });
}

proto._handleMouseDown = function handleMouseDown(e) {
   var
      element = e.target,
      html = document.documentElement;
   while (element !== html) {
      // todo совместимость! когда уберем совместимость, надо убрать element.getAttribute('ws-no-focus')
      if (element['ws-no-focus'] || element.getAttribute('ws-no-focus')) {
         e.preventDefault();
         break;
      } else {
         element = element.parentNode;
      }
   }

   captureEventHandler.call(this, e);
};

var clickStateTarget = [];
proto._handleClick = function handleClick(event) {
   if (this._shouldUseClickByTap()) {
      // if click event occurred, we can remove monitored target
      if (clickStateTarget.indexOf(event.target) > -1) {
         clickStateTarget.splice(clickStateTarget.indexOf(event.target), 1);
      }
   }

   /**
    * Firefox right click bug
    * https://bugzilla.mozilla.org/show_bug.cgi?id=184051
    */
   if (event.button === 2) {
      event.stopPropagation();
      return;
   }

   /**
    * Break click by select.
    */
   var
      selection = window.getSelection ? window.getSelection() : null,
      hasSelection = selection && selection.toString().length && event.target.contains(selection.focusNode),
      userSelectIsNone = window.getComputedStyle
         ? window.getComputedStyle(event.target)['user-select'] === 'none'
         : true;
   if (hasSelection && !userSelectIsNone) {
      event.stopPropagation();
      return;
   }

   captureEventHandler.call(this, event);
};
proto._handleTouchstart = function handleTouchstart(event) {
   if (this._shouldUseClickByTap()) {
      clickStateTarget.push(event.target);
   }

   SwipeController.initSwipeState(event);

   captureEventHandler.call(this, event);
};
proto._handleTouchmove = function handleTouchmove(event) {
   if (this._shouldUseClickByTap()) {
      this._clickState.touchCount++;
      // Only one touchmove event is allowed between touchstart and touchend events on Ipad. If more than one touchmove did occurred, we don't emulate click event.
      // But on windows installed devices touchmove event can occur some times, therefore we must check if touchmove count more than 1.
      if (this._clickState.touchCount > 3) {
         clickStateTarget.splice(clickStateTarget.indexOf(event.target), 1);
      }
   }

   SwipeController.detectSwipe(event);

   captureEventHandler.call(this, event);
};
proto._handleTouchend = function handleTouchend(event) {
   if (this._shouldUseClickByTap()) {
      this._clickState.touchCount = 0;
      // click occurrence checking
      setTimeout(function () {
         if (clickStateTarget.indexOf(event.target) > -1) {
            // if click did not occurred, we emulate click event here
            event.target.click();
         }
      }, this._clickState.timeout);
   }

   SwipeController.resetSwipeState();

   captureEventHandler.call(this, event);
};

proto._shouldUseClickByTap = function shouldUseClickByTap() {
   //In chrome wrong target comes in event handlers of the click events on touch devices. It occurs on the TV and the Windows tablet.
   //Presto Offline uses limited version of WebKit therefore the browser does not always generate clicks on the tap event.
   return (
      constants.browser.retailOffline ||
      (constants.compatibility.touch &&
         constants.browser.chrome &&
         navigator &&
         navigator.userAgent.indexOf('Windows') > -1)
   );
};

function closest(sourceElement, rootElement) {
   while (sourceElement.parentNode) {
      sourceElement = sourceElement.parentNode;
      if (sourceElement === rootElement) return true;
   }
   return false;
}
function closestVdom(sourceElement) {
   while (sourceElement.parentNode) {
      sourceElement = sourceElement.parentNode;
      if (sourceElement.controlNodes) return true;
   }
   return false;
}

function fireEvent(e) {
   if (!this._rootDOMNode) {
      return;
   }

   var
      relatedTarget = e.relatedTarget || document.body,
      target = e.target;

   var evt = document.createEvent('Events') as any;
   evt.initEvent('keydown', true, true);

   var shifted = false;
   if (target.className === 'vdom-focus-in') {
      if (closest(relatedTarget, this._rootDOMNode)) {
         // в vdom-focus-in прилетели либо изнутри контейнера, либо сверху потому что зациклились, shift - только если изнутри
         if (!(relatedTarget.classList.contains('vdom-focus-out') && this._rootDOMNode['ws-tab-cycling'] === 'true')) {
            shifted = true;
         }
      }
   }
   if (target.className === 'vdom-focus-out') {
      if (!closest(relatedTarget, this._rootDOMNode)) {
         // в vdom-focus-out прилетели либо снаружи контейнера, либо снизу потому что зациклились, shift - и если снаружи и если зациклились
         shifted = true;
      }
   }

   evt.view = window;
   evt.altKey = false;
   evt.ctrlKey = false;
   evt.shiftKey = shifted;
   evt.metaKey = false;
   evt.keyCode = 9;

   target.dispatchEvent(evt);
}

function findFirstVNode(arr) {
   if (!Array.isArray(arr)) {
      return null;
   }
   return arr.find(function (value) {
      return !!value;
   });
}

function appendFocusesElements(self, vnode) {
   var firstChild = findFirstVNode(vnode.children),
       fireTab = function (e) {
         fireEvent.call(self, e);
      },
      hookOut = function hookOut(node) {
         if (node) {
            node.addEventListener('focus', fireTab);
         }
      };
   // добавляем ноды vdom-focus-in и vdom-focus-out тольео если есть какие-то внутренние ноды
   if (firstChild && firstChild.key !== 'vdom-focus-in') {
      var focusInNode = Vdom.htmlNode(
         'a',
         {
            attributes: { class: 'vdom-focus-in', tabindex: '1' }
         },
         [],
         'vdom-focus-in',
          hookOut
      );
      var focusOutNode = Vdom.htmlNode(
         'a',
         {
            attributes: { class: 'vdom-focus-out', tabindex: '0' }
         },
         [],
         'vdom-focus-out',
          hookOut
      );
      vnode.children = [].concat(focusInNode, vnode.children, focusOutNode);
      return true;
   }

   return false;
}

/**
 * We have to find focus elements, that belongs to the specific rootNode
 * @param elem
 * @param cssClass
 * @returns {*}
 */
function findDirectChildren(elem, cssClass) {
   return Array.prototype.filter.call(elem.children, function (el) { return el.matches(cssClass) });
}

/**
 * We have to insert focus elements are already in the DOM,  before virtual dom synchronization
 * @param rootElement
 */
function appendFocusElementsToDOM(rootElement) {
   var firstChild = rootElement.firstChild;
   if (firstChild && firstChild.classList && !firstChild.classList.contains('vdom-focus-in')) {
      var vdomFocusInElems = findDirectChildren(rootElement, '.vdom-focus-in');
      var vdomFocusOutElems = findDirectChildren(rootElement, '.vdom-focus-out');
      var focusInElem = vdomFocusInElems.length ? vdomFocusInElems[0] : document.createElement('a');
      focusInElem.classList.add('vdom-focus-in');
      (focusInElem as any).tabIndex = 1;
      var focusOutElem = vdomFocusOutElems.length ? vdomFocusOutElems[0] : document.createElement('a');
      focusOutElem.classList.add('vdom-focus-out');
      (focusOutElem as any).tabIndex = 0;
      rootElement.insertBefore(focusInElem, firstChild);
      rootElement.appendChild(focusOutElem);
      return true;
   }

   return false;
}

proto.applyNewVNode = function (newVNnode, rebuildChanges, newRootCntNode) {
   if (!this._rootDOMNode) {
      return;
   }

   var
      vnode = this.decorateRootNode(newVNnode),
      hasCompound,
      control,
      patch,
      newRootDOMNode;

   if (this._rootDOMNode.tagName !== 'HTML') {
      if (vnode && appendFocusesElements(this, vnode)) {
         if (this._rootVNode && appendFocusesElements(this, this._rootVNode)) {
            appendFocusElementsToDOM(this._rootDOMNode);
         }
      }
   } else {
      if (vnode && vnode.children[1]) {
         var body = vnode.children[1];
         if (this._rootVNode && appendFocusesElements(this, body)) {
            var bodyDOM = this._rootDOMNode.getElementsByTagName('body');
            if (bodyDOM.length) {
               bodyDOM = bodyDOM[0];
               appendFocusElementsToDOM(bodyDOM);
            }
         }
      }
   }

   this._rootDOMNode.isRoot = true;
   if (this._rootDOMNode.hasOwnProperty('$V') || !this._rootDOMNode.firstChild) {
      patch = this._rootVNode ? Vdom.render(vnode, this._rootDOMNode, undefined, undefined, true) : null;
   } else {
      patch = this._rootVNode ? Vdom.hydrate(vnode, this._rootDOMNode, true, true) : null;
   }
   this._rootVNode = vnode;

   hasCompound = isControlNodesCompound([newRootCntNode]);

   if (hasCompound) {
      control = atLeasOneControl([newRootCntNode]);
      if (newRootDOMNode) {
         // @ts-ignore
         control._container = window.$ ? $(newRootDOMNode) : newRootDOMNode;
      }
      runDelayed(function () {
         newRootCntNode.environment._haveRebuildRequest = false;
         control.reviveSuperOldControls && control.reviveSuperOldControls();
         callMountMethods([newRootCntNode], rebuildChanges); //afterMount и afterUpdate
         newRootCntNode.environment._rebuildRequestStarted = false;
         newRootCntNode.environment.runQueue();
      });
   } else {
      newRootCntNode.environment._haveRebuildRequest = false;
      callMountMethods([newRootCntNode], rebuildChanges); //afterMount и afterUpdate
      newRootCntNode.environment._rebuildRequestStarted = false;
      newRootCntNode.environment.runQueue();
   }

   return patch;
};

proto.decorateFullMarkup = function (vnode, controlNode) {
   if (Array.isArray(vnode)) {
      vnode = vnode[0];
   }
   return mapVNode(Hooks.setControlNodeHook(controlNode), controlNode, vnode, true);
};

proto.getMarkupNodeDecorator = function () {
   return this._markupNodeDecorator;
};

proto.getDOMNode = function () {
   return this._rootDOMNode;
};

proto.runQueue = function () {
   if (this.queue) {
      this.activateSubQueue = true;
      for (var i = 0; i < this.queue.length; i++) {
         this.forceRebuild(this.queue[i]);
      }
      this.activateSubQueue = false;
   }
   this.queue = null;
   this.queueIds = {};

   if (this.subQueue) {
      this.queue = this.subQueue;
      this.subQueueIds = this.queueIds;
      this.subQueue = null;
      this.subQueueIds = {};
   }
};

function isArgsLengthEqual(controlNodesArgs, evArgs) {
   return controlNodesArgs && controlNodesArgs.args && controlNodesArgs.args.length === evArgs.length;
}

function checkControlNodeEvents(controlNode, eventName, index) {
   return controlNode && controlNode.events && controlNode.events[eventName] && controlNode.events[eventName][index];
}

/**
 * Распространение происходит по DOM-нодам вверх по родителям, с использованием массива обработчиков eventProperties,
 * в котором указаны обработчики для каждого контрола, если эти контролы подписаны на событие
 * Таким образом, обходим всю иерархию, даже если на дом-ноде висит несколько контрол-нод.
 * @param eventObject - Объект распространения
 * @param controlNode - Контрол-нода, с элемента которой начинается распространение, если это кастомное событие
 * @param eventPropertiesStartId - индекс обработчика в массиве eventProperties у eventObject.target,
 * с которого нужно начать цепочку вызовов обработчиков события. Необходимо для того, чтобы не вызывать обработчики
 * контролов дочерних контрол-нод.
 * @param args - Аргументы, переданные в _notify
 */
function vdomEventBubbling(eventObject, controlNode, eventPropertiesStartId, args, native) {
   var
      eventProperties,
      stopPropagation = false,
      eventPropertyName = 'on:' + eventObject.type.toLowerCase(),
      curDomNode,
      fn,
      evArgs,
      res,
      templateArgs,
      finalArgs;

   //Если событием стрельнул window или document, то распространение начинаем с body
   if (native) {
      curDomNode =
         eventObject.target === window || eventObject.target === document ? document.body : eventObject.target;
   } else {
      curDomNode = controlNode.element;
   }
   curDomNode = native ? curDomNode : controlNode.element;

   //Цикл, в котором поднимаемся по DOM-нодам
   while (!stopPropagation) {
      eventProperties = curDomNode.eventProperties;
      if (eventProperties && eventProperties[eventPropertyName]) {
         //Вызываем обработчики для всех controlNode на этой DOM-ноде
         for (var i = eventPropertiesStartId; i < eventProperties[eventPropertyName].length && !stopPropagation; i++) {
            fn = eventProperties[eventPropertyName][i].fn;
            evArgs = eventProperties[eventPropertyName][i].args;
            // If controlNode has event properties on it, we have to update args, because of the clos
            // happens in template function
            templateArgs = isArgsLengthEqual(checkControlNodeEvents(controlNode, eventPropertyName, i), evArgs)
               ? controlNode.events[eventPropertyName][i].args : evArgs;
            try {
               if (!args.concat) {
                  throw new Error(
                     'Аргументы обработчика события ' + eventPropertyName.slice(3) + ' должны быть массивом.'
                  );
               }
               /* Составляем массив аргументов для обаботчика. Первым аргументом будет объект события. Затем будут
                * аргументы, переданные в обработчик в шаблоне, и последними - аргументы в _notify */
               finalArgs = templateArgs.concat(args);
               finalArgs = [eventObject].concat(finalArgs);
               // Добавляем в eventObject поле со ссылкой DOM-элемент, чей обработчик вызываем
               eventObject.currentTarget = curDomNode;

               /* Control can be destroyed, while some of his children emit async event.
                * we ignore it event*/
               /* Также игнорируем обработчики контрола, который выпустил событие.
                * То есть, сам на себя мы не должны реагировать
                * */
               if (!fn.control._destroyed && (!controlNode || fn.control !== controlNode.control)) {
                  fn.apply(fn.control, finalArgs); // Вызываем функцию из eventProperties
               }
               finalArgs = [];
               eventObject.currentTarget = undefined;
               /* Проверяем, нужно ли дальше распространять событие по controlNodes */
               if (!eventObject.propagating()) {
                  var needCallNext =
                     !eventObject.isStopped() &&
                     eventProperties[eventPropertyName][i + 1] &&
                     (eventProperties[eventPropertyName][i + 1].toPartial ||
                        eventProperties[eventPropertyName][i + 1].fn.controlDestination ===
                        eventProperties[eventPropertyName][i].fn.controlDestination);
                  /* Если подписались на события из HOC'a, и одновременно подписались на контент хока, то прекращать
                   распространение не нужно.
                    Пример sync-tests/vdomEvents/hocContent/hocContent */
                  if (!needCallNext) {
                     stopPropagation = true;
                  }
               }
            } catch (e) {
               var pe;

               if (!fn.control) {
                  if (typeof window !== 'undefined') {
                     //console print, because IoC convert any to string
                     window['console'].error('Error calculating the logical parent for the function ', fn);
                  }

                  pe = new Error(eventObject.type + ' event handle error');
               } else {
                  pe = new Error(eventObject.type + ' event handle error in ' + fn.control._moduleName);
               }
               IoC.resolve('ILogger').error(curDomNode, pe, e);
            }
            res = eventObject.result;
            if (!controlNode || !controlNode.control._destroyed) {
               if (res && res.then) {
                  res.then(
                     (function (fn) {
                        return function (result) {
                           if (!eventObject.blockUpdate) {
                              fn.control._forceUpdate();
                           }
                           return result;
                        };
                     })(fn),
                     e => e
                  );
               } else {
                  if (!eventObject.blockUpdate) {
                     fn.control._forceUpdate();
                  }
               }
            }
            res = undefined;
         }
      }
      curDomNode = curDomNode.parentNode;
      if (curDomNode === null || curDomNode === undefined || !eventObject.propagating()) {
         stopPropagation = true;
      }
      if (eventPropertiesStartId !== 0) {
         eventPropertiesStartId = 0;
      }
   }
}

/**
 * Находит индекс обработчика в массиве eventProperties у controlNode.element, с которого надо начинать распространение
 * @param controlNode
 * @returns {number}
 */
function getEventPropertiesStartId(controlNode, eventName) {
   var
      eventProperties = controlNode.element.eventProperties,
      controlNodes = controlNode.element.controlNodes,
      handlerIdx = 0,
      nodeIdx = 0,
      eventPropertyName = 'on:' + eventName,
      beforeTarget = true, //true, пока не дошли до @controlNode в массиве controlNodes
      curEventPropertyControl;
   if (eventProperties && eventProperties[eventPropertyName]) {
      curEventPropertyControl = eventProperties[eventPropertyName][0].fn.control;
      while (beforeTarget && nodeIdx < controlNodes.length) {
         if (controlNodes[nodeIdx].control === curEventPropertyControl) {
            handlerIdx++;
            if (handlerIdx < eventProperties[eventPropertyName].length) {
               curEventPropertyControl = eventProperties[eventPropertyName][handlerIdx].fn.control;
            }
         }
         if (controlNodes[nodeIdx].control === controlNode.control) {
            beforeTarget = false;
         }
         nodeIdx++;
      }
   }
   return handlerIdx;
}

/**
 * Создается объект кастомного события с указанными в notify параметрами и вызывается функция его распространения
 * Возвращает результат выполнения последнего обработчика
 * @param controlNode
 * @param args
 */
proto.startEvent = function (controlNode, args) {
   var
      eventName = args[0].toLowerCase(),
      handlerArgs = args[1] || [],
      eventDescription = args[2],
      eventConfig: any = {},
      eventObject;
   eventConfig._bubbling =
      eventDescription && eventDescription.bubbling !== undefined ? eventDescription.bubbling : false;
   eventConfig.type = eventName;
   eventConfig.target = controlNode.element;
   if (!eventConfig.target) {
      if (
         !(controlNode.fullMarkup instanceof RawMarkupNode) &&
         !(controlNode.fullMarkup && controlNode.fullMarkup.type === 'invisible-node')
      ) {
         IoC.resolve('ILogger').error('Event ' + eventName + ' has emited before mounting to DOM');
      }
      return;
   }
   eventObject = new SyntheticEvent(null, eventConfig);
   vdomEventBubbling(eventObject, controlNode, getEventPropertiesStartId(controlNode, eventName), handlerArgs, false);
   return eventObject.result;
};

function needPropagateEvent(environment, event) {
   function needStopChangeEventForEdge(node) {
      return node.type === 'text' || node.type === 'password';
   }
   if (!environment._rootDOMNode) {
      return false;
   } else if (
      !(
         (event.currentTarget === window && event.type === 'scroll') ||
         (event.currentTarget === window && event.type === 'resize')
      ) &&
      event.eventPhase !== 1
   ) {
      /* У событий scroll и resize нет capture-фазы, поэтому учитываем их в условии проверки на фазу распространения события */
      return false;
   } else if (
      detection.isIE &&
      event.type === 'change' &&
      !event._dispatchedForIE &&
      needStopChangeEventForEdge(event.target)
   ) {
      // Из-за особенностей работы vdom в edge событие change у некоторых типов input'ов стреляет не всегда. Поэтому
      // для этих типов мы будем стрелять событием сами.
      // И чтобы обработчики событий не были вызваны два раза, стопаем нативное событие.
      return false;
   } else if (!isMyDOMEnvironment(environment, event)) {
      return false;
   }

   return true;
}

/*
 * Checks if event.target is a child of current DOMEnvironment
 * @param env
 * @param event
 */
function isMyDOMEnvironment(env, event) {
   var element = event.target;
   if (element === window || element === document) {
      return true;
   }
   while (element) {
      if (element === env._rootDOMNode) {
         return true;
      }
      if (element.controlNodes && element.controlNodes[0] && element.controlNodes[0].environment === env) {
         return true;
      } else if (element.controlNodes && element.controlNodes[0] && element.controlNodes[0].environment !== env) {
         return false;
      }
      if (element === document.body) {
         element = document.documentElement;
      } else if (element === document.documentElement) {
         element = document;
      } else {
         element = element.parentNode;
      }
   }
   return false;
}

/**
 * It's an entry point for propagating DOM-events
 * @param event - объект события
 */
function captureEventHandler(event) {
   if (needPropagateEvent(this, event)) {
      var synthEvent = new SyntheticEvent(event);
      vdomEventBubbling(synthEvent, null, 0, [], true);
   }
}

proto.addCaptureEventHandler = function (eventName, element) {
   var handlers = this._captureEventHandlers;

   //В ие в слое совместимости дикая асинхронность, что приводит к тому, что подписка начинает вызываться для компонентов,
   //которые уже удалены из ДОМА механизмами CompoundControl
   if (this._rootDOMNode.parentNode) {
      /**Спец события BODY
       * обрабатываются спец образом
       * приходится подписываться прямо на BODY*/
      if (
         element.tagName &&
         element.tagName.toLowerCase() === 'body' &&
         (eventName === 'scroll' || eventName === 'resize')
      ) {
         if (handlers[eventName + 'body'] === undefined) {
            handlers[eventName + 'body'] = {
               handler: captureEventHandler.bind(this),
               count: 1
            };
            window.addEventListener(eventName, handlers[eventName + 'body'].handler);
         } else {
            handlers[eventName + 'body'].count++;
         }
      } else {
         if (handlers[eventName] === undefined) {
            handlers[eventName] = {
               handler: captureEventHandler.bind(this),
               count: 1
            };
            var fixedName = EventExpression.fixUppercaseDOMEventName(eventName);
            this._rootDOMNode.parentNode.addEventListener(fixedName, handlers[eventName].handler, true);
         } else {
            handlers[eventName].count++;
         }
      }
   }
};

proto.addCaptureProcessingHandler = function addCaptureProcessingHandler(eventName, method) {
   var handlers = this._captureEventHandlers;
   if (handlers[eventName] === undefined) {
      //В ие в слое совместимости дикая асинхронность, что приводит к тому, что подписка начинает вызываться для компонентов,
      //которые уже удалены из ДОМА механизмами CompoundControl
      if (this._rootDOMNode.parentNode) {
         handlers[eventName] = {
            handler: function (e) {
               if (!isMyDOMEnvironment(this, e)) {
                  return;
               }
               method.apply(this, arguments);
            }.bind(this),
            count: 1
         };
         this._rootDOMNode.parentNode.addEventListener(eventName, handlers[eventName].handler, true);
      }
   } else {
      handlers[eventName].count++;
   }
};

proto.removeCaptureEventHandler = function (eventName, element) {
   var handlers = this._captureEventHandlers;
   if (
      element &&
      element.tagName &&
      element.tagName.toLowerCase() === 'body' &&
      (eventName === 'scroll' || eventName === 'resize')
   ) {
      handlers[eventName + 'body'].count--;
      if (handlers[eventName + 'body'] === 0) {
         window.removeEventListener(eventName, handlers[eventName + 'body'].handler);
      }
   } else {
      var eventObject = handlers[eventName];

      if (eventObject) {
         eventObject.count--;
         if (eventObject.count === 0) {
            if (this._rootDOMNode.parentNode) {
               // так случилось, что если закрываем окно с виртуальной кнопкой, связи успевают разорваться быстрее чем все задестроиться, и parentNode тут уже нет
               this._rootDOMNode.parentNode.removeEventListener(eventName, eventObject.handler, true);
            }
            delete handlers[eventName];
         }
      }
   }
};

/*
   DOMEnvironment можно уничтожить, если dom-элемент, за которым он закреплен, уже уничтожен,
   либо не осталось ни одного контрола, прикрепленного к корневому dom-элементу,
   либо уничтожается корневой контрол, закрепленный за этим окружением
*/
proto._canDestroy = function (destroyedControl) {
   return (
      !this._rootDOMNode ||
      !this._rootDOMNode.controlNodes ||
      !this._rootDOMNode.controlNodes.find(function (node) {
         return !node.parent && node.control !== destroyedControl;
      })
   );
};

DOMEnvironment._goUpByControlTree = goUpByControlTree;

export default DOMEnvironment;
