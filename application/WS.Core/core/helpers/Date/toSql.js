/* global define, Date */
define('Core/helpers/Date/toSql', [
   'Types/formatter',
   'Env/Env'
], function(formatter, Env) {
   'use strict';

   /**
    * @public
    * @deprecated
    * @author Мальцев А.А.
    */
  if (typeof window !== 'undefined' && Env.IoC.has('ILogger')) {
      Env.IoC.resolve('ILogger').warn('Core/helpers/Date/toSql', 'Модуль устарел и будет удален используйте Types/formatter:date');
   }
   /**
    * @typedef {String} SerializeMode
    * @variant MODE_DATETIME Дата в время
    * @variant MODE_DATE Дата
    * @variant MODE_TIME Время
    *
   /**
    * Приводит объект Date() к строке, содержащей дату в формате SQL.
    * @function
    * @deprecated
    * @name Core/helpers/Date/toSql
    * @param {Date} date Дата
    * @param {SerializeMode} [mode=MODE_DATETIME] Режим сериализации.
    * @return {String}
    */
   function toSQL(date, mode) {
      return formatter.dateToSql(date, mode);
   }

   toSQL.MODE_DATETIME = formatter.TO_SQL_MODE.DATETIME;
   toSQL.MODE_DATE = formatter.TO_SQL_MODE.DATE;
   toSQL.MODE_TIME = formatter.TO_SQL_MODE.TIME;

   return toSQL;
});
