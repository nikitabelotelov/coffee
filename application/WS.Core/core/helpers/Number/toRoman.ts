/// <amd-module name="Core/helpers/Number/toRoman" />

const boundaries = {
   M: 1000,
   CM: 900,
   D: 500,
   CD: 400,
   C: 100,
   XC: 90,
   L: 50,
   XL: 40,
   X: 10,
   IX: 9,
   V: 5,
   IV: 4,
   I: 1
};

/**
 * Функция, переводящая арабское число в римское.
 *
 * Параметры:
 * <ul>
 *     <li>{Number} num Арабское число.</li>
 * </ul>
 *
 * @class Core/helpers/Number/toRoman
 * @public
 * @author Мальцев А.А.
 */
export = function toRoman(num) {
   let result = '';

   for (const key in boundaries) {
      if (boundaries.hasOwnProperty(key)) {
         while (num >= boundaries[key]) {
            result += key;
            num -= boundaries[key];
         }
      }
   }

   return result;
}
