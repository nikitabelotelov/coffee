/**
 * Модуль "Компонент SimpleDialogAbstract".
 *
 * @description
 */
define('Lib/Control/ModalOverlay/ModalOverlay', [
   "Core/WindowManager",
   "Core/Abstract",
   'Core/helpers/isNewEnvironment',
   "css!Lib/Control/ModalOverlay/ModalOverlay"
], function(WindowManager, cAbstract, isNewEnvironment) {

   "use strict";

   /**
    * Задний фон (overlay) для модального диалога.
    *
    * @author Крайнов Д.О.
    * @class Lib/Control/ModalOverlay/ModalOverlay
    * @extends Core/Abstract
    * @public
    * @singleton
    * @deprecated
    */
   var ModalOverlay = new (cAbstract.extend(/** @lends Lib/Control/ModalOverlay/ModalOverlay.prototype */{
      /**
       * @event onOverlayToggle Событие, происходящее при смене состояния оверлея (показан/скрыт)
       * @param {Boolean} state Текущее состояние, true = показан, false = скрыт
       */
      /**
       * @event onClick Событие на клик по оверлею
       * @param {Env/Event:Object} eventObject Дескриптор события.
       * @param {object} originalEvent Оригинальное событие, пришедшее в обработчик из jquery
       */
      $protected: {
         _overlay : undefined,
         _overlayState : false
      },
      $constructor: function() {
         this._publish('onOverlayToggle', 'onClick');
      },
      _createOverlay: function() {
         if (this._overlay === undefined) {
            // если элемент уже лежит в верстке, то берем его, иначе создаем новый
            var overlay = $('.ws-window-overlay');
            if (overlay.length) {
               this._overlay = overlay;
            } else {
               this._overlay = $('<div></div>')
                  .appendTo(document.body)
                  .hide()
                  .addClass('ws-window-overlay');

               // в 19.100 на вдомной странице будет всегда показываться вдомный индикатор
               // По новым стандартам клик по оверлею не закрывает окно
               if (isNewEnvironment()) {
                  this._overlay.on('mousedown', function(e) { e.preventDefault()})
               }
            }
            this._overlay.click(function(e){
               var window = WindowManager.getActiveWindow();
               if(window){
                  window.onBringToFront(); //возвращаем курсор в активный диалог
               }
               var res = this._notify('onClick', e);
               if (res) {
                  e.stopPropagation();
               }
            }.bind(this));
         }
      },
      _setZIndex: function(index) {
         if (this._overlay !== undefined) {
            this._overlay.css('z-index', index);
         }
      },
      getZIndex: function () {
         return (this._overlay && this._overlay.css('z-index')) || 0;
      },

      /**
       * Определяет, показан ли модальный оверлей для окна ("принадлежит" ему).
       * Это значит, что он лежит точно под этим окном (его z-index меньше z-index окна на единицу).
       * @param Lib/Control/AreaAbstract/AreaAbstract win
       * @returns {boolean}
       */
      isShownForWindow: function(win) {
         return (win.getZIndex() - this.getZIndex()) === 1;
      },
      _show: function() {
         if(this._overlayState !== true) {
            this._createOverlay();
            this._overlay.show();
            this._notify('onOverlayToggle', this._overlayState = true);
         }
         if (!WindowManager.isMaximizedWindowExists()) {
            this._overlay.css('right', $('body').css('margin-right'));
         }
      },
      /**
       * Скрыть оверлей. При этом  оверлей не уничтожается, чтобы в следующий раз быстреть отобразиться
       */
      _hide : function() {
         if (this._overlay !== undefined) {
            if(this._overlayState !== false) {
               this._overlay.hide();
               this._notify('onOverlayToggle', this._overlayState = false);
            }
         }
      },
      /**
       * Передвигает оверлей под самое верхнее модальное окно
       *
       * Для управления уровнем оверлея
       * используйте {@link WindowManager#acquireZIndex} и {@link WindowManager#releaseZIndex}
       * @returns {Boolean} true если оверлей остался видимым, false - если скрыт
       */
      adjust: function(modalIndex) {
         modalIndex = modalIndex || WindowManager.getMaxVisibleZIndex();
         if(modalIndex > 0) {
            this._show();
            this._setZIndex(modalIndex - 1);
            return true;
         } else {
            this._hide();
            return false;
         }
      },
      /**
       * Метод для получения текущегно состояния оверлея
       * @returns {Boolean}
       */
      getState: function() {
         return this._overlayState;
      }
   }))();

   return ModalOverlay;

});
