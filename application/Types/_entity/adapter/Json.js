/// <amd-module name="Types/_entity/adapter/Json" />
/**
 * Адаптер для данных в формате JSON.
 * Работает с данными, представленными в виде обычных JSON объектов.
 * Примеры можно посмотреть в модулях {@link Types/Adapter/JsonRecord} и {@link Types/Adapter/JsonTable}.
 * @class Types/Adapter/Json
 * @extends Types/Adapter/Abstract
 * @public
 * @author Мальцев А.А.
 */
define('Types/_entity/adapter/Json', [
    'require',
    'exports',
    'tslib',
    'Types/_entity/adapter/Abstract',
    'Types/_entity/adapter/JsonTable',
    'Types/_entity/adapter/JsonRecord',
    'Types/di'
], function (require, exports, tslib_1, Abstract_1, JsonTable_1, JsonRecord_1, di_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var Json = /** @class */
    function (_super) {
        tslib_1.__extends(Json, _super);    /** @lends Types/Adapter/Json.prototype */
        /** @lends Types/Adapter/Json.prototype */
        function Json() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        Json.prototype.forTable = function (data) {
            return new JsonTable_1.default(data);
        };
        Json.prototype.forRecord = function (data) {
            return new JsonRecord_1.default(data);
        };
        Json.prototype.getKeyField = function () {
            return undefined;
        };
        return Json;
    }(Abstract_1.default    /** @lends Types/Adapter/Json.prototype */);
    /** @lends Types/Adapter/Json.prototype */
    exports.default = Json;
    Json.prototype['[Types/_entity/adapter/Json]'] = true;
    Json.prototype._moduleName = 'Types/entity:adapter.Json';
    di_1.register('Types/entity:adapter.Json', Json, { instantiate: false });    //FIXME: deprecated
    //FIXME: deprecated
    di_1.register('adapter.json', Json);
});