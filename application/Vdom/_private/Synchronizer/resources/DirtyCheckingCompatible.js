/// <amd-module name="Vdom/_private/Synchronizer/resources/DirtyCheckingCompatible" />
define('Vdom/_private/Synchronizer/resources/DirtyCheckingCompatible', [
    'require',
    'exports',
    'View/Executor/Utils',
    'View/Executor/TClosure'
], function (require, exports, Utils_1, tclosure) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });    /**
     * Created by dv.zuev on 10.10.2017.
     */
    /**
     * Created by dv.zuev on 10.10.2017.
     */
    function createCompoundControlNode(controlClass_, controlCnstr, userOptions, internalOptions, key, parentNode, vnode) {
        return Utils_1.Compatible.createCompoundControlNode(controlClass_, controlCnstr, [], // вложенные v-ноды (их нет у только что созданного контрола)
        userOptions, internalOptions, key, parentNode, vnode, tclosure.getMarkupGenerator(false));
    }
    exports.createCompoundControlNode = createCompoundControlNode;
    function clearNotChangedOptions(options, actualChanges) {
        if (options) {
            delete options.editingTemplate;
            delete options.columns;
            delete options.itemContentTpl;
            delete options.dictionaries;
        }    // If option is marked as updated, but its value didn't actually change, remove
             // it from the list of updated options
        // If option is marked as updated, but its value didn't actually change, remove
        // it from the list of updated options
        for (var key in options) {
            if (options.hasOwnProperty(key) && !actualChanges.hasOwnProperty(key)) {
                delete options[key];
            }
        }
        return options;
    }
    exports.clearNotChangedOptions = clearNotChangedOptions;
});