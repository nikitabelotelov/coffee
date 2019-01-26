/// <amd-module name="Types/_entity/format/IntegerField" />
/**
 * Формат целочисленного поля.
 *
 * Создадим поле челочисленного типа:
 * <pre>
 *    var field = {
 *       name: 'foo',
 *       type: 'integer'
 *    };
 * </pre>
 * @class Types/Format/IntegerField
 * @extends Types/Format/Field
 * @public
 * @author Мальцев А.А.
 */

import Field from './Field';

export default class IntegerField extends Field /** @lends Types/Format/IntegerField.prototype */{
   _$defaultValue: number;
}

IntegerField.prototype['[Types/_entity/format/IntegerField]'] = true;
IntegerField.prototype._moduleName = 'Types/entity:format.IntegerField';
IntegerField.prototype._typeName = 'Integer';
IntegerField.prototype._$defaultValue = 0;
