define('Lib/Mixins/PendingOperationParentMixin', [
   'Core/helpers/Function/callBefore',
   'Core/helpers/Function/callNext',
   'Core/helpers/Array/findIndex',
   'Core/core-merge',
   'Core/core-clone',
   'Lib/Mixins/PendingOperationProducerMixin',
   'Core/CommandDispatcher',
   'Core/Deferred',
   'Env/Env'
], function(callBefore, callNext, arrayFindIndex, cMerge, cClone, ProducerMixin, CommandDispatcher, Deferred, Env) {
   //todo: зачем здесь genHelpers и funcHelpers
   function removeOperation(operation, array) {
      var  idx = arrayFindIndex(array, function(op) { return op === operation; });
      array.splice(idx, 1);
   }

   function finishResultOk(result) {
      return !(result instanceof Error || result === false);
   }

   var
      logger = Env.IoC.resolve('ILogger'),
      Producer = cClone(ProducerMixin),
      ProducerFuncs = ProducerMixin.$protected,
      ParentMixin = /** @lends Lib/Mixins/PendingOperationParentMixin.prototype */ cMerge(Producer, {
         $protected: {
            _childPendingOperations: [],
            _allChildrenPendingOperation: null,
            _finishPendingQueue: null,
            _isFinishingChildOperations: false
         },

         $constructor : callNext.call(function() {
            var
               registerPendingOperation = this._registerChildPendingOperation.bind(this),
               unregisterPendingOperation = this._unregisterChildPendingOperation.bind(this),
               declCmd = CommandDispatcher.declareCommand.bind(CommandDispatcher);

            declCmd(this, 'registerPendingOperation', registerPendingOperation);
            declCmd(this, 'unregisterPendingOperation', unregisterPendingOperation);
         }, ProducerFuncs.$constructor),

         _registerChildPendingOperation: function(operation) {
            var name, finishFunc;

            this._childPendingOperations.push(operation);

            if (!this._allChildrenPendingOperation) {
               name = (this._moduleName ? this._moduleName + '/' : '') + 'allChildrenPendingOperation';
               finishFunc = this.finishChildPendingOperations.bind(this);

               this._allChildrenPendingOperation = this._registerPendingOperation(name, finishFunc, this.getParent());
            }

            return true;
         },

         _unregisterChildPendingOperation: function(operation) {
            var
               childOps = this._childPendingOperations,
               allChildrenPendingOperation;

            if (childOps.length > 0) {
               removeOperation(operation, childOps);
               if (childOps.length === 0) {
                  allChildrenPendingOperation = this._allChildrenPendingOperation;
                  this._allChildrenPendingOperation = null;
                  Env.coreDebug.checkAssertion(!!allChildrenPendingOperation);

                  this._unregisterPendingOperation(allChildrenPendingOperation);
               }
            }
            return true;
         },

         finishChildPendingOperations: function(needSavePendings) {
            var
               self = this,
               checkFn = function(prevResult) {
                  var
                     childOps = self._childPendingOperations,
                     result, allChildrenPendingOperation;

                  function cleanupFirst() {
                     if (childOps.length > 0) {
                        childOps.shift().cleanup();
                     }
                  }

                  if (finishResultOk(prevResult) && childOps.length > 0) {
                     result = childOps[0].finishFunc(needSavePendings);
                     if (result instanceof Deferred) {
                        result.addCallback(function(res) {
                           if (finishResultOk(res)) {
                              cleanupFirst();
                           }
                           return checkFn(res);
                        }).addErrback(function(res) {
                           return checkFn(res);
                        });
                     } else {
                        if (finishResultOk(result)) {
                           cleanupFirst();
                        }
                        result = checkFn(result);
                     }
                  } else {
                     allChildrenPendingOperation = self._allChildrenPendingOperation;
                     if (childOps.length === 0 && allChildrenPendingOperation) {
                        self._allChildrenPendingOperation = null;
                        self._unregisterPendingOperation(allChildrenPendingOperation);
                     }
                     self._isFinishingChildOperations = false;
                     result = prevResult;
                  }
                  return result;
               };

            if (!this._isFinishingChildOperations) {
               this._finishPendingQueue = Deferred.success(true);
               this._isFinishingChildOperations = true;

               this._finishPendingQueue.addCallback(checkFn);
            }

            return this._finishPendingQueue;
         },

         getChildPendingOperations: function() {
            return this._childPendingOperations;
         },

         before: {
            destroy: callBefore.call(function() {
               var
                  operation = this._allChildrenPendingOperation,
                  message;

               if (this._isFinishingChildOperations) {
                  message = 'У контрола ' + this._moduleName + ' (name = ' + this.getName() + ', id = ' + this.getId() + ') вызывается метод destroy, ' +
                     'хотя у него ещё есть незавёршённые операции (свои или от дочерних контролов';
                  logger.error('Lib/Mixins/PendingOperationParentMixin', message);
               }

               this._childPendingOperations = [];//cleanup им вызывать не надо - всё равно там destroy будет работать, у дочернего контрола
               if (this._allChildrenPendingOperation) {
                  this._allChildrenPendingOperation = null;
                  this._unregisterPendingOperation(operation);
               }
            }, ProducerFuncs.destroy)
         }
      });

   return ParentMixin;
});
