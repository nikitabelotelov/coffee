/// <amd-module name="Core/helpers/Function/callBeforeWithCondition" />
//@ts-ignore
import callBefore = require('Core/helpers/Function/callBefore');

/**
 * Модуль, в котором описана функция <b>callBeforeWithCondition(original, decorator, condition)</b>.
 *
 * Метод обертки функции: вызовет перед исходной функцией дополнительную при выполнении условия.
 * Если дополнительная функция вернула результат, отличный от undefined, то он будет добавлен последним аргументом при вызове исходной.
 *
 * <h2>Параметры функции</h2>
 * <ul>
 *     <li><b>original</b> {Function} - исходная функция, вызов которой нужно обернуть.</li>
 *     <li><b>decorator</b> {Function} - дополнительная функция, которая будет вызвана перед исходной при выполнении условия.</li>
 *     <li><b>condition</b> {Function} - функция, проверяющая выполнение условия. Если вернет результат, приводимый к true, то будет вызвана decorator.</li>
 * </ul>
 *
 * <h2>Возвращает</h2>
 * {Function} Результирующая функция.
 *
 * <h2>Пример использования</h2>
 * <pre>
 *    require(['Core/helpers/Function/callBeforeWithCondition'], function(callBeforeWithCondition) {
 *       var foo = function(bar) {
 *             console.log(`foo: ${bar}`);
 *          },
 *          fooDecorator = callBeforeWithCondition(foo, function(bar) {
 *             console.log(`before foo: ${bar}`);
 *          }, function() {
 *             return this.debugMode;
 *          }),
 *          obj = {
 *             foo: fooDecorator
 *          };
 *
 *       obj.foo('baz');
 *       //foo: baz
 *
 *       obj.debugMode = true;
 *       obj.foo('baz');
 *       //before foo: baz
 *       //foo: baz
 *    });
 * </pre>
 *
 * @class Core/helpers/Function/callBefore
 * @public
 * @author Мальцев А.А.
 */
export = function callBeforeWithCondition(original, decorator, condition) {
   if (arguments.length < 3) {
      condition = decorator;
      decorator = original;
      original = this;
   }

   if (decorator) {
      return callBefore(original, function() {
         if (condition && condition.apply(this, [])) {
            return decorator.apply(this, arguments);
         }
      });
   }
   return original;
}
