/// <amd-module name="Core/helpers/Function/callNextWithCondition" />
//@ts-ignore
import callNext = require('Core/helpers/Function/callNext');

/**
 * Модуль, в котором описана функция <b>callNextWithCondition(original, decorator, condition)</b>.
 *
 * Метод обертки функции: вызовет после исходной функцией дополнительную при выполнении условия.
 * Результат вызова исходной функции будет добавлен последним аргументом при вызове дополнительной.
 * Если дополнительная функция вернула результат, отличный от undefined, то он и будет результатом работы результирующей функции.
 *
 * <h2>Параметры функции</h2>
 * <ul>
 *     <li><b>original</b> {Function} - исходная функция, вызов которой нужно обернуть.</li>
 *     <li><b>decorator</b> {Function} - дополнительная функция, которая будет вызвана после исходной при выполнении условия.</li>
 *     <li><b>condition</b> {Function} - функция, проверяющая выполнение условия. Если вернет результат, приводимый к true, то будет вызвана decorator.</li>
 * </ul>
 *
 * <h2>Возвращает</h2>
 * {Function} Результирующая функция.
 *
 * <h2>Пример использования</h2>
 * <pre>
 *    require(['Core/helpers/Function/callNextWithCondition'], function(callNextWithCondition) {
 *       var foo = function(bar) {
 *             console.log(`foo: ${bar}`);
 *             return 'foo+' + bar;
 *          },
 *          fooDecorator = callNextWithCondition(foo, function(bar, fooResult) {
 *             console.log(`after foo: ${bar} with ${fooResult}`);
 *          }, function() {
 *             return this.debugMode;
 *          }),
 *          obj = {
 *             foo: fooDecorator
 *          };
 *
 *       console.log(obj.foo('baz'));
 *       //foo: baz
 *       //foo+baz
 *
 *       obj.debugMode = true;
 *       console.log(obj.foo('baz'));
 *       //foo: baz
 *       //after foo: baz with foo+baz
 *       //foo+baz
 *    });
 * </pre>
 *
 * @class Core/helpers/Function/callNextWithCondition
 * @public
 * @author Мальцев А.А.
 */
export = function callNextWithCondition(original, decorator, condition) {
   if (arguments.length < 3) {
      condition = decorator;
      decorator = original;
      original = this;
   }

   if (decorator) {
      return callNext(original, function() {
         if (condition && condition.apply(this, [])) {
            return decorator.apply(this, arguments);
         }
      });
   }
   return original;
}
