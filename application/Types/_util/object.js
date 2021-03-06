/// <amd-module name="Types/_util/object" />
/**
 * Набор утилит для работы с объектами
 * @public
 * @author Мальцев А.А.
 */
define('Types/_util/object', [
    'require',
    'exports',
    'Types/shim',
    'Core/Serializer'
], function (require, exports, shim_1, Serializer) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    function getPropertyMethodName(property, prefix) {
        return prefix + property.substr(0, 1).toUpperCase() + property.substr(1);
    }    /**
     * Возвращает значение свойства объекта
     * @param object Объект.
     * @param property Название свойства.
     */
    /**
     * Возвращает значение свойства объекта
     * @param object Объект.
     * @param property Название свойства.
     */
    function getPropertyValue(object, property) {
        var checkedProperty = property || '';
        if (!(object instanceof Object)) {
            return undefined;
        }
        if (checkedProperty in object) {
            return object[checkedProperty];
        }
        if (object && object['[Types/_entity/IObject]'] && object.has(checkedProperty)) {
            return object.get(checkedProperty);
        }
        var getter = getPropertyMethodName(checkedProperty, 'get');
        if (typeof object[getter] === 'function' && !object[getter].deprecated) {
            return object[getter]();
        }
        return undefined;
    }    /**
     * Устанавливает значение свойства объекта
     * @param object Объект.
     * @param property Название свойства.
     * @param value Значение свойства.
     */
    /**
     * Устанавливает значение свойства объекта
     * @param object Объект.
     * @param property Название свойства.
     * @param value Значение свойства.
     */
    function setPropertyValue(object, property, value) {
        var checkedProperty = property || '';
        if (!(object instanceof Object)) {
            throw new TypeError('Argument object should be an instance of Object');
        }
        if (checkedProperty in object) {
            object[checkedProperty] = value;
            return;
        }
        if (object && object['[Types/_entity/IObject]'] && object.has(checkedProperty)) {
            object.set(checkedProperty, value);
            return;
        }
        var setter = getPropertyMethodName(checkedProperty, 'set');
        if (typeof object[setter] === 'function' && !object[setter].deprecated) {
            object[setter](value);
            return;
        }
        throw new ReferenceError('Object doesn\'t have setter for property "' + property + '"');
    }    /**
     * Клонирует объект путем сериализации в строку и последующей десериализации.
     * @param original Объект для клонирования
     * @return Клон объекта
     */
    /**
     * Клонирует объект путем сериализации в строку и последующей десериализации.
     * @param original Объект для клонирования
     * @return Клон объекта
     */
    function clone(original) {
        if (original instanceof Object) {
            if (original['[Types/_entity/ICloneable]']) {
                return original.clone();
            } else {
                var serializer = new Serializer();
                return JSON.parse(JSON.stringify(original, serializer.serialize), serializer.deserialize);
            }
        } else {
            return original;
        }
    }    /**
     * Реурсивно клонирует простые простые объекты и массивы. Сложные объекты передаются по ссылке.
     * @param original Объект для клонирования
     * @param [processCloneable=false] Обрабатывать объекты, поддерживающие интерфейс Types/_entity/ICloneable
     * @return Клон объекта
     */
    /**
     * Реурсивно клонирует простые простые объекты и массивы. Сложные объекты передаются по ссылке.
     * @param original Объект для клонирования
     * @param [processCloneable=false] Обрабатывать объекты, поддерживающие интерфейс Types/_entity/ICloneable
     * @return Клон объекта
     */
    function clonePlain(original, processCloneable, processing) {
        var result;
        var checkedProcessing = processing;
        if (!checkedProcessing) {
            checkedProcessing = new shim_1.Set();
        }
        if (checkedProcessing.has(original)) {
            return original;
        }
        if (original instanceof Array) {
            checkedProcessing.add(original);
            result = original.map(function (item) {
                return clonePlain(item, processCloneable, checkedProcessing);
            });
            checkedProcessing.delete(original);
        } else if (original instanceof Object) {
            if (Object.getPrototypeOf(original) === Object.prototype) {
                checkedProcessing.add(original);
                result = {};
                Object.keys(original).forEach(function (key) {
                    result[key] = clonePlain(original[key], processCloneable, checkedProcessing);
                });
                checkedProcessing.delete(original);
            } else if (original['[Types/_entity/ICloneable]']) {
                result = original.clone();
            } else {
                result = original;
            }
        } else {
            result = original;
        }
        return result;
    }
    exports.default = {
        getPropertyValue: getPropertyValue,
        setPropertyValue: setPropertyValue,
        clone: clone,
        clonePlain: clonePlain
    };
});