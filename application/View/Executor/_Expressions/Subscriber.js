/// <amd-module name="View/Executor/_Expressions/Subscriber" />
define('View/Executor/_Expressions/Subscriber', [
    'require',
    'exports'
], function (require, exports) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });    /**
     * Create function for event binding.
     *
     * @param func - function for launch
     * @param ctx - context launching
     * @param args - arguments for mix
     * @returns {Function}
     */
    /**
     * Create function for event binding.
     *
     * @param func - function for launch
     * @param ctx - context launching
     * @param args - arguments for mix
     * @returns {Function}
     */
    function getBindFunc(func, args) {
        return function () {
            var argsForLaunch = [], i;
            for (i = 0; i < arguments.length; i++) {
                argsForLaunch.push(arguments[i]);
            }
            for (i = 0; i < args.length; i++) {
                argsForLaunch.push(args[i]);
            }
            func.apply(undefined, argsForLaunch);
        };
    }
    exports.getBindFunc = getBindFunc;    /**
     * Extract events from options object.
     *
     * @param _options
     * @returns {{}}
     */
    /**
     * Extract events from options object.
     *
     * @param _options
     * @returns {{}}
     */
    function getEventsListFromOptions(_options) {
        var eventsList = {};
        for (var key in _options) {
            if (_options.hasOwnProperty(key)) {
                if (key.indexOf('event:') === 0) {
                    eventsList[key] = _options[key];
                }
            }
        }
        return eventsList;
    }
    exports.getEventsListFromOptions = getEventsListFromOptions;    /**
     * Iterate over event objects in event list.
     *
     * @param eventsList
     * @param func
     *    - executes for each (key, object) pair
     */
    /**
     * Iterate over event objects in event list.
     *
     * @param eventsList
     * @param func
     *    - executes for each (key, object) pair
     */
    function forEventObjects(eventsList, func) {
        for (var key in eventsList) {
            if (eventsList.hasOwnProperty(key)) {
                var value = eventsList[key];
                for (var i = 0; i < value.length; i++) {
                    func(key, value[i]);
                }
            }
        }
    }
    exports.forEventObjects = forEventObjects;    /**
     * Subscribe instance to all events in the list.
     *
     * @param inst
     * @param parent
     * @param eventsList
     */
    /**
     * Subscribe instance to all events in the list.
     *
     * @param inst
     * @param parent
     * @param eventsList
     */
    function subscribeEvents(inst, parent, eventsList) {
        forEventObjects(eventsList, function (key, eventObject) {
            if (eventObject.fn) {
                eventObject.bindedFunc = getBindFunc(eventObject.fn, eventObject.args);
                inst.subscribe(key.split(':')[1], eventObject.bindedFunc);
            }
        });
    }
    exports.subscribeEvents = subscribeEvents;    /**
     * Unsubscribe instance from all events in the list.
     *
     * @param inst
     * @param parent
     * @param eventsList
     */
    /**
     * Unsubscribe instance from all events in the list.
     *
     * @param inst
     * @param parent
     * @param eventsList
     */
    function unsubscribeEvents(inst, parent, eventsList) {
        forEventObjects(eventsList, function (key, eventObject) {
            if (eventObject.bindedFunc) {
                inst.unsubscribe(key.split(':')[1], eventObject.bindedFunc);
            }
        });
    }
    exports.unsubscribeEvents = unsubscribeEvents;    /**
     * Apply events to the given instance:
     *    1. Subscribe events to the instance
     *    2. Unsubscribe events when instance is destroyed
     *
     * @param inst
     * @param parent
     * @param eventsList
     */
    /**
     * Apply events to the given instance:
     *    1. Subscribe events to the instance
     *    2. Unsubscribe events when instance is destroyed
     *
     * @param inst
     * @param parent
     * @param eventsList
     */
    function applyEvents(inst, parent, eventsList) {
        subscribeEvents(inst, parent, eventsList);
        inst.once && inst.once('onDestroy', function () {
            unsubscribeEvents(inst, parent, eventsList);
        });
    }
    exports.applyEvents = applyEvents;
});