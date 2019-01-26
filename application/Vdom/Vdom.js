/// <amd-module name="Vdom/Vdom" />
define('Vdom/Vdom', [
    'require',
    'exports',
    'Vdom/_private/Synchronizer/resources/Debug',
    'Vdom/_private/Synchronizer/resources/DirtyChecking',
    'Vdom/_private/Synchronizer/resources/DirtyCheckingCompatible',
    'Vdom/_private/Synchronizer/resources/Hooks',
    'Vdom/_private/Synchronizer/resources/SwipeController',
    'Vdom/_private/Synchronizer/resources/TabIndex',
    'Vdom/_private/Synchronizer/resources/VdomMarkup',
    'Vdom/_private/Utils/DefaultOpenerFinder',
    'Vdom/_private/Utils/Focus',
    'Vdom/_private/Utils/Functional',
    'Vdom/_private/Utils/Monad',
    'Core/IoC',
    'Vdom/_private/Synchronizer/Synchronizer',
    'Vdom/_private/Synchronizer/resources/DOMEnvironment',
    'Vdom/_private/Synchronizer/resources/Environment',
    'Vdom/_private/Synchronizer/resources/runDelayedRebuild',
    'Vdom/_private/Synchronizer/resources/SyntheticEvent'
], function (require, exports, Debug, DirtyChecking, DirtyCheckingCompatible, Hooks, SwipeController, TabIndex, VdomMarkup, DefaultOpenerFinder, Focus, Functional, Monad, IoC, Synchronizer_1, DOMEnvironment_1, Environment_1, runDelayedRebuild_1, SyntheticEvent_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    exports.Debug = Debug;
    exports.DirtyChecking = DirtyChecking;
    exports.DirtyCheckingCompatible = DirtyCheckingCompatible;
    exports.Hooks = Hooks;
    exports.SwipeController = SwipeController;
    exports.TabIndex = TabIndex;
    exports.VdomMarkup = VdomMarkup;
    exports.DefaultOpenerFinder = DefaultOpenerFinder;
    exports.Focus = Focus;
    exports.Functional = Functional;
    exports.Monad = Monad;
    exports.Synchronizer = Synchronizer_1.default;
    exports.DOMEnvironment = DOMEnvironment_1.default;
    exports.Environment = Environment_1.default;
    exports.runDelayedRebuild = runDelayedRebuild_1.default;
    exports.SyntheticEvent = SyntheticEvent_1.default;
    function logDeprecatedWrapper(oldModuleName, newFieldName) {
        IoC.resolve('ILogger').warn('Vdom/Vdom', '"' + oldModuleName + '" wrapper is deprecated and will be removed. Require ' + ('"Vdom/Vdom" and use ' + newFieldName + ' from it instead.'));
    }
    exports.logDeprecatedWrapper = logDeprecatedWrapper;
});