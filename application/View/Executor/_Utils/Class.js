/// <amd-module name="View/Executor/_Utils/Class" />
define('View/Executor/_Utils/Class', [
    'require',
    'exports'
], function (require, exports) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    function removeDuplicates(array) {
        for (var i = 0; i < array.length; ++i) {
            for (var j = i + 1; j < array.length; ++j) {
                if (array[i] === array[j]) {
                    array.splice(j--, 1);
                }
            }
        }
        return array;
    }
    function removeClassDuplicates(classStr) {
        var classArray = classStr.split(/\s+/);
        classArray = classArray.filter(function (str) {
            return str != '';
        });
        classArray = removeDuplicates(classArray);
        classStr = classArray.join(' ');
        return classStr;
    }
    exports.removeClassDuplicates = removeClassDuplicates;
});