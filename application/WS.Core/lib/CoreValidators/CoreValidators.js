define('Lib/CoreValidators/CoreValidators', [
   "Lib/Control/Control",
   'Core/core-instance'
], function(CControl, CInstance) {

   'use strict';

   var obj,
       kppNonDecimalTest = /^([0-9A-Z]+)$/,
       kppDecimalTest = /^([0-9]+)$/;

   function ctrlDigFromStartWeight(value, start, period) {
      var
         summ = 0,
         weight = start,
         len = value.length;
      for (var i = 0; i < len - 1; i++, weight++) {
         weight = weight % (period + 1);
         if (weight === 0) {
            weight++;
         }
         summ += parseInt(value.charAt(i), 10) * weight;
      }
      return summ % 11;
   }

   function getValueForValidation(ctlValue) {
      if (ctlValue === undefined || ctlValue === null || ctlValue === '') {
         return '';
      }
      return ctlValue;
   }
   /**
    * Компонент с набором платформенных валидаторов, которые можно применять только к контролам из пространства имён "Deprecated/Controls" (бывш. SBIS3.CORE).
    * Подробнее о работе с валидаторами вы можете прочитать в разделе <a href="https://wi.sbis.ru/doc/platform/developmentapl/interface-development/forms-and-validation/validation/">Валидация вводимых данных</a>.
    * @class Lib/CoreValidators/CoreValidators
    * @public
    * @author Крайнов Д.О.
    * @deprecated Устаревший класс. Используйте {@link SBIS3.CONTROLS/Utils/ControlsValidators}.
    */
   return obj = /** @lends Lib/CoreValidators/CoreValidators.prototype */{
      /**
       * Проверяет наличие введённого значения.
       * @returns {String|Boolean}
       * <ol>
       *    <li>В случае прохождения валидации возвращает true.</li>
       *    <li>В случае не прохождения валидации возвращает сообщение "Поле обязательно для заполнения".</li>
       * </ol>
       */
      required : function() {
         var value = this.getText ? this.getText() : this.getValue();
         if (CInstance.instanceOfModule(value, 'Deprecated/Enum')) {
            value = value.getCurrentValue();
         }
         if (value === undefined || value === null || value === ''){
            return rk("Поле обязательно для заполнения");
         }
         return true;
      },
      /**
       * Проверяет по содержимому поля ввода соответствие формату кода причины поставки на учёт (КПП).
       * @param {String} innFieldName Название поля ввода, по длине значения которого устанавливается проверка КПП. Если длина значения 12, то КПП не должен быть заполнен.
       * Если имя поля не установлено, то валидация будет пройдена всегда успешно.
       * @returns {String|Boolean}
       * <ol>
       *    <li>В случае прохождения валидации возвращает true.</li>
       *    <li>В случае не прохождения валидации возвращает сообщения "КПП должен состоять из 9 символов: 1-4 и 7-9 должны быть цифрами, 5-6 могут быть цифрами или заглавными латинскими буквами" или "КПП не должен быть заполнен".</li>
       * </ol>
       * @see kppAtPlace
       */
      kpp : function(innFieldName) {
         var parent = this.getParentWindow() || this.getTopParent();
         var innField = parent.getChildControlByName(innFieldName);

         // Указанное поле ИНН существует и корректно заполнено
         if(obj.inn.call(innField) === true) {
            var innVal = innField.getValue() + '';
            if(innVal.length == 10) {
               var kppVal = this.getValue() || '',
                   kppParseDecimalChunk1 = kppVal.substr(0,4),
                   kppParseNonDecimalChunk = kppVal.substr(4,2), //Кусок, который может содержать буквы A-Z
                   kppParseDecimalChunk2 = kppVal.substr(6,3);
               if(CInstance.instanceOfModule(kppVal, 'Deprecated/Enum')) {
                  kppVal = kppVal.getCurrentValue();
               }
               return (('' + kppVal).length == 9 && kppDecimalTest.test(kppParseDecimalChunk1) && kppNonDecimalTest.test(kppParseNonDecimalChunk) &&
               kppDecimalTest.test(kppParseDecimalChunk2)) || !(kppVal + '').length ? true : rk('КПП должен состоять из 9 символов:') + ' ' +
               rk('1-4 и 7-9 должны быть цифрами, 5-6 могут быть цифрами или заглавными латинскими буквами');
               // Должно быть заполнено корректно

            } else if (innVal.length == 12) {
               return obj.required.call(this) !== true ? true : rk('КПП не должен быть заполнен'); // Если НЕ заполненно то все хорошо!
            } else{ // Сюда мы попадем, если ИНН пустой
               return true; // тогда считаем что и КПП заполнено правильно т.к. не можем выявить ошибку
            }
         } else {
            return true;
         }
      },
      /**
       * Проверяет значение поля <a href='https://wi.sbis.ru/doc/platform/developmentapl/interfacedev/core/context/'>контекста</a> на соответствие формату кода причины поставки на учёт (КПП).
       * @param {String} innColumn Название поля, по содержимому которого устанавливается проверка. Если длина значения поля равна 12, то КПП не должен быть заполнен.
       * @returns {String|Boolean}
       * <ol>
       *    <li>В случае прохождения валидации возвращает true.</li>
       *    <li>В случае не прохождения валидации возвращает сообщения "КПП должен состоять из 9 цифр" или "КПП не должен быть заполнен".</li>
       * </ol>
       * @see kpp
       */
      kppAtPlace: function(innColumn){
         var record = this.getLinkedContext().getRecord(),
            inn = record.get(innColumn);
         if (obj.innCheckValue(inn)) {
            if (inn.length == 10) {
               var kppVal = this.getValue();
               return ((/^([0-9]+)$/).test(kppVal) && ('' + kppVal).length == 9) || !(kppVal + '').length ? true : rk('КПП должен состоять из 9 цифр'); // Должно быть заполнено 9 цифрами или пусто
            } else if (inn.length == 12) {
               if (!kppVal) {
                  return rk('КПП не должен быть заполнен'); // Если НЕ заполненно то все хорошо!
               }
            }
         }
         return true;
      },
      /**
       * Проверяет только контрольную сумму ИНН, если длина 10 или 12.
       * @return {Boolean|String}
       * <ol>
       *    <li>В случае прохождения валидации возвращает true.</li>
       *    <li>В случае не прохождения валидации возвращает сообщение "ИНН должен состоять из 10 или 12 цифр".</li>
       * </ol>
       * @see inn
       * @see innCheckValue
       */
      innCheckSum : function(){
         var value = getValueForValidation(this.getValue());
         return obj.innCheckValue(value);
      },
      /**
       * Проверяет корректность значения ИНН. Может быть использовано не только на полях ввода.
       * @param {String} value Значение ИНН.
       * @return {Boolean|String}
       * <ol>
       *    <li>В случае прохождения валидации возвращает true.</li>
       *    <li>В случае не прохождения валидации возвращает сообщение "Неверная контрольная сумма ИНН".</li>
       * </ol>
       * @see inn
       * @see innCheckSum
       */
      innCheckValue: function(value){
         if(value === ''){
            return true;
         }

         if (value === '000000000000' || value === '0000000000'){
            return rk('ИНН не может состоять из одних нулей');
         }

         var
            koef = [3,7,2,4,10,3,5,9,4,6,8],
            val = value.toString(),
            sum = 0, i, j;

         if (val.length === 12) {
            for(i = 0,j = 1; i < 10; i++, j++){
               sum += val.charAt(i) * koef[j];
            }
            if((sum % 11) % 10 == val.charAt(10)){
               sum = 0;
               for(i = 0, j = 0; i < 11; i++, j++){
                  sum += val.charAt(i) * koef[j];
               }
               if((sum % 11) % 10 == val.charAt(11))
                  return true;
            }
         } else {
            if( val.length === 10 ){// 10 digits
               for(i = 0, j = 2; i < 9; i++, j++){
                  sum += val.charAt(i) * koef[j];
               }
               if((sum % 11) % 10 == val.charAt(9)){
                  return true;
               }
            } else {
               return true;
            }
         }
         return rk('Неверная контрольная сумма ИНН');
      },
      /**
       * Проверяет строку на соответствие формату идентификационного номера налогоплательщика (ИНН).
       * @param {Number|String} [innLen] Устанавливает длину строки, которой должен соответствовать введённый ИНН.
       * @returns {Boolean|String}
       * <ol>
       *    <li>В случае прохождения валидации возвращает true.</li>
       *    <li>В случае не прохождения валидации возвращает сообщение "ИНН должен состоять из 10 или 12 цифр".</li>
       * </ol>
       * @see innCheckValue
       * @see innCheckSum
       */
      inn : function(innLen) {
         innLen = parseInt(innLen, 10) || 0;
         var value = getValueForValidation(this.getValue());
         if(value === ''){
            return true;
         }

         var
            valLen = ('' + value).length,
            isNumbers = (/^([0-9]+)$/).test(value),
            isCorrectLength = (innLen > 0) ?  (('' + value).length == innLen) : (valLen === 10 || valLen === 12);
         if(!isNumbers || !isCorrectLength){
            return rk('ИНН должен состоять из') + ' ' + (innLen > 0 ? innLen : rk('10 или 12')) + ' ' + rk('цифр');
         }

         return obj.innCheckSum.apply( this );
      },
      /**
       * Проверяет строку на соответствие формату адреса электронной почты.
       * @returns {Boolean|String}
       * <ol>
       *    <li>В случае прохождения валидации возвращает true.</li>
       *    <li>В случае не прохождения валидации возвращает сообщение "В поле требуется ввести адрес электронной почты".</li>
       * </ol>
       */
      email : function(){
         var value = getValueForValidation(this.getValue());
         if (value === '') {
            return true;
         }
         if ((/^[a-z0-9+_][-a-z0-9+_]*(\.[-a-z0-9+_]+)*@([a-z0-9]([-a-z0-9]{0,61}[a-z0-9])?\.)+([a-z]{1,10})$/i).test(value)){
            return true;
         }
         if ((/^(([a-z0-9+_][-a-z0-9+_]*(\.[-a-z0-9+_]+)*)|([-а-яё0-9+_]+(\.[-а-яё0-9+_]+)*))@([а-яё0-9]([-а-яё0-9]{0,61}[а-яё0-9])?\.)+([а-яё]{1,10})$/i).test(value)){
            return true;
         }
         return rk('В поле требуется ввести адрес электронной почты');
      },
      /**
       * Проверяет введённое число на соответствие допустимому диапазону значений.
       * @param {Number|String} min Нижняя граница диапазона.
       * @param {Number|String} max Верхняя граница диапазона.
       * @returns {Boolean|String}
       * <ol>
       *    <li>В случае прохождения валидации возвращает true.</li>
       *    <li>В случае не прохождения валидации возвращает сообщение "Значение должно попадать в диапазон ...".</li>
       * </ol>
       */
      inRange : function(min, max) {
         var value = getValueForValidation(this.getValue());
         if(value === ''){
            return true;
         }
         min = parseFloat(min);
         max = parseFloat(max);
         var
            min_ = isNaN(min) ? value : min,
            max_ = isNaN(max) ? value : max;
         return (!isNaN(parseFloat(value)) && isFinite(value) && value >= min_ && value <= max_) ?
            true : rk('Значение должно попадать в диапазон [')+(isNaN(min)? '*' : min)+';'+(isNaN(max)? '*' : max)+']';
      },
      /**
       * Устанавливает допустимую длину строки.
       * @param {Number|String} min Минимальная длина строки.
       * @param {Number|String} max Максимальная длина строки.
       * @returns {Boolean|String}
       * <ol>
       *    <li>В случае прохождения валидации возвращает true.</li>
       *    <li>В случае не прохождения валидации возвращает сообщение "Длина должна попадать в указанный диапазон ...".</li>
       * </ol>
       */
      length : function(min, max) {
         var value = this.getStringValue() || '';
         if(value === ''){
            return true;
         }
         min = parseInt(min, 10);
         max = parseInt(max, 10);
         var
            l =  value.length,
            min_ = (isNaN(min)) ? l : min,
            max_ = (isNaN(max)) ? l : max;
         return (l >= min_ && l <= max_) ? true : rk('Длина должна попадать в указанный диапазон [')+(isNaN(min)? '*' : min)+';'+(isNaN(max)? '*' : max)+']';
      },
      /**
       * Проверяет строку на соответствие формату гиперссылки.
       * @returns {Boolean|String}
       * <ol>
       *    <li>В случае прохождения валидации возвращает true.</li>
       *    <li>В случае не прохождения валидации возвращает сообщение "Должен быть указан корректный URL".</li>
       * </ol>
       */
      url : function() {
         var value = getValueForValidation(this.getValue());
         if(value === ''){
            return true;
         }
         return ((/^(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?$/i).test(value)) ? true : rk('Должен быть указан корректный URL');
      },
      /**
       * Проверяет значение поля ввода на соответствие значению из другого поля ввода.
       * @param {String} name Имя поля ввода, со значением которого будет производиться сравнивание.
       * @returns {Boolean|String}
       * <ol>
       *    <li>В случае прохождения валидации возвращает true.</li>
       *    <li>В случае не прохождения валидации возвращает сообщение "Значение поля должно совпадать с полем ...".</li>
       * </ol>
       */
      compare : function(name) {
         var value = this.getStringValue() || '',
            valueCmp;
         try {
            valueCmp = CControl.ControlStorage.getByName(name).getStringValue() || '';
         } catch(e) {
            return false;
         }
         // Возможно, нужно будет использовать equals из core.js
         return (value === valueCmp) ? true : rk("Значение поля должно совпадать с полем '") + name + "'";
      },
      /**
       * Проверяет строку на соответствие формату общероссийскому классификатору предприятий и организаций (ОКПО).
       * @returns {Boolean|String}
       * <ol>
       *    <li>В случае прохождения валидации возвращает true.</li>
       *    <li>В случае не прохождения валидации возвращает сообщения "ОКПО должен содержать 8 или 14 цифр" или "Неверная контрольная сумма ОКПО".</li>
       * </ol>
       */
      okpo : function() {
         var
            inputValue = getValueForValidation(this.getValue()).trim(),
            len, lastDig, ctrlDig;
         if(inputValue === '' ) {
            return true;
         }

         len = inputValue.length;
         if(len != 8 && len != 14 && len != 10) { // Комментарий отдела форм отчётности - 8 или 14 знаков, для ИП - 10 знаков.
            return rk('ОКПО должен содержать 8 или 14 цифр. ОКПО для ИП должен содержать 10 цифр.');
         }

         if (len == 14) {
            // Для обособленных подразделений контрольную сумму считаем по первым 8
            inputValue = inputValue.substr(0, 8);
            len = 8;
         }

         lastDig = parseInt(inputValue.charAt(len-1), 10);
         ctrlDig = ctrlDigFromStartWeight(inputValue, 1, 10);
         if (ctrlDig === 10) {
            ctrlDig = ctrlDigFromStartWeight(inputValue, 3, 10);
         }
         if (ctrlDig === 10) {
            ctrlDig = 0;
         }
         if (ctrlDig !== lastDig) {
            return rk('Неверная контрольная сумма ОКПО');
         }
         return true;
      },
      /**
       * Проверяет строку на соответствие формату основного государственного регистрационного номера (ОГРН/ОГРНИП): применяется как для юридического лица, так и для ИП.
       * @param {Number} length Длина регистрационного номера, с которой будет производиться сравнивание. 15 - ОГРНИП, 13 - ОГРН.
       * @param {String} field Название поля, которое содержит название типа регистрационного номера: ОГРН или ОГРНИП.
       * @returns {Boolean|String}
       * <ol>
       *    <li>В случае прохождения валидации возвращает true.</li>
       *    <li>В случае не прохождения валидации возвращает сообщения "... должен состоять из ..." или "Неверная контрольная сумма ...".</li>
       * </ol>
       */
      ogrn : function(length, field) { // Работает как для организации, так и для ИП
         var
            inputValue = getValueForValidation(this.getValue()).trim(),
            len, lastDig, ctrlDig, lstctrldig, firstDig,
            effectivLen = parseInt(inputValue,10).toString().length,
            allowsFirstDig = [1,2,3,5],
            firstDigIsCorrect = false;

         if (inputValue === '') {
            return true;
         }

         len = inputValue.length;
         field = field || (length == 15 ? rk('ОГРНИП') : rk('ОГРН'));
         if (length && len != length || !length && (len !== 13 && len !== 15)) {
            return field + ' ' + rk('должен состоять из') + ' ' + (length || rk('13 или 15')) + ' ' + rk('цифр');
         }

         firstDig = parseInt(inputValue.charAt(0), 10);
         lastDig = parseInt(inputValue.charAt(len - 1), 10);
         ctrlDig = parseInt(inputValue.substr(0, len - 1), 10) % (effectivLen - 2);
         lstctrldig = ctrlDig % 10;

         firstDigIsCorrect = (allowsFirstDig.indexOf(firstDig) !== -1);

         if ((lstctrldig !== lastDig) || !firstDigIsCorrect) {
            return rk('Неверная контрольная сумма') + ' ' + field;
         }
         return true;
      },
      /**
       * Проверяет строку на соответствие формату страхового номера индивидуального лицевого счета (СНИЛС).
       * @returns {Boolean|String}
       * <ol>
       *    <li>В случае прохождения валидации возвращает true.</li>
       *    <li>В случае не прохождения валидации возвращает сообщения "СНИЛС должен состоять из 11 цифр" или "Неверная контрольная сумма СНИЛС".</li>
       * </ol>
       * @see snilsValidalion
       */
      snils : function(){
         var inputValue = getValueForValidation( this.getValue() );
         if ( inputValue === '' ){
            return true;
         }
         //Проверим длину входных данных
         if ( inputValue.length !== 11 ){
            return rk('СНИЛС должен состоять из 11 цифр');
         }
         //Проверим корректность входных данных(только числа)
         if ( !(/^[\d]+$/).test( inputValue ) ){
            return rk('СНИЛС должен состоять из 11 цифр');
         }
         //Получим контрольные цифры
         var lastDigs = inputValue % 100;
         //Считаем контрольную сумму ( сумма произведений цифры на( 10 - (позиция, на которой она стоит) ) )
         var snilsNum = inputValue.substr( 0, 9 );
         var ctrlDigs = 0;
         for(var i = 1; i<10; i++ ){
            ctrlDigs += snilsNum.substr( i-1, 1 ) * ( 10 - i );
         }
         //Посчитанную контрольную сумму надо взять по модулю 101 и после этого по модулю 100( контрольная сумма для 100 должна быть 00 )
         ctrlDigs = ( ctrlDigs % 101 ) % 100;
         //Сравним значения контрольных сумм
         if (ctrlDigs != lastDigs){
            return rk('Неверная контрольная сумма СНИЛС');
         }
         return true;
      },
      /**
       * Проверяет строку на соответствие СНИЛС.
       * @returns {Boolean|String}
       * <ol>
       *    <li>В случае прохождения валидации возвращает true.</li>
       *    <li>В случае не прохождения валидации возвращает сообщение "Неверный номер страхового свидетельства ПФ".</li>
       * </ol>
       * @see snils
       */
      snilsValidalion : function(){
         var SnilsStr = this;
         var value = SnilsStr.getValue();
         if(value === '' || value === '___-___-___ __' || value === null){
            return true;
         }
         else{
            var re = /^[0-9]{3}\-[0-9]{3}\-[0-9]{3} [0-9]{2}$/;
            if(re.test(value)){
               var num = '';
               var ctrlNum = Number(value[12] + value[13]);
               for(var i = 0; i < 12; i += 4){
                  var tmp_str = '';
                  for(var j = i; j < i + 3; j++){
                     tmp_str += value[j];
                  }
                  num += tmp_str;
               }
               if(Number(num) > 1001998){
                  var sum = 0;
                  for(var l = 0; l < 9; l++){
                     sum += ( 9 - l ) * Number(num[l]);
                  }
                  if(( sum < 100 && Number(ctrlNum) == sum ) ||
                      ( ( sum === 100 || sum === 101) && Number(ctrlNum) === 0 ) ||
                      ( sum > 101 && Number(ctrlNum) == (sum % 101) % 100 )){
                     return true;
                  }
               }
               else {
                  return true;
               }
            }
         }
         return rk('Неверный номер страхового свидетельства ПФ');
      },
      /**
       * Проверяет строку на соответствие формату регистрационного номера в пенсионном фонде РФ.
       * @returns {Boolean|String}
       * <ol>
       *    <li>В случае прохождения валидации возвращает true.</li>
       *    <li>В случае не прохождения валидации возвращает сообщение "Регистрационный номер в ПФ должен состоять из 12 цифр".</li>
       * </ol>
       */
      PFNumber : function() {
         var value = getValueForValidation(this.getValue());
         if (value === '' || !(/^[0-9]{3}-[0-9]{3}-[0-9]{6}$/).test(value)) {
            return rk('Регистрационный номер в ПФ должен состоять из 12 цифр');
         }
         return true;
      },
      /**
       * Функция проверяет строку на соответствие формату номера в фонде социального страхования (ФСС).
       * @returns {Boolean|String}
       * <ol>
       *    <li>В случае прохождения валидации возвращает true.</li>
       *    <li>В случае не прохождения валидации возвращает сообщение "Номер в ФСС должен состоять из 10 цифр".</li>
       * </ol>
       * @see kodPodchinennostiFSS
       */
      FSSNumber : function() {
         var value = getValueForValidation(this.getValue());
         if (value === '') {
            return true;
         }
         if (value.length != 10) {
            return rk('Номер в ФСС должен состоять из 10 цифр');
         }
         return true;
      },
      /**
       * Проверяет строку на соответствие формату кода подчиненности в фонде социального страхования (ФСС).
       * @returns {Boolean|String}
       * <ol>
       *    <li>В случае прохождения валидации возвращает true.</li>
       *    <li>В случае не прохождения валидации возвращает сообщение "Код подчиненности в ФСС должен состоять из 5 цифр".</li>
       * </ol>
       * @see FSSNumber
       */
      kodPodchinennostiFSS : function() {
         var value = getValueForValidation(this.getValue());
         if (value === '' || !(/^[0-9]{4}[1-3]{1}$/).test(value)) {
            return rk('Код подчиненности в ФСС должен состоять из 5 цифр. Последняя цифра может быть равна 1, 2 или 3.');
         }
         return true;
      },
      /**
       * Проверяет строку на соответствие формату кода в территориальном фонде обязательного медицинского страхования (ТФОМС).
       * @returns {Boolean|String}
       * <ol>
       *    <li>В случае прохождения валидации возвращает true.</li>
       *    <li>В случае не прохождения валидации возвращает сообщения "Номер должен состоять из 15 цифр", "Номер ТФОМС не может состоять из одних нулей" или "Неверная контрольная сумма ТФОМС".</li>
       * </ol>
       */
      TFOMS : function() {
         var
            weights = [3, 5, 7, 9, 11, 13, 15, 13, 11, 9, 7, 5, 3, 1],
            summ = 0,
            value = getValueForValidation(this.getValue()).trim(),
            lstctrldig = parseInt(value.charAt(value.length - 1), 10);
         if (value === '') {
            return true;
         }
         if (value.length != 15) {
            return rk('Номер должен состоять из 15 цифр');
         }
         else if (value === '000000000000000') {
            return rk('Номер ТФОМС не может состоять из одних нулей');
         }
         for (var i = 0; i < value.length - 1; i++) {
            summ += parseInt(value.charAt(i), 10) * weights[i];
         }
         if ((summ % 9) === lstctrldig) {
            return true;
         }
         return rk('Неверная контрольная сумма ТФОМС');
      },
      /**
       * Обрезает пробелы в начале и конце строки, а также заменяет несколько подряд идущих пробелов на 1.
       * @returns {Boolean} true - функция отработала успешно, новый результат установлен в поле ввода.
       */
      removeExcessSpaces : function(){
         var new_value = getValueForValidation( this.getValue() ).trim().replace(/\s+/g, ' ');
         //Установим новое значение в поле
         this.setValue( new_value );
         //Возвратим true, функция отработала
         return true;
      }
   };
});
