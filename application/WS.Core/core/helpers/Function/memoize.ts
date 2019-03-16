/// <amd-module name="Core/helpers/Function/memoize" />

'use strict';

/**
  * Возвращает функцию, запоминающую результат первого вызова оборачиваемого метода объекта и возврашающую при повторных вызовах единожды вычисленный результат.
  *
  * <h2>Параметры функции</h2>
  * <ul>
  *     <li><b>func</b> {Function} - Метод, результат вызова которого будет запомнен.</li>
  *     <li><b>cachedFuncName</b> {String} - Имя метода в экземпляре объекта, которому он принадлежит.</li>
  * </ul>
  *
  * <h2>Возвращает</h2>
  * {Function} Результирующая функция.
  *
  * @class Core/helpers/Function/memoize
  * @public
  * @author Мальцев А.А.
  */
interface cached extends Function{
   reset?();
}

interface wrapFn extends Function{
   reset?();
   wrappedFunction?();
}

interface memoize extends Function{
   clear?(instance:any);
}
const memoize:memoize = function(func, cachedFuncName) {
   var wrapFn:wrapFn = function memoFirst() {
      let res = func.call(this),
         cached:cached = function memoCached() {
            return res;
         };

      cached.reset = function() {
         addToMemoized(this, cachedFuncName, wrapFn);
         res = undefined;
      }.bind(this);

      addToMemoized(this, cachedFuncName, cached);
      return res;
   };

   wrapFn.reset = function() {};
   wrapFn.wrappedFunction = func;

   return wrapFn;
};

var addToMemoized = function(instance, name, impl) {
   instance[name] = impl;
   const memoizedMethods = instance._memoizedMethods || (instance._memoizedMethods = []);
   if (memoizedMethods.indexOf(name) === -1) {
      memoizedMethods.push(name);
   }
};

const clearMemoized = function(instance) {
   if (instance._memoizedMethods) {
      instance._memoizedMethods.forEach((name) => {
         if (instance[name] && instance[name].reset) {
            instance[name].reset();
         }
      });
   }
   delete instance._memoizedMethods;
};

memoize.clear = clearMemoized;

export = memoize;
