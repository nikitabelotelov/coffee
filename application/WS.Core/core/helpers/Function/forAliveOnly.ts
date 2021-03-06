/// <amd-module name="Core/helpers/Function/forAliveOnly" />

'use strict';

/**
 * Оборачивает указанную функцию в функцию, проверяющую, удалён ли указанный в аргументе control контрол.
 * Если control не задан, то используется обычный this (предполагается, что функция будет вызываться на этом контроле).
 * Если контрол удалён (его метод isDestroyed() возвращает true), то функция func вызываться не будет.
 *
 * <h2>Параметры функции</h2>
 * <ul>
 *     <li><b>func</b> {Function} - функция, которая будет работать только на живом контроле.</li>
 *     <li><b>[control]</b> {Lib/Control/Control} - ссылка на контрол. Если не указана, то используется this (такой вариант удобно использовать для оборачивания методов контрола).</li>
 * </ul>
 *
 * <h2>Возвращает</h2>
 * {Function} Результирующая функция.
 *
 * @class Core/helpers/Function/forAliveOnly
 * @public
 * @author Мальцев А.А.
 */
export = function forAliveOnly(func, control) {
   const result = function() {
      const self = control || this;
      if (!self.isDestroyed()) {
         return func.apply(self, arguments);
      }
   };
   //@ts-ignore
   result.wrappedFunction = func;
   return result;
}
