define('UI/_index/Control', [
    'require',
    'exports',
    'wml!UI/_index/Control',
    'Core/IoC',
    'Core/helpers/Hcontrol/doAutofocus',
    'Vdom/Vdom',
    'View/Executor/Utils',
    'View/Executor/Expressions',
    'View/Logger'
], function (require, exports, template, IoC, doAutofocus, Vdom_1, Utils_1, Expressions_1, Logger_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });    /**
     * @event Core/Control#activated Occurs when the component becomes active.
     * @param {Boolean} isTabPressed Indicates whether control was activated by Tab press.
     * @remark Control is activated when one of its DOM elements becomes focused. Detailed description and u
     * se cases of the event can be found
     * {@link https://wi.sbis.ru/doc/platform/developmentapl/interface-development/wasaby/focus/ here}.
     * @see Documentation: Activation system
     * @see deactivated
     */
                                                                      /**
     * @event Core/Control#deactivated Occurs when control becomes inactive.
     * @param {Boolean} isTabPressed Indicates whether control was deactivated by Tab press.
     * @remark Control is deactivated when all of its child component lose focus.
     * Detailed description and use cases of the event can be found
     * {@link https://wi.sbis.ru/doc/platform/developmentapl/interface-development/wasaby/focus/ here}.
     * @see Documentation: Activation system
     * @see activated
     */
    /**
     * @event Core/Control#activated Occurs when the component becomes active.
     * @param {Boolean} isTabPressed Indicates whether control was activated by Tab press.
     * @remark Control is activated when one of its DOM elements becomes focused. Detailed description and u
     * se cases of the event can be found
     * {@link https://wi.sbis.ru/doc/platform/developmentapl/interface-development/wasaby/focus/ here}.
     * @see Documentation: Activation system
     * @see deactivated
     */
    /**
     * @event Core/Control#deactivated Occurs when control becomes inactive.
     * @param {Boolean} isTabPressed Indicates whether control was deactivated by Tab press.
     * @remark Control is deactivated when all of its child component lose focus.
     * Detailed description and use cases of the event can be found
     * {@link https://wi.sbis.ru/doc/platform/developmentapl/interface-development/wasaby/focus/ here}.
     * @see Documentation: Activation system
     * @see activated
     */
    var countInst = 1;
    var Control = /** @class */
    function () {
        function Control(cfg) {
            var _this = this;
            this._mounted = false;
            this._unmounted = false;
            this._destroyed = false;
            this._active = false;
            this._options = null;
            this._internalOptions = null;
            this._container = null;    /**
             * TODO: delete it
             */
            /**
             * TODO: delete it
             */
            this._context = null;
            this.context = null;
            this.saveFullContext = null;
            this._saveContextObject = null;
            this._saveEnvironment = null;
            this.saveInheritOptions = null;
            this._getEnvironment = null;
            this._notify = null;    /**
             * Manually triggers start of the update cycle for the control.
             *
             * @remark Control's update starts automatically when you subscribe to DOM and control events from the
             * template. If you update control's state at some other time (timeout or subscription to server event),
             * you need to start update manually. After _forceUpdate, all hooks from update lifecycle will be called
             * (_shouldUpdate, _beforeUpdate, _afterUpdate).
             * @example
             * In this example, _statusUpdatedHandler is called when new status received from server.
             * You then update the state with this status and manually trigger control's update to rerender its' template.
             * <pre>
             *    Control.extend({
             *       ...
             *       _statusUpdatedHandler(newStatus) {
             *          this._status = newStatus;
             *          this._forceUpdate();
             *       }
             *       ...
             *    });
             * </pre>
             * @see Documentation: Control lifecycle
             * @private
             */
            /**
             * Manually triggers start of the update cycle for the control.
             *
             * @remark Control's update starts automatically when you subscribe to DOM and control events from the
             * template. If you update control's state at some other time (timeout or subscription to server event),
             * you need to start update manually. After _forceUpdate, all hooks from update lifecycle will be called
             * (_shouldUpdate, _beforeUpdate, _afterUpdate).
             * @example
             * In this example, _statusUpdatedHandler is called when new status received from server.
             * You then update the state with this status and manually trigger control's update to rerender its' template.
             * <pre>
             *    Control.extend({
             *       ...
             *       _statusUpdatedHandler(newStatus) {
             *          this._status = newStatus;
             *          this._forceUpdate();
             *       }
             *       ...
             *    });
             * </pre>
             * @see Documentation: Control lifecycle
             * @private
             */
            this._forceUpdate = null;    //Render function for virtual dom
            //Render function for virtual dom
            this._getMarkup = null;    //Render function for text generator
            //Render function for text generator
            this.render = null;
            this._children = null;
            if (!cfg) {
                cfg = {};
            }    /**
             * TODO: delete it
             */
            /**
             * TODO: delete it
             */
            var fullContext = null, _contextObj = null;
            this.saveFullContext = function (ctx) {
                fullContext = ctx;
            };
            this._saveContextObject = function (ctx) {
                _contextObj = ctx;
                _this._context = ctx;
            };
            this.context = {
                get: function (field) {
                    if (_contextObj && _contextObj.hasOwnProperty(field)) {
                        return _contextObj[field];
                    }
                    throw new Error('You trying to get unrequired field ' + field);
                },
                set: function () {
                    throw new Error('Can\'t set data to context. Context is readonly!');
                },
                has: function () {
                    return true;
                }
            };    /**
             * end todo
             */
            /**
             * end todo
             */
            var controlNode = null, savedInheritOptions = null, environment = null;
            this.saveInheritOptions = function (opts) {
                savedInheritOptions = opts;
            };
            this._saveEnvironment = function (env, cntNode) {
                controlNode = cntNode;
                environment = env;
            };
            this._getEnvironment = function () {
                return environment;
            };
            this._notify = function () {
                return environment && environment.startEvent(controlNode, arguments);
            };
            this._forceUpdate = function () {
                var control = _this || controlNode && controlNode.control;
                if (control && !control._mounted) {
                    // _forceUpdate was called asynchronous from _beforeMount before control was mounted to DOM
                    // So we need to delay _forceUpdate till the moment component will be mounted to DOM
                    control._$needForceUpdate = true;
                } else {
                    environment && environment.forceRebuild(controlNode.id);
                }
            };    /**
             * Метод, который возвращает разметку для компонента
             * @param rootKey
             * @returns {*}
             */
            /**
             * Метод, который возвращает разметку для компонента
             * @param rootKey
             * @returns {*}
             */
            this._getMarkup = function _getMarkup(rootKey, isRoot, attributes, isVdom) {
                if (!this._template.stable) {
                    IoC.resolve('ILogger').error(this._moduleName, 'Check what you put in _template');
                    return '';
                }
                var res;
                if (isVdom === undefined) {
                    isVdom = true;
                }
                if (!attributes) {
                    attributes = {};
                }
                attributes.context = fullContext;
                attributes.inheritOptions = savedInheritOptions;
                for (var i in attributes.events) {
                    if (attributes.events.hasOwnProperty(i)) {
                        for (var handl = 0; handl < attributes.events[i].length; handl++) {
                            if (attributes.events[i][handl].fn.isControlEvent && !attributes.events[i][handl].fn.controlDestination) {
                                attributes.events[i][handl].fn.controlDestination = this;
                            }
                        }
                    }
                }
                res = this._template(this, attributes, rootKey, isVdom);
                if (res) {
                    if (isVdom) {
                        for (var k = 0; k < res.length; k++) {
                            if (res[k]) {
                                return res[k];
                            }
                        }
                    }
                } else {
                    res = '';
                }
                return res;
            };
            this.render = function (empty, attributes) {
                var markup = this._getMarkup(null, true, attributes, false);
                this._isRendered = true;
                return markup;
            };
            this._options = {};
            this._internalOptions = {};
            this._children = {};
            this._instId = 'inst_' + countInst++;    /*dont use this*/
            /*dont use this*/
            this._afterCreate && this._afterCreate(cfg);
        }
        Control.prototype.getInstanceId = function () {
            return this._instId;
        };
        Control.prototype.mountToDom = function (element, cfg, controlClass) {
            if (!this._mounted) {
                this._mounted = true;
                this._container = element;
                Vdom_1.Synchronizer.mountControlToDOM(this, controlClass, cfg, this._container);
            }
            if (cfg) {
                this.saveOptions(cfg);
            }
        };    // Just save link to new options
        // Just save link to new options
        Control.prototype.saveOptions = function (options, controlNode) {
            if (controlNode === void 0) {
                controlNode = null;
            }
            this._options = options;
            if (controlNode) {
                this._container = controlNode.element;
            }
            return true;
        };
        Control._getInheritOptions = function (ctor) {
            var inherit = ctor.getInheritOptions && ctor.getInheritOptions() || {};
            if (!inherit.hasOwnProperty('readOnly')) {
                inherit.readOnly = false;
            }
            if (!inherit.hasOwnProperty('theme')) {
                inherit.theme = '';
            }
            return inherit;
        };
        Control.createControl = function (ctor, cfg, domElement) {
            if (Utils_1.OptionsResolver.resolveOptions(ctor, cfg)) {
                var attrs = { inheritOptions: {} }, ctr;
                Utils_1.OptionsResolver.resolveInheritOptions(ctor, attrs, cfg, true);
                try {
                    ctr = new ctor(cfg);
                } catch (error) {
                    ctr = new Control({});
                    Logger_1.default.catchLifeCircleErrors('constructor', error);
                }
                ctr.saveInheritOptions(attrs.inheritOptions);
                ctr._container = domElement;
                Expressions_1.Focus.patchDom(domElement, cfg);
                ctr.saveFullContext(Expressions_1.ContextResolver.wrapContext(ctr, { asd: 123 }));
                ctr.mountToDom(ctr._container, cfg, ctor);
                return ctr;
            }
            return null;
        };
        ;    /**
         * Метод задания значения служебной опции
         * @param {String} name Имя служебной опции
         * @param {*} value Значение опции
         */
        /**
         * Метод задания значения служебной опции
         * @param {String} name Имя служебной опции
         * @param {*} value Значение опции
         */
        Control.prototype._setInternalOption = function (name, value) {
            if (!this._internalOptions) {
                this._internalOptions = {};
                IoC.resolve('ILogger').error('Component with ' + (this._options ? 'name ' + this._options.name + ' config ' + this._options.__$config : 'maybe id ' + this._$id), 'Control.constructor wasn\'t called');
            }
            this._internalOptions[name] = value;
        };    /**
         * Метод задания служебных опций
         * @param {Object} internal Объект, содержащий ключи и значения устанавливаемых служебных опций
         */
        /**
         * Метод задания служебных опций
         * @param {Object} internal Объект, содержащий ключи и значения устанавливаемых служебных опций
         */
        Control.prototype._setInternalOptions = function (internal) {
            for (var name in internal) {
                if (internal.hasOwnProperty(name)) {
                    this._setInternalOption(name, internal[name]);
                }
            }
        };
        Control.prototype.destroy = function () {
            this._destroyed = true;
            try {
                var contextTypes = this.constructor.contextTypes ? this.constructor.contextTypes() : {};
                for (var i in contextTypes) {
                    if (contextTypes.hasOwnProperty(i)) {
                        this.context.get(i).unregisterConsumer(this);
                    }
                }
                if (this._mounted) {
                    this._beforeUnmount();
                    Vdom_1.Synchronizer.cleanControlDomLink(this._container);
                }
            } catch (error) {
                Logger_1.default.catchLifeCircleErrors('_beforeUnmount', error);
            }
        };    // <editor-fold desc="API">
        // <editor-fold desc="API">
        Control.prototype._blur = function () {
            var container = this._container[0] ? this._container[0] : this._container, activeElement = document.activeElement, tmpTabindex;
            if (!Expressions_1.Focus.closest(document.activeElement, container)) {
                return;
            }    // задача - убрать фокус с текущего элемента. куда? ну, например на body
                 // чтобы можно было перевести фокус на body, сначала выставим табиндекс, а потом уберем
            // задача - убрать фокус с текущего элемента. куда? ну, например на body
            // чтобы можно было перевести фокус на body, сначала выставим табиндекс, а потом уберем
            if (document.body.tabIndex === -1) {
                tmpTabindex = document.body.tabIndex;
                document.body.tabIndex = 1;
            }
            document.body.focus();
            if (this._active) {
                var env = container.controlNodes[0].environment;    // если DOMEnvironment не перехватил переход фокуса, вызовем обработчик ухода фокуса вручную
                // если DOMEnvironment не перехватил переход фокуса, вызовем обработчик ухода фокуса вручную
                env._handleFocusEvent({
                    target: document.body,
                    relatedTarget: activeElement
                });
            }
            if (tmpTabindex !== undefined) {
                document.body.tabIndex = tmpTabindex;
            }
        };    /**
         * Activates the control.
         * @returns {Boolean} True - when focus was set successfully, false - when nothing was focused.
         * @example
         * The following example shows how to activate input on button click.
         * <pre>
         *    Control.extend({
         *       ...
         *       _clickHandler() {
         *          this._children.textInput.activate();
         *       }
         *       ...
         *    });
         * </pre>
         *
         * <pre>
         *    <div>
         *       <Button on:click="_clickHandler()" />
         *       <Controls.Input.Text name="textInput" />
         *    </div>
         * </pre>
         * @remark Method finds DOM element inside the control (and its child controls) that can be focused and
         * sets focus on it. Returns true if focus was set successfully and false if nothing was focused.
         * When control becomes active, all of its child controls become active too. When control activates,
         * it fires activated event. Detailed description of the activation algorithm can be found
         * {@link https://wi.sbis.ru/doc/platform/developmentapl/interface-development/wasaby/focus/ here}.
         * @see Documentation: Activation system
         * @see activated
         * @see deactivated
         */
        /**
         * Activates the control.
         * @returns {Boolean} True - when focus was set successfully, false - when nothing was focused.
         * @example
         * The following example shows how to activate input on button click.
         * <pre>
         *    Control.extend({
         *       ...
         *       _clickHandler() {
         *          this._children.textInput.activate();
         *       }
         *       ...
         *    });
         * </pre>
         *
         * <pre>
         *    <div>
         *       <Button on:click="_clickHandler()" />
         *       <Controls.Input.Text name="textInput" />
         *    </div>
         * </pre>
         * @remark Method finds DOM element inside the control (and its child controls) that can be focused and
         * sets focus on it. Returns true if focus was set successfully and false if nothing was focused.
         * When control becomes active, all of its child controls become active too. When control activates,
         * it fires activated event. Detailed description of the activation algorithm can be found
         * {@link https://wi.sbis.ru/doc/platform/developmentapl/interface-development/wasaby/focus/ here}.
         * @see Documentation: Activation system
         * @see activated
         * @see deactivated
         */
        Control.prototype.activate = function () {
            function doFocus(container) {
                var res = false, activeElement = document.activeElement;
                if (container.wsControl && container.wsControl.setActive) {
                    // если нашли контейнер старого контрола, активируем его старым способом (для совместимости)
                    if (container.wsControl.canAcceptFocus()) {
                        container.wsControl.setActive(true);
                        res = container.wsControl.isActive();
                    } else {
                        // todo попробовать поискать следующий элемент?
                        res = false;
                    }
                } else {
                    if (Vdom_1.TabIndex.getElementProps(container).tabStop) {
                        Vdom_1.TabIndex.focus(container);
                    }
                    res = container === document.activeElement;
                    container = this._container[0] ? this._container[0] : this._container;    // может случиться так, что на focus() сработает обработчик в DOMEnvironment, и тогда тут ничего не надо делать
                                                                                              // todo делать проверку не на _active а на то, что реально состояние изменилось. например переходим от
                                                                                              // компонента к его предку, у предка состояние не изменилось. но с которого уходили у него изменилось
                    // может случиться так, что на focus() сработает обработчик в DOMEnvironment, и тогда тут ничего не надо делать
                    // todo делать проверку не на _active а на то, что реально состояние изменилось. например переходим от
                    // компонента к его предку, у предка состояние не изменилось. но с которого уходили у него изменилось
                    if (res && !this._active) {
                        var env = container.controlNodes[0].environment;
                        env._handleFocusEvent({
                            target: container,
                            relatedTarget: activeElement
                        });
                    }
                }
                return res;
            }
            var res = false, container = this._container[0] ? this._container[0] : this._container;    // сначала попробуем поискать по ws-autofocus, если найдем - позовем focus рекурсивно для найденного компонента
            // сначала попробуем поискать по ws-autofocus, если найдем - позовем focus рекурсивно для найденного компонента
            var autofocusElems = doAutofocus.findAutofocusForVDOM(container), autofocusElem, found;
            for (var i = 0; i < autofocusElems.length; i++) {
                autofocusElem = autofocusElems[i];    // если что-то зафокусировали, перестаем поиск
                // если что-то зафокусировали, перестаем поиск
                if (!found) {
                    // фокусируем только найденный компонент, ws-autofocus можно повесить только на контейнер компонента
                    if (autofocusElem && autofocusElem.controlNodes && autofocusElem.controlNodes.length) {
                        res = autofocusElem.controlNodes[0].control.activate();
                        found = res;
                    }
                }
            }    // если не получилось найти по автофокусу, поищем первый элемент по табиндексам и сфокусируем его.
                 // причем если это будет конейнер старого компонента, активируем его по старому тоже
            // если не получилось найти по автофокусу, поищем первый элемент по табиндексам и сфокусируем его.
            // причем если это будет конейнер старого компонента, активируем его по старому тоже
            if (!found) {
                // так ищем DOMEnvironment для текущего компонента. В нем сосредоточен код по работе с фокусами.
                var getElementProps = Vdom_1.TabIndex.getElementProps;
                var next = Vdom_1.TabIndex.findFirstInContext(container, false, getElementProps);
                if (next) {
                    res = doFocus.call(this, next);
                } else {
                    res = doFocus.call(this, container);
                }
            }
            return res;
        };
        Control.prototype._afterCreate = function (cfg) {
        };    /**
         * Control’s lifecycle hook. Called right before the mounting of the component to DOM.
         *
         * @param {Object} options Control's options.
         * @param {Object} context Context fields that controls requested. See "Context in Wasaby controls".
         * @param {Object} receivedState Data received from server render. See "Server render in Wasaby controls".
         * @example
         * <pre>
         *    Control.extend({
         *       ...
         *       _beforeMount(options, context, receivedState) {
         *          if (receivedState) {
         *             this.employeeName = receivedState;
         *          } else {
         *             return EmployeeNameSource.query().addCallback(function(employeeName) {
         *                this.employeeName = employeeName;
         *                return employeeName;
         *             });
         *          }
         *       }
         *       ...
         *    });
         * </pre>
         * @remark This is the first lifecycle hook of the control and the only hook
         * that is called on both server and client side. It is called before template is render, thus
         * it is usually used to prepare data for template. Detailed description of lifecycle hooks can be found here.
         * @see Documentation: Control lifecycle
         * @see Documentation: Options
         * @see Documentation: Context
         * @see Documentation: Server render
         * @private
         */
        /**
         * Control’s lifecycle hook. Called right before the mounting of the component to DOM.
         *
         * @param {Object} options Control's options.
         * @param {Object} context Context fields that controls requested. See "Context in Wasaby controls".
         * @param {Object} receivedState Data received from server render. See "Server render in Wasaby controls".
         * @example
         * <pre>
         *    Control.extend({
         *       ...
         *       _beforeMount(options, context, receivedState) {
         *          if (receivedState) {
         *             this.employeeName = receivedState;
         *          } else {
         *             return EmployeeNameSource.query().addCallback(function(employeeName) {
         *                this.employeeName = employeeName;
         *                return employeeName;
         *             });
         *          }
         *       }
         *       ...
         *    });
         * </pre>
         * @remark This is the first lifecycle hook of the control and the only hook
         * that is called on both server and client side. It is called before template is render, thus
         * it is usually used to prepare data for template. Detailed description of lifecycle hooks can be found here.
         * @see Documentation: Control lifecycle
         * @see Documentation: Options
         * @see Documentation: Context
         * @see Documentation: Server render
         * @private
         */
        Control.prototype._beforeMount = function () {
            return Promise.resolve();
        };
        Control.prototype._beforeMountLimited = function () {
            var _this = this;
            if (typeof window !== 'undefined') {
                return this._beforeMount.apply(this, arguments);
            }
            var resultBeforeMount = this._beforeMount.apply(this, arguments);
            if (resultBeforeMount && resultBeforeMount.callback) {
                return new Promise(function (resolve, reject) {
                    var timeout = 0;
                    resultBeforeMount.then(function (result) {
                        if (!timeout) {
                            timeout = 1;
                            resolve(result);
                        }
                        return result;
                    }, function (error) {
                        if (!timeout) {
                            timeout = 1;
                            reject(error);
                        }
                        return error;
                    });
                    setTimeout(function () {
                        if (!timeout) {
                            /* Change _template and _afterMount
                                *  if execution was longer than 2 sec
                                * */
                            IoC.resolve('ILogger').error('_beforeMount', 'Wait 20000 ms ' + self._moduleName);
                            timeout = 1;
                            new Promise(function (resolve_1, reject_1) {
                                require(['View/Executor/TClosure'], resolve_1, reject_1);
                            }).then(function (thelpers) {
                                _this._originTemplate = self._template;
                                _this._template = function (data, attr, context, isVdom, sets) {
                                    try {
                                        return this._originTemplate.apply(self, arguments);
                                    } catch (e) {
                                        return thelpers.getMarkupGenerator(isVdom).createText('');
                                    }
                                };
                                _this._template.stable = true;
                                _this._afterMount = function () {
                                };
                                resolve(false);
                            });
                        }
                    }, 20000);
                });
            }
            return resultBeforeMount;
        };    /**
         * Control’s lifecycle hook. Called right after component was mounted to DOM.
         * @param {Object} options Control's options.
         * @param {Object} context Context fields that controls requested. See "Context in Wasaby controls."
         * @example
         * <pre>
         *    Control.extend({
         *       ...
         *       _beforeMount(options, context) {
         *          this.subscribeToServerEvents();
         *          this.buttonHeight = this._children.myButton.offsetHeight;
         *       }
         *       ...
         *    });
         * </pre>
         * @remark This is the first lifecycle hook called after control was mounted to DOM.
         * At this stage, you can access options and context at this._options and this._context.
         * This hook is frequently used to access DOM elements and to subscribe to server events.
         * Detailed description of lifecycle hooks can be found here.
         * @see Documentation: Control lifecycle
         * @see Documentation: Options
         * @see Documentation: Context
         * @see Documentation: Server render
         * @private
         */
        /**
         * Control’s lifecycle hook. Called right after component was mounted to DOM.
         * @param {Object} options Control's options.
         * @param {Object} context Context fields that controls requested. See "Context in Wasaby controls."
         * @example
         * <pre>
         *    Control.extend({
         *       ...
         *       _beforeMount(options, context) {
         *          this.subscribeToServerEvents();
         *          this.buttonHeight = this._children.myButton.offsetHeight;
         *       }
         *       ...
         *    });
         * </pre>
         * @remark This is the first lifecycle hook called after control was mounted to DOM.
         * At this stage, you can access options and context at this._options and this._context.
         * This hook is frequently used to access DOM elements and to subscribe to server events.
         * Detailed description of lifecycle hooks can be found here.
         * @see Documentation: Control lifecycle
         * @see Documentation: Options
         * @see Documentation: Context
         * @see Documentation: Server render
         * @private
         */
        Control.prototype._afterMount = function () {
        };    /**
         * Control’s lifecycle hook. Called before update of the control.
         *
         * @param {Object} newOptions Options that control received. Old options can be found in this._options.
         * @param {Object} newContext Context that control received. Old context can be found in this._context.
         * @remark In this hook you can compare new and old options and update state of the control.
         * In this hook you would prepare everything needed for control's template render. Frequently,
         * the code in this hook will be similar to code in _beforeMount hook.
         * @example
         * <pre>
         *    Control.extend({
         *       ...
         *       _beforeUpdate(newOptions, newContext) {
         *
         *          // Update control's state before template is rerendered.
         *          this.userName = newOptions.firstName + ' ' + newOptions.lastName;
         *          if (newOptions.salary !=== this._options.salary) {
         *             this._recalculateBenefits(newOptions.salary);
         *          }
         *       }
         *       ...
         *    });
         * </pre>
         * @see Documentation: Control lifecycle.
         * @see Documentation: Options.
         * @see Documentation: Context.
         * @private
         */
        /**
         * Control’s lifecycle hook. Called before update of the control.
         *
         * @param {Object} newOptions Options that control received. Old options can be found in this._options.
         * @param {Object} newContext Context that control received. Old context can be found in this._context.
         * @remark In this hook you can compare new and old options and update state of the control.
         * In this hook you would prepare everything needed for control's template render. Frequently,
         * the code in this hook will be similar to code in _beforeMount hook.
         * @example
         * <pre>
         *    Control.extend({
         *       ...
         *       _beforeUpdate(newOptions, newContext) {
         *
         *          // Update control's state before template is rerendered.
         *          this.userName = newOptions.firstName + ' ' + newOptions.lastName;
         *          if (newOptions.salary !=== this._options.salary) {
         *             this._recalculateBenefits(newOptions.salary);
         *          }
         *       }
         *       ...
         *    });
         * </pre>
         * @see Documentation: Control lifecycle.
         * @see Documentation: Options.
         * @see Documentation: Context.
         * @private
         */
        Control.prototype._beforeUpdate = function () {
        };    /**
         * Determines whether control should update. Called every time before control update.
         *
         * @param {Object} newOptions Options that control received. Old options can be found in this._options.
         * @param {Object} newContext Context that control received. Old context can be found in this._context.
         * @returns {Boolean}
         * <ol>
         *    <li>true(default): control will update.</li>
         *    <li>false: control won't update. _afterUpdate hook won't be called.</li>
         * </ol>
         * @example
         * For example, if employeeSalary if the only option used in control's template, you can tell the control
         * to update only if employeeSalary option changes.
         * <pre>
         *    Control.extend({
         *       ...
         *       _shouldUpdate: function(newOptions, newContext) {
         *          if (newOptions.employeeSalary === this._options.employeeSalary) {
         *             return false;
         *          }
         *       }
         *       ...
         *    });
         * </pre>
         * @remark The hook is called after _beforeUpdate hook before templating engine's rebuild of the control.
         * This hook can be used for optimizations. You can compare new and current options and return false if
         * there is no need to recalculate control's DOM tree.
         * @see Documentation: Control lifecycle
         * @see Documentation: Options
         * @see Documentation: Context
         * @see Documentation: Server render
         * @private
         */
        /**
         * Determines whether control should update. Called every time before control update.
         *
         * @param {Object} newOptions Options that control received. Old options can be found in this._options.
         * @param {Object} newContext Context that control received. Old context can be found in this._context.
         * @returns {Boolean}
         * <ol>
         *    <li>true(default): control will update.</li>
         *    <li>false: control won't update. _afterUpdate hook won't be called.</li>
         * </ol>
         * @example
         * For example, if employeeSalary if the only option used in control's template, you can tell the control
         * to update only if employeeSalary option changes.
         * <pre>
         *    Control.extend({
         *       ...
         *       _shouldUpdate: function(newOptions, newContext) {
         *          if (newOptions.employeeSalary === this._options.employeeSalary) {
         *             return false;
         *          }
         *       }
         *       ...
         *    });
         * </pre>
         * @remark The hook is called after _beforeUpdate hook before templating engine's rebuild of the control.
         * This hook can be used for optimizations. You can compare new and current options and return false if
         * there is no need to recalculate control's DOM tree.
         * @see Documentation: Control lifecycle
         * @see Documentation: Options
         * @see Documentation: Context
         * @see Documentation: Server render
         * @private
         */
        Control.prototype._shouldUpdate = function () {
            return true;
        };    /**
         * Control’s lifecycle hook. Called after control was updated.
         *
         * @param {Object} oldOptions Options that control had before the update.
         * Current options can be found in this._options.
         * @param {Object} oldContext Context that control had before the update.
         * Current context can be found in this._context.
         * @remark This lifecycle hook called after control's DOM was updated. At this stage you access
         * control's children and interact with DOM. Frequently, the code in this hook will
         * be similar to code in _afterMount hook.
         * @example
         * <pre>
         *    Control.extend({
         *       ...
         *       _afterUpdate(oldOptions, oldContext) {
         *
         *          // Accessing DOM elements to update control's state.
         *          this.buttonHeight = this._children.myButton.offsetHeight;
         *       }
         *       ...
         *    });
         * </pre>
         * @see Documentation: Control lifecycle
         * @see Documentation: Options
         * @see Documentation: Context
         * @private
         */
        /**
         * Control’s lifecycle hook. Called after control was updated.
         *
         * @param {Object} oldOptions Options that control had before the update.
         * Current options can be found in this._options.
         * @param {Object} oldContext Context that control had before the update.
         * Current context can be found in this._context.
         * @remark This lifecycle hook called after control's DOM was updated. At this stage you access
         * control's children and interact with DOM. Frequently, the code in this hook will
         * be similar to code in _afterMount hook.
         * @example
         * <pre>
         *    Control.extend({
         *       ...
         *       _afterUpdate(oldOptions, oldContext) {
         *
         *          // Accessing DOM elements to update control's state.
         *          this.buttonHeight = this._children.myButton.offsetHeight;
         *       }
         *       ...
         *    });
         * </pre>
         * @see Documentation: Control lifecycle
         * @see Documentation: Options
         * @see Documentation: Context
         * @private
         */
        Control.prototype._afterUpdate = function () {
        };    /**
         * Control’s lifecycle hook. Called before the destruction of the control.
         * @remark This is the last hook of the control's lifecycle. Control will no exist after this hook.
         * It can be used to unsubscribe from server events and clean up anything that was stored in memory.
         * @example
         * <pre>
         *    Control.extend({
         *       ...
         *       _beforeUnmount() {
         *          this._unsubscribeFromMyEvents();
         *       }
         *       ...
         *    });
         * </pre>
         * @see Documentation: Control lifecycle
         * @see Documentation: Options
         * @see Documentation: Context
         * @private
         */
        /**
         * Control’s lifecycle hook. Called before the destruction of the control.
         * @remark This is the last hook of the control's lifecycle. Control will no exist after this hook.
         * It can be used to unsubscribe from server events and clean up anything that was stored in memory.
         * @example
         * <pre>
         *    Control.extend({
         *       ...
         *       _beforeUnmount() {
         *          this._unsubscribeFromMyEvents();
         *       }
         *       ...
         *    });
         * </pre>
         * @see Documentation: Control lifecycle
         * @see Documentation: Options
         * @see Documentation: Context
         * @private
         */
        Control.prototype._beforeUnmount = function () {
        };
        Control.isWasaby = true;
        return Control;
    }();
    Control.prototype._template = template;
    exports.default = Control;
});