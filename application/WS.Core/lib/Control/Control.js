/**
 * Created with JetBrains PhpStorm.
 * User: tm.baeva
 * Date: 23.04.13
 * Time: 14:14
 * To change this template use File | Settings | File Templates.
 */
define('Lib/Control/Control', [
   "Core/core-extend",
   'Lib/Control/Control.compatible',
   'Core/helpers/Function/shallowClone',
   'Core/core-hash',
   "Core/core-instance",
   'Core/helpers/String/unEscapeHtml',
   'Core/helpers/Function/memoize',
   'Env/Event',
   "Core/Deferred",
   "Core/CommandDispatcher",
   "Core/Abstract",
   "Lib/Mixins/DataBoundMixin",
   'Core/markup/ParserUtilities',
   "Lib/NavigationController/NavigationController",
   "Core/ControlBatchUpdater",
   'Core/helpers/Hcontrol/configStorage',
   "Core/Context",
   'Env/Env',
   'Core/helpers/Hcontrol/replaceContainer',
   'Core/helpers/Hcontrol/focusControl',
   "Lib/Control/ControlGoodCode",
   'Vdom/Vdom',
   'Core/ContextBinder',
   "Lib/Control/AttributeCfgParser/AttributeCfgParser"
], function(
   cExtend,
   ControlCompatible,
   shallowClone,
   hash,
   cInstance,
   unEscapeHtml,
   memoize,
   EnvEvent,
   cDeferred,
   CommandDispatcher,
   Abstract,
   DataBoundMixin,
   ParserUtilities,
   NavigationController,
   ControlBatchUpdater,
   configStorage,
   Context,
   Env,
   replaceContainer,
   focusControl,
   ControlGoodCode,
   Vdom
) {
   'use strict';

   function ucFirst(str) {
      return str.substr(0, 1).toUpperCase() + str.substr(1);
   }

   var isNewEnvironment = memoize(function isNewEnvironment() {
      var cn = document.getElementsByTagName('html')[0].controlNodes,
         compat = cn && cn[0] && cn[0].options && cn[0].options.compat || false;

      // Существуют Application.Compatible - там все старое
      return !!cn && (!compat);
   }, 'isNewEnvironment').bind({});

   /**
    * Абстрактный визуальный элемент управления
    * @class Lib/Control/Control
    * @extends  Core/Abstract
    * @author Крайнов Д.О.
    * @public
    * @mixes Lib/Control/Control.compatible
    * @mixes Lib/Control/ControlGoodCode
    */

   var
      Control,
      ControlStorage;

   var quotRE = /"/ig,
      slashRE = /\\/ig;

   Control = Abstract.extend([ControlCompatible, ControlGoodCode], /** @lends Lib/Control/Control.prototype */{
      /**
       * @event onChange При изменении значения пользователем или из контекста
       * @remark
       * Событие происходит, когда пользователь изменяет значение контрола.
       * @param {Env/Event:Object} eventObject Дескриптор события.
       * @param {*} value Текущее значение контрола.
       * @see value
       * @see onValueChange
       */
      /**
       * @event onFocusIn Происходит при установке фокуса на контрол.
       * @remark
       * Событие происходит, когда контрол получает фокус: клик по контролу, через клавишу Tab или с помощью метода {@link setActive}.
       * Не происходит второй раз, если фокус уже установлен на контроле.
       * @param {Env/Event:Object} eventObject Дескриптор события.
       * @example
       * 1. При переходе фокуса на поле ввода (fieldString) открыть подсказку Инфобокс.
       * <pre>
       *    fieldString.subscribe('onFocusIn', function() {
       *       var message = 'Поле для ввода логина';
       *       if (!this.getValue()) {
       *          message += ' Обязательно для заполнения!';
       *       }
       *        Infobox.show(this.getContainer(), message);
       *    });
       * </pre>
       *
       * 2. При переходе фокуса на строку поиска (searchString) открыть автодополнение (suggest).
       * <pre>
       *    searchString.subscribe('onFocusIn', function() {
       *       suggest.show();
       *    });
       * </pre>
       * @see tabindex
       * @see onFocusOut
       * @see setActive
       * @see isActive
       */
      /**
       * @event onFocusOut Происходит при потере контролом фокуса.
       * @remark
       * Событие происходит в момент потери контролом фокуса.
       * Такое возможно в двух случаях:
       * <ol>
       *    <li>другой контрол получил фокус;</li>
       *    <li>контрол, на который установлен фокус, разрушен с помощью метода {@link destroy}.</li>
       * </ol>
       * @param {Env/Event:Object} eventObject Дескриптор события.
       * @param {Boolean|undefined} destroyed Произошла ли потеря фокуса вследствие разрушения контрола методом {@link destroy}.
       * @param {Lib/Control/Control|undefined} focusedControl Контрол, на который перешёл фокус. Если контрол неизвестен, то undefined.
       * @example
       * Поле ввода (fieldString1) предназначено для указания номера жилого дома.
       * Если поле ввода (fieldString1) теряет фокус, то получить значение, введённое пользователем.
       * Подключиться к базе данных, по номеру дома найти почтовый индекс и вставить его в другое поле (fieldString2).
       * <pre>
       *    fieldString1.subscribe('onFocusOut', function() {
       *       //создаём объект бизнес-логики
       *       var bl = new BLObject('АдреснаяКнига'),
       *           self = this,
       *           //улица, которую пользователь выбирает из выпадающего списка
       *           street = fieldDropdown.getStringValue();
       *       //вызываем метод бизнес-логики
       *       bl.call('ПолучитьИндекс', {'Улица': street, 'Дом': self.getValue()}, BLObject.RETURN_TYPE_RECORD)
       *       .addCallBack(function(record) {
       *          //предполагается, что на выбранной улице находится только один дом с указанным номером
       *          var array = record.getDataRow();
       *          fieldString2.setValue(array[0]);
       *       });
       *    });
       * </pre>
       * @see onFocusOut
       * @see destroy
       * @see tabindex
       * @see setActive
       * @see isActive
       */
      /**
       * @event onKeyPressed Происходит при нажатии клавиши, когда на котороле установлен фокус.
       * @remark
       * @param {Env/Event:Object} eventObject Дескриптор события.
       * @param {Event} event Произошедшее JavaScript событие. Содержит код клавиши в поле which.
       * @return Для отмены обработки нажатия клавиши установить результат false (см. Пример № 3).
       * @example
       * 1. Удалять содержимое поля ввода (fieldString) по нажатию клавиши Del
       * <pre>
       *    fieldString.subscribe('onKeyPressed', function(eventObject, event) {
       *       if (event.which ==  Constants.key.del) {
       *          this.setValue('');
       *       }
       *    });
       * </pre>
       *
       * 2. При нажатии клавиши Enter в поле ввода (fieldString) сохраним запись
       * <pre>
       *    fieldString.subscribe('onKeyPressed', function(eventObject, event) {
       *       if (event.which ==  Constants.key.enter) {
       *          this.getTopParent().updateRecord();
       *       }
       *    });
       * </pre>
       * 3. Отменить обработку нажатия клавиши "пробел" в поле ввода
       * <pre>
       *     fieldString.subscribe('onKeyPressed', function(eventObject, event) {
       *        if (event.which ==  Constants.key.space) {
       *           eventObject.setResult(false);
       *        }
       *     });
       * </pre>
       */
      /**
       * @event onClick Происходит при клике на контрол.
       * @param {Env/Event:Object} eventObject Дескриптор события.
       * @param {Object} originalEvent Оригинальное событие, пришедшее в обработчик из jQuery.
       * @example
       * 1. При клике по полю связи (SBIS3.CONTROLS/FieldLink) сбросить значение связи.
       * <pre>
       *    fieldLink.subscribe('onClick', function(eventObject) {
       *       this.getLinkedContext().setValue("@Лицо", null);
       *    });
       * </pre>
       *
       * 2. При клике на поле ввода (SBIS3.CONTROLS/TextBox) открыть всплывающую подсказку.
       * <pre>
       *    filedString.subscribe('onClick', function() {
       *        Infobox.show(this.getContainer(), 'Придумайте пароль, используя цифры и буквы латинского алфавита.');
       *    });
       * </pre>
       */
      /**
       * @event onStateChanged Происходит при изменении состояния контрола.
       * @remark
       * Событие происходит при смене состояния контрола.
       * Поднимается первый раз без аргументов, тем самым контрол сообщает, что готов к приёму состояния.
       * Последующие события поднимаются с аргументом, который соответствует состоянию контрола.
       * @param {Env/Event:Object} eventObject Дескриптор события.
       * @param {*}                     state     Состояние контрола.
       * @param {Boolean}               replace     Не записывать состояние в историю браузера
       * @param {Boolean}               force       Игнорировать флаг applied
       * @example
       * При изменении состояния запомним адрес страницы.
       * <pre>
       *    control.subscribe('onStateChanged', function(eventObject, state) {
       *       window.previousPageUrl = window.location;
       *    });
       * </pre>
       * @see applyState
       * @see applyEmptyState
       * @see stateKey
       * @see setStateKey
       * @see getStateKey
       */
      /**
       * @event onTooltipContentRequest Происходит при получении содержимого расширенной подсказки поля.
       * @remark
       * Обработчик события применяется для отмены или модификации текста подсказки.
       * @param {Env/Event:Object} eventObject Дескриптор события.
       * @param {String} message Сообщение для отображения.
       * @return
       * <ol>
       *    <li>cDeferred - дожидаемся результата, воспринимаем его как текст подсказки.
       *    На время ожидания в подсказке отображается текст "Загрузка...".</li>
       *    <li>Строка - отображается заданный текст.</li>
       *    <li>false - отменяется отображение подсказки.</li>
       * </ol>
       * @example
       * <pre>
       *    function asyncGetTextFromServer() {
       *       var dR = new cDeferred();
       *       // ... some async
       *       return dR;
       *    }
       *    control.subscribe('onTooltipContentRequest', function(eventObject, message) {
       *       //если исходный текст подсказки содержит подстроку ...
       *       if (message.indexOf('some string') != -1) {
       *          //не будем ее показывать
       *          eventObject.setResult(false);
       *       } else {
       *          //иначе запросим подсказку с сервера
       *          eventObject.setResult(asyncGetTextFromServer());
       *       }
       *    });
       * </pre>
       * @see extendedTooltip
       * @see setExtendedTooltip
       * @see getExtendedTooltip
       */
      /**
       * @event onPropertyChanged Происходит при изменении значения любого свойства контрола.
       * @remark
       * Изменение свойств контрола происходит либо при взаимодействии с пользователем, либо "внутри" контрола по заданной логике.
       *
       * Извещение об изменении свойства нужно производить с помощью метода {@link _notifyOnPropertyChanged}, а не просто _notify('onPropertyChanged').
       * Это требуется, чтобы обеспечить поддержку события на обновление группы свойств - {@link onPropertiesChanged}, и отложенного запуска этого события до окончания обновления всей группы свойств (см. метод {@link runInPropertiesUpdate}).
       * @param {Env/Event:Object} eventObject Дескриптор события.
       * @param {String}                propName    Имя изменённого свойства.
       * @see _notifyOnPropertyChanged
       * @see setProperty
       * @see getProperty
       * @see setProperties
       */

      /* eslint-disable no-irregular-whitespace */
      /**
       * @event onPropertiesChanged Происходит при изменении значения любого свойства или группы свойств.
       * @remark
       * Изменение группы свойств происходит тогда, когда методы, вызывающие это изменение, выполняются из метода-обёртки {@link runInPropertiesUpdate}.
       * Он позволяет группировать изменения свойств и откладывать событие onPropertiesChanged до окончания группы так, что для нескольких изменений разных свойств в группе произойдёт только одно событие onPropertiesChanged - в момент окончания группы.
       * @param {Env/Event:Object} eventObject Дескриптор события.
       * @example
       * <pre>
       *    //Начинаем группу изменений свойств
       *    control.runInPropertiesUpdate(function() {
       *       //если метод setProp1 вызовет _notifyOnPropertyChanged('prop1'), то синхронизация произойдёт по выходу из группы изменений (из верхнего runInPropertiesUpdate)
       *       control.setProp1('prop1', val1);
       *
       *       //Начинаем вложенную группу
       *       control.runInPropertiesUpdate(function() {
       *          //если метод setProp2 вызовет _notifyOnPropertyChanged('prop2'), то синхронизация произойдёт по выходу из группы изменений (из верхнего runInPropertiesUpdate, не нижнего)
       *          control.setProp2(val2);
       *       });
       *    });
       *    //Событие onPropertiesChanged выстрелит после окончания самой внешней группы, если внутри группы
       *    //кто-то вызывал _notifyOnPropertyChanged.
       *    //Это событие услышит контекст, к которому привязаны свойства контрола, и запустит синхронизацию свойств
       *    //от контрола к контексту, то есть, запишет изменённые значения привязанных свойств в поля контекста.
       * </pre>
       * @see runInPropertiesUpdate
       * @see setProperty
       * @see getProperty
       * @see setProperties
       */
      /* eslint-enable no-irregular-whitespace */

      /**
       * @event onCommandCatch Событие, позволяющее перехватывать команду
       * @param {Env/Event:Object} eventObject Дескриптор события.
       * @param {string} commandName Дескриптор события.
       * @param {*} arg1 Остальные аргументы команды: onCommandCatch(eventObject, commandName, arg1, arg2...)
       */

      /**
       * @cfg {String|jQuery|HTMLElement} Элемент, на котором строится контрол
       * @noShow
       *
       * @remark
       * Можно передать:
       * <ol>
       *    <li>строку - будет рассмотрено как идентификатор DOM-элемента.</li>
       *    <li>DOM-элемент.</li>
       *    <li>jQuery-объект.</li>
       * </ol>
       * @example
       * <pre>
       *    //если будем передавать строку
       *    var MyElement = 'myElementID';
       *    //если будем передавать DOM-элемент
       *    var MyElement = document.getElementById('elementID');
       *    //если будем передавать jQuery-объект
       *    var MyElement = $('.my-class-name');
       *    //передаём заданный элемент
       *    var myTemplatedArea = attachInstance('Lib/Control/TemplatedArea/TemplatedArea', {
       *       element : MyElement
       *    });
       * </pre>
       */
      _$element: null,

      /**
       * @cfg {String|undefined} Привязка по горизонтали
       * @remark
       * Определяет положение контрола по горизонтали.
       *
       * Возможные значения:
       * <ol>
       * <li>Left - фиксирует положение левого края контрола. При сдвиге левого края родительского контейнера
       * контрол сдвинется вместе с ним так, что расстояние от его левого края до левого края родительского
       * контейнера не изменится.</li>
       * <li>Right - фиксирует положение правого края контрола. При сдвиге правого края родительского контейнера
       * контрол сдвинется вместе с ним так, что расстояние от его правого края до правого края родительского
       * контейнера не изменится.</li>
       * <li>Stretch - фиксирует положение левого и правого краёв контрола. При изменении размеров родительского
       * контейнера изменятся размеры контрола, при этом расстояния до указанных краёв останутся прежними.</li>
       * </ol>
       *
       * @see getAlignment
       * @see verticalAlignment
       * @noShow
       */
      _$horizontalAlignment: undefined,

      /**
       * @cfg {String|undefined} Привязка по вертикали
       * @remark
       * Определяет положение контрола по вертикали.
       *
       * Возможные значения:
       * <ol>
       * <li>Bottom - фиксирует положение нижнего края контрола. При сдвиге нижнего края родительского контейнера
       * контрол сдвинется вместе с ним так, что расстояние от его нижнего края до нижнего края родительского
       * контейнера не изменится.</li>
       * <li>Stretch - фиксирует положение нижнего и верхнего краёв контрола. При изменении размеров родительского
       * контейнера изменятся размеры контрола, при этом расстояния до указанных краёв останутся прежними.</li>
       * <li>Top - фиксирует положение верхнего края контрола. При сдвиге верхнего края родительского контейнера
       * контрол сдвинется вместе с ним так, что расстояние от его верхнего края до верхнего края родительского
       * контейнера не изменится.</li>
       * </ol>
       *
       * @see getAlignment
       * @see horizontalAlignment
       * @noShow
       */
      _$verticalAlignment: undefined,

      /**
       * @cfg {String} Устанавливает имя контрола.
       * @remark
       * Имя контрола - это название, выделяющее его среди других контролов веб-страницы.
       * Имя следует давать осмысленно, максимально характеризуя предназначение контрола.
       * Если имя состоит из нескольких слов, то они пишутся в стиле CamelCase: слитно, каждое с заглавной буквы.
       * Имена контролов, находящихся в одной области видимости, не должны совпадать.
       * В противном случае по общему имени будет доступен один контрол, который раньше других объявлен на веб-странице.
       * @example
       * Пример 1. Устанавливаем значение опции в вёрстке компонента.
       * <pre>
       *    <component data-component="SBIS3.CONTROLS/Radio/Group" name="radioGroup">
       *       ...
       *    </component>
       * </pre>
       *
       * Пример 2. Устанавливаем имя контрола при его создании в JS-коде.
       * <pre>
       *    Core.attachInstance('Deprecated/Controls/FieldString/FieldString', {
       *       name: 'ФильтрДокументов',
       *       ...
       *    });
       * </pre>
       * @see getName
       * @see getByName
       * @see getChildControlByName
       * @see getParentByName
       */
      _$name: '',

      /**
       * @cfg {Boolean} Устанавливает режим взаимодействия с контролом.
       * * true Взаимодействие с контролом разрешено.
       * * false Взаимодействие с контролом запрещено.
       * @remark
       * Взаимодействие означает возможность пользователя переводить фокус на контрол по клику и изменять его значение.
       * С помощью метода {@link isEnabled} можно проверить установленное значение опции, а с помощью метода {@link setEnabled} - изменить её.
       * Когда с контролом запрещено взаимодействие, визуально он становится серого цвета.
       * Обратите внимание, что для контрола контейнерного типа опция изменяет состояние всех дочерних контролов.
       * @example
       * Пример 1. Устанавливаем значение опции в вёрстке компонента.
       * <pre>
       *    <option name="enabled">false</option>
       * </pre>
       *
       * Пример 2. Изменяем значение опции через JS-код.
       * <pre>
       *    fieldCheckbox.subscribe('onValueChange', function(eventObject, value) {
       *       btn.setEnabled(value); //
       *    });
       * </pre>
       * @see setEnabled
       * @see isEnabled
       * @see allowChangeEnable
       * @see isAllowChangeEnable
       * @see setAllowChangeEnable
       */
      _$enabled: true,

      /**
       * @cfg {Boolean} Устанавливает конфигурацию, в которой запрещается изменять режим взаимодействия с контролом.
       * @remark
       * Взаимодействие означает возможность пользователя переводить фокус на контрол по клику и изменять его значение.
       * Режим взаимодействия можно установить с помощью опции {@link enabled} или метода {@link setEnabled}.
       * Однако их применение не будет актуальным, когда изменение конфигурации запрещено в опции allowChangeEnable.
       *
       * Установить значение опции возможно с помощью метода {@link setAllowChangeEnable}, а проверить её текущее значение - с помощью метода {@link isAllowChangeEnable}.
       *
       * Такой механизм применяется в тех случаях, когда разработчик по умолчанию фиксирует режим взаимодейстия.
       * В дальнейшем это обезопасит случайное изменение опции при наследованиях контрола.
       * * true Изменение режима взаимодействия с контролом разрешено.
       * * false Изменение режима взаимодействия с контролом запрещено.
       * @example
       * Пример 1. Устанавливаем значение опции в вёрстке компонента.
       * <pre>
       *    <option name="allowChangeEnable">true</option>
       * </pre>
       *
       * Пример 2. Производим проверку значения опции через JS-код.
       * <pre>
       *    if (this.isAllowChangeEnabled()) { // проверяем, можно ли изменять режим взаимодействия с контролом
             *       this.setEnabled(param); // изменяем режим взаимодействия
             *    }
       * </pre>
       * @see enabled
       * @see setEnabled
       * @see isEnabled
       * @see isAllowChangeEnable
       * @see setAllowChangeEnable
       */
      _$allowChangeEnable: true,

      /**
       *
       */
      _$width: '',

      /**
       *
       */
      _$height: '',

      /**
       *
       */
      _$minWidth: 0,

      /**
       *
       */
      _$minHeight: 0,

      /**
       *
       */
      _$maxWidth: Infinity,

      /**
       *
       */
      _$maxHeight: Infinity,

      /**
       * @cfg {String|null} Владелец контрола
       * @remark
       * Владелец - это контрол, с которым установлена односторонняя связь.
       * К нему приходят необработанные команды от других контролов, которыми он владеет.
       *
       * Значение null говорит об отсутствии владельца.
       *
       * @example
       * При клике на кнопку (btn) перезагрузить табличное представление.
       * <pre>
       *    btn.subscribe('onClick', function() {
       *       //this.getOwner() - табличное представление
       *       this.getOwner().reload();
       *    });
       * </pre>
       * @see getOwner
       * @see setOwner
       * @see getOwnerId
       * @see makeOwnerName
       * @editor InternalComponentChooser
       * @noShow
       */
      _$owner: null,

      /**
       * @cfg {String} Устанавливает текст простой всплывающей подсказки, которая отображается при наведении на контрол курсора.
       * @remark
       * Установить текст подсказки можно с помощью метода {@link setTooltip}, а получить - с помощью метода {@link getTooltip}.
       * @example
       * Пример 1. Устанавливаем значение опции в вёрстке компонента.
       * <pre>
       *    <option name="tooltip">Для ввода значения используйте только латинские буквы.</option>
       * </pre>
       * Пример 2. Каждому флагу установить всплывающую подсказку как подпись флага.
       * <pre>
       *    var names = groupCheckbox.getValue().getColumns();
       *    names.forEach(function(element) {
       *       var flag = groupCheckbox.getChildControlByName(element);
       *       flag.setTooltip(flag.getFlagCaption(element));
       *    });
       * </pre>
       * @translatable
       * @see setTooltip
       * @see getTooltip
       */
      _$tooltip: '',

      /**
       * @cfg {String|Boolean} Текст расширенной подсказки
       * @remark
       * Текст расширенной подсказки, отображаемой в всплывающей панели ({@link Lib/Control/Infobox/Infobox}).
       * Возможные значения:
       * <ol>
       *    <li>Текст расширенной подсказки.</li>
       *    <li>true - расширенная подсказка включена, но её текст не задан.</li>
       *    <li>false - расширенная подсказка отключена.</li>
       * </ol>
       * @example
       * При наведении курсора на контрол показать подсказку с текущими датой и временем.
       * <pre>
       *    //включаем расширенную подсказку
       *    control.setExtendedTooltip(true);
       *    control.subscribe('onTooltipContentRequest', function(event, originalMessage) {
       *       event.setResult('Подсказка запрошена в ' + new Date());
       *    });
       * </pre>
       * @see alwaysShowExtendedTooltip
       * @see onTooltipContentRequest
       * @see setExtendedTooltip
       * @see getExtendedTooltip
       */
      _$extendedTooltip: false,

      /**
       * @cfg {Object} Конфигурация, с которой будет открываться расширенная подсказка.
       * @remark
       * Расширенная подсказка создаётся на основе класса {@link https://wi.sbis.ru/docs/js/Lib/Control/Infobox/Infobox/ Lib/Control/Infobox/Infobox/}. В опции можно передать ровно те опции, что приведены в описании к методу {@link https://wi.sbis.ru/docs/js/Lib/Control/Infobox/Infobox/methods/show show()}.
       * Чтобы для контрола работала расширенная подсказка, нужно задать значение в опции {@link https://wi.sbis.ru/docs/js/Lib/Control/Control/options/extendedTooltip/ extendedTooltip}.
       * @example
       * В tmpl-файл добавляем компонент с конфигурацией расширенной подсказки:
       * <pre class="brush: js">
       * <SBIS3.CONTROLS.MoneyTextBox alwaysShowExtendedTooltip="{{ true }}">
       * ...
       * <!-- Расширенная подсказка автоматически скрывается через 3000 мс -->
       * <ws:extendedTooltipConfig hideDelay="{{ 3000 }}" />
       * </SBIS3.CONTROLS.MoneyTextBox>
       * </pre>
       * @see alwaysShowExtendedTooltip
       * @see onTooltipContentRequest
       * @see setExtendedTooltip
       * @see getExtendedTooltip
       */
      _$extendedTooltipConfig: {},
      /**
       * @cfg {Boolean} Устанавливает режим отображения расширенной подсказки.
       * @remark
       * Расширенная подсказка отображается при наведении курсора на контрол.
       * Она строится на основе всплывающей панели ({@link Lib/Control/Infobox/Infobox}).
       * Текст подсказки можно установить с помощью опции {@link extendedTooltip}.
       * Режим отображения подсказки зависит о установленного режима взаимодействия с контролом (см. опцию {@link enabled}).
       * * true Расширенная подсказка отображается всегда.
       * * false Расширенная подсказка отображается только в том случае, когда разрешено взаимодействие с контролом (см. опцию {@link enabled}).
       * @example
       * Устанавливаем значение опции в вёрстке компонента.
       * <pre>
       *    <option name="alwaysShowExtendedTooltip">false</option>
       * </pre>
       * @see extendedTooltip
       * @see onTooltipContentRequest
       * @see setExtendedTooltip
       * @see getExtendedTooltip
       */
      _$alwaysShowExtendedTooltip: true,

      /**
       * @cfg {Boolean} Устанавливает видимость контрола.
       * @remark
       * Видимость контрола - это его отображение на веб-странице. Скрытый контрол не виден, но в вёрстке веб-страницы он остаётся.
       * Место за скрытым контролом не резервируется, и веб-страница формируется так, будто контрола не существует.
       *
       * Скрыть отображение контрола можно с помощью метода {@link hide}. Отобразить контрол из скрытого состояния можно с помощью метода {@link show}.
       * Изменить текущее состояние видимости на противоположное можно с помощью метода {@link toggle}.
       * Проверить текущее состояние видимости контрола можно с помощью метода {@link isVisible}.
       *
       * Для скрытия контрола на его контейнер устанавливается платформенный CSS-класс "ws-hidden".
       * Когда прикладной разработчик самостоятельно устанавливает/убирает на контейнере контрола класс "ws-hidden", то значение опции visible не изменяется.
       *
       * Возможные значения:
       * <ul>
       *    <li>true - контрол виден;</li>
       *    <li>false - контрол скрыт.</li>
       * </ul>
       * @example
       * Пример 1. Устанавливаем значение опции в вёрстке компонента.
       * <pre>
       *    <option name="visible">false</option>
       * </pre>
       * Пример 2. Изменение видимости контрола из JS-кода. В зависимости от установленного значения выпадающего списка изменяется видимость контрола.
       * <pre>
       *    fieldDropdown.subscribe('onChange', function(eventObject, value) {
       *       myControl.toggle(value);
       *    });
       * </pre>
       * @see hide
       * @see show
       * @see toggle
       * @see isVisible
       */
      _$visible: true,

      /**
       * @cfg {Number|false} Устанавливает табиндекс контрола.
       * @remark
       * Опция устанавливает порядковый номер контрола, в котором на него перейдёт фокус от других контролов по нажатию клавиши Tab.
       * По умолчанию контролы создаются с табиндексом -1, и обход по клавише Tab осуществляется в том порядке, как они описаны в разметке страницы.
       * Чтобы на контрол нельзя было перейти по клавише Tab, нужно установить табиндекс 0.
       * <br/>
       * Получить текущее значение табиндекса контрола можно с помощью метода {@link getTabindex}, а установить - с помощью метода {@link setTabindex}.
       * <br/>
       * Смена табиндекса производится по следующей схеме:
       * <ul>
       *     <li>При клике по кнопке Tab происходит поиск следующего контрола через функцию {@link Lib/Control/AreaAbstract/AreaAbstract#detectNextActiveChildControl}, на который можно перевести фокус.</li>
       *     <li>Чтобы проверить, есть ли возможность установить фокус на контрол/область, их применяется функция {@link canAcceptFocus}.</li>
       *     <li>Когда подходящий контрол найден, на него устанавливается фокус методом {@link Lib/Control/AreaAbstract/AreaAbstract#setActive}.</li>
       *     <li>При изменении табиндекса происходят события {@link onFocusIn} и {@link onFocusOut}.</li>
       * </ul>
       * @example
       * Устанавливаем значение опции в вёрстке компонента.
       * <pre>
       *    <option name="tabindex">2</option>
       * </pre>
       * @see getTabindex
       * @see setActive
       * @see setTabindex
       */
      _$tabindex: -1,

      /**
       * @cfg {String} Дополнительный CSS-класс контрола
       * @remark
       * Дополнительный CSS-класс, который будет присвоен контейнеру контрола.
       * Этот класс добавляется при построении контрола в атрибут class к уже заданным CSS-классам.
       *
       * @example
       * <pre>
       *     var container = $('#myFutureContainer');
       *     var myTemplatedArea = attachInstance('Lib/Control/TemplatedArea/TemplatedArea', {
       *        //устанавливаем CSS-класс "mySuperContainer", описанный заранее
       *        className: 'mySuperContainer',
       *        element: container,
       *        parent: self.getParent()
       *     });
       *
       *     //атрибут контейнера контрола до добавления дополнительного CSS-класса
       *     class="ws-enabled ws-has-focus"
       *     //атрибут контейнера контрола после добавления дополнительного CSS-класса
       *     class="ws-enabled ws-has-focus mySuperContainer"
       * </pre>
       * @see setClassName
       * @see getClassName
       */
      _$className: '',

      /**
       *
       */
      _$zIndex: undefined,

      /**
       * @cfg {Boolean} Автовысота
       * @remark
       * Будет ли контрол подстраиваться по высоте под своё содержимое.
       *
       * Возможные значения:
       * <ol>
       *    <li>true - контрол будет подстраиваться по высоте под своё содержимое.</li>
       *    <li>false - не будет подстраиваться по высоте.</li>
       * </ol>
       *
       * @example
       * <pre>
       *     var dfr = attachInstance('Lib/Control/TemplatedArea/TemplatedArea', {
       *        autoHeight: true,
       *        element: container,
       *        parent: this.getParent()
       *     });
       * </pre>
       * @see autoWidth
       * @noShow
       */
      _$autoHeight: true,

      /**
       * @cfg {Boolean} Автоширина
       * @remark
       * Будет ли контрол подстраиваться по ширине под своё содержимое.
       *
       * Возможные значения:
       * <ol>
       *    <li>true - контрол будет подстраиваться по ширине под своё содержимое.</li>
       *    <li>false - не будет подстраиваться по ширине.</li>
       * </ol>
       *
       * @example
       * <pre>
       *     var dfr = attachInstance('Lib/Control/TemplatedArea/TemplatedArea', {
       *        autoWidth : true,
       *        element : container,
       *        parent : this.getParent()
       *     });
       * </pre>
       * @see autoHeight
       * @noShow
       */
      _$autoWidth: false,

      /**
       *
       */
      _$saveState: false,

      /**
       * @cfg {String} Ключ для идентификации состояния
       * @remark
       * Ключ, который используется для идентификации состояния контрола в {@link Lib/NavigationController/NavigationController}`e.
       * @see applyEmptyState
       * @see applyState
       * @see setStateKey
       * @see getStateKey
       * @see onStateChanged
       * @noShow
       */
      _$stateKey: '',

      /**
       * @cfg {Boolean} Часть составного контрола
       * @remark
       * Является ли контрол подконтролом какого-то другого, составного контрола.
       *
       * @example
       * Если кнопка (btn) - это подконтрол, то подписать её на отправку команды.
       * <pre>
       *    if (btn.isSubControl()) {
       *       btn.subscribe('onClick', function() {
       *          this.sendCommand('clear');
       *       });
       *    }
       * </pre>
       * @see isSubControl
       * @noShow
       */
      _$subcontrol: false,

      /**
       *
       */
      _$cssClassName: '',

      /**
       *
       */
      _$content: '',

      /**
       * @cfg {Boolean} Лежит ли контрол внутри родительского контейнера
       * @remark
       * Нужно для расчёта авторазмеров: если контейнер контрола, как у автодополнения, лежит в body, то его не
       * надо учитывать при расчёте авторазмеров родителя.
       *
       * @noShow
       */
      _$isContainerInsideParent: true,

      /**
       * @cfg {Boolean} Устанавливает режим работы, в котором клик по контролу не производит его активации.
       * @remark
       * Активация означает перевод фокуса на контрол, который происходит при клике. Перевод фокус на контрол сопровождается событием {@link onFocusIn}.
       * Для контрола, с которого фокус ушёл, происходит событие {@link onFocusOut}. Однако такое поведение можно изменить с помощью опции activableByClick.
       * Опция позволяет установить такой режим работы, в котором клик по контролу не производит его активацию.
       * Это означает, что фокус не будет отобран у текущего активного контрола, а также не будут закрываться плавающие панели.
       * * true Режим, в котором клик по контролу производит его активацию.
       * * false Режим, в котором клик по контролу не производит его активацию.
       * @see onFocusIn
       * @see onFocusOut
       */
      _$activableByClick: true,

      /**
       * @cfg {Boolean} Опция включает использование контекста при построении вёрстки контрола в методе buildMarkup.
       * @remark
       * Если опция включена, то при построении вёрстки дочерних контролов их свойства, привязанные к контексту через
       * атрибут bind у тега option, будут инициализированы значениями из контекста родителя, у которого вызывается buildMarkup.
       * Включив эту опцию, можно заставить работать привязки свойств дочерних компонентов во время построения их вёрстки.
       */
      _$buildMarkupWithContext: true,

      /**
       * @cfg { Context} linkedContext Связанный с данным элементом контекст
       * @remark
       * Это тот контекст, из которого данный контрол будет забирать данные.
       * Получить связанный с элементом контекст можно методом {@link getLinkedContext}.
       *
       * @example
       * <pre>
       *    control.getLinkedContext().setValue(control.getName(), 'my value');
       * </pre>
       * @see getLinkedContext
       */
      _$linkedContext: null,

      _$focusOnActivatedOnMobiles: undefined,
      // удалить 3.17.20 когда переведем все кнопки на vdom
      _$fix165c4103: false,
      //Включает эмуляцию клика по тапу
      _$emulateClickByTap: false,
      //Используется для защиты от двойного клика, например checkClickByTap может сгенерировать клик раньше браузера, тогда будет два клика вместо одного, клики работают асинхронно
      _$clickThrottleAsynch: false,
      /**
       * @cfg {Lib/Control/AreaAbstract/AreaAbstract} Родительский элемент управления
       * @noShow
       * @remark
       * Это тот контрол, на котором находится элемент.
       * Получить можно методом {@link getParent}, который вернет ближайшего родителя.
       * Другой метод {@link getTopParent} возвращает самого первого родителя - диалог или область страницы.
       *
       * @example
       * <pre>
       *    // По кнопке получим диалог и обновим его запись
       *    control.getTopParent().updateRecord();
       * </pre>
       * Также можно получить родителя по классу
       * <pre>
       *    control.getParentByClass(Deprecated/Controls/DialogRecord/DialogRecord);
       * </pre>
       * и даже по имени
       * <pre>
       *    control.getParentByName('Редактирование контакта');
       * </pre>
       * @see getParent
       * @see getTopParent
       * @see getParentByName
       */
      _parent: null,

      _container : undefined,
      _prevEnabled : undefined,  //Предыдущее состояние опции enabled
      _isControlActive: false,
      _id: '',
      _context: null,
      _craftedContext: false,//Индикатор того, что контекст мы изготовили сами и можно его уничтожить
      _keysWeHandle : null,
      _isVisible: true,
      _minHeight: null,
      _margins: null,
      _horizontalAlignment: 'Stretch',
      _verticalAlignment: 'Top',
      _batchUpdateData: undefined,
      _aliasForContent: '', //указывает какому полю из опций соответствует поле content
      //проверять в touchable устройствах приход события click после touchend: https://inside.tensor.ru/Task.html?editParams=eyJpZCI6IndzLWRwMzV2eTdjNm9rZm43YjkxNDM3NDcwNDE4NDc1IiwiaGllck1vZGUiOmZhbHNlLCJwayI6MzYyMDIwNjYsImNvcHkiOmZhbHNlLCJyZWFkT25seSI6ZmFsc2UsIm9iaiI6ItCh0LvRg9C20JfQsNC%2FIiwiX2V2ZW50cyI6eyJvbkJlZm9yZVJlYWQiOltdLCJvbkJlZm9yZVVwZGF0ZSI6W10sIm9uQmVmb3JlU2hvd1JlY29yZCI6W10sIm9uTG9hZEVycm9yIjpbXX0sImZvcm1hdCI6ItCh0LvRg9C20JfQsNC%2FLtCh0L%2FQuNGB0L7QuiJ9
      _checkClickByTap: false,
      _maxTouchCount: 1,
      _maxTouchTime: 300,
      _clickState: null,
      //не обрабатывать браузерный focusin
      _ignoreNativeFocusIn: false,
      _underCursor : false,
      _initiatedByCursor: false,
      _owner: null,
      _userData: undefined,
      _tooltipSettings: null,
      _propertiesChangedLock: 0,
      _propertiesChangedCnt: 0,
      _supportOldJinneeMarkup: false,
      _rootMarkupByTemplate: false,
      _enabledOptApplied: undefined,
      _savedConfigs: null,
      _savedConfigsMaps: null,

      _saveConfigFromOption: function(option){
         if (Object.prototype.toString.call(option) === '[object String]') {
            var r = /config=/ig,
               one;

            while (( one = r.exec(option))){
               var start = option.indexOf('"', one.index)+1,
                  end = option.indexOf('"', start),
                  config = option.substring(start, end),
                  cfg = {};
               cfg[config] = shallowClone(configStorage.getData()[config]);

               if (!this.isDestroyed()) {
                  this._savedConfigs = this._savedConfigs || [];
                  this._savedConfigsMaps = this._savedConfigsMaps || [];
               }

               this._savedConfigs.push(cfg);
               this._savedConfigsMaps.push(config);
            }
         }
      },

      constructor : function Control(cfg, skipInit) {
         /**
          * Пробежимся по опциям что передали в контрол
          * и если там есть строка в которой есть config='...'
          * запомним в массив.
          * Если эта контентная опция не будет использована в процессе жизни
          * компонента, то все конфиги внутри нее останутся в configStorage
          * При destroy компонента удалим найденные конфиги из configStorage
          */
         // New Control instance will be registered in global object.
         // It may lead to memory leak on presentation service.
         // To prevent this it is necessary to check that Control is not created on server.
         if(typeof window === 'undefined') {
            Env.IoC.resolve('ILogger').error(new Error('Creating Lib/Control/Control on server side is forbidden'));
         }

         for(var opt in cfg) {
            if (cfg.hasOwnProperty(opt)) {
               this._saveConfigFromOption(cfg[opt]);
            }
         }

         this._tooltipSettings = this._tooltipSettings || {};
         this._keysWeHandle = this._keysWeHandle || [];
         this._margins = this._margins || {};
         this._clickState = {
            detected: false,
            stage: '',
            timer: undefined,
            timeout: 500,
            target: null,
            timeStart:undefined,
            tapHoldTimeout: 900,
            maxCoordDiff: 10
         };
         this._tooltipSettings = {
            handleFocus: this._tooltipSettings && 'handleFocus' in this._tooltipSettings ? this._tooltipSettings.handleFocus : true,
            handleHover: this._tooltipSettings && 'handleHover' in this._tooltipSettings ? this._tooltipSettings.handleHover : true
         };

         Control.superclass.constructor.call(this, cfg, true);

         var self = this, optionsSaved, needApplyOptions, hasMarkup, markupContext, markup;
         this._publish('onChange', 'onKeyPressed', 'onClick', 'onFocusIn', 'onFocusOut', 'onStateChanged', 'onTooltipContentRequest',
            'onPropertyChanged', 'onPropertiesChanged', 'onCommandCatch');
         this._keysWeHandle = hash(this._keysWeHandle);

         if (cfg) {
            // TODO: При использовании без шаблонов (прямое внедрение в HTML через attachInstance) здесь будет ошибка
            if ('parent' in cfg && (cfg.parent && cfg.parent._template || cfg.parent instanceof Control || ( cInstance.instanceOfModule(cfg.parent, 'Lib/Control/AreaAbstract/AreaAbstract')) )) {
               this._parent = cfg.parent;
            }
            if ('id' in cfg) {
               this._id = cfg.id;
            }
            if(cfg.enable !== undefined) {
               this._setOption('enabled', !!cfg.enable);
            }
            if(cfg.hidden !== undefined) {
               this._setOption('visible', !cfg.hidden);
            }

            this._supportOldJinneeMarkup = !!cfg.supportOldJinneeMarkup;
            this._initContainer(cfg);
         }

         var initContext = this._createContext(this._getOptions(), this._parent && this._parent.getLinkedContext && this._parent.getLinkedContext());
         if (this.hasOwnProperty('_compatContext')){
            this._compatContext = initContext.context;
         } else {
            this._context = initContext.context;
         }

         this._craftedContext = initContext.craftedContext;

         var opts = this._getOptions();
         optionsSaved = {};
         if ('enabled' in opts) {
            optionsSaved.enabled = opts.enabled
         }

         if ('visible' in opts) {
            optionsSaved.visible = opts.visible
         }

         if ('name' in opts) {
            optionsSaved.name = opts.name
         }

         if ('className' in opts) {
            optionsSaved.className = opts.className
         }

         if ('cssClassName' in opts) {
            optionsSaved.cssClassName = opts.cssClassName
         }

         /*Нужно проставить созданный контекст в опции. Такая ситуация случается только при создании внутри CompoundArea
         * А в телефонии в _modifyOptions работают с контекстом из опций*/

         if (!opts.linkedContext) {
            if (this.hasOwnProperty('_compatContext')){
               opts.linkedContext = this._compatContext;
            } else {
               opts.linkedContext = this._context;
            }
         }

         //На конструкторе обязательно нужно вызвать _modifyOptions, поскольку с препроцессора в конфиге приходят
         //неизменённые опции. Полный набор опций (с дефолтными опциями и опциями из шаблона) после _modifyOptions на препроцессоре
         //я оттуда присылать не могу, потому что в дефолтных опциях контрола может лежать всякая ересь, которая не сериализуется,
         //или просто слишком большая.
         //Поэтому _modifyOptions вызывается два раза: на препроцессоре в _prepareMarkup, и в конструкторе - на тех значениях опций,
         //которые были заданы в шаблоне.
         // Второй параметр добавлен для проверки, что все опции записанные на первом modifyOptions находятся в configStorage
         if (this._options) {
            this._options = this._modifyOptions(this._getOptions(), cfg);
         }
         this._contentAliasing(this._getOptions(), cfg);

         if (this._parent && !!this._parent.isEnabled && !this._parent.isEnabled() && this._getOption('allowChangeEnable')) {
            if(!this._parent._template || (!!this.isEnabled && !this.isEnabled())) {
               this._prevEnabled = this._getOption('enabled');
               this._setOption('enabled', false);
            }
         }
         if (self._isCorrectContainer()) {
            configStorage.deleteString(this._container.attr('config'));
            hasMarkup = this._hasMarkup();
            this._rootMarkupByTemplate = true;

            if (!hasMarkup && this._dotTplFn) {
               markupContext = this._getOption('buildMarkupWithContext') ? this._context : null;
               markup = this._buildMarkup(this._dotTplFn, this._getOptions(), null, null, markupContext);

               var replaceFn = function(markupResult) {
                  replaceContainer(this._container, markupResult);

                  // подменили _container, нужно и element обновить, а то код предполагает что это один и тот же элемент. в частности
                  // в проверке в CompoundControl, где проверяется наличие wsControl на element (makeInst).
                  cfg.element = this._container;

                  this._enabledApplied = this._getOption('enabled');
               }
               if (markup && markup.callback) {
                  markup.addCallback(function(markupResult) {
                     replaceFn.call(this, markupResult);
                  }.bind(this));
               } else {
                  replaceFn.call(this, markup);
               }
            } else {
               this._rootMarkupByTemplate = this._container.attr('wasbuildmarkup') === 'true';
               needApplyOptions = !this._rootMarkupByTemplate || Object.keys(optionsSaved).reduce(function(memo, key) {
                  return memo || this._getOption(key) !== optionsSaved[key];
               }.bind(this), false);
               if (needApplyOptions) {
                  if (this._getOption('name')) {
                     this._container.attr('sbisname', this._getOption('name'));
                  }
                  var classes = 'ws-control-inactive ws-component ' + this._getOption('className');
                  if (!this._hasMarkup() && this._getOption('cssClassName')) {
                     classes += ' ' + this._getOption('cssClassName');
                  }

                  var tabindex = this._container.attr('tabindex') || 0;
                  this._container.addClass(classes).attr({tabindex: tabindex, hideFocus: true});
               } else {
                  this._enabledApplied = this._getOption('enabled');
               }
            }

            //TODO: убрать зависимость от вызова hide из конструктора у новых контролов
            //честно скрываем контейнер
            if (!this._getOption('visible')) {
               this.hide();
            } else {
               // костыль. иногда верстка строится со спрятанным компонентом, а до того как он оживится успевает долететь
               // поле в контекст и оживляется он уже visible=true. но ws-hidden остается, потому что сеттер visible не
               // срабатывает (синхронизация контекста не происходит), ведь поле в контексте и контроле в этом случае совпадают
               if (this._moduleName !== "SBIS3.CONTROLS/OperationsPanel" && this._moduleName !== "SBIS3.CONTROLS/OperationsPanel" && this._container.hasClass('ws-hidden')) {
                  //У компонента OperationsPanel логика инвертирована и он всегда созадется скрытым
                  //там прямо так в шаблоне и написано, и уже OperationsPanel сам показывается когда ему это будет угодно
                  this._isVisible = false;
                  this.show();
               }
            }

            if (this._getOption('zIndex') !== undefined) {
               this._container.css('z-index', this._getOption('zIndex'));
            }

            if (this._supportOldJinneeMarkup) {
               this._horizontalAlignment = this._getOption('horizontalAlignment') || this._container.attr('HorizontalAlignment') || this._horizontalAlignment;
               this._verticalAlignment = this._getOption('verticalAlignment') || this._container.attr('VerticalAlignment') || this._verticalAlignment;

               //проставляем связной метке тот же zIndex
               var linkedLabel = self._getLinkedLabel();
               if (linkedLabel) {
                  linkedLabel.css('z-index', self._getOption('zIndex'));
               }
            } else {
               this._horizontalAlignment = this._getOption('horizontalAlignment') || this._horizontalAlignment;
               this._verticalAlignment = this._getOption('verticalAlignment') || this._verticalAlignment;
            }

            this._container[0].wsControl = this;

            this._container.bind('click touchend', this._onActionHandler.bind(this));

            //if (Constants.compatibility.touch && this._checkClickByTap) {
               this._container[0].addEventListener('touchmove', this._onActionHandler.bind(this), Env.constants.compatibility.supportPassive ? {passive: true} : false);
               this._container[0].addEventListener('touchstart', this._onActionHandler.bind(this), Env.constants.compatibility.supportPassive ? {passive: true} : false);
            //}

            this._initKeyboardMonitor();
            this._bindExtendedTooltip();
         }

         this._initSizeOptions();
         if(this._getOption('autoWidth')) {
            this._setOption('width', 'auto');
         }
         if(this._getOption('autoHeight')) {
            this._setOption('height', 'auto');
         }

         if (this._parent){
            this._registerToParent(this._parent);
         }

         if (this._getOption('saveState')){
            this.subscribe('onStateChanged', this._stateChangeHandler);
         }

         this.subscribe('onPropertyChanged', function(ev, name) {
            /*
               Некоторые контролы стреляют событием onPropertyChanged, не имея при этом проинициализированной опции.
               Поэтому проверяем наличие опции
             */
            if(this._hasOption(name)) {
               this._notify(name+"Changed", this._getOption(name));
               this._notify('onChange' + name, this._getOption(name));
            }
         });

         if (!skipInit) {
            this._initInstance();
         }
      },

      init: function(){
         this._initFocusCatch();
         Control.superclass.init.apply(this, arguments);
      },


      _createContext: function(options, parentContext) {
         //TODO:: use from AreaAbstract in new control
         var result, craftedContext, contextOpt;

         contextOpt = options.context || options.linkedContext;
         if (contextOpt && !(contextOpt instanceof Context)) {
            throw new Error('Опция linkedContext (или context), если указана, и не равна null/undefined, то должна быть объектом типа Core/Context');
         }

         result = contextOpt || parentContext;

         craftedContext = !result;
         if (craftedContext) {
            //Если контекст не указан, то надо создать контекст, изолированный на запись, но на чтение привязанный к глобальному контексту.
            //Это нужно, чтобы контрол, которому забыли дать контекст, не портил глобальный контекст - такое бывает.
            //result = new Context();
            //result.setRestriction('set');

            craftedContext = false;
            result =  Context.global;
         }

         // Если контролу не сказали, с каким контекстом он связан - всегда линковать к нему глобальный
         return {
            context: result,
            craftedContext: craftedContext
         };
      },

      _isRelativePosition: memoize(function() {
         var pos = this._isCorrectContainer() && this._container.css('position');
         return  pos === 'relative' || pos === 'static';
      }, '_isRelativePosition'),



      _buildMarkup: function(dotTplFn, options, vStorage, attrsToMergeFn, context) {
         return ParserUtilities.buildMarkup(dotTplFn, options, undefined, attrsToMergeFn, context);
      },
      _prepareMarkup: function(node, parentOptions, vStorage, controlId, context){
         return ParserUtilities.prepareMarkupForNode(node, parentOptions, vStorage, controlId, context);
      },


      /**
       *
       * Задаёт текст простой подсказки, отображаемой внутри контрола или при наведении на него.
       * @param {String} tooltip Текст подсказки.
       * @example
       * 1. При смене значения группы радиокнопок (fieldRadio) установить подсказку об активной кнопке.
       * <pre>
       *    fieldRadio.subscribe('onValueChange', function() {
       *       var name = this.getStringValue();
       *       this.setTooltip('Выбрана кнопка ' + name );
       *    });
       * </pre>
       *
       * 2. Показать над полем ввода (fieldString) число применённых фильтров.
       * <pre>
       *    groupCheckbox.subscribe('onChange', function(eventObject, record) {
       *       var values = record.getDataRow(),
       *           count = 0;
       *       values.forEach(function(element) {
       *          if (element) {
       *             count++;
       *          }
       *       });
       *       fieldString.setTooltip('Применено фильтров: ' + count);
       *    });
       * </pre>
       * @see tooltip
       * @see getTooltip
       */
      setTooltip: function(tooltip) {
         this._setOption('tooltip', '' + (tooltip ? tooltip : ''));
         this._container.attr('title', unEscapeHtml(this._getOption('tooltip')));
         this._notifyOnPropertyChanged('tooltip');
      },
      /**
       *
       * Получить имя дополнительного CSS-класса контрола.
       * @returns {String}
       * @example
       * При готовности контрола получить CSS-класс родителя и передать его другому контролу.
       * <pre>
       *    control.subscribe('onReady', function() {
       *       var class = this.getParent().getClassName();
       *       this.getChildControlByName('ChildName').setClassName(class);
       *    });
       * </pre>
       * @see setClassName
       * @see className
       */
      getClassName: function(){
         return this._getOption('className');
      },
      /**
       *
       * Установить дополнительный CSS-класс контрола.
       * @param {String} className Имя CCS-класса.
       * @example
       * Установить календарю (fieldDatePicker) новый стиль отображения с 31 декабря.
       * <pre>
       *    var obj = new Date();
       *    if (obj.getDate() == 31 && obj.getMonth() == 11)
       *       fieldDataPicker.setClassName('happy-new-year');
       * </pre>
       * @see className
       * @see getClassName
       */
      setClassName: function(className){
         this._container.toggleClass(this._getOption('className'));
         this._setOption('className', className);
         this._container.addClass(className);
      },
      describe: function() {
         return (this._isCorrectContainer() ? (this.getContainer().attr('type') || this.getContainer().attr('data-component')) : '?Control') + '#' + this.getId();
      },
      /**
       * Связывает поле, указанное в протектед переменной _aliasForContent, с опцией content
       * @param {Object} options - опции контрола после конструирования (могут содержать значения по умолчанию)
       * @param {Object} cfg - актуальная конфигурация контрола, переданная в конструкторе.
       * @returns {Object} - модифицированный объект
       * @private
       */
      _contentAliasing : function(options, cfg){
         var val;
         //Если альясная опция есть в актуальном конфиге, то она главнее опции content
         if (this._aliasForContent && options.content) {
            if (cfg && this._aliasForContent in cfg) {
               val = cfg[this._aliasForContent];
            } else {
               val = undefined;
            }

            if (val === '' || val === undefined || val === null) {
               options[this._aliasForContent] = options.content;
            }
         }
         return options;
      },

      /**
       * Здесь должна осуществляться привязка "внутренностей" контрола к верстке, не важно как она создана
       */
      _bindInternals: function () {},

      onAfterVisibilityChange: function(event, visibility){
         this._notify('onAfterVisibilityChange', visibility);
      },
      /**
       * Регистрируется у родителя
       * @param {Lib/Control/AreaAbstract/AreaAbstract} parent Родитель контрола
       * @private
       */
      _registerToParent: function(parent){
         if (parent._template) {
            this.once("onInit", function(){
               parent._notifyToParentAboutChild(this);
            });

            if (!parent._children) {
               parent._children = {};
            }

            parent._children[this.getName()] = this;

            this.once('onDestroy', function () {
               delete parent._children[this.getName()];
            });
         }
         // Если родитель Area - зарегистрируем дочерний контрол
         if(cInstance.instanceOfModule(parent, 'Lib/Control/AreaAbstract/AreaAbstract') || parent._template){
            if(parent.hasEvent('onResize') || parent._template) { //Есть вероятность, что когда контрол инициализируется, родителя уже убили. Мы не умеем корректно обрабатывать подобные ситуации. Если onResize есть - значит, родитель живой и корректен. Да, костыль
               parent.registerChildControl(this);
            }
         }
         else if(parent){
            Env.IoC.resolve('ILogger').error('Control', 'Incorrect parent (' + ((parent instanceof Object && parent.getId) ? parent.getId() : 'not object') + ') for control (' + this.getId() + '), parent must be instanceof $ws.proto.AreaAbstract');
         }
         this.onAfterVisibilityChange = this.onAfterVisibilityChange.bind(this);

         parent.subscribe('onAfterVisibilityChange', this.onAfterVisibilityChange);
         this.subscribe('onDestroy', function(){
            parent.unsubscribe('onAfterVisibilityChange', this.onAfterVisibilityChange);
         });
      },


      /**
       * Если выполняется конструирование контрола, и отсылка событий отключена, то откладывает функцию до момента
       * после окончания конструирования контрола (когда будет включена отсылка событий).
       * Если _delayToConstructionFinished вызывается вне контекста конструирования контрола и события включены, то просто выполняет функцию, не дожидаясь ничего.
       * @param {String} hint Имя пакета, для отладки. Имеет смысл при параметре withBatch=true.
       * @param {Boolean} withBatch Нужно ли оборачивать вызов функции (или ожидание окончания конструирования и вызов) в пакет (см. метод runInBatchUpdate).
       * @param {Function} func Функция, которую нужно вызвать или отложить до включения событий.
       * @param [arg1, [...]] Параметры функции.
       * @private
       */
      _delayToConstructionFinished: function(hint, withBatch, func) {
         var args = Array.prototype.slice.call(arguments, 3), self = this;
         if (this._isInitialized) {
            if (withBatch) {
               this._runInBatchUpdate(hint, func, args);
            }
            else {
               func.apply(self, args);
            }
         }
         else {
            if (withBatch) {
               ControlBatchUpdater.beginBatchUpdate(hint);
               this.once('onInit', function() {
                  try {
                     func.apply(self, args);
                  } finally {
                     ControlBatchUpdater.endBatchUpdate(hint);
                  }
               });
            } else {
               this.once('onInit', function() {
                  func.apply(self, args);
               });
            }
         }
      },

      _initComplete: function() {
         // Пометим контейнер классом
         if(this._isCorrectContainer()) {
            this._setEnabled(this._getOption('enabled'));
         }
         // Добавим в ControlStorage только после прохождения всей инициализации
         ControlStorage.store(this);
         EnvEvent.Bus.channel('luntik').notify('onInit', this);
         // В родительском классе будет сделан _notify('onInit') - все кто подписался смогут получить контрол из ControlStorage
         Control.superclass._initComplete.apply(this, arguments);
      },


      _notifyBatchDelayedEventLow: function(event, merge, args) {
         var result;
         if (this._haveBatchUpdate()) {
            ControlBatchUpdater.addDelayedEvent(event, merge, this, args);
         }
         else {
            result = this._notify.apply(this, args);
         }
         return result;
      },

      /**
       * Сообщает о событии с задержкой на авторазмеры, не объединяя события до окончания пакета.
       * Если в пакете стрельнет несколько одинаковых таких событий, то по окончании пакета они просигналятся все, в том порядке, в котором был вызван этот метод.
       * @param {String} event Название события
       * @param {Array} args Параметры события
       * @returns {*}
       * @protected
       */
      _notifyBatchDelayedNoMerge: function(event/*, payload*/) {
         return this._notifyBatchDelayedEventLow(event, false, arguments);
      },

      /**
       * Сообщает о событии с задержкой на авторазмеры. Объединяет события одного типа для одного и того же контрола
       * @param {String} event Название события
       * @param [arg1, [...]] Параметры события
       * @returns {*}
       * @protected
       */
      _notifyBatchDelayed: function(event/*, payload*/) {
         return this._notifyBatchDelayedEventLow(event, true, arguments);
      },

      _notifyOnSizeChanged: function(source, initiator, recalculateOwnSize) {
         var updater = ControlBatchUpdater;

         updater.ensureBatchUpdate('Control._notifyOnSizeChanged');

         //можно вызывать метод с одним аргументом - recalculateOwnSize
         if (arguments.length === 1) {
            recalculateOwnSize = arguments[0];
         }

         updater.addBatchSizeChanged(this, recalculateOwnSize);
      },



      /**
       * Активирует контрол при получении фокуса
       * @private
       */
      _initFocusCatch: function(){
         //Реагировать на 'focusin' нужно в тех же случаях, что и на _onClickHandler,
         //иначе, если не активировать контрол на focusin, то focusin будет всплывать к родителю, и активировать его,
         //отбирая активность у дочернего контрола (который успел активироваться по _onClickHandler)
         var self = this,
            elements = [this._getElementToFocus()];
         if(!elements[0] || elements[0].get(0) !== this._container.get(0)){
            elements.push(this._container);
         }
         for(var i = 0; i < elements.length; ++i){
            var element = elements[i];
            if(element){
               element.bind('focusin', function(event){
                  if (self._getOption('activableByClick')) {
                     // если фокус уходит на виртуальный компонент, он позовет активацию у предков, тут не надо ничего активировать
                     if (event.target.wsControl && event.target.wsControl.iWantVDOM) {
                        return;
                     }
                     if (!self._ignoreNativeFocusIn && !self.isActive()) {
                        self.setActive(true, false, true);
                     }
                     event.stopPropagation();
                  }
               });
               element.bind('focusout', function(event){
                  var
                     relatedTarget = $(event.relatedTarget),
                     relatedControl, isChild, isSame;

                  //setActive(false) нужно делать только при наличии relatedTarget (иначе ломаются автотесты в Селениуме на FF)
                  //- там фокус в никуда уходит странным образом, а также только тогда, когда фокус уходит из контрола на не-контрол.
                  //На переход фокуса внутри контрола деактивироваться не надо, а на уход фокуса в другой контрол надо (главное - указать этот контрол,
                  //чтобы код на setActive(false..) (например, в редактировании по месту) правильно различал, на какой контрол уходит фокус, надо ли автозакрытие
                  //делать, и т.п.
                  if (relatedTarget.length > 0 && relatedTarget.closest(self.getContainer()).length === 0) {
                     // существует кейс, когда на нажатие по крестику окна стреляет focusout у которого relatedTarget - html,
                     // будто бы мы хотим заактивировать компонент, который висит на html. Но это не так, мы хотим по закрытию
                     // окошка восстановить фокус на предыдущий активный компонент. Но до этого дело не доходит - активируется
                     // html и происходят ошибки, например, закрывается панель, из которой было открыто окошко.
                     // не будем обрабатывать фокусировку на html - нам никогда не надо активировать html на focusout
                     if (event.relatedTarget.nodeName.toLowerCase() !== 'html') {
                        if (self.isActive()) {
                           var parentControls = Vdom.DOMEnvironment._goUpByControlTree(relatedTarget);
                           relatedControl = parentControls[0];

                           // Может случиться так, что дочерний контрол лежит не внутри родительского.
                           // В этом случае родительский контрол деактивировать не надо, а то начинается дикая шиза со скаканием фокуса,
                           // и невозможно на родительском контроле ничего выделить
                           isChild = !!parentControls.find(function(parent) {
                              return parent === self;
                           });

                           // может случиться так, что focusout стрельнул на компоненте, который мы тут же активируем. Например, в IE такое поведение. Не нужно в этом случае дизактивировать компонент.
                           // проблема появилась с новым jquery, он стал присылать relatedTarget. А в IE особое поведение при нажатии на бегунок сролла, стреляет событие focusout на компоненте.
                           isSame = relatedControl === self;

                           // если это vdom-компонент без совместимости, его нельзя отдавать в setActive
                           if (isNewEnvironment() && parentControls[0]._template) {
                              relatedControl = null;
                           }

                           // деактивируем компонент, с которого ушел фокус, если активация происходит не на его потомка
                           if (!isChild && !isSame) {
                              self.setActive(false, false, true, relatedControl);
                           }
                        }
                     }
                     event.stopPropagation();
                  }
               });
            }
         }
      },
      /**
       *
       * Применить состояние.
       * @param {String|Number} state Состояние, которое должен применить к себе контрол.
       * @example
       * Для табличного представления (tableView) установить текущую активную строчку по состоянию.
       * <pre>
       *    tableView.subscribe('onReady', function() {
       *       this.applyState(33);
       *    });
       * </pre>
       * @see stateKey
       * @see applyEmptyState
       * @see getStateKey
       * @see setStateKey
       * @see onStateChanged
       */
      applyState : function(state){
         //child classes must implement this method for applying state
      },
      /**
       *
       * Применить пустое состояние.
       * @remark
       * Метод используется в случае необходимости обработки пустого состояния.
       * По умолчанию он пустой, при необходимости поддержки контролом сохранения/восстановления состояния,
       * нужно переопределить метод - должен восстанавливать состояние контрола по умолчанию.
       * @see stateKey
       * @see applyState
       * @see getStateKey
       * @see setStateKey
       * @see onStateChanged
       */
      applyEmptyState: function() {
         //child classes must implement this method for applying empty state
      },
      /**
       * Установить/сменить ключ, который будет использован для идентификации состояния контрола в {@link Lib/NavigationController/NavigationController}.
       * @remark
       * Этот ключ предназначен для хранения состояния браузера в хэше адресной строки.
       * @param {String} key Ключ для идентификации состояния контрола (отображается в хэше в адресной строке).
       * @example
       * Создать новый контрол, расширив уже существующий. Определить ключ и использовать его в качестве состояния контрола.
       * <pre>
       *    //создаём свой контрол, наследуемся от браузера-дерево
       *    define('SBIS3.BILLING.MyBrowser', ['Deprecated/Controls/TreeView/TreeView'], function(TreeView) {
       *       //определяем желаемое значение ключа
       *       var MyStateKey = 'MyStateKey';
       *       //наследуемся от контрола дерево
       *       var MyBrowser = TreeView.extend({
       *          //расширяем конструктор
       *          $constructor: function() {
       *             //устанавливаем ключ
       *             this.setStateKey(MyStateKey);
       *          }
       *       });
       *       return MyBrowser;
       *    });
       * </pre>
       * @see stateKey
       * @see applyState
       * @see applyEmptyState
       * @see getStateKey
       * @see onStateChanged
       */
      setStateKey: function(key){
         this._setOption('stateKey', key);
      },
      /**
       * Получить ключ, который используется для идентификации состояния контрола в {@link Lib/NavigationController/NavigationController}.
       * @returns {String} Ключ для идентификации состояния контрола (отображается в хэше в адресной строке).
       * @example
       * Изменить значение поля контекста в зависимости от состояния табличного представления (tableView).
       * <pre>
       *     var MyKey = tableView.getStateKey(),
       *         category = NavigationController.getStateByKey(MyKey).state;
       *     control.getLinkedContext().setValue('КатегорияЗадачи', category != null ? category : '');
       * </pre>
       * @see applyEmptyState
       * @see stateKey
       * @see applyState
       * @see setStateKey
       * @see onStateChanged
       */
      getStateKey: function(){
         return this._getOption('saveState') ? (this._getOption('stateKey') || this.getName()) : undefined;
      },
      _stateChangeHandler : function(e, state, replace, force){
         if (state !== undefined){
            NavigationController.updateState(this.getStateKey(), state, replace, force);
         }
      },
      /**
       * Инициализация опиций минимальных и максимальных размеров
       * @protected
       */
      _initSizeOptions: function(){
         this._setOption('minWidth', parseInt(this._getOption('minWidth'), 10) || 0);
         this._setOption('minHeight', parseInt(this._getOption('minHeight'), 10) || 0);

         var maxWidth = this._getOption('maxWidth'),
            maxHeight = this._getOption('maxHeight');

         this._setOption('maxWidth', (maxWidth !== undefined && maxWidth !== Infinity) ?
            parseInt(maxWidth, 10) : Infinity);

         this._setOption('maxHeight',(maxHeight !== undefined && maxHeight !== Infinity) ?
            parseInt(maxHeight, 10) : Infinity);
      },
      /**
       * Инициализирует контейнер
       * @param {Object} cfg
       */

      _initContainer: function(cfg) {
         var container;
         if (cfg && cfg.nodeType){
            container = $(cfg);
         } else if ('element' in cfg) {
            if (typeof(cfg.element) == 'string') { // Given an ID
               var id = cfg.element;
               container = $('#' + cfg.element);
               if(container.length === 0)
                  throw new Error("Вы пытаетесь создать элемент в несуществующем контейнере! Необходимо создать контейнер с указанным id = " + id);
            } else
            if ("jquery" in cfg.element) { // Given jQuery object
               container = cfg.element;
            }
            else if (cfg.element.nodeType) { // Given HTMLElement
               container = $(cfg.element);
            }
         }

         // Проверка при постороении компонента на используемость DOM-элемента, переданного в поле element, другим компонентом
         // https://inside.tensor.ru/opendoc.html?guid=7dd0c52e-b0cd-454a-8b33-61001deae7d2&des=
         if (container) {
            var checkingControl = ("jquery" in container) ? (container[0] && container[0].wsControl) : container.wsControl;
            if (checkingControl && checkingControl !== this) {
               Env.IoC.resolve('ILogger').error('Control', 'Вы пытаетесь привязать компоненту (id: ' + this.getId() + ', module: ' + this._moduleName + ', ' +
                  'name: ' + this.getName() + ') элемент, который уже привязан к другому компоненту (id: ' + this.getId() + ' , module: ' + checkingControl._moduleName + ', ' +
                  'name: ' + checkingControl.getName() + ')');
            }
         }
         this._container = container;
      },

      /**
       * Зависит ли высота контрола от его ширины. Эта функция нужна для оптимизации расчётов старой сетки и ей подобных контролов -
       * чтобы знать, когда вызывать дополнительный пересчёт своего ресайзера, а когда нет. У большинства контролов высота не зависит от ширины, что позволяет считать
       * старую сетку оптимальнее.
       * @returns {boolean}
       * @private
       */
      _isHeightDependentOnWidth: function() {
         return false;
      },

      _clearContainer: function() {
         if (this._isCorrectContainer()) {
            // удаляется контейнер, все элементы с конфигами могли сохранить по эти конфиги в хранилище. их нужно почистить
            this._container.find('[config]').each(function(index, elem) {
               var config = elem.getAttribute('config');
               var configObj = {};
               configObj[config] = undefined;
               configStorage.merge(configObj);
            });
            this._container.empty();
         }
      },
      /**
       * Функция удаления контейнера контрола из DOM-дерева
       * Наследник может переопределить, если требуется другое поведение
       * @private
       */
      _removeContainer: function() {
         if (this._isCorrectContainer()) {
            this._clearContainer();
            this._container.remove().get(0).wsControl = null;
         }
      },
      destroy: function(){
         if(this._container && this._container.unbind) {
            this._container.unbind();
         }

         if (this._savedConfigsMaps) {
            for (var savedI = 0; savedI < this._savedConfigsMaps.length; savedI++) {
               if (this._savedConfigsMaps[savedI]) {
                  configStorage.deleteString(this._savedConfigsMaps[savedI]);
               }
            }
         }

         this._savedConfigs = null;
         this._savedConfigsMaps = null;

         if(this.isActive()){
            this._isControlActive = false;
            this._notify('onFocusOut', true);   //Фокус с элемента уходит
         }

         this._removeContainer();
         this._invalidateParentCache();

         CommandDispatcher.deleteCommandsForObject(this);
         ControlStorage.remove(this);
         if(this._parent && this._parent.unregisterChildControl){
            this._parent.unregisterChildControl(this);
         }

         // удаляем element и opener на дестрое, чтобы компонент не держался в памяти
         if (this._hasOption('element') && this._getOption('element')) {
            this._setOption('element', null);
         }
         if (this._hasOption('opener') && this._getOption('opener')) {
            this._setOption('opener', null);
         }
         if (this._hasOption('parent') && this._getOption('parent')) {
            this._setOption('parent', null);
         }

         this._parent = null;
         this._owner = null;
         this._userData = undefined;
         this._batchUpdateData = {};
         this._clickState.target = null;

         if (this._getOption('saveState')) {
            // removeState может вызвать повторное применение состояния
            // отпишемся от обработчика а затем удалим состояние
            this.unsubscribe('onStateChanged', this._stateChangeHandler);
            NavigationController.removeState(this, false);
         }

         memoize.clear(this);

         ControlCompatible.destroy.apply(this, arguments);
         Control.superclass.destroy.apply(this, arguments);
      },

      /**
       * Устанавливает фокус на контрол.
       * @param {Boolean} active
       * * true Перевести фокус на контрол. Если фокус ранее находился на другом элементе, то произойдёт событие {@link onFocusIn}.
       * Если фокус был на данном контроле, то откроется всплывающая подсказка.
       * * false Убрать фокус с контрола. Произойдёт событие {@link onFocusOut}.
       * @param {Boolean} [shiftKey] Признак: клавиша Shift нажата (true) или отпущена (false).
       * @param {Boolean} [noFocus] Признак: не передавать (true) или передавать (false) фокус контролу после переключения его состояния.
       * @param {Lib/Control/Control} [focusedControl] Контрол, на который ушёл фокус.
       * @example
       * При готовности контрола перевести на него фокус.
       * <pre>
       *    control.subscribe('onReady', function() {
       *       if (!this.isActive()) this.setActive(true);
       *    });
       * </pre>
       * @see isActive
       * @see onFocusIn
       * @see onFocusOut
       */
      setActive: function(active, shiftKey, noFocus, focusedControl){
         //TODO:: use this from AreaAbstract.compatible.js for new controls
         var wasActive = this._isControlActive,
            myParent;

         this._isControlActive = active;
         this._updateActiveStyles();

         if(this._isCorrectContainer()){
            if(active){

               if(active !== wasActive){
                  // стреляем событиями onFocusInside у парентов, который в данный момент активны
                  this._callOnFocusInside();
                  // Если контрол был ранее неактивен - поднимем FocusIn - это приведет к возможному появлению подсказки
                  myParent = this.getParent();
                  if (myParent) {
                     myParent._activate(this);
                  }

                  //_isControlActive надо проверить - какой-то onFocusIn/onFocusOut в myParent.activate мог отменить активность
                  if (this._isControlActive) {
                     this._notify('onFocusIn');
                  }
               } else {
                  // Если контрол уже активный - возможно надо показать подсказку
                  if(this._isCanShowExtendedTooltip() && this._tooltipSettings.handleFocus) {
                     this._showExtendedTooltip();
                  }
               }

               // Откладываем фокусировку до подняния вверх myParent.activate, иначе там очищалось выделение
               // _isControlActive надо проверить - какой-то onFocusIn/onFocusOut мог отменить активность - тогда фокус ставить не надо
               if(this._isControlActive && !noFocus){
                  if (Env.detection.isMobilePlatform) {
                     focusControl(this);
                  } else {
                     ControlBatchUpdater.runBatchedDelayedAction('Control.focus', [this]);
                  }
               }
            }
            else if(active !== wasActive){
               this._notify('onFocusOut', false, focusedControl);
               // если после onFocusOut вернулось состояние компонента в активное, значит произошла отмена дизактивации. останавливаем процесс дизактивации.
               if (!this.isActive()) {
                  // Если контрол теряет активность, его предки тоже должны потерять активность,
                  // иначе при уходе с контрола активности будет отключаться активность его предков, дойдет до CompoundActiveFixMixin,
                  // он вызовет setActive не AreaAbstract а этот, и дизактивация предков на нем и завершится, то что выше будет считаться активным не являясь таковым
                  if (focusedControl) {
                     var filter = function(parent) {
                        return parent === myParent;
                     };

                     myParent = this.getParent();
                     if (myParent) {
                        //область надо деактивировать, если новый активный контрол не лежит внутри неё
                        if (!focusedControl.findParent || !focusedControl.findParent(filter)) {
                           if (focusedControl !== myParent) {
                              myParent.setActive(false, undefined, undefined, focusedControl);
                           } else {
                              // если компонент теряет активность, его предок должен забыть про то, что этот компонент внутри предка - активен
                              myParent._activeChildControl = -1;
                              myParent._activatedWithTabindex = false;
                           }
                        }
                     }
                  } else {
                     myParent = this.getParent();
                     if (myParent) {
                        myParent.setActive(false);
                        myParent._activeChildControl = -1;
                        myParent._activatedWithTabindex = false;
                     }
                  }
               }
            }
         }
      },

      _hasMarkup: function() {
         return this._isCorrectContainer() && this._container.attr('hasMarkup') === 'true';
      },

      /**
       * Возвращает признак, по которому можно определить отображается ли контрол на веб-странице или нет.
       * @remark
       * Подробнее о видимости контрола читайте в описании опции {@link visible}.
       * @return {Boolean}
       * * true Контрол отображается на веб-странице.
       * * false Контрол не отображается на веб-странице.
       * @example
       * В зависимости от состояния переключателя (switcher) применить фильтр к табличному представлению (tableView).
       * <pre>
       *    switcher.subscribe('onChange', function(eventObject, value) {
       *       if (value && tableView.isVisible()) {
       *          tableView.setQuery('Тип': 'ИП');
       *       }
       *    });
       * </pre>
       * @see visible
       * @see show
       * @see hide
       * @see toggle
       * @see setVisible
       */
      isVisible : function(){
         return this._isVisible;
      },

      /**
       * Устанавливает видимость контрола на веб-странице.
       * Подробнее о видимости контрола на веб-странице вы можете прочитать в описании к опции {@link visible}.
       * @param {Boolean} visible
       * * true Контрол виден.
       * * false Контрол скрыт.
       * @example
       * При определённом значении группы радикнопок (fieldRadio) сделать видимыми дополнительные контролы.
       * <pre>
       *    fieldRadio.subscribe('onChange', function(eventObject, value) {
       *       if (value === 'ОСНО') {
       *          fieldDropdown.setVisible(true);
       *          fieldString.setVisible(true);
       *       }
       *    });
       * </pre>
       * @see visible
       * @see show
       * @see hide
       * @see toggle
       * @see isVisible
       */
      setVisible: function(visible){
         this.toggle(visible);
      },

      _checkDelayedRecalk: function() {
         var updater = ControlBatchUpdater;
         if (updater._needDelayedRecalk(this))
            updater._doDelayedRecalk(this);
      },


      _getLinkedLabelLow: memoize(function() {
         var
            parent = this._container.parent(),
            name = this._getOption('name'),
            label;

         if (parent.hasClass('ws-Label')) {
            label = parent.find('.ws-Label-title:first');
         }
         else if (name) {
            var convertedName = (name + '').replace(slashRE, '\\\\').replace(quotRE, '\\"');
            label = parent.find('label[for="fld-' + convertedName + '"]').parent();
            if (label.length === 0 && parent.hasClass('ws-labeled-control')) {
               label = parent.find('label:first');
            }
         }
         else if (parent.hasClass('ws-labeled-control')) {
            label = parent.find('label:first');
         }

         return (label && label.length > 0) ? label : null;
      }, '_getLinkedLabelLow'),

      /**
       * Есть ли/будет ли у контрола приявязанная метка
       * @return {Boolean}
       * @protected
       */
      _hasLinkedLabel: function() {
         return !!this._getLinkedLabelLow();
      },

      /**
       * Получить метку, приявязанную к контролу
       * Отдаёт undefined если метки нет
       * @return {Object}
       * @protected
       */
      _getLinkedLabel: function() {
         return this._getLinkedLabelLow();
      },




      /**
       *
       * Получить идентификатор владельца контрола.
       * @return {String|null} Идентификатор владельца контрола.
       * Возвращает null, если владельца нет.
       * @example
       * При готовности контрола получить идентификатор его владельца. Если владельца нет, то задать его.
       * <pre>
       *    control.subscribe('onReady', function() {
       *       if (this.getOwnerId() === null) {
       *          this.setOwner(control2);
       *       }
       *    });
       * </pre>
       * @see owner
       * @see getOwner
       * @see setOwner
       * @see makeOwnerName
       */
      getOwnerId: function() {
         var owner = this.getOwner();
         return owner instanceof Control ? owner.getId() : null;
      },

      /**
       *
       * Задать владельца контрола.
       * @param {String|Lib/Control/Control} owner Идентификатор нового владельца контрола или экземпляр класса владельца контрола.
       * @example
       * Если у кнопки (btn) нет владельца, то сделать табличное представление (tableView) контролом-владельцем.
       * <pre>
       *    btn.subscribe('onReady', function() {
       *       //дополнительно проверяем нахождение контролов в одном окне
       *       if (this.getOwner() === null && this.getParent() === tableView.getParent()) {
       *          this.setOwner(tableView);
       *       }
       *    });
       * </pre>
       * @see owner
       * @see getOwnerId
       * @see getOwner
       * @see makeOwnerName
       */
      setOwner: function(owner) {
         if (owner instanceof Control)
            this._owner = owner;
         else {
            this._setOption('owner', owner);
            this._owner = null;
         }
      },

      /**
       *
       * Создать строку в формате "ИмяОкна/ИмяКонтрола", где окно - это область, на которой построен контрол.
       * @remark
       * Применяется в тех случаях, когда контролу в качестве владельца передаётся строка (имя владельца фиксированного
       * формата).
       * @return {String} Имя контрола в формате "ИмяОкна/ИмяКонтрола".
       * @example
       * Сделаем поле ввода (fieldString) контролом-владельцем автодополнения (suggest).
       * <pre>
       *    suggest.subscribe('onReady', function() {
       *       var windowName = fieldString.makeOwnerName(),
       *       this.setOwner(windowsName);
       *    });
       * </pre>
       * @see owner
       * @see getOwnerId
       * @see setOwner
       * @see getOwner
       */
      makeOwnerName: function(){
         var parent = this.findParent(function(parent) {
            // ws-tabs-generated - динамически добавленная вкладка, её элементы должны упираться в неё
            // не динамическая вкладка - джинн прокидывает название шаблона в этом случае
            if (cInstance.instanceOfModule(parent, 'Deprecated/Controls/TabTemplatedArea/TabTemplatedArea') && !parent.getContainer().hasClass('ws-tabs-generated')) {
               return false;
            }
            return cInstance.instanceOfModule(parent, 'Lib/Control/TemplatedAreaAbstract/TemplatedAreaAbstract');

         });
         return [ parent && parent.getCurrentTemplateName(), this.getName()].join(':');
      },
      /**
       * @noShow
       */
      getMinSize:function (){
         return {
            'minHeight':this.getMinHeight(),
            'minWidth':this.getMinWidth()
         };
      },

      _getAutoHeight: function() {
         return this._container.outerHeight();
      },

      _getAutoWidth: function() {
         return this._container.outerWidth();
      },

      _getFixedHeight: memoize(function() {
         return this._container.outerHeight();
      }, '_getFixedHeight'),

      _getFixedWidth: memoize(function() {
         return this._container.outerWidth();
      }, '_getFixedWidth'),

      /**
       * @noShow
       */
      getMinHeight:function (){
         if(this._container && this.isVisible()){
            var minHeight, autoHeight = this._getOption('autoHeight');
            if (this._verticalAlignment === 'Stretch') {
               //Если растяг с автовысотой, то нужно вернуть свою возможную минимальную высоту
               minHeight = autoHeight ? this._calcMinHeight() : 0;
            } else if (autoHeight) {
               minHeight = this._getAutoHeight();
            } else {
               // @todo в целях оптимизации возможно записать в атрибут
               minHeight = (this._height && this._height !== "100%" && this._height !== "auto") ?
                  parseInt(this._height, 10) : this._getFixedHeight();
            }

            // сначала проверяется максимальный размер, т.к. браузеры считают именно так
            if(minHeight > this._getOption('maxHeight')){
               minHeight = this._getOption('maxHeight');
            }
            if(minHeight < this._getOption('minHeight')){
               minHeight = this._getOption('minHeight');
            }
            if(this._margins['top'])
               minHeight += this._margins['top'];
            if(this._margins['bottom'])
               minHeight += this._margins['bottom'];
            return minHeight;
         }
         return 0;
      },

      /**
       * Вычисляет свою возможную минимальную высоту
       * @return {Number}
       * @private
       */
      _calcMinHeight: function() {
         return this._getOption('minHeight');
      },
      /**
       * Вычисляет свою возможную минимальную ширину
       * @return {Number}
       * @private
       */
      _calcMinWidth: function() {
         return this._getOption('minWidth');
      },
      /**
       * @noShow
       */
      getMinWidth:function (){
         if(this._container && this.isVisible()){
            var minWidth, autoWidth = this._getOption('autoWidth');
            if(this._horizontalAlignment === 'Stretch'){
               //Если растяг с автошириной, то нужно вернуть свою возможную минимальную ширину
               minWidth = autoWidth ? this._calcMinWidth() : 0;
            } else if (this._getOption('autoWidth')) {
               minWidth = this._getAutoWidth();
            } else {
               minWidth = (this._width && this._width !== "100%" && this._width !== "auto") ?
                  parseInt(this._width, 10) : this._getFixedWidth();
            }

            if(minWidth > this._getOption('maxWidth')){
               minWidth = this._getOption('maxWidth');
            }
            if(minWidth < this._getOption('minWidth')){
               minWidth = this._getOption('minWidth');
            }
            if(this._margins['left'])
               minWidth += this._margins['left'];
            if(this._margins['right'])
               minWidth += this._margins['right'];
            return minWidth;
         }
         return 0;
      },
      /**
       *
       */
      getAlignment:function (){
         return {
            horizontalAlignment:this._horizontalAlignment,
            verticalAlignment:this._verticalAlignment
         }
      },



      /**
       *
       * Является ли контрол подконтролом.
       * Важно для обработки фокуса: фокус на подконтролы не переходит.
       * @return {Boolean} true - контрол является подконтролом, false - нет.
       *
       */
      isSubControl: function(){
         return this._getOption('subcontrol');
      },

      /**
       * Инициализирует свойство в формате, определенном в компоненте.
       * @remark
       * Проверяет, определён ли у контрола create-метод для этого свойства. Если определён, то вызывает его.
       * Если нет методa, createProperty создаёт исключение.
       * @param {String} propName Имя свойства.
       * @return {*}
       * @see getProperty
       * @see onPropertyChanged
       * @see onPropertiesChanged
       * @see setProperties
       */
      initializeProperty: function(propName) {
         var methodName = 'initialize' + ucFirst(propName),
            hasMethod = typeof(this[methodName]) === 'function';

         if(hasMethod) {
            this[methodName]();
         } else {
            Env.IoC.resolve('ILogger').error('Control', 'Метод initializeProperty вызвали для несуществующего свойства "' + propName + '" (не определено соответствующего ему метода ' + methodName + ' ) "');
         }
      }
   });

   var controlExtend = function (classPrototype, mixinsList, classExtender) {
      Control.prototype._setCompatibleOptions(classPrototype, mixinsList, classExtender);
   };

   Control.beforeExtend = controlExtend;

   /**
    * @class $ws.single.ControlStorage
    * @public
    * @deprecated Этот класс - сосредоточение мирового зла. Пожалуйста, постарайтесь не использовать его.
    * @singleton
    */
   ControlStorage = /** @lends $ws.single.ControlStorage.prototype */{
      _storage : {},
      _waitingChildren: {},
      _waitingChildrenByName: {},
      _storageWithParentName: {},
      /**
       * Сохраняет элемент управления в хранилище
       *
       * @param {Lib/Control/Control} control
       * @returns {String|Boolean} ID элемента, если сохранен, false в противном случае.
       * @deprecated Использовать крайне не рекомендуется
       */
      store : function(control){
         var id = false;
         if(control instanceof Control){
            this._storage[id = control.getId()] = control;
            if(this._waitingChildren[id]) {
               try {
                  this._waitingChildren[id].callback(control);
               }
               finally {
                  delete this._waitingChildren[id]
               }
            }
            var name = control.getName(),
               ownerName = control.makeOwnerName().split(":"),
               parentName = ownerName[0],
               parentStorage;
            if(this._waitingChildrenByName[name] && !this._waitingChildrenByName[name].isReady()) {
               try {
                  this._waitingChildrenByName[name].callback(control);
               }
               finally {
                  delete this._waitingChildrenByName[name];
               }
            }
            this._storageWithParentName[parentName] = this._storageWithParentName[parentName] || {};
            parentStorage = this._storageWithParentName[parentName];
            if(parentStorage[name] instanceof cDeferred){
               var def = parentStorage[name];
               parentStorage[name] = control;
               def.callback(control);
            } else
               parentStorage[name] = control;
         }
         return id;
      },
      /**
       * Убирает элемент управления из хранилища
       * @param {Lib/Control/Control} control
       * @deprecated Использовать крайне не рекомендуется
       */
      remove : function(control){
         if(control instanceof Control) {
            var id = control.getId(),
               name = control.getName(),
               ownerName = control.makeOwnerName().split(":"),
               parentName = ownerName[0];
            if(id in this._storage) {
               this._storage[id] = null;
               delete this._storage[id];
            }
            if(id in this._waitingChildren) {
               this._waitingChildren[id] = null;
               delete this._waitingChildren[id];
            }
            if(name in this._waitingChildrenByName) {
               this._waitingChildrenByName[name] = null;
               delete this._waitingChildrenByName[name];
            }
            if(parentName in this._storageWithParentName){
               this._storageWithParentName[parentName][name] = null;
               delete this._storageWithParentName[parentName][name];
            }
         }
      },
      /**
       * Получить контрол по идентификатору.
       * @param {String} id Идентификатор искомого контрола.
       * @return {Lib/Control/Control} Найденный контрол.
       * @deprecated Используйте Lib/Control/AreaAbstract/AreaAbstract.getChildControlByName
       */
      get : function(id){
         if (this._storage[id] === undefined)
            throw new Error("ControlStorage : id = '" + id + "' not stored");
         return this._storage[id];
      },
      /**
       * Проверить по идентификатору наличие контрола.
       * @param {String} id Идентификатор искомого контрола.
       * @returns {Boolean} true - контрол нашли, false - не нашли.
       * @deprecated Использовать крайне не рекомендуется
       */
      contains : function(id){
         return this._storage[id] !== undefined;
      },
      /**
       * Получить контрол по его имени.
       * @param {String} name Имя контрола.
       * @param {Object} [classObject] Класс, интстансом которого должен быть контрол.
       * @return {Lib/Control/Control} Найденный контрол.
       * @deprecated Используйте Lib/Control/AreaAbstract/AreaAbstract.getChildControlByName
       */
      getByName: function(name, classObject) {
         for(var id in this._storage) {
            if(this._storage.hasOwnProperty(id)) {
               if(this._storage[id].getName() == name){
                  if(classObject && !(this._storage[id] instanceof classObject)){
                     continue;
                  }
                  return this._storage[id];
               }
            }
         }
         throw new Error("ControlStorage : control with name '" + name + "' is not stored");
      },
      /**
       * @param name
       * @returns {*}
       * @deprecated Использовать крайне не рекомендуется
       */
      getWithParentName: function(name) {
         var names = name.indexOf(':') > -1 ? name.split(':') : name.split('/'),
            controlName = names[1],
            parentName = names[0];
         if(parentName in this._storageWithParentName && controlName in this._storageWithParentName[parentName]){
            return this._storageWithParentName[parentName][controlName]
         }
         throw new Error("ControlStorage : control with name '" + controlName + "' is not stored in parent with name " + parentName);
      },
      /**
       * Проверить по имени наличие контрола.
       * @param {String} name Имя искомого контрола.
       * @returns {Boolean} true - нашли контрол, false - не нашли.
       * @deprecated Используйте Lib/Control/AreaAbstract/AreaAbstract.hasChildControlByName
       */
      containsByName : function(name){
         for(var id in this._storage) {
            if(this._storage.hasOwnProperty(id)) {
               if(this._storage[id].getName() == name)
                  return true;
            }
         }
         return false;
      },
      /**
       * Ожидание создания контрола с определённым идентификатором.
       * @param {String} id Идентификатор контрола.
       * @return {Core/Deferred}
       * @deprecated Используйте Lib/Control/AreaAbstract/AreaAbstract.waitChildControlById
       */
      waitChild: function(id){
         if(id in this._storage)
            return new cDeferred().callback(this._storage[id]);
         else
            return (id in this._waitingChildren) ?
               this._waitingChildren[id] :
               (this._waitingChildren[id] = new cDeferred());
      },
      /**
       * Ожидание создания контрола с определённым именем.
       * @param {String} name Имя контрола.
       * @return {Core/Deferred}
       * @deprecated Используйте Lib/Control/AreaAbstract/AreaAbstract.waitChildControlByName
       */
      waitChildByName: function(name){
         if(this.containsByName(name))
            return new cDeferred().callback(this.getByName(name));
         else
            return (name in this._waitingChildrenByName) ?
               this._waitingChildrenByName[name] :
               (this._waitingChildrenByName[name] = new cDeferred());
      },
      /**
       * Ожидание контрола по имени самого контрола и имени его родителя
       * @param {String} name Строка вида <имя родителя>/<имя контрола>.
       * @return {Core/Deferred}
       * @deprecated Использовать крайне не рекомендуется
       */
      waitWithParentName: function(name){
         var names;
         // todo remove this condition after 3.6
         if (name.indexOf(':') > -1 || name.indexOf('/') > -1) {
            names = name.indexOf(':') > -1 ? name.split(':') : name.split('/');
            this._storageWithParentName[names[0]] = this._storageWithParentName[names[0]] || {};
            var parentStorage = this._storageWithParentName[names[0]];
            if(parentStorage[names[1]] instanceof Control)
               return new cDeferred().callback(parentStorage[names[1]]);
            else if(parentStorage[names[1]] instanceof cDeferred)
               return parentStorage[names[1]];
            else
               return ( parentStorage[names[1]] = new cDeferred() );
         }
         return ControlStorage.waitChild(name);
      },
      /**
       * Получить все хранимые контролы.
       * @returns {*}
       * @deprecated Использовать крайне не рекомендуется
       */
      getControls: function(){
         return this._storage;
      }
   };

   if (window){
      NavigationController.init();
   }

   /**
    * Класс, описывающий контрол, связанный с данными в контексте
    * Заботится о своевременном получении значения из контекста
    * @class SBIS3.CORE.DataBoundControl
    * @public
    * @deprecated
    * @extends Lib/Control/Control
    * @mixes Lib/Mixins/DataBoundMixin
    */
   var DataBoundControl = cExtend.mixin(Control, DataBoundMixin);
   DataBoundControl.beforeExtend = controlExtend;

   return {
      Control: Control,
      DataBoundControl: DataBoundControl,
      ControlStorage: ControlStorage,
      ControlBatchUpdater: ControlBatchUpdater
   };
});
