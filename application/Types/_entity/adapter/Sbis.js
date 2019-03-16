/// <amd-module name="Types/_entity/adapter/Sbis" />
/**
 * Адаптер для данных в формате СБиС.
 * Работает с форматом данных, который использует БЛ СБИС.
 * Примеры можно посмотреть в модулях {@link Types/_entity/adapter/SbisRecord} и
 * {@link Types/_entity/adapter/SbisTable}.
 * @class Types/_entity/adapter/Sbis
 * @extends Types/_entity/adapter/Abstract
 * @public
 * @author Мальцев А.А.
 */
define('Types/_entity/adapter/Sbis', [
    'require',
    'exports',
    'tslib',
    'Types/_entity/adapter/Abstract',
    'Types/_entity/adapter/SbisTable',
    'Types/_entity/adapter/SbisRecord',
    'Types/_entity/adapter/SbisFieldType',
    'Types/di'
], function (require, exports, tslib_1, Abstract_1, SbisTable_1, SbisRecord_1, SbisFieldType_1, di_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var Sbis = /** @class */
    function (_super) {
        tslib_1.__extends(Sbis, _super);    /** @lends Types/_entity/adapter/Sbis.prototype */
        /** @lends Types/_entity/adapter/Sbis.prototype */
        function Sbis() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        Sbis.prototype.forTable = function (data) {
            return new SbisTable_1.default(data);
        };
        Sbis.prototype.forRecord = function (data) {
            return new SbisRecord_1.default(data);
        };
        Sbis.prototype.getKeyField = function (data) {
            // TODO: primary key field index can be defined in this._data.k. and can be -1
            var index;
            var s;
            if (data && data.s) {
                s = data.s;
                for (var i = 0, l = s.length; i < l; i++) {
                    if (s[i].n && s[i].n[0] === '@') {
                        index = i;
                        break;
                    }
                }
                if (index === undefined && s.length) {
                    index = 0;
                }
            }
            return index === undefined ? undefined : s[index].n;
        };
        Object.defineProperty(Sbis, 'FIELD_TYPE', {
            get: function () {
                return SbisFieldType_1.default;
            },
            enumerable: true,
            configurable: true
        });
        return Sbis;
    }(Abstract_1.default    /** @lends Types/_entity/adapter/Sbis.prototype */);
    /** @lends Types/_entity/adapter/Sbis.prototype */
    exports.default = Sbis;
    Sbis.prototype['[Types/_entity/adapter/Sbis]'] = true;
    Sbis.prototype._moduleName = 'Types/entity:adapter.Sbis';
    di_1.register('Types/entity:adapter.Sbis', Sbis, { instantiate: false });    // Deprecated
    // Deprecated
    di_1.register('adapter.sbis', Sbis);
});