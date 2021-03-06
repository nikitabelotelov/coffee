/// <amd-module name="Vdom/_private/Synchronizer/resources/Hooks" />
define('Vdom/_private/Synchronizer/resources/Hooks', [
    'require',
    'exports',
    'View/Executor/Expressions',
    'Env/Env'
], function (require, exports, Expressions_1, Env_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    function getEventHandlerBase(eventDescr) {
        function eventUtil(event) {
            var evArgs = event.nativeEvent && event.nativeEvent.args || [], args = evArgs.concat(eventDescr.args);
            eventDescr.fn.apply(eventDescr.controlNode.control, [event].concat(args));
            var res = event.nativeEvent.result;
            if (res && res.then) {
                res.then(function () {
                    eventDescr.controlNode.requestDirtyCheck(eventDescr.controlNode);
                });
            } else {
                eventDescr.controlNode.requestDirtyCheck(eventDescr.controlNode);
            }
            return [
                eventDescr.controlNode.control,
                event
            ];
        }
        if (eventDescr.name === 'event') {
            return eventUtil;
        } else {
            throw new Error('getEventHandlerBase: wrong event type');
        }
    }
    var ControlNodeHook = /** @class */
    function () {
        function ControlNodeHook(controlNode) {
            this.type = 'ControlNodeHook';
            this.controlNode = controlNode;
        }
        return ControlNodeHook;
    }();
    exports.ControlNodeHook = ControlNodeHook;
    var NamedNodeHook = /** @class */
    function () {
        function NamedNodeHook(name, control) {
            this.nameForNode = name;
            this.control = control;
        }
        NamedNodeHook.hookName = 'named-hook';
        NamedNodeHook.attributeName = 'name';
        NamedNodeHook.restrictedTags = {
            component: true,
            option: true
        };
        return NamedNodeHook;
    }();
    exports.NamedNodeHook = NamedNodeHook;
    var FocusPropsNodeHook = /** @class */
    function () {
        function FocusPropsNodeHook(name, value) {
            this.propName = name;
            this.value = value;
        }
        return FocusPropsNodeHook;
    }();
    exports.FocusPropsNodeHook = FocusPropsNodeHook;
    function updateControlNodes(element, controlNode, fn) {
        var controlNodes = element && element['controlNodes'] || [], controlNodeIdx = controlNodes.indexOf(controlNode);
        fn(controlNodes, controlNodeIdx);
        if (element) {
            element['controlNodes'] = controlNodes;
        }
        for (var i = 0; i < controlNodes.length; i++) {
            controlNodes[i]['element'] = element;
            if (Env_1.constants.compat) {
                controlNodes[i].control.saveOptions(controlNodes[i].control._options, controlNodes[i]);
            } else {
                controlNodes[i].control._container = element;
            }
        }
    }
    function sortControlNodes(controlNodes) {
        var params = controlNodes.slice(0);
        params.sort(function (node1, node2) {
            var id1 = parseInt((node1.id + '').replace('inst_', ''), 10), id2 = parseInt((node2.id + '').replace('inst_', ''), 10);
            if (id1 > id2) {
                return -1;
            }
            if (id1 < id2) {
                return 1;
            }
            return 0;
        });
        params.unshift(params.length);
        params.unshift(0);
        controlNodes.splice.apply(controlNodes, params);
    }
    function setControlNodeHook(controlNode) {
        return function (tagName, props, children, key, controlNode, ref) {
            var controlRef = function controlRef(element) {
                if (element) {
                    if (this.environment._destroyed) {
                        return;
                    }
                    if (ref) {
                        ref(element);
                    }
                    if (this.controlNode.markup && this.controlNode.markup.type === 'invisible-node') {
                        addEventsToElement(this.controlNode, this.controlNode.events, this.controlNode.environment, element);
                    }
                    updateControlNodes(element, this.controlNode, function (controlNodes, controlNodeIdx) {
                        var haveNode = controlNodeIdx !== -1;
                        if (!haveNode) {
                            controlNodes.push(this.controlNode);
                            sortControlNodes(controlNodes);
                        }
                    }.bind(this));
                } else {
                    updateControlNodes(this.controlNode.control._container[0], this.controlNode, function (controlNodes, controlNodeIdx) {
                        var haveNode = controlNodeIdx !== -1;
                        if (haveNode) {
                            controlNodes.splice(controlNodeIdx, 1);
                        }
                    }.bind(this));
                }
            }.bind({
                controlNode: controlNode,
                environment: controlNode.environment
            });
            return [
                tagName,
                props,
                children,
                key,
                controlRef ? controlRef : ref
            ];
        };
    }
    exports.setControlNodeHook = setControlNodeHook;    ///////////////////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////
    function reverseArray(arr) {
        arr = arr.arguments || arr;
        var ln = arr.length, result = new Array(ln), j = ln - 1, i;
        if (typeof ln !== 'number') {
            throw new Error('reverseArray - wrong arg');
        }
        for (i = 0; i !== ln; i++) {
            result[j] = arr[i];
            j--;
        }
        return result;
    }    ///////////////////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////
    function BubblingPhaseEventHook(eventName, eventDescrArr) {
        this.eventName = eventName;
        this.eventDescrArr = eventDescrArr;
        this.handlerFn = null;
    }
    BubblingPhaseEventHook.prototype.type = 'BubblingPhaseEventHook';    ///////////////////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////
    function CapturePhaseEventHook(eventName, eventDescrArr, environment, controlNode) {
        this.eventName = eventName;
        this.environment = environment;
        this.eventDescrArr = eventDescrArr.map(function (val) {
            val.controlNode = controlNode;
            return val;
        });
    }
    CapturePhaseEventHook.prototype.type = 'CapturePhaseEventHook';    ///////////////////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////
    function eventDescrAttach(elementEvents, eventDescrArr) {
        return elementEvents.filter(function (event) {
            return eventDescrArr[0] && eventDescrArr[0].value === event.value;
        });
    }    /**
     * Let's add controlNode event properties to dom element
     * @param controlNode
     * @param events
     * @param environment
     * @param element
     */
    /**
     * Let's add controlNode event properties to dom element
     * @param controlNode
     * @param events
     * @param environment
     * @param element
     */
    function addEventsToElement(controlNode, events, environment, element) {
        var elementEvents;
        for (var propName in events) {
            if (events.hasOwnProperty(propName)) {
                var propVal = events[propName], eventName = Expressions_1.Event.getEventName(propName), eventDescrArr = propVal.map(function (val) {
                        val.controlNode = controlNode;
                        return val;
                    });
                if (!(propVal instanceof CapturePhaseEventHook) && !(propVal instanceof BubblingPhaseEventHook)) {
                    if (!element.eventProperties) {
                        element.eventProperties = {};
                        element.eventPropertiesCnt = 0;
                    }    /**
                     * Invisible node should be attached to the parent dom node even if there're other events attached on the
                     * same node
                     */
                    /**
                     * Invisible node should be attached to the parent dom node even if there're other events attached on the
                     * same node
                     */
                    if (element.eventProperties[propName]) {
                        elementEvents = eventDescrAttach(element.eventProperties[propName], eventDescrArr);
                        if (element.eventProperties[propName] && elementEvents.length === 0) {
                            eventDescrArr = eventDescrArr.concat(element.eventProperties[propName]);
                        }
                    }
                    element.eventProperties[propName] = eventDescrArr;
                    element.eventPropertiesCnt++;
                    environment.addCaptureEventHandler(eventName, element);
                }
            }
        }
    }
    function setEventHooks(domEnvironment) {
        return function (tagName, props, children, key, controlNode, ref) {
            var haveEvents = Object.keys(props.events).length > 0, eventRef;
            if (haveEvents) {
                eventRef = function (element) {
                    var cnt;
                    if (element) {
                        // Do not execute event hooks if environment is already destroyed
                        if (this.environment._destroyed) {
                            return;
                        }
                        ref(element);
                        addEventsToElement(this.controlNode, this.events, this.environment, element);
                    } else {
                        ref();
                        for (var propName in this.events) {
                            if (this.events.hasOwnProperty(propName)) {
                                var propVal = this.events[propName], eventName = Expressions_1.Event.getEventName(propName), eventDescrArr = propVal.map(function (val) {
                                        val.controlNode = controlNode;
                                        return val;
                                    }), newProp;
                                if (!(propVal instanceof CapturePhaseEventHook) && !(propVal instanceof BubblingPhaseEventHook)) {
                                    cnt = this.controlNode.control._container[0];
                                    this.environment.removeCaptureEventHandler(eventName, cnt);
                                    if (cnt && cnt.eventProperties) {
                                        delete cnt.eventProperties[this.eventName];
                                        cnt.eventPropertiesCnt--;
                                        if (cnt.eventPropertiesCnt === 0) {
                                            delete cnt.eventPropertiesCnt;
                                            delete cnt.eventProperties;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }.bind({
                    environment: domEnvironment,
                    controlNode: controlNode,
                    events: props.events
                });
            }
            return [
                tagName,
                props,
                children,
                key,
                eventRef ? eventRef : ref
            ];
        };
    }
    exports.setEventHooks = setEventHooks;
});