/* global define, Date */
define('Core/helpers/Date/fromSql', [
   'Types/formatter',
   'Env/Env'
], function(
   formatter,
   Env
) {
   'use strict';

   /**
    * @public
    * @deprecated
    * @author Мальцев А.А.
    */

   /**
    * Создает дату из строки даты в формате SQL. Если строка содержит информацию о времени, то оно будет приведено к местному.
    * @function
    * @deprecated
    * @name Core/helpers/Date#fromSQL
    * @param {String} dateTime Дата и/или время в формате SQL
    * @param {Number} [defaultTimeZone] Использовать указанная временную зону (смещение относительно часового пояса UTC в минутах), если в строке временная зона не задана.
    * @return {Date}
    */
  if (typeof window !== 'undefined' && Env.IoC.has('ILogger')) {
      Env.IoC.resolve('ILogger').warn('Core/helpers/Date/fromSql', 'Модуль устарел и будет удален');
   }

   return formatter.dateFromSql;
});
