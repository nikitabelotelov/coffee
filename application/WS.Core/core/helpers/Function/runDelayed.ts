/// <amd-module name="Core/helpers/Function/runDelayed" />

/**
 * Модуль, в котором описана функция <b>runDelayed(fn)</b>.
 *
 * Метод Вызывает функцию асинхронно, через requestAnimationFrame, или на крайний случай setTimeout
 *
 * <h2>Параметры функции</h2>
 * <ul>
 *     <li><b>fn</b> {Function} - исходная функция, вызов которой нужно асинхронно.</li>
 * </ul>
 *
 * @class Core/helpers/Function/runDelayed
 * @public
 * @author Мальцев А.А.
 */
export = function runDelayed(fn) {
   const win = typeof window !== 'undefined' ? window : null;
   if (win && win.requestAnimationFrame) {
      win.requestAnimationFrame(fn);
   } else {
      setTimeout(fn, 0);
   }
}
