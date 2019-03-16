/// <amd-module name="Types/_entity/format/IdentityField" />
/**
 * Формат поля для идентификатора.
 *
 * Создадим поле c типом "Идентификатор":
 * <pre>
 *    var field = {
 *       name: 'foo',
 *       type: 'identity'
 *    };
 * </pre>
 * @class Types/_entity/format/IdentityField
 * @extends Types/_entity/format/Field
 * @public
 * @author Мальцев А.А.
 */

import Field from './Field';

export default class IdentityField extends Field /** @lends Types/_entity/format/IdentityField.prototype */{
   /**
    * @cfg {Array.<Number>} Значение поля по умолчанию
    * @name Types/_entity/format/IdentityField#defaultValue
    * @see getDefaultValue
    * @see setDefaultValue
    */
   _$defaultValue: any[];

   _separator: string;

   // region Public methods

   /**
    * Возвращает разделитель
    * @return {String}
    */
   getSeparator(): string {
      return this._separator;
   }

   // endregion Public methods
}

IdentityField.prototype['[Types/_entity/format/IdentityField]'] = true;
IdentityField.prototype._moduleName = 'Types/entity:format.IdentityField';
IdentityField.prototype._typeName = 'Identity';
IdentityField.prototype._separator = ',';
IdentityField.prototype._$defaultValue = [null];
