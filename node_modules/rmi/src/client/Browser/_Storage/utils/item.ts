/// <amd-module name="Browser/_Storage/utils/item" />
// @ts-ignore
import isPlainObject = require("Core/helpers/Object/isPlainObject");
// @ts-ignore
import Serializer = require("Core/Serializer");

// Экземпляр сериализатора
let serializer = new Serializer();

/**
 * Сериализация даных перед записью в хранилище
 * @param {*} item
 * @return {String}
 * @private
 */
export let serialize = (item: any): string => {
    let json = item;
    /*
     * У объектов Types/entity.* и Types/collections.* перед сереализацией необходимо вызвать toJSON
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
};

/**
 * Десериализация данных
 * @param {String} item
 * @return {*}
 * @private
 */
export let deserialize = (item: string): any => {
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
};
