/* global define */
define('WS.Data/Format/TextField', [
   'WS.Data/Format/StringField',
   'WS.Data/Utils'
], function(
   StringField,
   Utils
) {
   'use strict';

   /**
    * Формат поля для строк.
    * @class WS.Data/Format/TextField
    * @extends WS.Data/Format/StringField
    * @public
    * @deprecated Модуль удален в 3.18.10, используйте {@link WS.Data/Format/StringField}
    * @author Мальцев А.А.
    */

   Utils.logger.error('WS.Data/Format/TextField', 'Module has been removed in 3.18.10. Use WS.Data/Format/StringField instead.');
   return StringField;
});