define('Lib/Control/Dialog/Dialog', ['Lib/Control/Window/Window', 'Lib/Control/ModalOverlay/ModalOverlay'], function(Window) {

   'use strict';

   /**
    * Модуль "Компонент Модальный диалог".
    * Активный модальный диалог может быть только один. Все остальное скрыто и недоступно для взаимодействия.
    *
    * @class Lib/Control/Dialog/Dialog
    * @extends Lib/Control/Window/Window
    * @author Крайнов Д.О.
    * @public
    */
   var Dialog = Window.extend(/** @lends Lib/Control/Dialog/Dialog.prototype */{
      $protected : {
         _options: {
             /**
              * @cfg {Boolean} Модальный ли диалог
              * @example
              * <pre>
              *     <option name="modal">false</option>
              * </pre>
              */
            modal: true
         }
      }
   });

   return Dialog;
});
