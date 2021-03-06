/// <amd-module name="Core/helpers/Function/callIf" />
/**
 *
 * Модуль, в котором описана функция <b>callIf(original, condition)</b>.
 *
 * Метод обертки функции: вызовет исходную функцию при выполнении условия.
 *
 * <h2>Параметры функции</h2>
 * <ul>
 *     <li><b>original</b> {Function} - исходная функция, вызов которой нужно обернуть.</li>
 *     <li><b>condition</b> {Function} - функция, проверяющая выполнение условия. Если вернет результат, приводимый к true, то будет вызвана original.</li>
 * </ul>
 *
 * <h2>Возвращает</h2>
 * {Function} Результирующая функция.
 *
 * <h2>Пример использования</h2>
 * <pre>
 *    require(['Core/helpers/Function/callIf'], function(callIf) {
 *       var foo = function(bar) {
 *             console.log(`foo: ${bar}`);
 *          },
 *          fooDecorator = callIf(foo, function() {
 *             return !this.testingMode;
 *          }),
 *          obj = {
 *             foo: fooDecorator
 *          };
 *
 *       obj.foo('baz');
 *       //foo: baz
 *
 *       obj.testingMode = true;
 *       obj.foo('baz');
 *       //
 *    });
 * </pre>
 *
 * @class Core/helpers/Function/callIf
 * @public
 * @author Мальцев А.А.
 */
export = function callIf(original, condition) {
   if (arguments.length < 2) {
      condition = original;
      original = this;
   }

   return function() {
      if (condition && condition.apply(this, [])) {
         return original.apply(this, arguments);
      }
   };
}
