/**
 * Created by as.krasilnikov on 12.09.2018.
 */
define('Core/helpers/isNewEnvironment', ['View/Request'], function(Request) {

   'use strict';

   /**
    * Модуль возвращает функцию, которая позволяет выполнить проверку: построена ли текущая страница на основе {@link Controls/Application}.
    *
    * <h2>Возвращает</h2>
    *
    * <ul>
    *     <li>true, если веб-страница создана на основе компонента Controls/Application.</li>
    *     <li>false, во всех остальных случаях.</li>
    * </ul>
    * @class Core/helpers/isNewEnvironment
    * @public
    * @author Мальцев А.А.
    */

   return function isNewEnvironment() {
      var request = Request.getCurrent();

      if (request) {
         var headData = request.getStorage('HeadData');
         return headData && headData.isNewEnvironment;
      }

      return false;
   };
});
