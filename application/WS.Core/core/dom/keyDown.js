define('Core/dom/keyDown', [
   'Env/Env'
], function(Env) {
   //MOVE_TO КРАЙНОВ

   /**
    * Устанавливает обработчик на событие keydown.
    * @remark
    * Для одинаковой обработки событий в разных браузерах.
    * Актуально для старых версий, например, Opera до 12.10.
    * @param {jQuery} object Объект, на который вешается обработчик события нажатия клавиши.
    * @param {Function} callback Функция, которая сработает при нажатии клавиши.
    * @see checkCapsLock
    * @see wheel
    * @see getTouchEventCoords
    * @see getTouchEventClientCoords
    */
   return function (object, callback) {
      object[Env.constants.compatibility.correctKeyEvents ? 'keydown' : 'keypress'](function (e) {
         if (!Env.constants.compatibility.correctKeyEvents) {
            if (e.which === e.keyCode) {
               if (e.which >= 97 && e.which <= 122) {
                  e.which = e.keyCode - 32;
               }
               else if (e.which in Env.constants.operaKeys) {
                  e.which = Env.constants.key[Env.constants.operaKeys[e.which]];
               }
            }
            if (e.which === 0) {
               e.which = e.keyCode;
            }
            e.keyCode = e.which;
         }
         callback(e);
      });
   };
});
