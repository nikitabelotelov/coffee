/// <amd-module name="Core/helpers/Function/callNext" />
/**
 * Модуль, в котором описана функция <b>callNext(original, decorator)</b>.
 *
 * Метод обертки функции: вызовет после исходной функцией дополнительную.
 * Результат вызова исходной функции будет добавлен последним аргументом при вызове дополнительной.
 * Если дополнительная функция вернула результат, отличный от undefined, то он и будет результатом работы результирующей функции.
 *
 * <h2>Параметры функции</h2>
 * <ul>
 *     <li><b>original</b> {Function} - исходная функция, вызов которой нужно обернуть.</li>
 *     <li><b>decorator</b> {Function} - Дополнительная функция, которая будет вызвана после исходной.</li>
 * </ul>
 *
 * <h2>Возвращает</h2>
 * {Function} Результирующая функция.
 *
 * <h2>Пример использования</h2>
 * <pre>
 *    require(['Core/helpers/Function/callNext'], function(callNext) {
 *       var foo = function(bar) {
 *             console.log(`foo: ${bar}`);
 *             return 'foo+' + bar;
 *          },
 *          fooDecorator = callNext(foo, function(bar, fooResult) {
 *             console.log(`after foo: ${bar} with ${fooResult}`);
 *          });
 *
 *       console.log(fooDecorator('baz'));
 *       //foo: baz
 *       //after foo: baz with foo+baz
 *       //foo+baz
 *    });
 * </pre>
 * @class Core/helpers/Function/callNext
 * @public
 * @author Мальцев А.А.
 */
export = function callNext(original, decorator) {
   if (arguments.length < 2) {
      decorator = original;
      original = this;
   }

   return function() {
      let originalResult = original.apply(this, arguments),
         decoratorResult;
      if (decorator) {
         Array.prototype.push.call(arguments, originalResult);
         decoratorResult = decorator.apply(this, arguments);
      }
      return decoratorResult === undefined ? originalResult : decoratorResult;
   };
}
