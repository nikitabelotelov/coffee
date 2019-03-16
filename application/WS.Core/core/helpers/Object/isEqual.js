define('Core/helpers/Object/isEqual', ['Types/object', 'Env/Env'], function(object, Env) {
   /**
    *
    * Модуль, в котором описана функция <b>isEqual(obj1, obj2)</b>,
    *
    * Функция рекурсивно сравнивает два объекта или массива.
    * Объекты считаются равными тогда, когда они равны по оператору ===, или когда они являются plain Object и у них одинаковые наборы внутренних ключей, и по каждому ключу значения равны, причём, если эти значения - объекты или массивы, то они сравниваются рекурсивно.
    * Функция возвращает true, когда оба объекта/массива идентичны.
    *
    * <h2>Параметры функции</h2>
    *
    * <ul>
    *   <li><b>obj1</b> {Object|Array}.</li>
    *   <li><b>obj2</b> {Object|Array}.</li>
    * </ul>
    *
    * <h2>Пример использования</h2>
    * <pre>
    *    require(['Core/helpers/Object/isEqual'], function(isEqual) {
    *
    *       // true
    *       console.log(isEqual({foo: 'bar'}, {foo: 'bar'}));
    *
    *       // false
    *       console.log(isEqual([0], ['0']));
    *    });
    * </pre>
    *
    * @class Core/helpers/Object/isEqual
    * @public
    * @deprecated
    * @author Мальцев А.А.
    */

  if (typeof window !== 'undefined' && Env.IoC.has('ILogger')) {
      Env.IoC.resolve('ILogger').warn('Core/helpers/Object/isEqual', 'Модуль устарел и будет удален используйте Types/object:isEqual');
   }
   return object.isEqual;
});
