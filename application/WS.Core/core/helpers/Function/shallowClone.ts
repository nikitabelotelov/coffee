/// <amd-module name="Core/helpers/Function/shallowClone" />
//@ts-ignore
import  merge = require('Core/core-merge');

/**
 *
 * Модуль, в котором описана функция <b>shallowClone(hash)</b>.
 *
 * Функция, делающая поверхностное (без клонирования вложенных объектов и массивов) копирование объекта или массива. Сделана на основе <strong>$ws.core.merge</strong>.
 *
 * <h2>Параметры функции</h2>
 * <ul>
 *     <li><b>hash</b> {Object|Array} - исходный объект или массив.</li>
 * </ul>
 *
 * <h2>Возвращает</h2>
 * Скопированный объект или массив.
 *
 * @class Core/helpers/Function/shallowClone
 * @public
 * @author Мальцев А.А.
 */

export = function(hash) {
   let result;
   if (Array.isArray(hash)) {
      result = hash.slice(0);
   } else {
      result = merge({}, hash, { clone: false, rec: false });
   }
   return result;
}
