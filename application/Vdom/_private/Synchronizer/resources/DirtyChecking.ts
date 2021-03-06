/// <amd-module name="Vdom/_private/Synchronizer/resources/DirtyChecking" />

// @ts-ignore
import { constants as isJs } from 'Env/Env';
import { mapM, createWriterMonad } from '../../Utils/Monad';
import { composeWithResultApply } from '../../Utils/Functional';
import { Subscriber } from 'View/Executor/Expressions';
import * as VdomMarkup from './VdomMarkup';
import { Compatible, Vdom, Common, OptionsResolver } from 'View/Executor/Utils';
import { ContextResolver } from 'View/Executor/Expressions';
// @ts-ignore
import * as shallowClone from 'Core/helpers/Function/shallowClone';
import runDelayed from './runDelayedRebuild';
// @ts-ignore
import * as Serializer from 'Core/Serializer';
import * as Logger from 'View/Logger';
import * as _dcc from './DirtyCheckingCompatible';

var Slr = new Serializer();

var DirtyCheckingCompatible;
if (isJs.compat) {
   DirtyCheckingCompatible = _dcc;
}

function subscribeToEvent(node) {
   if (node.control && node.control._getInternalOption && node.control._getInternalOption('parent')) {
      var events = Subscriber.getEventsListFromOptions(node.options);
      Subscriber.applyEvents(node.control, node.control._getInternalOption('parent'), events);
   }
}

/**
 * Добавляет родителя во внутренние опции компонента, если он отсутствует
 * @param internalOptions
 * @param userOptions
 * @param parentNode
 */
function fixInternalParentOptions(internalOptions, userOptions, parentNode) {
   // У compound-контрола parent может уже лежать в user-опциях, берем его оттуда, если нет нашей parentNode
   internalOptions.parent = internalOptions.parent || (parentNode && parentNode.control) || userOptions.parent || null;
   internalOptions.logicParent =
      internalOptions.logicParent ||
      (parentNode && parentNode.control && parentNode.control.logicParent) ||
      userOptions.logicParent ||
      null;
}

export const DirtyKind = {
   NONE: 0,
   DIRTY: 1,
   CHILD_DIRTY: 2
};

function getModuleDefaultCtor(mod) {
   return typeof mod === 'function' ? mod : mod['constructor'];
}

function isObjectDate(obj) {
   return Object.prototype.toString.call(obj) === '[object Date]';
}

var
   ARR_EMPTY = [],
   INVALID_CONTEXT = {};

var RebuildResultMonoid = {
   plus: function (memo1, memo2) {
      return {
         createdNodes: memo1.createdNodes.concat(memo2.createdNodes),
         destroyedNodes: memo1.destroyedNodes.concat(memo2.destroyedNodes),
         updatedNodes: memo1.updatedNodes.concat(memo2.updatedNodes),
         createdTemplateNodes: memo1.createdTemplateNodes.concat(memo2.createdTemplateNodes),
         updatedTemplateNodes: memo1.updatedTemplateNodes.concat(memo2.updatedTemplateNodes),
         updatedChangedNodes: memo1.updatedChangedNodes.concat(memo2.updatedChangedNodes),
         updatedChangedTemplateNodes: memo1.updatedChangedTemplateNodes.concat(memo2.updatedChangedTemplateNodes),
         updatedUnchangedNodes: memo1.updatedUnchangedNodes.concat(memo2.updatedUnchangedNodes),
         selfDirtyNodes: memo1.selfDirtyNodes.concat(memo2.selfDirtyNodes)
      };
   },

   zero: {
      createdNodes: [],
      destroyedNodes: [],
      updatedNodes: [],
      createdTemplateNodes: [],
      updatedTemplateNodes: [],
      updatedUnchangedNodes: [],
      updatedChangedNodes: [],
      updatedChangedTemplateNodes: [],
      selfDirtyNodes: []
   }
};

export const RebuildResultWriter = createWriterMonad(RebuildResultMonoid);

function shallowMerge(dest, src) {
   var i;
   for (i in src) {
      if (src.hasOwnProperty(i)) {
         dest[i] = src[i];
      }
   }
   return dest;
}

function collectObjectVersions(collection) {
   var versions = {};
   for (var key in collection) {
      if (collection.hasOwnProperty(key)) {
         if (collection[key] && collection[key].getVersion) {
            versions[key] = collection[key].getVersion();
         } else if (collection[key] && collection[key].isDataArray) {
            
            //тут нужно собрать версии всех объектов,
            //которые используются внутри контентных опций
            //здесь учитывается кейс, когда внутри контентной опции
            //есть контентная опция
            //по итогу получаем плоский список всех версий всех объектов
            //внутри контентных опций
            for (var kfn = 0; kfn < collection[key].length; kfn++) {
               var innerVersions = collectObjectVersions(collection[key][kfn].internal || {});
               for(var innerKey in innerVersions) {
                  if (innerVersions.hasOwnProperty(innerKey)) {
                     versions[key + ';' + kfn + ';' + innerKey] = innerVersions[innerKey];
                  }
               }
            }
         }
      }
   }
   return versions;
}

function getInternalOptions(templateOptions) {
   return templateOptions && templateOptions.internal ? templateOptions.internal : {};
}

function checkIsVersionableObject(newOption, oldOptionsVersions) {
   return typeof newOption === 'object' && newOption && oldOptionsVersions && newOption.getVersion;
}

function getChangedOptions(newOptions, oldOptions, ignoreDirtyChecking?, oldOptionsVersions?, checkOldValue?, prefix?) {
   var
      i,
      def,
      changed = false,
      changedOptions = {},
      hasOld,
      hasNew;

   for (i in oldOptions) {
      /**
       * Игнорируем переменные dirtyChecking для compoundControl
       * Эти переменные могут появиться только когда внутри VDom контрола
       * есть CompoundControl внутри которого в контентных опциях
       * есть контролы
       */
      if (ignoreDirtyChecking && i && i.indexOf('__dirtyCheckingVars_') > -1) {
         continue;
      }
      //TODO Сделать проверку изменения для контекстов https://online.sbis.ru/opendoc.html?guid=bb9a707f-b8fe-4b26-b2b3-874e060548c8
      hasOld = oldOptions.hasOwnProperty(i) || (checkOldValue && oldOptions[i] !== undefined);
      if (hasOld) {
         hasNew = newOptions.hasOwnProperty(i) || newOptions[i] !== undefined;
         if (hasNew) {
            if (
               (typeof newOptions[i] === 'number' &&
                  typeof oldOptions[i] === 'number' &&
                  (isNaN(newOptions[i]) && isNaN(oldOptions[i])))
            ) {
               continue;
            }
            /**
             * All objects in control's options are compared only by reference
             * (and version if it is supported). CompoundControl monitors
             * changes inside objects and/or arrays by itself
             */
            if (newOptions[i] === oldOptions[i]) {
               if (checkIsVersionableObject(newOptions[i], oldOptionsVersions)) {
                  var newVersion = newOptions[i].getVersion();
                  var checkPrefix = prefix || '';
                  if (oldOptionsVersions[checkPrefix + i] !== newVersion) {
                     changed = true;
                     changedOptions[i] = newOptions[i];
                     oldOptionsVersions[checkPrefix + i] = newVersion;
                  } else if (Array.isArray(newOptions[i]) && newOptions[i]) {
                     if (!newOptions[i].isDataArray) {
                        changed = true;
                        changedOptions[i] = newOptions[i];
                     }
                  }
               }
            } else {
               if (Array.isArray(newOptions[i]) && newOptions[i]) {
                  if (!newOptions[i].isDataArray) {
                     changed = true;
                     changedOptions[i] = newOptions[i];
                  } else {
                     if (!oldOptions[i]) {
                        changed = true;
                        changedOptions[i] = newOptions[i];
                        continue;
                     }
                     for (var kfn = 0; kfn < newOptions[i].length; kfn++) {
                        var localPrefix = i + ';' + kfn + ';';
                        if (prefix) {
                           localPrefix = prefix + localPrefix;
                        }
                        var ch = getChangedOptions(getInternalOptions(newOptions[i][kfn]),
                                 getInternalOptions(oldOptions[i][kfn]), false,
                                 oldOptionsVersions, checkOldValue, localPrefix);

                        if (ch) {
                           changed = true;
                           changedOptions[i] = newOptions[i];
                           break;
                        }
                     }
                  }
               } else if (i.indexOf('__dirtyCheckingVars_') > -1 &&  typeof oldOptions[i] === 'object'
                  &&  typeof newOptions[i] === 'object' && newOptions[i] && oldOptions[i] &&
                   /* We don't need to check Date object internal properties */ !isObjectDate(newOptions[i])) {

                  //Object inside __dirtyChecking must be checked, it can be "scope=object" in subcontrol

                  if(newOptions[i] !== oldOptions[i]) {
                     changed = true;
                     changedOptions[i] = newOptions[i];
                     break;
                  } else {
                     var innerCh = getChangedOptions(
                         newOptions[i],
                         oldOptions[i],
                         true,
                         {},
                         true
                     );

                     if (innerCh) {
                        changed = true;
                        changedOptions[i] = newOptions[i];
                        break;
                     }
                  }
               } else {

                  /*Есть такой кейс, когда объекты всегда новые, но они равны
                  * поставим флажок в объект, который заставит нас смотреть только на версию*/
                  if (newOptions[i] && newOptions[i]._preferVersionAPI) {
                     let newVersion = newOptions[i].getVersion();
                     let secCheckPrefix = prefix || '';
                     if (oldOptionsVersions[secCheckPrefix + i] !== newVersion) {
                        changed = true;
                        changedOptions[i] = newOptions[i];
                        oldOptionsVersions[secCheckPrefix + i] = newVersion;
                        break;
                     }
                  } else if (newOptions[i] && newOptions[i]._isDeepChecking && oldOptions[i] && oldOptions[i]._isDeepChecking) {
                     let innerCh = getChangedOptions(
                        newOptions[i],
                        oldOptions[i],
                        true,
                        {},
                        true
                     );
                     if (innerCh) {
                        changed = true;
                        changedOptions[i] = newOptions[i];
                        break;
                     }
                  } else {
                     if (newOptions[i] && newOptions[i]._ignoreChanging) {
                        continue;
                     }
                     changed = true;
                     changedOptions[i] = newOptions[i];
                     if (checkIsVersionableObject(newOptions[i], oldOptionsVersions)) {
                        oldOptionsVersions[ (prefix || '') + i] = newOptions[i].getVersion();
                     }
                  }
               }
            }
         }
      }
   }
   return changed ? changedOptions : null;
}

function flatten(arr) {
   arr = arr || [];
   return arr.reduce(function (flat, newChunk) {
      return flat.concat(Array.isArray(newChunk) ? flatten(newChunk) : newChunk);
   }, []);
}

function getControlNodeParams(control, controlClass, environment) {
   var composedDecorator = composeWithResultApply.call(undefined, [environment.getMarkupNodeDecorator()]).bind(control);
   return {
      markupDecorator: composedDecorator,
      defaultOptions: {} //нет больше понятия опция по умолчанию
   };
}

function getMarkupForTemplatedNode(vnode, controlNodes, environment) {
   var result = vnode.parentControl
      ? vnode.template.call(vnode.parentControl, vnode.controlProperties, vnode.attributes, vnode.context, true)
      : vnode.template(vnode.controlProperties, vnode.attributes, vnode.context, true);

   var
      resultsFromTemplate = [],
      k;
   if (!Array.isArray(result)) {
      result = [result];
   }

   for (k = 0; k < result.length; k++) {
      /*return controlNodes "as is" without inner full markup
        it must be controlNode for dirty cheking
        */
      var markup = VdomMarkup.getFullMarkup(controlNodes, result[k], true);
      resultsFromTemplate = resultsFromTemplate.concat(Array.isArray(markup) ? markup : [markup]);
   }
   for (k = 0; k < resultsFromTemplate.length; k++) {
      resultsFromTemplate[k] = VdomMarkup.mapVNode(
         environment.getMarkupNodeDecorator(),
         controlNodes,
         resultsFromTemplate[k]
      );
   }
   result = resultsFromTemplate;

   return result;
}

export function createNode(controlClass_, options, key, environment, parentNode, serialized, vnode?) {
   var
      controlCnstr = getModuleDefaultCtor(controlClass_), // получаем конструктор из модуля
      compound = vnode && vnode.compound,
      serializedState = (serialized && serialized.state) || { vdomCORE: true }, // сериализованное состояние компонента
      userOptions = options.user, // прикладные опции
      internalOptions = options.internal || {}, // служебные опции
      result;

   fixInternalParentOptions(internalOptions, userOptions, parentNode);

   if (!key) {
      /*У каждой ноды должен быть ключ
       * for строит внутренние ноды относительно этого ключа
       * */
      key = '_';
   }

   if (compound) {
      // Создаем виртуальную ноду для compound контрола
      if (!DirtyCheckingCompatible) {
         // @ts-ignore
         DirtyCheckingCompatible = _dcc;
      }
      result = DirtyCheckingCompatible.createCompoundControlNode(
         controlClass_,
         controlCnstr,
         userOptions,
         internalOptions,
         key,
         parentNode,
         vnode
      );
   } else {
      // Создаем виртуальную ноду для не-compound контрола
      var
         invisible = vnode && vnode.invisible,
         // подмешиваем сериализованное состояние к прикладным опциям
         optionsWithState = serializedState ? shallowMerge(userOptions, serializedState) : userOptions,
         optionsVersions,
         contextVersions,
         control,
         params,
         context,
         instCompat,
         defaultOptions;

      if (typeof controlClass_ === 'function') {
         // создаем инстанс компонента
         instCompat = Compatible.createInstanceCompatible(controlCnstr, optionsWithState, internalOptions);
         control = instCompat.instance;
         optionsWithState = instCompat.resolvedOptions;
         defaultOptions = instCompat.defaultOptions;
      } else {
         // инстанс уже есть, работаем с его опциями
         control = controlClass_;
         defaultOptions = OptionsResolver.getDefaultOptions(controlClass_);
         if (isJs.compat) {
            optionsWithState = Compatible.combineOptionsIfCompatible(
               controlCnstr.prototype,
               optionsWithState,
               internalOptions
            );
            if (control._setInternalOptions) {
               control._options.doNotSetParent = true;
               control._setInternalOptions(internalOptions || {});
            }
         }
      }

      // check current options versions
      optionsVersions = collectObjectVersions(optionsWithState);
      // check current context field versions
      context = (vnode && vnode.context) || {};
      contextVersions = collectObjectVersions(context);

      params = getControlNodeParams(control, controlCnstr, environment);

      result = {
         attributes: options.attributes,
         events: options.events,
         control: control,
         errors: serialized && serialized.errors,
         controlClass: controlCnstr,
         options: optionsWithState,
         internalOptions: internalOptions,
         optionsVersions: optionsVersions,
         id: control._instId || 0,
         parent: parentNode,
         key: key,
         defaultOptions: defaultOptions,
         markup: invisible ? Vdom.textNode('') : undefined,
         fullMarkup: undefined,
         childrenNodes: ARR_EMPTY,
         markupDecorator: params && params.markupDecorator,
         serializedChildren: serialized && serialized.childrenNodes,
         hasCompound: false,
         receivedState: undefined,
         invisible: invisible,

         contextVersions: contextVersions,
         context: (vnode && vnode.context) || {},
         inheritOptions: (vnode && vnode.inheritOptions) || {}
      };

      environment.setupControlNode(result);
   }

   return result;
}

function copyNode(controlNode) {
   return shallowClone(controlNode);
}

function rebuildNodeWriter(environment, dirties, node, force, isRoot?) {
   if (node.receivedState && node.receivedState.then) {
      return node.receivedState.then(
         function rebuildNodeWriterCbk(state) {
            node.receivedState = state;
            return rebuildNode(environment, dirties, node, force, isRoot);
         },
         function (err) {
            Common.asyncRenderErrorLog(err);
            /*_beforeMount can return errback
             * send error and create control
             */
            node.receivedState = null;
            return rebuildNode(environment, dirties, node, force, isRoot);
         }
      );
   } else {
      return rebuildNode(environment, dirties, node, force, isRoot);
   }
}

export function destroyReqursive(childControlNode, environment) {
   // Разобраться в 3.19.110, можно ли безопасно удалить после доработок
   // https://online.sbis.ru/opendoc.html?guid=92557b8d-cd03-4ba6-b631-446d68394490
   if (!childControlNode) {
      return;
   }

   try {
      environment.setRebuildIgnoreId(childControlNode.id);
      if (childControlNode.compound) {
         var
            oldOptions = childControlNode.options,
            instanceCtr = oldOptions.__vdomOptions && oldOptions.__vdomOptions.controlNode.instance;

         /**
          * CompoundControl может быть разрушен в любой момент времени
          * при этом он удалится из списка детей
          * Просто не разрушаем если его уже нет
          */
         if (instanceCtr) {
            runDelayed(function () {
               instanceCtr.destroy();
            });
         }
      } else {
         for (var i = 0; i < childControlNode.childrenNodes.length; i++) {
            destroyReqursive(childControlNode.childrenNodes[i], environment);
         }

         // Пометим контрол, как разрушаемый из DirtyChecking
         // слой совместимости попытается удалить контрол из дома,
         // этого не должно произойти, иначе синхронизатор упадет
         childControlNode.control.__$destroyFromDirtyChecking = true;
         childControlNode.control.destroy();
         delete childControlNode.controlProperties;
         delete childControlNode.oldOptions;
         delete childControlNode.element;
         delete childControlNode.fullMarkup;
         delete childControlNode.markup;
         if (
            childControlNode.control._logicParent &&
            childControlNode.control._logicParent._template &&
            childControlNode.control._options.name
         ) {
            delete childControlNode.control._logicParent._children[childControlNode.control._options.name];
         }
      }
   } finally {
      environment.setRebuildIgnoreId(childControlNode.id);
   }
}

function setChangedForNode(node) {
   if (node.fullMarkup) {
      node.fullMarkup.changed = true;
   }
   if (node.parent && node.parent.fullMarkup && !node.parent.fullMarkup.changed) {
      setChangedForNode(node.parent);
   }
}

function addTemplateChildrenRecursive(node, result) {
   if (node.children) {
      for (var i = 0; i < node.children.length; i++) {
         if (Vdom.isControlVNodeType(node.children[i])) {
            result.push(node.children[i]);
         } else if (Vdom.isTemplateVNodeType(node.children[i]) || Vdom.isVNodeType(node.children[i])) {
            addTemplateChildrenRecursive(node.children[i], result);
         }
      }
   }
}

export function rebuildNode(environment, dirties, node, force, isRoot) {
   var
      id = node.id,
      def,
      dirty = dirties[id] || DirtyKind.NONE,
      isDirty = dirty !== DirtyKind.NONE || force,
      isSelfDirty = !!(dirty & DirtyKind.DIRTY) || force,
      oldMarkup = node.markup,
      shouldUpdate,
      needRenderMarkup = false,
      newNode,
      parentNode,
      diff,
      createdNodes,
      createdTemplateNodes,
      updatedNodes,
      updatedTemplateNodes,
      updatedUnchangedNodes,
      updatedChangedNodes,
      updatedChangedTemplateNodes = [],
      selfDirtyNodes,
      destroyedNodes,
      destroyedTemplateNodes,
      result,
      childrenRebuild,
      childrenNodes,
      createdStartIdx,
      changedNodes,
      changedTemplateNodes,
      parentNodeContext,
      resolvedContext;

   if (isDirty) {
      newNode = node;
      parentNodeContext = node.context;
      resolvedContext = ContextResolver.resolveContext(newNode.controlClass, parentNodeContext, newNode.control);
      if (!newNode.compound) {
         /**
          *
          Вызываем _beforeUpdate и _shouldUpdate для корневой контрол ноды.
          */
         if (isSelfDirty && newNode.control._mounted && !force) {
            try {
               // Forbid force update in the time between _beforeUpdate and _afterUpdate
               //newNode.control._canForceUpdate = false;
               newNode.control.__beforeUpdate(newNode.options, resolvedContext);
            } catch (error) {
               Logger.catchLifeCircleErrors('_beforeUpdate', error);
            }
            try {
               shouldUpdate = newNode.control._shouldUpdate(newNode.options, resolvedContext);
            } catch (error) {
               Logger.catchLifeCircleErrors('_shouldUpdate', error);
            }
            isSelfDirty = isSelfDirty && shouldUpdate;
         }

         if (isSelfDirty) {
            Logger.log('DirtyChecking', ['requestRebuild ' + id, newNode.control, newNode]);
            parentNode = newNode;

            newNode.control.saveFullContext(ContextResolver.wrapContext(newNode.control, newNode.context || {}));
            if (!newNode.inheritOptions) {
               newNode.inheritOptions = {};
            }
            OptionsResolver.resolveInheritOptions(newNode.controlClass, newNode, newNode.options);
            newNode.control.saveInheritOptions(newNode.inheritOptions);

            newNode.markup = VdomMarkup.getDecoratedMarkup(newNode, isRoot);

            diff = VdomMarkup.getMarkupDiff(oldMarkup, newNode.markup);
            Logger.log('DirtyChecking (diff)', ['', '', diff]);

            if (diff.destroy.length || diff.vnodeChanged) {
               setChangedForNode(newNode);
               needRenderMarkup = true;
            }

            while (diff.createTemplates.length > 0 || diff.updateTemplates.length > 0) {
               var diffTmpl = {
                  create: [],
                  createTemplates: [],
                  destroy: [],
                  destroyTemplates: [],
                  update: [],
                  updateTemplates: []
               };

               createdTemplateNodes = diff.createTemplates.map(function rebuildCreateTemplateNodes(vnode) {
                  Logger.log('DirtyChecking (create template)', ['', '', vnode]);
                  vnode.optionsVersions = collectObjectVersions(vnode.controlProperties);
                  // check current context field versions
                  vnode.contextVersions = collectObjectVersions(vnode.context);

                  vnode.children = getMarkupForTemplatedNode(vnode, newNode, environment);
                  for (var i = 0; i < vnode.children.length; i++) {
                     var diffTmplOneNode = VdomMarkup.getMarkupDiff(null, vnode.children[i]);
                     diffTmpl.create = diffTmpl.create.concat(diffTmplOneNode.create);
                     diffTmpl.createTemplates = diffTmpl.createTemplates.concat(diffTmplOneNode.createTemplates);
                     diffTmpl.update = diffTmpl.update.concat(diffTmplOneNode.update);
                     diffTmpl.updateTemplates = diffTmpl.updateTemplates.concat(diffTmplOneNode.updateTemplates);
                  }
                  return vnode;
               });

               diff.createTemplates = diffTmpl.createTemplates;
               diff.updateTemplates = diff.updateTemplates.concat(diffTmpl.updateTemplates);

               diffTmpl.createTemplates = [];
               diffTmpl.updateTemplates = [];

               updatedTemplateNodes = diff.updateTemplates.map(function rebuildUpdateTemplateNodes(diffPair) {
                  Logger.log('DirtyChecking (update template)', ['', '', diffPair]);

                  var
                     newTemplateNode = diffPair.newNode,
                     oldTemplateNode = diffPair.oldNode,
                     oldOptions = oldTemplateNode.controlProperties,
                     newOptions = newTemplateNode.controlProperties,
                     changedOptions = getChangedOptions(newOptions, oldOptions, false, oldTemplateNode.optionsVersions),
                     oldAttrs = oldTemplateNode.attributes.attributes,
                     newAttrs = newTemplateNode.attributes.attributes,
                     changedAttrs = getChangedOptions(newAttrs, oldAttrs, false, {}),
                     changedTemplate = oldTemplateNode.template !== newTemplateNode.template,
                     diffTmplOneNode, i;

                  if (changedOptions || changedAttrs || changedTemplate) {
                     Logger.log('DirtyChecking (update template with changed options)', ['', '', changedOptions]);

                     /* newTemplateNode === oldTemplateNode but they children have changed */
                     var oldchildren = oldTemplateNode.children;
                     newTemplateNode.children = getMarkupForTemplatedNode(newTemplateNode, newNode, environment);
                     var max =
                        newTemplateNode.children.length > oldchildren.length
                           ? newTemplateNode.children.length
                           : oldchildren.length;
                     for (i = 0; i < max; i++) {
                        var
                           oldChild = oldchildren[i],
                           newChild = newTemplateNode.children[i];
                        if (newChild) {
                           diffTmplOneNode = VdomMarkup.getMarkupDiff(oldChild, newChild, true);
                           diffTmpl.create = diffTmpl.create.concat(diffTmplOneNode.create);
                           diffTmpl.createTemplates = diffTmpl.createTemplates.concat(diffTmplOneNode.createTemplates);
                           diffTmpl.update = diffTmpl.update.concat(diffTmplOneNode.update);
                           diffTmpl.updateTemplates = diffTmpl.updateTemplates.concat(diffTmplOneNode.updateTemplates);
                           diffTmpl.destroy = diffTmpl.destroy.concat(diffTmplOneNode.destroy);
                        } else if (oldChild) {
                           // В этой ветке находим ноды, которые были задестроены, чтобы вызвать _beforeUnmount у контролов
                           if (Vdom.isControlVNodeType(oldChild)) {
                              diffTmpl.destroy.push(oldChild);
                           } else if (Vdom.isTemplateVNodeType(oldChild) || Vdom.isVNodeType(oldChild)) {
                              addTemplateChildrenRecursive(oldChild, diffTmpl.destroy);
                           }
                        }
                     }
                  } else {
                     newTemplateNode.children = oldTemplateNode.children;
                     for (i = 0; i < newTemplateNode.children.length; i++) {
                        /*template can contains controlNodes and we try find all of them
                         * all controlNodes must be in array "childrenNodes"
                         */
                        diffTmplOneNode = VdomMarkup.getMarkupDiff(
                           oldTemplateNode.children[i],
                           newTemplateNode.children[i],
                           true
                        );
                        diffTmpl.create = diffTmpl.create.concat(diffTmplOneNode.create);
                        diffTmpl.createTemplates = diffTmpl.createTemplates.concat(diffTmplOneNode.createTemplates);
                        diffTmpl.update = diffTmpl.update.concat(diffTmplOneNode.update);
                        diffTmpl.updateTemplates = diffTmpl.updateTemplates.concat(diffTmplOneNode.updateTemplates);
                        diffTmpl.destroy = diffTmpl.destroy.concat(diffTmplOneNode.destroy);
                     }
                  }
                  newTemplateNode.optionsVersions = oldTemplateNode.optionsVersions;
                  return newTemplateNode;
               });

               diff.updateTemplates = diffTmpl.updateTemplates;
               diff.create = diff.create.concat(diffTmpl.create);
               diff.destroy = diff.destroy.concat(diffTmpl.destroy);
               diff.update = diff.update.concat(diffTmpl.update);
               diff.createTemplates = diff.createTemplates.concat(diffTmpl.createTemplates);
            }

            destroyedNodes = diff.destroy.map(function rebuildDestroyNodes(vnode) {
               var
                  controlNodeIdx = vnode.controlNodeIdx,
                  childControlNode = parentNode.childrenNodes[controlNodeIdx];
               destroyReqursive(childControlNode, environment);
               return childControlNode;
            });

            changedNodes = new Array(diff.create.length + diff.update.length);
            changedTemplateNodes = new Array(diff.createTemplates.length + diff.updateTemplates.length);

            createdStartIdx = diff.update.length;

            createdTemplateNodes = [];
            updatedTemplateNodes = [];

            createdNodes = diff.create.map(function rebuildCreateNodes(vnode, idx) {
               var
                  nodeIdx = createdStartIdx + idx,
                  serializedChildren = parentNode.serializedChildren,
                  serialized = serializedChildren && serializedChildren[nodeIdx],
                  options,
                  carrier,
                  controlNode;
               Logger.log('DirtyChecking (create node)', ['', '', idx, vnode]);

               needRenderMarkup = true;
               if (!vnode.compound) {
                  options = vnode.controlProperties;
                  controlNode = createNode(
                     vnode.controlClass,
                     {
                        user: options,
                        internal: vnode.controlInternalProperties,
                        attributes: vnode.controlAttributes,
                        events: vnode.controlEvents
                     },
                     vnode.key,
                     environment,
                     parentNode,
                     serialized,
                     vnode
                  );
                  if (!controlNode.control._mounted && !controlNode.control._unmounted) {
                     carrier = Vdom.getReceivedState(controlNode, vnode, Slr);
                     if (carrier) {
                        controlNode.receivedState = carrier;
                     }
                     if (controlNode.control.saveOptions) {
                        controlNode.control.saveOptions(controlNode.options, controlNode);
                     } else {
                        /**
                         * Поддержка для совместимости версий контролов
                         */
                        controlNode.control._options = controlNode.options;
                        controlNode.control._container = controlNode.element;
                        controlNode.control._setInternalOptions(vnode.controlInternalProperties || {});

                        if (isJs.compat) {
                           // @ts-ignore
                           controlNode.control._container = $(controlNode.element);
                        }
                     }
                  }

                  // Only subscribe to event: from options if the environment is compatible AND control
                  // has compatible behavior mixed into it
                  if (isJs.compat && (!controlNode.control.hasCompatible || controlNode.control.hasCompatible())) {
                     subscribeToEvent(controlNode); //TODO Кусок слоя совместимости https://online.sbis.ru/opendoc.html?guid=95e5b595-f9ea-45a2-9a4d-97a714d384af
                  }
               } else {
                  controlNode = createNode(
                     vnode.controlClass,
                     {
                        user: shallowMerge(vnode.controlProperties, vnode.controlInternalProperties),
                        attributes: vnode.controlAttributes,
                        events: vnode.controlEvents
                     },
                     vnode.key,
                     environment,
                     parentNode,
                     serialized,
                     vnode
                  );
               }
               vnode.controlNodeIdx = nodeIdx;
               changedNodes[vnode.controlNodeIdx] = true;
               return controlNode;
            });

            updatedNodes = diff.update.map(function rebuildUpdateNodes(diffPair, idx) {
               Logger.log('DirtyChecking (update node)', ['', '', diffPair]);
               var
                  newVNode = diffPair.newNode,
                  controlNodeIdx = diffPair.oldNode.controlNodeIdx,
                  childControlNode = parentNode.childrenNodes[controlNodeIdx],
                  childControl = childControlNode.control,
                  shouldUpdate = true,
                  newOptions = newVNode.compound
                     ? Compatible.createCombinedOptions(
                        newVNode.controlProperties,
                        newVNode.controlInternalProperties
                     )
                     : newVNode.controlProperties,
                  oldOptions = childControlNode.options,
                  oldOptionsVersions = childControlNode.optionsVersions,
                  newChildNodeContext = newVNode.context || {},
                  oldChildNodeContext = childControlNode.context,
                  oldContextVersions = childControlNode.contextVersions,
                  changedOptions = getChangedOptions(newOptions, oldOptions, newVNode.compound, oldOptionsVersions),
                  changedContext = getChangedOptions(
                     newChildNodeContext,
                     oldChildNodeContext,
                     false,
                     oldContextVersions
                  ),
                  changedContextProto = changedContext
                     ? changedContext
                     : getChangedOptions(newChildNodeContext, oldChildNodeContext, false, oldContextVersions, true),
                  oldAttrs = childControlNode.controlAttributes || childControlNode.attributes,
                  changedAttrs = getChangedOptions(newVNode.controlAttributes, oldAttrs, newVNode.compound),
                  changedInternalOptions;
               if (newVNode.compound) {
                  newOptions.__vdomOptions = oldOptions.__vdomOptions;
                  if (changedOptions) {
                     /**
                      * Сложнейшая логика синхронизации CompoundControls
                      * Суть в том, что разные контролы при получении нового значения опции
                      * реагируют по разному.
                      * Отсюда получается, что мы устанавливаем в контрол одни данные, а по факту
                      * устанавливаются другие и в том месте, куда мы что-то присвоили уже лежит не то, что мы туда присваивали
                      * Поэтому здесь двойная проверка, которая не позволяет синхронно установить
                      * какие-либо данные в контрол дважды.
                      */
                     var instanceCtr = oldOptions.__vdomOptions && oldOptions.__vdomOptions.controlNode.instance;
                     if (instanceCtr && !instanceCtr.__$$blockSetProperties) {
                        // CompoundControld could have changed its options by itself, so we have to check which options
                        // really have to be updated
                        var realCh = getChangedOptions(newOptions, instanceCtr._options || {}, newVNode.compound);
                        if (realCh) {
                           instanceCtr.__$$blockSetProperties = true;

                           // Remove all options that were updated by CompoundControl already from changedOptions
                           changedOptions = DirtyCheckingCompatible.clearNotChangedOptions(changedOptions, realCh);
                           instanceCtr.setProperties(changedOptions);

                           runDelayed(function () {
                              instanceCtr.__$$blockSetProperties = false;
                           });
                        }
                     }
                  }
                  childControlNode.options = newOptions;
               } else {
                  // для не-compound контролов делаем проверку изменения служебных опций
                  changedInternalOptions = getChangedOptions(
                     newVNode.controlInternalProperties,
                     childControlNode.internalOptions
                  );
                  //Атрибуты тоже учавствуют в DirtyChecking
                  if (changedOptions || changedInternalOptions || changedAttrs || changedContext) {
                     try {
                        var resolvedContext;

                        Logger.log('DirtyChecking (update node with changed)', [
                           '',
                           '',
                           changedOptions || changedInternalOptions || changedAttrs || changedContext
                        ]);
                        environment.setRebuildIgnoreId(childControlNode.id);

                        OptionsResolver.resolveInheritOptions(
                           childControlNode.controlClass,
                           childControlNode,
                           newOptions
                        );
                        childControl.saveInheritOptions(childControlNode.inheritOptions);

                        resolvedContext = ContextResolver.resolveContext(
                           childControlNode.controlClass,
                           newChildNodeContext,
                           childControlNode.control
                        );

                        OptionsResolver.resolveOptions(childControlNode.controlClass,
                            childControlNode.defaultOptions,
                            newOptions,
                            childControlNode.parent.control._moduleName);

                        // Forbid force update in the time between _beforeUpdate and _afterUpdate
                        childControl._beforeUpdate && childControl.__beforeUpdate(newOptions, resolvedContext);
                        childControl._options = newOptions;
                        shouldUpdate =
                           (childControl._shouldUpdate
                              ? childControl._shouldUpdate(newOptions, resolvedContext)
                              : true) || changedInternalOptions;

                        childControl._setInternalOptions(changedInternalOptions || {});

                        childControlNode.oldOptions = oldOptions; //TODO Для afterUpdate подумать, как еще можно передать
                        childControlNode.oldContext = oldChildNodeContext; //TODO Для afterUpdate подумать, как еще можно передать
                        childControlNode.attributes = newVNode.controlAttributes;
                        childControlNode.events = newVNode.controlEvents;

                        childControl._saveContextObject(resolvedContext);
                        childControl.saveFullContext(ContextResolver.wrapContext(childControl, childControl._context));
                     } finally {
                        /**
                         * TODO: удалить после синхронизации с контролами
                         */
                        var shouldUp = childControl._shouldUpdate
                           ? childControl._shouldUpdate(newOptions, newChildNodeContext) || changedInternalOptions
                           : true;
                        childControl._setInternalOptions(changedInternalOptions || {});

                        if (shouldUp) {
                           environment.setRebuildIgnoreId(null);
                        }

                        childControlNode.options = newOptions;
                        childControlNode.context = newChildNodeContext;
                        if (!newVNode.compound) {
                           childControlNode.internalOptions = newVNode.controlInternalProperties;
                        }
                     }
                  } else if (changedContextProto) {
                     var childCN = childControlNode.childrenNodes;
                     for (var i = 0; i < childCN.length; i++) {
                        dirties[childCN[i].id] |= DirtyKind.CHILD_DIRTY;
                     }
                  }
               }
               changedNodes[idx] =
                  (!!changedOptions || !!changedInternalOptions || !!changedContext || !!changedAttrs) && shouldUpdate;
               newVNode.controlNodeIdx = idx;
               // In case of empty diff, events property has to be updated, because of the closure
               childControlNode.events = newVNode.controlEvents;
               return childControlNode;
            });

            childrenNodes = updatedNodes.concat(createdNodes);

            updatedUnchangedNodes = ARR_EMPTY;
            updatedChangedNodes = ARR_EMPTY;
            selfDirtyNodes = ARR_EMPTY;

            updatedNodes.forEach(function (node, idx) {
               if (changedNodes[idx]) {
                  if (updatedChangedNodes === ARR_EMPTY) {
                     updatedChangedNodes = [];
                  }
                  updatedChangedNodes.push(node);
               } else {
                  if (updatedUnchangedNodes === ARR_EMPTY) {
                     updatedUnchangedNodes = [];
                  }
                  updatedUnchangedNodes.push(node);
               }
            });

            if (updatedChangedNodes.length || createdNodes.length) {
               setChangedForNode(newNode);
               needRenderMarkup = true;
            }

            // храним еще незаапдейченные ноды, которые сами были грязными
            if (childrenNodes.indexOf(newNode) === -1) {
               if (selfDirtyNodes === ARR_EMPTY) {
                  selfDirtyNodes = [];
               }
               selfDirtyNodes.push(newNode);
            }
         } else {
            childrenNodes = node.childrenNodes;

            createdNodes = ARR_EMPTY;
            createdTemplateNodes = ARR_EMPTY;
            updatedNodes = ARR_EMPTY;
            updatedUnchangedNodes = ARR_EMPTY;
            updatedChangedNodes = ARR_EMPTY;
            updatedChangedTemplateNodes = ARR_EMPTY;
            destroyedNodes = ARR_EMPTY;
            selfDirtyNodes = ARR_EMPTY;
         }
      } else {
         childrenNodes = node.childrenNodes;
         createdNodes = ARR_EMPTY;
         createdTemplateNodes = ARR_EMPTY;
         updatedNodes = ARR_EMPTY;
         updatedUnchangedNodes = ARR_EMPTY;
         updatedChangedNodes = ARR_EMPTY;
         updatedChangedTemplateNodes = ARR_EMPTY;
         destroyedNodes = ARR_EMPTY;
         selfDirtyNodes = ARR_EMPTY;
         if (newNode.compound) {
            // Слой совместимости
            //Нужно установить hasCompound только тогда когда нода действительно со
            //старым контролом. В эту точку также попадаем и при создании контролллера
            //компонента без шаблона
            newNode.parent.hasCompound = true;
         }
      }

      childrenRebuild = mapM(
         childrenNodes,
         function (node, idx) {
            if (changedNodes && changedNodes[idx]) {
               setChangedForNode(node);
            }
            return rebuildNodeWriter(environment, dirties, node, changedNodes && changedNodes[idx]);
         },
         RebuildResultWriter
      );

      if (childrenRebuild.then) {
         return childrenRebuild.then(
            function (childrenRebuild) {
               newNode.childrenNodes = childrenRebuild.value;

               if (needRenderMarkup || !newNode.fullMarkup || newNode.fullMarkup.changed || isSelfDirty) {
                  var wasChanged = newNode.fullMarkup && newNode.fullMarkup.changed;
                  newNode.fullMarkup = environment.decorateFullMarkup(
                     VdomMarkup.getFullMarkup(
                        newNode.childrenNodes,
                        newNode.markup,
                        undefined,
                        needRenderMarkup || isSelfDirty ? undefined : newNode.fullMarkup
                     ),
                     newNode
                  );
                  newNode.fullMarkup.changed =
                     wasChanged || newNode.fullMarkup.changed || (needRenderMarkup || isSelfDirty);
                  if (newNode.fullMarkup.changed) {
                     setChangedForNode(newNode);
                  }
               }

               return {
                  value: newNode,
                  memo: RebuildResultMonoid.plus(childrenRebuild.memo, {
                     createdNodes: createdNodes,
                     updatedNodes: updatedNodes,
                     destroyedNodes: destroyedNodes,
                     updatedChangedNodes: updatedChangedNodes,
                     updatedChangedTemplateNodes: updatedChangedTemplateNodes,
                     updatedUnchangedNodes: updatedUnchangedNodes,
                     selfDirtyNodes: selfDirtyNodes,
                     createdTemplateNodes: createdTemplateNodes,
                     updatedTemplateNodes: updatedTemplateNodes,
                     destroyedTemplateNodes: destroyedTemplateNodes
                  })
               };
            },
            function (err) {
               Common.asyncRenderErrorLog(err);
               return err;
            }
         );
      } else {
         newNode.childrenNodes = childrenRebuild.value;
         if (needRenderMarkup || !newNode.fullMarkup || newNode.fullMarkup.changed || isSelfDirty) {
            var wasChanged = newNode.fullMarkup && newNode.fullMarkup.changed;
            newNode.fullMarkup = environment.decorateFullMarkup(
               VdomMarkup.getFullMarkup(
                  newNode.childrenNodes,
                  newNode.markup,
                  undefined,
                  needRenderMarkup || isSelfDirty ? undefined : newNode.fullMarkup
               ),
               newNode
            );
            newNode.fullMarkup.changed = wasChanged || newNode.fullMarkup.changed || (needRenderMarkup || isSelfDirty);
            if (newNode.fullMarkup.changed) {
               setChangedForNode(newNode);
            }
         }

         result = {
            value: newNode,
            memo: RebuildResultMonoid.plus(childrenRebuild.memo, {
               createdNodes: createdNodes,
               updatedNodes: updatedNodes,
               destroyedNodes: destroyedNodes,
               updatedChangedNodes: updatedChangedNodes,
               updatedChangedTemplateNodes: updatedChangedTemplateNodes,
               updatedUnchangedNodes: updatedUnchangedNodes,
               selfDirtyNodes: selfDirtyNodes,
               createdTemplateNodes: createdTemplateNodes,
               updatedTemplateNodes: updatedTemplateNodes,
               destroyedTemplateNodes: destroyedTemplateNodes
            })
         };
      }
   } else {
      result = {
         value: node,
         memo: RebuildResultMonoid.zero
      };
   }

   return result;
}
