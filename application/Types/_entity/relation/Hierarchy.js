/// <amd-module name="Types/_entity/relation/Hierarchy" />
/**
 * Класс, предоставляющий возможность построить иерархические отношения.
 *
 * Организуем работу с иерархическим каталогом товаров:
 * <pre>
 *    //Создадим экземпляр иерархических отношений и рекордсет
 *    var hierarchy = new Hierarchy({
 *          idProperty: 'id',
 *          parentProperty: 'parent',
 *          nodeProperty: 'parent@',
 *          declaredChildrenProperty: 'parent$'
 *       }),
 *       catalogue = new RecordSet({
 *          rawData: [
 *             {id: 1, parent: null, 'parent@': true, 'parent$': true, title: 'Computers'},
 *             {id: 2, parent: 1, 'parent@': true, 'parent$': false, title: 'Mac'},
 *             {id: 3, parent: 1, 'parent@': true, 'parent$': true, title: 'PC'},
 *             {id: 4, parent: null, 'parent@': true, 'parent$': true, title: 'Smartphones'},
 *             {id: 5, parent: 3, 'parent@': false, title: 'Home Station One'},
 *             {id: 6, parent: 3, 'parent@': false, title: 'Home Station Two'},
 *             {id: 7, parent: 4, 'parent@': false, title: 'Apple iPhone 7'},
 *             {id: 8, parent: 4, 'parent@': false, title: 'Samsung Galaxy Note 7'}
 *          ]
 *       });
 *
 *    //Проверим, является ли узлом запись 'Computers'
 *    hierarchy.isNode(catalogue.at(0));//true
 *
 *    //Проверим, является ли узлом запись 'Apple iPhone 7'
 *    hierarchy.isNode(catalogue.at(6));//false
 *
 *    //Получим все записи узла 'PC' (по значению ПК узла)
 *    hierarchy.getChildren(3, catalogue);//'Home Station One', 'Home Station Two'
 *
 *    //Получим все записи узла 'Smartphones' (по узлу)
 *    hierarchy.getChildren(catalogue.at(3), catalogue);//'Apple iPhone 7', 'Samsung Galaxy Note 7'
 *
 *    //Получим родительский узел для товара 'Home Station One' (по значению ПК товара)
 *    hierarchy.getParent(5, catalogue);//'PC'
 *
 *    //Получим родительский узел для узла 'Mac' (по узлу)
 *    hierarchy.getParent(catalogue.at(1), catalogue);//'Computers'
 *
 *    //Проверим, есть ли декларируемые потомки в узле 'Computers'
 *    hierarchy.hasDeclaredChildren(catalogue.at(0));//true
 *
 *    //Проверим, есть ли декларируемые потомки в узле 'Mac'
 *    hierarchy.hasDeclaredChildren(catalogue.at(1));//false
 * </pre>
 *
 * @class Types/_entity/relation/Hierarchy
 * @mixes Types/_entity/DestroyableMixin
 * @mixes Types/_entity/OptionsMixin
 * @public
 * @author Мальцев А.А.
 */
define('Types/_entity/relation/Hierarchy', [
    'require',
    'exports',
    'tslib',
    'Types/_entity/DestroyableMixin',
    'Types/_entity/OptionsToPropertyMixin',
    'Types/util'
], function (require, exports, tslib_1, DestroyableMixin_1, OptionsToPropertyMixin_1, util_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var Hierarchy = /** @class */
    function (_super) {
        tslib_1.__extends(Hierarchy, _super);    /** @lends Types/_entity/relation/Hierarchy.prototype */
        /** @lends Types/_entity/relation/Hierarchy.prototype */
        function Hierarchy(options) {
            var _this = _super.call(this, options) || this;
            OptionsToPropertyMixin_1.default.call(_this, options);
            return _this;
        }    // region Public methods
             /**
         * Возвращает название свойства, содержащего идентификатор узла.
         * @return {String}
         * @see idProperty
         * @see setIdProperty
         */
        // region Public methods
        /**
         * Возвращает название свойства, содержащего идентификатор узла.
         * @return {String}
         * @see idProperty
         * @see setIdProperty
         */
        Hierarchy.prototype.getIdProperty = function () {
            return this._$idProperty;
        };    /**
         * Устанавливает название свойства, содержащего идентификатор узла.
         * @param {String} idProperty
         * @see idProperty
         * @see getIdProperty
         */
        /**
         * Устанавливает название свойства, содержащего идентификатор узла.
         * @param {String} idProperty
         * @see idProperty
         * @see getIdProperty
         */
        Hierarchy.prototype.setIdProperty = function (idProperty) {
            this._$idProperty = idProperty;
        };    /**
         * Возвращает название свойства, содержащего идентификатор родительского узла.
         * @return {String}
         * @see parentProperty
         * @see setParentProperty
         */
        /**
         * Возвращает название свойства, содержащего идентификатор родительского узла.
         * @return {String}
         * @see parentProperty
         * @see setParentProperty
         */
        Hierarchy.prototype.getParentProperty = function () {
            return this._$parentProperty;
        };    /**
         * Устанавливает название свойства, содержащего идентификатор родительского узла.
         * @param {String} parentProperty
         * @see parentProperty
         * @see getParentProperty
         */
        /**
         * Устанавливает название свойства, содержащего идентификатор родительского узла.
         * @param {String} parentProperty
         * @see parentProperty
         * @see getParentProperty
         */
        Hierarchy.prototype.setParentProperty = function (parentProperty) {
            this._$parentProperty = parentProperty;
        };    /**
         * Возвращает название свойства, содержащего признак узла.
         * @return {String}
         * @see nodeProperty
         * @see setNodeProperty
         */
        /**
         * Возвращает название свойства, содержащего признак узла.
         * @return {String}
         * @see nodeProperty
         * @see setNodeProperty
         */
        Hierarchy.prototype.getNodeProperty = function () {
            return this._$nodeProperty;
        };    /**
         * Устанавливает название свойства, содержащего признак узла.
         * @param {String} nodeProperty
         * @see nodeProperty
         * @see getNodeProperty
         */
        /**
         * Устанавливает название свойства, содержащего признак узла.
         * @param {String} nodeProperty
         * @see nodeProperty
         * @see getNodeProperty
         */
        Hierarchy.prototype.setNodeProperty = function (nodeProperty) {
            this._$nodeProperty = nodeProperty;
        };    /**
         * Возвращает название свойства, содержащего декларируемый признак наличия детей.
         * @return {String}
         * @see declaredChildrenProperty
         * @see setDeclaredChildrenProperty
         */
        /**
         * Возвращает название свойства, содержащего декларируемый признак наличия детей.
         * @return {String}
         * @see declaredChildrenProperty
         * @see setDeclaredChildrenProperty
         */
        Hierarchy.prototype.getDeclaredChildrenProperty = function () {
            return this._$declaredChildrenProperty;
        };    /**
         * Устанавливает название свойства, содержащего декларируемый признак наличия детей.
         * @param {String} declaredChildrenProperty
         * @see declaredChildrenProperty
         * @see getDeclaredChildrenProperty
         */
        /**
         * Устанавливает название свойства, содержащего декларируемый признак наличия детей.
         * @param {String} declaredChildrenProperty
         * @see declaredChildrenProperty
         * @see getDeclaredChildrenProperty
         */
        Hierarchy.prototype.setDeclaredChildrenProperty = function (declaredChildrenProperty) {
            this._$declaredChildrenProperty = declaredChildrenProperty;
        };    /**
         * Проверяет, является ли запись узлом.
         * Возвращаемые значения:
         * <ul>
         *   <li><em>true</em>: запись является узлом</li>
         *   <li><em>false</em>: запись скрытым листом</li>
         *   <li><em>null</em>: запись является листом</li>
         * </ul>
         * @param {Types/_entity/Record} record
         * @return {Boolean|null}
         * @see nodeProperty
         */
        /**
         * Проверяет, является ли запись узлом.
         * Возвращаемые значения:
         * <ul>
         *   <li><em>true</em>: запись является узлом</li>
         *   <li><em>false</em>: запись скрытым листом</li>
         *   <li><em>null</em>: запись является листом</li>
         * </ul>
         * @param {Types/_entity/Record} record
         * @return {Boolean|null}
         * @see nodeProperty
         */
        Hierarchy.prototype.isNode = function (record) {
            return record.get(this._$nodeProperty);
        };    /**
         * Возвращает список детей для указанного родителя.
         * @param {Types/_entity/Record|Sting|Number} parent Родительский узел или его идентификатор
         * @param {Types/_collection/RecordSet} rs Рекордсет
         * @return {Array.<Types/_entity/Record>}
         * @see nodeProperty
         */
        /**
         * Возвращает список детей для указанного родителя.
         * @param {Types/_entity/Record|Sting|Number} parent Родительский узел или его идентификатор
         * @param {Types/_collection/RecordSet} rs Рекордсет
         * @return {Array.<Types/_entity/Record>}
         * @see nodeProperty
         */
        Hierarchy.prototype.getChildren = function (parent, rs) {
            if (!this._$parentProperty) {
                return parent === null || parent === undefined ? function () {
                    var result = [];
                    rs.each(function (item) {
                        result.push(item);
                    });
                    return result;
                }() : [];
            }
            var parentId = this._asField(parent, this._$idProperty);
            var indices = rs.getIndicesByValue(this._$parentProperty, parentId);
            var children = [];    // If nothing found by that property value, return all if null(root) requested
            // If nothing found by that property value, return all if null(root) requested
            if (indices.length === 0 && parentId === null) {
                indices = rs.getIndicesByValue(this._$parentProperty);
            }
            for (var i = 0; i < indices.length; i++) {
                children.push(rs.at(indices[i]));
            }
            return children;
        };    /**
         *
         * Возвращает признак наличия декларируемых детей.
         * @param {Types/_entity/Record} record
         * @return {Boolean}
         * @see declaredChildrenProperty
         */
        /**
         *
         * Возвращает признак наличия декларируемых детей.
         * @param {Types/_entity/Record} record
         * @return {Boolean}
         * @see declaredChildrenProperty
         */
        Hierarchy.prototype.hasDeclaredChildren = function (record) {
            return record.get(this._$declaredChildrenProperty);
        };    /**
         * Возвращает признак наличия родителя для указанного дочернего узла.
         * @param {Types/_entity/Record|Sting|Number} child Дочерний узел или его идентификатор
         * @param {Types/_collection/RecordSet} rs Рекордсет
         * @return {Boolean}
         * @see nodeProperty
         */
        /**
         * Возвращает признак наличия родителя для указанного дочернего узла.
         * @param {Types/_entity/Record|Sting|Number} child Дочерний узел или его идентификатор
         * @param {Types/_collection/RecordSet} rs Рекордсет
         * @return {Boolean}
         * @see nodeProperty
         */
        Hierarchy.prototype.hasParent = function (child, rs) {
            child = this._asRecord(child, rs);
            var parentId = child.get(this._$parentProperty);
            var idProperty = this._$idProperty || rs.getIdProperty();
            var index = rs.getIndexByValue(idProperty, parentId);
            return index > -1;
        };    /**
         * Возвращает родителя для указанного дочернего узла.
         * Если записи с указанным идентификатором нет - кидает исключение.
         * Если узел является корневым, возвращает null.
         * @param {Types/_entity/Record|Sting|Number} child Дочерний узел или его идентификатор
         * @param {Types/_collection/RecordSet} rs Рекордсет
         * @return {Types/_entity/Record|Null}
         * @see nodeProperty
         */
        /**
         * Возвращает родителя для указанного дочернего узла.
         * Если записи с указанным идентификатором нет - кидает исключение.
         * Если узел является корневым, возвращает null.
         * @param {Types/_entity/Record|Sting|Number} child Дочерний узел или его идентификатор
         * @param {Types/_collection/RecordSet} rs Рекордсет
         * @return {Types/_entity/Record|Null}
         * @see nodeProperty
         */
        Hierarchy.prototype.getParent = function (child, rs) {
            child = this._asRecord(child, rs);
            var parentId = child.get(this._$parentProperty);
            return parentId === undefined || parentId === null ? null : this._asRecord(parentId, rs);
        };    // endregion Public methods
              // region Protected methods
              /**
         * Возвращает инстанс записи
         * @param {Types/_entity/Record|Sting|Number} value Запись или ее ПК
         * @param {Types/_collection/RecordSet} rs Рекордсет
         * @return {Types/_entity/Record}
         * @protected
         */
        // endregion Public methods
        // region Protected methods
        /**
         * Возвращает инстанс записи
         * @param {Types/_entity/Record|Sting|Number} value Запись или ее ПК
         * @param {Types/_collection/RecordSet} rs Рекордсет
         * @return {Types/_entity/Record}
         * @protected
         */
        Hierarchy.prototype._asRecord = function (value, rs) {
            if (value && value['[Types/_entity/Record]']) {
                return value;
            }
            var idProperty = this._$idProperty || rs.getIdProperty();
            var index = rs.getIndexByValue(idProperty, value);
            if (index === -1) {
                throw new ReferenceError(this._moduleName + ': record with id "' + value + '" does not found in the recordset');
            }
            return rs.at(index);
        };    /**
         * Возвращает значение поля записи
         * @param {Types/_entity/Record|Sting|Number} value Запись или значение ее поля
         * @param {String} field Имя поля
         * @return {*}
         * @protected
         */
        /**
         * Возвращает значение поля записи
         * @param {Types/_entity/Record|Sting|Number} value Запись или значение ее поля
         * @param {String} field Имя поля
         * @return {*}
         * @protected
         */
        Hierarchy.prototype._asField = function (value, field) {
            if (!(value && value['[Types/_entity/Record]'])) {
                return value;
            }
            return value.get(field);
        };
        return Hierarchy;
    }(util_1.mixin(DestroyableMixin_1.default, OptionsToPropertyMixin_1.default)    /** @lends Types/_entity/relation/Hierarchy.prototype */);
    /** @lends Types/_entity/relation/Hierarchy.prototype */
    exports.default = Hierarchy;
    Hierarchy.prototype['[Types/_entity/relation/Hierarchy]'] = true;
    Hierarchy.prototype._$idProperty = '';
    Hierarchy.prototype._$parentProperty = '';
    Hierarchy.prototype._$nodeProperty = '';
    Hierarchy.prototype._$declaredChildrenProperty = '';
});