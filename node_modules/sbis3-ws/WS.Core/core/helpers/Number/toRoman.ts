/// <amd-module name="Core/helpers/Number/toRoman" />

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
//@ts-ignore
import formatter = require("Types/formatter");
//@ts-ignore
import { IoC } from 'Env/Env';

if (IoC.has('ILogger')) {
   IoC.resolve('ILogger').warn('Core/helpers/Number/toRoman', 'Модуль устарел и будет удален используйте Types/function:toRoman');
}
export = formatter.numberRoman;

