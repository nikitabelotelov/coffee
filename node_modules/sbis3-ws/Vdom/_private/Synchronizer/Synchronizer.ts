/// <amd-module name="Vdom/_private/Synchronizer/Synchronizer" />

import * as _Debug from './resources/Debug';
import * as Monad from '../Utils/Monad';
import { DirtyKind, rebuildNode, createNode, RebuildResultWriter, destroyReqursive } from './resources/DirtyChecking';
import DOMEnvironment from './resources/DOMEnvironment';
import runDelayed from './resources/runDelayedRebuild';
// @ts-ignore
import * as isEmptyObject from 'Core/helpers/Object/isEmpty';
// @ts-ignore
import * as uniqueArray from 'Core/helpers/Array/uniq';
// @ts-ignore
import * as Serializer from 'Core/Serializer';
import { Common, Vdom } from 'View/Executor/Utils';
import * as Logger from 'View/Logger';

var Debug;

var
   // A number of rebuild iterations we can run, before we assume that
   // it's stuck in an infinite loop
   MAX_REBUILD = 50,
   // A number of rebuild iterations to run with view logs enabled if it is
   // stuck in an infinite loop, before throwing an error. We should do
   // multiple iterations to see if the components rebuild are different
   // each time or the same
   MAX_REBUILD_LOGGED_ITERS = 2,
   isDebug = false;

if (isDebug) {
   Debug = _Debug;
}
function forEachNodeParents(node, fn) {
   var parent = node.parent;
   while (parent) {
      fn(parent);
      parent = parent.parent;
   }
}

function filterNewRoots(rootNodes, newRootNodes) {
   return rootNodes.map(function (node) {
      var filtered = newRootNodes.filter(function (filteredNode) {
         return node.id === filteredNode.id;
      });
      if (filtered.length) {
         return filtered[0];
      }
      return node;
   });
}

function checkIsControlNodesParentDestroyed(controlNode) {
   return (
      controlNode.control &&
      controlNode.control._parent &&
      controlNode.control._parent.isDestroyed &&
      controlNode.control._parent.isDestroyed()
   );
}

function loadControlClassIfString(controlClass) {
   if (Object.prototype.toString.call(controlClass) === '[object String]') {
      // @ts-ignore
      return require(controlClass);
   }
   return controlClass;
}

/**
 * Функция для сбора массива созданных/измененных контрол-нод
 * @param arr
 */
function mapIds(arr) {
   return arr.map(function reduceIdsReduce(controlNode) {
      return controlNode.id;
   });
}

var
   mountedProcess,
   _rootNodes = [],
   _environments = [],
   _dirties = {};

const VDomSynchronizer = {
   _controlNodes: {},
   _rebuild: function () {
      function doRebuild(timeMeasureFn) {
         var dirties = _dirties;

         if (Object.keys(dirties).length === 0) {
            /*Ключей нет, значит мы пытаемся обновлять вторую корневую ноду, которую уже обновили с первой*/
            return {
               dirties: dirties,
               oldRoots: _rootNodes,
               newRoots: _rootNodes,
               rebuildChanges: null,
               applyResults: null
            };
         }

         _dirties = {};
         _rootNodes.splice(_environments.length);

         var
            oldRoots = _rootNodes,
            rootsRebuild = Monad.mapM(
               oldRoots,
               function rebuildOneRootNode(node, i) {
                  node.requestDirtyCheck = requestDirtyCheck;
                  return rebuildNode(_environments[i], dirties, node, undefined, true);
               },
               RebuildResultWriter,
               this
            );

         if (rootsRebuild.then) {
            rootsRebuild.then(
               function (rootRebuildVal) {
                  var
                     // In the case of asynchronious controls we have to check
                     // is parent of those destroyed or not. If it is, that means, that we don't have a place
                     // to mount our rootNodes
                     newRoots = rootRebuildVal.value.filter(function (node) {
                        if (checkIsControlNodesParentDestroyed(node)) {
                           return false;
                        }
                        return true;
                     }),
                     rebuildChanges = rootRebuildVal.memo,
                     rebuildChangesIds = mapIds(newRoots),
                     /**
                      * Типы нод, для которых нужно запустить _afterUpdate
                      * @type {{createdNodes: boolean, updatedChangedNodes: boolean, selfDirtyNodes: boolean}}
                      */
                     rebuildChangesFields = {
                        createdNodes: true,
                        updatedChangedNodes: true,
                        selfDirtyNodes: true,
                        createdTemplateNodes: true,
                        updatedChangedTemplateNodes: true
                     },
                     applyResults;

                  //Сохраняем id созданных/обновленных контрол нод, чтобы вызвать afterUpdate или afterMound только у них
                  for (var field in rebuildChangesFields) {
                     if (rebuildChanges[field].length > 0) {
                        rebuildChangesIds = rebuildChangesIds.concat(mapIds(rebuildChanges[field]));
                     }
                  }

                  rebuildChangesIds = uniqueArray(rebuildChangesIds);

                  var applyNewVNode = function (env, i) {

                     /*Запускать генерацию можно только у нод, которых эта генерация запущена
                     * через rebuildRequest
                     * Все случайно попавшие ноды игнорируются до следующего тика*/
                     return newRoots[i] && newRoots[i].environment &&
                        newRoots[i].environment._haveRebuildRequest && newRoots[i].fullMarkup
                        ? env.applyNewVNode(newRoots[i].fullMarkup, rebuildChangesIds, newRoots[i])
                        : null;
                  };
                  if (timeMeasureFn) {
                     applyNewVNode = timeMeasureFn(applyNewVNode);
                  }

                  rebuildChanges.createdNodes.forEach(function (node) {
                     node.requestDirtyCheck = requestDirtyCheck;
                     this._controlNodes[node.id] = node;
                  }, this);

                  rebuildChanges.destroyedNodes.forEach(function (node) {
                     delete this._controlNodes[node.id];
                  }, this);

                  applyResults = _environments.map(applyNewVNode);

                  // controls which contain async controls and were created by using createControl method have different
                  // set of closured _rootNodes, so if newRoots have less controls than it should have, we will update
                  // just those ones.
                  if (_rootNodes.length > newRoots.length) {
                     _rootNodes = filterNewRoots(_rootNodes, newRoots);
                  } else {
                     _rootNodes = newRoots;
                  }

                  return {
                     dirties: dirties,
                     oldRoots: oldRoots,
                     newRoots: newRoots,
                     rebuildChanges: rebuildChanges,
                     applyResults: applyResults
                  };
               }.bind(this),
               function (err) {
                  Common.asyncRenderErrorLog(err);
                  return err;
               }
            );
         } else {
            var
               newRoots = rootsRebuild.value.filter(function (node) {
                  // Some controls might have already been destroyed, but they are
                  // still in rootsRebuild because they were in oldRoots when
                  // rebuild started. Filter them out if their environment does
                  // not exist anymore
                  return _environments.indexOf(node.environment) !== -1;
               }),
               rebuildChanges = rootsRebuild.memo,
               rebuildChangesIds = mapIds(newRoots).map(function (current) {
                  /*Запускаем afterUpdate только для тех, кто реально Dirty
                   * Остальные - это ChildDirty*/
                  return dirties[current] & DirtyKind.DIRTY ? current : undefined;
               }),
               /**
                * Типы нод, для которых нужно запустить _afterUpdate
                * @type {{createdNodes: boolean, updatedChangedNodes: boolean, selfDirtyNodes: boolean}}
                */
               rebuildChangesFields = {
                  createdNodes: true,
                  updatedChangedNodes: true,
                  selfDirtyNodes: true,
                  createdTemplateNodes: true,
                  updatedChangedTemplateNodes: true
               },
               applyResults;

            //Сохраняем id созданных/обновленных контрол нод, чтобы вызвать afterUpdate или afterMound только у них
            for (var field in rebuildChangesFields) {
               if (rebuildChanges[field].length > 0) {
                  rebuildChangesIds = rebuildChangesIds.concat(mapIds(rebuildChanges[field]));
               }
            }

            rebuildChangesIds = uniqueArray(rebuildChangesIds);

            var applyNewVNode = function (env, i) {

               /*Запускать генерацию можно только у нод, которых эта генерация запущена
               * через rebuildRequest
               * Все случайно попавшие ноды игнорируются до следующего тика*/
               return newRoots[i] && newRoots[i].environment &&
                  newRoots[i].environment._haveRebuildRequest && newRoots[i].fullMarkup
                     ? env.applyNewVNode(newRoots[i].fullMarkup, rebuildChangesIds, newRoots[i])
                     : null;
            };
            if (timeMeasureFn) {
               applyNewVNode = timeMeasureFn(applyNewVNode);
            }

            rebuildChanges.createdNodes.forEach(function (node) {
               node.requestDirtyCheck = requestDirtyCheck;
               this._controlNodes[node.id] = node;
            }, this);

            rebuildChanges.destroyedNodes.forEach(function (node) {
               delete this._controlNodes[node.id];
            }, this);

            applyResults = _environments.map(applyNewVNode);

            _rootNodes = newRoots;
            return {
               dirties: dirties,
               oldRoots: oldRoots,
               newRoots: newRoots,
               rebuildChanges: rebuildChanges,
               applyResults: applyResults
            };
         }
      }

      var
         rebuildImpl = isDebug ? Debug.withLogRebuild(doRebuild, { silent: true }) : doRebuild,
         i;

      for (i = 0; i !== MAX_REBUILD; i++) {
         rebuildImpl.call(this);
         if (isEmptyObject(_dirties)) {
            break;
         }
      }
      if (i === MAX_REBUILD) {
         var j;

         // If we reached MAX_REBUILD, we can assume that something went
         // wrong - nodes were rebuilt many times, but they are still dirty,
         // so we are stuck in an infinite loop.
         // To be able to debug the error, we enable view logs (to see which
         // components are being rebuilt) and run rebuild a couple of times
         // with logs enabled.
         // After we've logged the problematic components, we disable view
         // logs and throw an error to exit the infinite rebuild loop.

         // enable view logs
         Logger.setLoggerStatus(true, true);

         // make some rebuild iterations with logging
         for (j = 1; j <= MAX_REBUILD_LOGGED_ITERS; j++) {
            Logger.log('MAX_REBUILD error', ['Logged iteration ' + j]);
            rebuildImpl.call(this);
         }

         // disable view logs
         Logger.setLoggerStatus(false, true);

         throw new Error('SBIS3.CORE.VDOM.Synchronizer: i === MAX_REBUILD');
      }
   },
   controlStateChangedCallback: function (controlId) {
      VDomSynchronizer.requestRebuild(controlId, false);
   },
   mountControlToDOM: function (control, controlClass, options, domElement, attributes) {
      domElement = domElement[0] ? domElement[0] : domElement;
      var
         hasMountedComponent,
         rootAttrs = attributes || {},
         serializedId = domElement.getAttribute('data-component-root-id'),
         jsModules = serializedId && (window as any).vdomJsModules[serializedId];

      if (!attributes) {
         rootAttrs['data-component'] = domElement.getAttribute('data-component');
      }

      controlClass = loadControlClassIfString(controlClass);

      var doMount = function doMount() {
         var
            controlNode,
            environment,
            state,
            Slr = new Serializer();

         environment = new DOMEnvironment(domElement, this.controlStateChangedCallback, rootAttrs, serializedId);

         controlNode = createNode(control, { user: options }, undefined, environment, null, state);
         controlNode.requestDirtyCheck = requestDirtyCheck;
         if (rootAttrs) {
            controlNode.attributes = rootAttrs;
         }
         this._controlNodes[controlNode.id] = controlNode;

         _environments.push(environment);
         _rootNodes.push(controlNode);

         // храним в рутовом виртуальном компоненте ссылку на environment,
         // иначе до него не докопаться, только после ребилда, а это слишком поздно для системы фокусов
         controlNode.control._saveEnvironment(environment, controlNode);

         var carrier;

         if (!control._mounted && !control._unmounted && !control._beforeMountCalled) {
            carrier = Vdom.getReceivedState(
               controlNode,
               {
                  controlProperties: options,
                  controlClass: controlClass
               },
               Slr
            );
         }

         controlNode['element'] = domElement;
         /**
          * Сделать final проверку
          */
         if (controlNode.control.saveOptions) {
            controlNode.control.saveOptions(controlNode.options, controlNode);
         } else {
            /**
             * Поддержка для совместимости версий контролов
             */
            controlNode.control._options = controlNode.options;
            // @ts-ignore
            controlNode.control._container = $(controlNode.element);
         }
         /**
          * Обработка асинхронного построения для рутовой ноды
          * @type {*}
          */
         if (carrier) {
            carrier.then(
               function asyncRenderCallback(receivedState) {
                  controlNode.receivedState = receivedState;
                  this.requestRebuild(controlNode.id, true);
                  return receivedState;
               }.bind(this),
               function asyncRenderErrback(error) {
                  Common.asyncRenderErrorLog(error);
                  return error;
               }
            );
         } else {
            this.requestRebuild(controlNode.id, true);
         }
      }.bind(this);

      hasMountedComponent = _environments.some(function (env) {
         return env instanceof DOMEnvironment && env.getDOMNode() === domElement;
      });

      if (hasMountedComponent) {
         throw new Error('На этом DOM-элементе уже есть смонтированный корневой компонент');
      }


      var startResolveAfterMount = function(control, resolve) {
            var baseAM = control._afterMount;
            control._afterMount = function() {
               baseAM.apply(this, arguments);
               setTimeout(function() {
                  resolve();
               })
            }
         },
         
         //глобальная переменная mountedProcess контроллирует
         //текущий запущенный процесс маунтинга
         //процесс заканчивается, когда у контрола стреляет _afterMount
         //упорядочиваем маунты, чтобы они не конфликтовали друг с другом
         doMountQueue = function(){
            var currentMountProcess = mountedProcess;
            mountedProcess = new Promise(function(resolve) {
               if (currentMountProcess) {
                  currentMountProcess.then(function() {
                     startResolveAfterMount(control, resolve);
                     doMount();
                  });
               } else {
                  startResolveAfterMount(control, resolve);
                  doMount();
               }
            });
         };

      if (jsModules && jsModules.length > 0) {
         // @ts-ignore
         require(jsModules, doMountQueue);
      } else {
         doMountQueue();
      }
   },

   cleanControlDomLink: function (node) {
      if (!node) {
         return;
      }
      var domElement = node[0] ? node[0] : node;
      if (domElement.controlNodes) {
         for (var i = 0; i < domElement.controlNodes.length; i++) {
            if (!domElement.controlNodes[i].control || domElement.controlNodes[i].control._destroyed) {
               delete this._controlNodes[domElement.controlNodes[i].id];
               if (domElement.controlNodes.length > 0) {
                  /* We should remove all controls nodes link to destroy Environment in root node*/
                  if (domElement.controlNodes.length > 1 || !domElement.controlNodes[0].parent) {
                     domElement.controlNodes.splice(i, 1);
                     i--;
                  }
               }
            }
         }
      }
   },

   unMountControlFromDOM: function unMountControlFromDOM(control, node) {
      var
         domElement = node[0] ? node[0] : node,
         foundControlEnvironment,
         foundControlNode;

      for (var i = _rootNodes.length - 1; i >= 0; i--) {
         var rootDOMNode = _rootNodes[i].environment._rootDOMNode;

         // We only have one root dom node on vdom page, others are created inside of
         // compound controls. Compound control could be destroyed incorrectly, which would
         // leave an environment with undefined _rootDOMNode. We have to clean up these
         // environments as well.
         if ((domElement === rootDOMNode && _rootNodes[i].environment._canDestroy(control)) || !rootDOMNode) {
            var nodeId = _rootNodes[i].id,
               env = _environments.splice(i, 1)[0];

            if (this._controlNodes[nodeId]) {
               foundControlNode = this._controlNodes[nodeId];
               delete this._controlNodes[nodeId];
            }
            _rootNodes.splice(i, 1);

            // Control's environment was found, remember it to destroy after loop
            if (domElement === rootDOMNode) {
               foundControlEnvironment = env;
            } else {
               env.destroy();
            }
         }
      }

      // If control's environment was found, destroy it and the control itself.
      // Do this after loop, because destroying the control will destroy its children, that
      // could also call unMountControlFromDOM, which would change the _rootNodes array length
      // and lead to errors. For example, after control.destroy(), `i` could be out of bounds,
      // because child control environments were removed
      if (foundControlEnvironment) {
         if (!control._destroyed) {
            control.destroy();
         }
         if (foundControlNode) {
            // We have to make sure that all of the child controls are destroyed, in case
            // synchronizer didn't run against this environment when destroy() was called
            // for the root control
            destroyReqursive(foundControlNode, foundControlEnvironment);
         }
         control._mounted = false;
         control._unmounted = true;
         foundControlEnvironment.destroy();
      }
   },

   queue: null,

   requestRebuild: function (controlId, mountProcess) {
      //контрол здесь точно должен найтись, или быть корневым - 2 варианта попадания сюда:
      //    из конструктора компонента (тогда его нет, но тогда синхронизация активна) - тогда не нужно с ним ничего делать
      //    из внутреннего события компонента, меняющего его состояние, и вызывающего requestRebuild
      var
         controlNode = this._controlNodes[controlId],
         dirties = _dirties,
         pushed = false,
         self = this;

      let canUpdate = controlNode && !controlNode.environment._rebuildRequestStarted;
      if (!mountProcess) {
         canUpdate = canUpdate && !(_rootNodes.some((el) => {
            if (el.environment !== controlNode.environment && !controlNode.environment._haveRebuildRequest) {
               if (el.environment && (el.environment._rebuildRequestStarted ||
                  el.environment._haveRebuildRequest)) {

                  /*нельзя даже помечать контрол ноды для обновлений,
                  * пока хоть в одной корневой ноде начат процесс обновления
                  * в некоторых интерфейсах все построено на _forceUpdate
                  * что приводит к обновлениям кусков интерфейса
                  * в центре уже обновляемого куска*/

                  /*Добавить текущую ноду в очередь к какой-то обновляемой ноде
                    ждем https://online.sbis.ru/opendoc.html?guid=11776bc8-39b7-4c55-b5b5-5cc2ea8d9fbe*/

                  if (!el.environment.queue) {
                     el.environment.queue = [];
                  }

                  if (!el.environment.queueIds) {
                     el.environment.queueIds = {};
                  }

                  pushed = true;

                  if (!el.environment.queueIds[controlId]) {
                     el.environment.queue.push(controlId);
                  }
                  el.environment.queueIds[controlId] = 1;


                  /*еще один кейс с несколькими корневыми нодами
                  * одновременно могут начать обновляться несколько рутов, тогда первый контрол в очереди запустит
                  * синхронизацию повторно, и если синхронизация с той нодой, которая только что закончила,
                  * мы теряем все обновления, которые не входят
                  * То есть, это очередь, которая может скапливаться только при разборе очереди
                  * */

                  if (el.environment.activateSubQueue) {
                     if (!el.environment.subQueue) {
                        el.environment.subQueue = [];
                     }

                     if (!el.environment.subQueueIds) {
                        el.environment.subQueueIds = {};
                     }

                     if (!el.environment.subQueueIds[controlId]) {
                        el.environment.subQueue.push(controlId);
                     }
                     el.environment.subQueueIds[controlId] = 1;
                  }

                  return true;
               }
            }
         }));
      }

      if (canUpdate) {
         dirties[controlId] |= DirtyKind.DIRTY;

         forEachNodeParents(controlNode, function (parent) {
            dirties[parent.id] |= DirtyKind.CHILD_DIRTY;
         });

         if (!controlNode.environment._haveRebuildRequest) {
            controlNode.environment._haveRebuildRequest = true;
            runDelayed(
               function requestRebuildDelayed() {
                  if (!controlNode.environment._haveRebuildRequest) {

                     /*Если _haveRebuildRequest=false значит
                     * циклы синхронизации смешались и в предыдущем тике у
                     * всех контролов был вызван _afterUpdate
                     * Такое может случиться только в слое совместимости,
                     * когда динамически удаляются и добавляются контрол ноды
                     * */
                     return;
                  }
                  controlNode.environment._rebuildRequestStarted = true;

                  if (this._savedActiveElement !== document.activeElement) {
                     var currentElement = document.activeElement as any;
                     while (currentElement && currentElement.parentElement) {
                        if (currentElement.controlNodes && currentElement.controlNodes[0]) {
                           this._savedControlNode = currentElement.controlNodes[0];
                           break;
                        }
                        currentElement = currentElement.parentElement;
                     }
                  }
                  this._savedActiveElement = document.activeElement;

                  self._rebuild();

                  //controlNode.environment._haveRebuildRequest = false;

                  controlNode.environment.addTabListener();

                  var savedControlNode;
                  // если фокус был, но слетел, надо восстановить
                  // todo проверим нужно ли восстановление вообще
                  // if (this._savedControlNode && document.activeElement === document.body) {
                  //    savedControlNode = this._savedControlNode;
                  //    this._savedControlNode = null;
                  // }

                  // для совместимости, фокус устанавливаелся через старый механизм setActive, нужно восстановить фокус после _rebuild
                  if (controlNode.control.__$focusing) {
                     savedControlNode = controlNode;
                  }

                  // если фокус слетел, и есть куда его восстановить, восстановим его
                  if (savedControlNode) {
                     controlNode.environment.autofocusChanges.call(this, savedControlNode);
                  }
               }.bind(this)
            );
         }
      } else if (controlNode && controlNode.environment && !pushed) {
         if (!controlNode.environment.queue) {
            controlNode.environment.queue = [];
         }

         if (!controlNode.environment.queueIds) {
            controlNode.environment.queueIds = {};
         }

         if (!controlNode.environment.queueIds[controlId]) {
            controlNode.environment.queue.push(controlId);
         }
         controlNode.environment.queueIds[controlId] = 1;
      }
   },

   setDebugMode: function (val) {
      isDebug = val;
   }
};

function requestDirtyCheck(controlNode) {
   VDomSynchronizer.requestRebuild(controlNode.id, false);
}

export default VDomSynchronizer;
