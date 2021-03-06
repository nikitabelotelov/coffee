/// <amd-module name="View/Executor/_Expressions/Rights" />
define('View/Executor/_Expressions/Rights', [
    'require',
    'exports',
    'Core/RightsManager',
    'Core/helpers/Object/isPlainObject',
    'Env/Env'
], function (require, exports, RightsManager, isPlainObject, Env_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var entityRightsHandlers = {
        object: {
            getMinAccessLevel: function (object, minLevelDefault) {
                var minAccessLevel;
                if (typeof object['data-access-min-level'] !== 'undefined') {
                    minAccessLevel = object['data-access-min-level'];
                } else if (typeof object['dataAccessMinLevel'] !== 'undefined') {
                    Env_1.IoC.resolve('ILogger').info('entityHelpers', 'Для задания минимального уровня доступа для опции, используйте data-access-min-level вместо dataAccessMinLevel.');
                    minAccessLevel = object['dataAccessMinLevel'];
                }
                if (typeof minAccessLevel === 'string') {
                    minAccessLevel = parseInt(minAccessLevel, 10);
                }
                if (typeof minAccessLevel !== 'number' || isNaN(minAccessLevel)) {
                    // если полученный minAccessLevel - не число, возвращаемся ко значению по умолчанию
                    minAccessLevel = minLevelDefault;
                }
                return minAccessLevel;
            },
            isAccessible: function (object, minLevel) {
                var accessString, access;
                if (typeof minLevel === 'undefined') {
                    minLevel = 1;
                }
                access = minLevel;
                if (typeof object['data-access'] !== 'undefined') {
                    accessString = object['data-access'];
                } else if (typeof object['dataAccess'] !== 'undefined') {
                    Env_1.IoC.resolve('ILogger').info('entityHelpers', 'Для задания зоны доступа для опции, используйте data-access вместо dataAccess.');
                    accessString = object['dataAccess'];
                }
                if (typeof accessString === 'string') {
                    access = RightsManager.checkAccessRights(accessString.split(','));
                }
                return access >= minLevel;
            },
            iterate: function (object, callback) {
                for (var key in object) {
                    if (object.hasOwnProperty(key)) {
                        callback(object[key], key, object);
                    }
                }
                return object;
            },
            remove: function (object, key) {
                var desc = Object.getOwnPropertyDescriptor(object, key);
                if (desc.configurable) {
                    // Configurable properties can be removed using 'delete'
                    delete object[key];
                } else if (desc.set) {
                    // Non-configurable properties (for example defined with Object.defineProperty)
                    // can not be removed with delete. If it has a setter, we can set it to be
                    // undefined
                    object[key] = undefined;
                }
            }
        },
        array: {
            getMinAccessLevel: function (array, minLevel) {
                return minLevel;
            },
            isAccessible: function () {
                return true;
            },
            iterate: function (array, callback) {
                for (var i = array.length - 1; i >= 0; i--) {
                    callback(array[i], i, array);
                }
                return array;
            },
            remove: function (array, index) {
                array.splice(index, 1);
            }
        }
    };    /**
     * Обходим существующие бинды контрола. Ищем связи с опциями. Если есть бинд на опцию, а опции нет - удалим такой бинд.
     * Исключниями являются бинды которые не смотрят на опции контрола.
     * Опция компонента может быть вырезана правами.
     */
    /**
     * Обходим существующие бинды контрола. Ищем связи с опциями. Если есть бинд на опцию, а опции нет - удалим такой бинд.
     * Исключниями являются бинды которые не смотрят на опции контрола.
     * Опция компонента может быть вырезана правами.
     */
    function removeBindCutOption(controlData) {
        var isPath = false, whiteList = [], pathTemp, bindings, bindItem, urlBind;
        if (controlData && controlData.bindings && controlData.bindings.length) {
            bindings = controlData.bindings;    // Осуществляем обход по биндам контрола
            // Осуществляем обход по биндам контрола
            for (var bindNumber = 0, bindlength = bindings.length; bindNumber < bindlength; bindNumber++) {
                isPath = false;
                pathTemp = controlData;
                bindItem = bindings[bindNumber];    // Если есть путь до опции, разберем его на массив
                // Если есть путь до опции, разберем его на массив
                if (bindItem.propPath && bindItem.propPath.length) {
                    urlBind = bindItem.propName.split('/');
                } else {
                    urlBind = [];
                }    // Отсутствие пути у бинда значит, что он забинден не на опцию компонента. Такой бинд сразу пропускаем.
                // Отсутствие пути у бинда значит, что он забинден не на опцию компонента. Такой бинд сразу пропускаем.
                if (urlBind.length) {
                    // Пытаемся пройти по опциям контрола используя путь который вытащили из бинда
                    for (var i = 0, urlLength = urlBind.length; i < urlLength; i++) {
                        if (pathTemp.hasOwnProperty(urlBind[i])) {
                            pathTemp = pathTemp[urlBind[i]];
                            if (i + 2 === urlLength) {
                                // Удалось пройти по пути, опция не удалена.
                                isPath = true;
                            }
                        } else {
                            break;
                        }
                    }
                } else {
                    isPath = true;
                }
                if (isPath) {
                    // Если опция не удалена или бинд смотрит не на опцию контрола - добавляем бинд в белый список
                    whiteList.push(bindings[bindNumber]);
                }
            }    // Заменим массив биндов на "проверенный" массив биндов
            // Заменим массив биндов на "проверенный" массив биндов
            controlData.bindings = whiteList;
        }
    }
    exports.removeBindCutOption = removeBindCutOption;
    ;
    function applyRightsToEntity(entity, minAccessLevel) {
        var typeHandler;
        if (Array.isArray(entity)) {
            typeHandler = entityRightsHandlers.array;
        } else if (isPlainObject(entity)) {
            typeHandler = entityRightsHandlers.object;
        } else {
            return entity;
        }
        minAccessLevel = typeHandler.getMinAccessLevel(entity, minAccessLevel);
        if (!typeHandler.isAccessible(entity, minAccessLevel)) {
            return undefined;
        }
        entity = typeHandler.iterate(entity, function (value, index, scope) {
            if (value && value['__isRightsChecked']) {
                return;
            }
            if (isPlainObject(value)) {
                /**
                 * Патчим объект "незаметно" для других.
                 * Методы перебора не заметят нового свойства, а по прямому прозвону мы его увидим
                 * в ИЕ работает :)
                 */
                Object.defineProperty(value, '__isRightsChecked', {
                    enumerable: false,
                    value: true
                });
            }
            scope[index] = applyRightsToEntity(value, minAccessLevel);
            if (scope[index] === undefined) {
                typeHandler.remove(scope, index);
            }
        });
        return entity;
    }
    exports.applyRightsToEntity = applyRightsToEntity;
    function applyRights(attrs, controlData) {
        var attr = attrs && (attrs['data-access'] || attrs['attr:data-access']), rightsNeeded = RightsManager.rightsNeeded();
        if (attr && rightsNeeded) {
            switch (RightsManager.checkAccessRights(attr.split(','))) {
            case 0:
                return false;
            case 1:
                // Меняем права если "только для чтения", иначе отдадим как есть
                var displayNode = controlData['display'];
                if (displayNode) {
                    controlData['readOnly'] = true;
                    controlData['enabled'] = true;
                    controlData['allowChangeEnable'] = false;
                } else {
                    controlData['enabled'] = false;
                    controlData['allowChangeEnable'] = false;
                }
                return true;
            }
        }
        applyRightsToEntity(controlData, 1);    // Если по правам были удалены какие-то опции контрола, проверим, нет ли биндинга на эти опции. При обнаружении таких связей - удалим.
        // Если по правам были удалены какие-то опции контрола, проверим, нет ли биндинга на эти опции. При обнаружении таких связей - удалим.
        removeBindCutOption(controlData);
        return true;
    }
    exports.applyRights = applyRights;
});