/// <amd-module name="Types/_source/provider" />
/**
 * Data providers library
 * @library Types/source:provider
 * @includes IAbstract Types/_source/provider/IAbstract
 * @includes IChannel Types/_source/provider/IChannel
 * @includes INotify Types/_source/provider/INotify
 * @includes SbisBusinessLogic Types/_source/provider/SbisBusinessLogic
 * @author Мальцев А.А.
 */
define('Types/_source/provider', [
    'require',
    'exports',
    'Types/_source/provider/IAbstract',
    'Types/_source/provider/IChannel',
    'Types/_source/provider/INotify',
    'Types/_source/provider/SbisBusinessLogic'
], function (require, exports, IAbstract_1, IChannel_1, INotify_1, SbisBusinessLogic_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    exports.IAbstract = IAbstract_1.default;
    exports.IChannel = IChannel_1.default;
    exports.INotify = INotify_1.default;
    exports.SbisBusinessLogic = SbisBusinessLogic_1.default;
});