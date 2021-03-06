/// <amd-module name="Core/helpers/Array/clone" />
//@ts-ignore
import merge = require('Core/core-merge');

/**
 * Модуль, в котором описана функция <b>clone(array)</b>.
 *
 * Создает копию не только основного массива, как делает slice, но также создает копию внутренних массивов и объектов.
 *
 * <h2>Параметры функции</h2>
 * <ul>
 *     <li><b>array</b> {Array} - массив.</li>
 * </ul>
 *
 * <h2>Возвращает</h2>
 * Возвращает копию массива.
 *
 * @class Core/helpers/Array/clone
 * @public
 * @author Мальцев А.А.
 */
// ws: ws/lib/Control/DataViewAbstract/plugins/Print-plugin.js, рекорд, рекордсет
// контролы: SBIS3.CONTROLS/Mixins/MultiSelectable, components/OperationsPanel/OperationsPanel-components/OperationMerge/resources/MergeDialogTemplate/MergeDialogTemplate.module.js
export = function clone(array) {
   const plainProto = Object.prototype;
   const copy = array.slice();

   for (let i = 0, l = copy.length; i < l; i++) {
      const item = copy[i];
      if (item) {
         if (Array.isArray(item)) {
            copy[i] = clone(item);
         } else if (typeof item === 'object' && Object.getPrototypeOf(item) === plainProto) {
            const obj = copy[i] = merge({}, item);
            for (const j in obj) {
               if (obj.hasOwnProperty(j) && Array.isArray(obj[j])) {
                  obj[j] = clone(obj[j]);
               }
            }
         }
      }
   }

   return copy;
}
