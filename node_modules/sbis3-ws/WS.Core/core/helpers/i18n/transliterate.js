define('Core/helpers/i18n/transliterate', [
   'Types/formatter',
   'Env/Env'
], function(formatter, Env) {

   /**
    * Выполняет транслитерацию строки. Заменяет пробелы на _, вырезает мягкий и твердый знаки.
    * @param {String} string Исходная строка для преобразования.
    * @deprecated
    * @returns {String}
    */
  if (typeof window !== 'undefined' && Env.IoC.has('ILogger')) {
      Env.IoC.resolve('ILogger').warn('Core/helpers/Number/toRoman', 'Модуль устарел и будет удален используйте Types/formatter:cyrTranslit');
   }
   return formatter.cyrTranslit;
});
