/// <amd-module name="Lib/Storage/utils/item" />

import isPlainObject = require("Core/helpers/Object/isPlainObject");
import Serializer = require("Core/Serializer");

// Экземпляр сериализатора
let serializer = new Serializer();

export = {
    /**
     * Сериализация даных перед записью в хранилище
     * @param {*} item
     * @return {String}
     * @private
     */
    serialize(item: any): string {
        let json = item;
        /*
         * У объектов Types/entity.* и Types/collection.* перед сереализацией необходимо вызвать toJSON
         * Для корректрой работы серилизации и обратной десерилизации в Record|Model|RecordSet|...
         */
        if (item && typeof item.toJSON === "function") {
            json = item.toJSON();
        }
        try {
            /**
             * Core/Serializer не умеет нормально сериализовывать сложные объекты,
             * инстансы каких-либо классов (не прямой потомок Object)
             */
            if (!json || isPlainObject(json)) {
                return JSON.stringify(json, serializer.serialize)
            }
            return JSON.stringify(json);
        }
        catch (err) {
            return "" + json;

        }
    },
    /**
     * Десериализация данных
     * @param {String} item
     * @return {*}
     * @private
     */
    deserialize(item: string): any {
        if (!item) {
            return null;
        }
        let result;
        try {
            result = JSON.parse(item, serializer.deserialize);
        }
        catch (err) {
            return item;
        }
        return result;
    }
}
