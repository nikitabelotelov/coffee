/// <amd-module name="Core/helpers/Array/flatten" />
/**
 * Модуль, в котором описана функция <b>flatten(arr)</b>.
 *
 * "Выравнивает" вложенные массивы (любого уровня вложенности), склеивая в одноуровневый массив.
 *
 *
 *
 * @param {Array} arr
 * @returns {Array}
 * @example
 * <pre>
 * flatten([1, [2], [3, [[4]]]]) => [1, 2, 3, 4]
 * </pre>
 */
export = function flatten(arr, skipundefined) {
   let result = [], i, ln = arr.length;
   for (i = 0; i !== ln; i++) {
      if (Array.isArray(arr[i])) {
         result = result.concat(flatten(arr[i], skipundefined));
      } else {
         if (skipundefined && arr[i] === undefined) {
            continue;
         }
         result.push(arr[i]);
      }
   }
   return result;
}
