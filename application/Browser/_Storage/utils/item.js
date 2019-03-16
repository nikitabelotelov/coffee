define('Browser/_Storage/utils/item', [
    'require',
    'exports',
    'Core/helpers/Object/isPlainObject',
    'Core/Serializer'
], function (require, exports, isPlainObject, Serializer) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });    // Экземпляр сериализатора
    // Экземпляр сериализатора
    var serializer = new Serializer();    /**
     * Сериализация даных перед записью в хранилище
     * @param {*} item
     * @return {String}
     * @private
     */
    /**
     * Сериализация даных перед записью в хранилище
     * @param {*} item
     * @return {String}
     * @private
     */
    exports.serialize = function (item) {
        var json = item;    /*
         * У объектов Types/entity.* и Types/collections.* перед сереализацией необходимо вызвать toJSON
         * Для корректрой работы серилизации и обратной десерилизации в Record|Model|RecordSet|...
         */
        /*
         * У объектов Types/entity.* и Types/collections.* перед сереализацией необходимо вызвать toJSON
         * Для корректрой работы серилизации и обратной десерилизации в Record|Model|RecordSet|...
         */
        if (item && typeof item.toJSON === 'function') {
            json = item.toJSON();
        }
        try {
            /**
             * Core/Serializer не умеет нормально сериализовывать сложные объекты,
             * инстансы каких-либо классов (не прямой потомок Object)
             */
            if (!json || isPlainObject(json)) {
                return JSON.stringify(json, serializer.serialize);
            }
            return JSON.stringify(json);
        } catch (err) {
            return '' + json;
        }
    };    /**
     * Десериализация данных
     * @param {String} item
     * @return {*}
     * @private
     */
    /**
     * Десериализация данных
     * @param {String} item
     * @return {*}
     * @private
     */
    exports.deserialize = function (item) {
        if (!item) {
            return null;
        }
        var result;
        try {
            result = JSON.parse(item, serializer.deserialize);
        } catch (err) {
            return item;
        }
        return result;
    };
});