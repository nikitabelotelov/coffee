/* global define, Date */
define('Core/helpers/Date/format', [
   'Types/formatter',
   'Env/Env'
], function(
   formatter,
   Env
) {
   'use strict';

  if (typeof window !== 'undefined' && Env.IoC.has('ILogger')) {
      Env.IoC.resolve('ILogger').warn('Core/helpers/Date/format', 'Модуль устарел и будет удален используйте Types/formatter:date');
   }

   return formatter.date;
});
