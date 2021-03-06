define('Core/CompoundContainer', [
   'require',
   'Core/Control',
   'tmpl!Core/CompoundContainer',
   'Env/Env',
   'Core/Deferred',
   'Core/moduleStubs',
   'Env/Event',
   'Core/ControlBatchUpdater',
   'Core/helpers/Hcontrol/makeInstanceCompatible',

   'Lib/Control/AreaAbstract/AreaAbstract.compatible',
   'Core/Abstract.compatible',
   'Lib/Control/Control.compatible',
   'Lib/Control/BaseCompatible/BaseCompatible'
], function(require, Control, template, Env, Deferred, moduleStubs, EnvEvent, ControlBatchUpdater, makeInstanceCompatible) {


   var _private = {
      areBothTemplates: function(obja, objb) {
         return obja && obja.isDataArray && objb && objb.isDataArray;
      },
      isChangedConfig: function(oldConfig, newConfig) {
         var key;

         // Check if any values were changed or any keys removed
         for (key in oldConfig) {
            if (oldConfig.hasOwnProperty(key)) {
               // Ignore a change if both old object and new object are templates
               // They are recreated on every resynchronization and the reference
               // is changing, but child control should not rebuild
               if (!newConfig.hasOwnProperty(key) ||
                  (oldConfig[key] !== newConfig[key] && !_private.areBothTemplates(oldConfig[key], newConfig[key]))) {
                  return true;
               }
            }
         }

         // Check if any keys were added
         for (key in newConfig) {
            if (newConfig.hasOwnProperty(key) && !oldConfig.hasOwnProperty(key)) {
               return true;
            }
         }

         return false;
      },
      createChildContainer: function() {
         var container = document.createElement('div');
         this._children.compoundBlock.appendChild(container);
         return container;
      },
      destroyChildControl: function() {
         var
            self = this,
            currentChild = self._childControl;

         self._childControl = null;
         self._childCreatedDfr = null;

         // TODO make this async? it was in CompoundArea
         currentChild.unsubscribe('onCommandCatch', self._handleCommandCatch);
         currentChild.destroy();
         currentChild._container.remove();
      },
      createChildControl: function() {
         var self = this;

         if (self._childControl) {
            _private.destroyChildControl.call(self);
         }

         // TODO should this be async? it was in CompoundArea
         self._childCreatedDfr = new Deferred();

         moduleStubs.require([self._childControlName]).addCallback(function(modules) {
            var
               ComponentConstructor = modules[0],
               childContainer = (self._childConfig && self._childConfig.element) || _private.createChildContainer.call(self);

            self._notifyCompound('onInit');
            self._notifyCompound('onBeforeControlsLoad');

            // сначала выполняем событие onInit, чтобы там позвался setEnabled
            var clonedOptions = Object.assign({
               element: $(childContainer),
               enabled: self._setChildEnabled
            }, self._childConfig);

            clonedOptions.parent = self;

            // We have to track changes made during child control initialization separately, since the
            // control doesn't exist yet, but the clonedOptions can't be changed at this point either.
            // _isWaitingForChild flag is true while child control is being constructed, so other
            // CompoundContainer methods (for example setEnabled) can 'delay' requested changes and apply
            // them later, when child control has finished being created (for example when onBeforeShow
            // is triggered
            self._isWaitingForChild = true;

            // We have to wrap constructor into a ControlBatchUpdater 'batch' because otherwise child controls
            // of our main control will start firing events too early, before _childControl has finished constructing.
            // FloatArea started a batch 'FloatArea.loadControls' for this reason
            ControlBatchUpdater.beginBatchUpdate('CompoundContainer.constructingChildControl');
            self._childControl = new (ComponentConstructor)(clonedOptions);
            ControlBatchUpdater.endBatchUpdate('CompoundContainer.constructingChildControl');
            self._isWaitingForChild = false;

            self._notifyCompound('onBeforeShow');
            self._notifyCompound('onShow');
            if (!self._childCreatedDfr.isReady()) {
               self._childCreatedDfr.callback(self._childControl);
            }

            self._notifyCompound('onAfterLoad');
            self._notifyCompound('onInitComplete');
            self._notifyCompound('onAfterShow');
            self._notifyCompound('onReady');

            self._childControl.subscribe('onCommandCatch', self._handleCommandCatch);
         }).addErrback(function(e) {
            Env.IoC.resolve('ILogger').error('Core/CompoundContainer', 'Could not load "' + self._childControlName + '"');
            self._childCreatedDfr.errback(e);
         });
         return self._childCreatedDfr;
      },
      getChildCommandHandler: function(commandName) {
         var
            commandHandler = null,
            commandStorage = this._childControl.getUserData('commandStorage');
         if (commandStorage) {
            commandHandler = commandStorage[commandName];
         }
         return commandHandler;
      },
      handleCommandCatch: function(event, commandName) {
         var args = Array.prototype.slice.call(arguments, 2);
         event.setResult(this.handleCommand(commandName, args));
      }
   };

   var CompoundContainer = Control.extend({
      _template: template,
      _record: null,

      _childControlName: '',
      _childConfig: null,
      _childControl: null,
      _childCreatedDfr: null,
      _setChildEnabled: true,
      _isWaitingForChild: false,

      _eventHandlers: null,
      _eventSubscriptions: null,
      _handleCommandCatch: null,
      _notifyVDOM: null,

      _isEnabled: true,

      _beforeMount: function(newOptions) {
         if (!this._options.__$config) {
            // Component has to have __$config option so BaseCompatible can correctly assign its
            // container to it during deprecatedContr
            this._options.__$config = newOptions.__$config;
         }

         this._childControlName = newOptions.component;
         this._childConfig = newOptions.componentOptions;

         // Every CompoundContainer should have onCommandCatch handler with its own context
         this._handleCommandCatch = _private.handleCommandCatch.bind(this);
         this._eventHandlers = {};
         this._eventSubscriptions = [];
      },

      _afterMount: function(options) {
         this._options = options;

         makeInstanceCompatible(this);

         // Hide the parent so that inner CompoundControl doesn't get access to vdom
         if (this._options.parent) {
            if (!this._parent) {
               this._parent = this._options.parent;
            }
            this._options.parent = null;
         }

         // There are CompoundControls inside of the CompoundContainer, so it should
         // use the old WS3 focuses system
         this.detectNextActiveChildControl = this._oldDetectNextActiveChildControl;

         // Replace VDOM notification system with old notification system
         this._notifyVDOM = this._notify;
         this._notify = this._notifyCompound;

         this.rebuildChildControl();
      },

      _shouldUpdate: function(newOptions) {
         // Check option 'redrawOnOptionsChange' (true by default). Some users
         // want to change child control options manually and we should not
         // redraw these components.
         if (this._options.redrawOnOptionsChange !== false &&
            (this._childControlName !== newOptions.component ||
            _private.isChangedConfig.call(this, this._childConfig, newOptions.componentOptions))) {
            this._childControlName = newOptions.component;
            this._childConfig = newOptions.componentOptions;
            this._options = newOptions;
            this.rebuildChildControl();
         }
         return false;
      },

      destroy: function() {
         if (this.isDestroyed()) {
            return;
         }

         if (this._childControl) {
            _private.destroyChildControl.call(this);
         }

         this._childConfig = null;

         // from CompoundArea
         if (this._parent) {
            this._parent._childsMapId = this._parent._childsMapId || {};
            this._parent._childsMapName = this._parent._childsMapName || {};
            this._parent._childsTabindex = this._parent._childsTabindex || {};
         }

         CompoundContainer.superclass.destroy.apply(this, arguments);

         this._parent = null;

         if (this._eventSubscriptions) {
            // Clear event handlers after superclass destroy in case it fires any events
            for (var i = 0; i < this._eventSubscriptions.length; i++) {
               var sub = this._eventSubscriptions[i];
               sub.control.unsubscribe(sub.eventName, sub.handler);
            }
         }
         this._eventSubscriptions = null;
         this._eventHandlers = null;
         this._handleCommandCatch = null;
      },

      //<editor-fold desc="Methods to override">

      rebuildChildControl: function() {
         return _private.createChildControl.call(this);
      },

      handleCommand: function(commandName, args) {
         var
            result,
            parent = this.getParent(),
            childCommandHandler = _private.getChildCommandHandler.call(this, commandName);

         if (childCommandHandler) {
            result = childCommandHandler.apply(this._childControl, args);
         }
         if (!result) {
            result = this._notifyVDOM('commandCatch', [commandName].concat(args));
         }
         if (!result && parent && parent.sendCommand) {
            result = parent.sendCommand.apply(parent, [commandName].concat(args));
         }

         // Even if CompoundControl's and parent's command handlers didn't return a truthy result, we have to return
         // true to stop command propagation, since we propagated it to our parent manually (parent.sendCommand) and
         // the command shouldn't be sent for the second time
         return result || true;
      },

      //</editor-fold>

      //<editor-fold desc="Event system">

      _notifyCompound: function(eventName) {
         var
            self = this,
            args = Array.prototype.slice.call(arguments, 1),
            allHandlers = self._eventHandlers || {},
            eventHandlers = allHandlers[eventName] || [],
            optionHandlers = self._options.handlers || {},
            optionEventHandlers = optionHandlers[eventName] || [],
            eventObject = new EnvEvent.Object(eventName, self),
            fullArgs = [eventObject].concat(args),
            i;

         // If there is one handler for an event in options, it would be passed as a function
         // and not an array
         if (typeof optionEventHandlers === 'function') {
            optionEventHandlers = [optionEventHandlers];
         }

         // Go through all the handlers, added by calling 'subscribe' and passed through options
         var evToConcat = [];
         for (var k = 0; k < optionEventHandlers.length; k++) {
            if (!eventHandlers.find(function(a) {
               return a === optionEventHandlers[k];
            })) {
               evToConcat.push(optionEventHandlers[k]);
            }
         }
         eventHandlers = eventHandlers.concat(evToConcat);
         for (i = 0; i < eventHandlers.length && eventObject.getResult() !== false; i++) {
            eventHandlers[i].apply(self, fullArgs);
         }

         if (eventObject.getResult() !== false) {
            var
               channel = this._getChannel(),
               result = channel.notify.apply(channel, [eventName].concat(args));
            if (result !== undefined) {
               eventObject.setResult(result);
            }
         }

         return eventObject.getResult();
      },

      subscribe: function(eventName, handler) {
         this._eventHandlers = this._eventHandlers || {};
         if (!this._eventHandlers[eventName]) {
            this._eventHandlers[eventName] = [];
         } else if (typeof this._eventHandlers[eventName] === 'function') {
            this._eventHandlers[eventName] = [this._eventHandlers[eventName]];
         }
         this._eventHandlers[eventName].push(handler);
      },

      once: function(eventName, handler) {
         var
            self = this,
            onceWrapper = function() {
               handler.apply(this, arguments); // 'this' is passed to the handler
               self.unsubscribe(eventName, onceWrapper); // 'self' is the CompoundContainer that subscribed
            };

         self.subscribe(eventName, onceWrapper);
      },

      subscribeTo: function(control, eventName, handler) {
         control.subscribe(eventName, handler);
         this._eventSubscriptions.push({
            control: control,
            eventName: eventName,
            handler: handler
         });
      },

      unsubscribe: function(eventName, handler) {
         this._unsubscribe(eventName, handler, this._eventHandlers || {});
         this._unsubscribe(eventName, handler, this._options.handlers || {});
      },

      _unsubscribe: function (eventName, handler, storage) {
         if (storage[eventName]) {
            var collection = storage[eventName];
            if (typeof collection === 'function') {
               collection = [collection];
            }
            var idx = collection.findIndex(function(el) {
               return el === handler;
            });
            if (idx >= 0) {
               collection.splice(idx, 1);
               storage[eventName] = collection;
            }
         }
      },

      //</editor-fold>

      //<editor-fold desc="Redefined old controls API">

      getParent: function() {
         // CompoundContainer has a VDom parent above it, which compound child can't interact with anyway,
         // so it pretends to be the top parent
         return null;
      },

      sendCommand: function(commandName) {
         var args = Array.prototype.slice.call(arguments, 1);
         return this.handleCommand(commandName, args);
      },

      setEnabled: function(enabled) {
         this._isEnabled = enabled;
         if (this._childControl) {
            this._childControl.setEnabled(enabled);
         } else if (this._isWaitingForChild) {
            var self = this;

            // Child control can call this.getParent().setEnabled(true/false) on `init` or in  the constructor.
            // Since this._childControl === null at this point, we have to remember the fact that the enabled
            // state has been changed and pass the change to the child control when it finishes being created
            self.once('onBeforeShow', function() {
               self._childControl.setEnabled(enabled);
            });
         } else {
            // If the child control hasn't been created yet, remember the 'enabled' value and
            // pass it to a child control in options. We should pass it as an option, because
            // child control could change its enabled state in constructor or during init
            this._setChildEnabled = enabled;
         }
      },

      isEnabled: function() {
         return this._isEnabled;
      },

      getContainer: function() {
         return $(this._container);
      },

      isDestroyed: function() {
         return this._destroyed;
      },

      getImmediateChildControls: function() {
         var filtered = [];
         for (var i = 0; i < this._childControls.length; i++) {
            if (this._childControls[i]) {
               filtered.push(this._childControls[i]);
            }
         }
         return filtered;
      },

      getRecord: function() {
         return this._record || this._options.record || (this._childConfig && this._childConfig.record);
      },

      setRecord: function(record) {
         this._record = record;
      }

      //</editor-fold>
   });

   return CompoundContainer;

});
