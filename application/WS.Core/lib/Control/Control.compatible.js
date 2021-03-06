/* global define */

/**
 * Created by dv.zuev on 17.04.2017.
 */
define('Lib/Control/Control.compatible', [
   'Core/ControlBatchUpdater',
   'Env/Env',
   'Core/helpers/Number/randomId',
   'Core/core-instance',
   'Core/core-merge',
   'Core/ContextBinder',
   'Core/helpers/Object/find',
   'Core/CommandDispatcher',
   'Core/helpers/Hcontrol/isElementVisible',
   'Core/helpers/Hcontrol/focusControl',
   'View/Runner',
   'View/Executor/Utils',
   'Core/helpers/Function/throttle',
   'Core/Deferred',
   'is!browser?jquery'
], function(
   ControlBatchUpdater,
   Env,
   randomId,
   cInstance,
   merge,
   ContextBinder,
   objectFind,
   CommandDispatcher,
   isElementVisible,
   focusControl,
   runner,
   Utils,
   throttle
) {
   /*
    *  Сохраняем детек клика в глобальной переменной, потму что клик может сработать над другим контролом, у ссылок преимущество
    *  а touchend будет над другим и тогда дополнительно сгенерируется клик
    */
   var clickStateTarget = [];


   ControlBatchUpdater.registerDelayedAction('Control.focus', focusControl, 'FocusActions');

   function ucFirst(str) {
      return str.substr(0, 1).toUpperCase() + str.substr(1);
   }

   function isDuckGetSet(entity) {
      return entity && entity.set && entity.get;
   }

   /**
    * Функция искуственного создания scope для корректной работы замыканий.
    * Для понимания функции сначала прочитать комментарий внутри _modifyOptions
    */
   function calcFinalScope(scopes) {
      /**
       * Сюда сложим финальный scope
       */
      var finalScope = {};

      /**
       * пробежимся по конфигам родителей начиная с самого далекого предка
       */
      for (var k = scopes.length - 1; k >= 0; k--) {
         /**
          * Просто скопируем опции родителя поверх текущих скопированных опций
          */
         for (var i in scopes[k]) {
            /**
             * Элементы, которые необходимо игнорировать, т.к. они автоматически применяются внутри шаблонизатора
             */
            if (i === 'element' ||
               i === 'parent' ||
               i === 'logicParent' ||
               i === 'parentEnabled') {
               continue;
            }

            /**
             * Нужно делать сложные штуки для создания правильного scope
             * Чтобы понять что это, нужно нарисовать схему компонентов:
             * А
             *  |-- B
             *       |-- C
             *            |-- D
             * И все компоненты вставлены в инлайн шаблоны контентных опций компонента родителя
             * То есть, это как будто компонент, который обернут тремя скроллконтейнерами
             * Далее на уровне компонента А в шаблоне появляется переменная "prop1 = { a: 1, b:2 }"
             * Это опция компонента А
             * Далее в компоненте D это используется как prop1.a
             * Данные берутся из замыкания.
             * Строим на сервере, возвращаем сериализованные функции. И получается, что D - функция в контексте которой
             * нет prop1.a
             * Чтобы оно там появилось - собираем scope из родительских опций, берем опции A - кладем их в наш объект,
             * берем опции B - кладем их в наш scope и так далее.
             * Вот на этом этапе нужно мержить объекты, потому что у компонента B оказывается опция, которая называется prop1
             * и она имеет значение по умолчанию prop1= { c: 1, d:2 }
             * Итого после мержа, в контексте D есть prop1 = {a,b,c,d}
             */
            if (typeof scopes[k][i] === 'object' && scopes[k][i]) {
               /**
                * При восстановлении функции мы восстанавливаем область
                * видимости и данные для неё. Т.к. в таких объектах могут встречаться
                * сущности из Types просто так мы их не можешь смерджить с объектом, который мы
                * восстанавливаем. Поэтому нам нужно передать её по ссылке не изменяя ничего.
                * Для передачи по ссылке инстансов с get и set
                * потому что мерджить просто по свойствам их нельзя.
                */
               if (isDuckGetSet(scopes[k][i])) {
                  finalScope[i] = scopes[k][i];
               } else {
                  if (!finalScope[i]) {
                     finalScope[i] = Array.isArray(scopes[k][i]) ? [] : {};
                  }
                  finalScope[i] = merge(finalScope[i], scopes[k][i], {rec: false});
               }
            } else {
               finalScope[i] = scopes[k][i];
            }
         }
      }

      /**
       * На выходе мы имеем такую картину:
       * p1 = {a: 1, b: 2}, p2 = {a:2,c:3}
       * где p2 есть parent для p1
       * тогда finalConfig = { a:1, b:2, c:3 }
       */
      finalScope = Object.create(finalScope);
      return finalScope;
   }

   /**
    * @public
    * @mixin Lib/Control/Control.compatible
    * @public
    * @author Крайнов Д.О.
    */
   return /** @lends Lib/Control/Control.compatible.prototype */ {

      _needFocusOnActivated: function() {
         var isMobile =  Env.constants.browser.isMobilePlatform,
            focusOpt = this._getOption('focusOnActivatedOnMobiles');

         return !isMobile || focusOpt === undefined || focusOpt;
      },


      /**
       * Данный метод позволяет изменить опции в дочернем классе ДО построения верстки
       * В аргументы приходит this._options по ссылке (!) то есть все изменения, проводимые с полученным объектом, отразятся на this._options
       * Возвращаемое значение будет испольновано при построении верстки
       * @param {Object} options
       * @returns {*}
       * @private
       */
      _modifyOptions: function(options) {

         /**
          * Условие гласит следующее: если мы на клиенте и у нас есть какой-то конфиг
          * поищем его в конфигах, пришедших с сервера и если он там есть сделаем следующую штуку
          */
         if (typeof window !== 'undefined' && options && options['__$config'] &&
            window.componentOptions && window.componentOptions.indexOf(options['__$config']) > -1) {

            /**
             * Соберем все _options всех родителей, которые являются контролами с tmplными функциями
             * То есть, здесь мы просто поднимаемся по иерархии вверх и сохраняем ссылки на опции
             * Т.к. modifyOptions может быть вызвано не 1 раз, проверим не делали ли мы этого ранее
             * помечаем функцию шаблонизатора как fixed
             */
            var scope = [];
            if (this && this._dotTplFn && this._dotTplFn.stable &&
               !this._dotTplFn.fixed) {
               /**
                * Соберем массив _options
                */
               var parent = options.parent;
               while (parent && parent._dotTplFn && parent._dotTplFn.stable) {
                  scope.push(parent._options);
                  parent = parent._parent;
               }

               /**
                * Если есть хоть один parent - его опции могут быть замкнуты внутри шаблонов детей
                */
               if (scope.length > 0) {
                  /**
                   * Сохраним ссылку на функцию, чтобы потом вызвать ее с правильным scope
                   */
                  var oldTpl = this._dotTplFn;
                  this._dotTplFn = function() {
                     /**
                      * Рассчитываем scope, как будто мы внутри некой функции и возвращаем результат
                      */
                     return oldTpl.apply(calcFinalScope(scope), arguments);
                  };

                  /**
                   * Пометим функции, чтобы еще раз не кастомить
                   */
                  this._dotTplFn.fixed = true;
                  this._dotTplFn.stable = true;
               }

               /**
                * А здесь начинается самая сильная мысль всего коммита!
                * Сразу скажу метрики этого кода:
                * для страницы Задачи->На мне он выполняется 38 раз (38 компонентов)
                * в среднем по 0,12 мс
                */
               this._fixMyOption(scope, options, options, 0);
            }
         }

         /**
          * options могут не передать, т.к. не понимают что вообще происходит...
          */
         if (options && !options.hasOwnProperty('logicParent')) {
            options.logicParent = null;
         }
         if (options && !options.hasOwnProperty('parentEnabled')) {
            options.parentEnabled = true;
         }

         return options;
      },

      /**
       * Функция кастомизации опций, которые пришли с сервера
       */
      _fixMyOption: function(scope, parentOptions, object, gl) {
         if (object && object.jquery) {
            return;
         }
         if (typeof Node !== 'undefined' && object instanceof Node) {
            return;
         }

         /*
           * Не будем проваливаться в те штуки, которые похожи
           * на сериализованные объекты, там не может быть функций.
           * Функции есть только в обычных объектах
          * */
         if (object && (object._goUp !== undefined ||
               object._type ||
               object._moduleName)) {
            return;
         }

         /**
          * Рекурсивно обходимо объект опций, с максимальной глубиной 3
          * этой глубины достаточно для решения проблемы в ЭДО в 3.7.5.150
          * В 3.17.300 ЭДО стало глубже и нам необходимо углубить проход
          * Технически со стороны сервера можно вернуть "метку" для конфига,
          * которая бы указала путь до опции-функции
          */
         if (gl > 7) {
            return;
         }
         for (var i in object) {
            try { //typeof object[i] - в ItemsStrategy валит throw new Error и все падает. Поймаем и подавим
               if (typeof object[i] === 'function') {
                  /**
                   * Если нашли опцию функцию, проверим является ли эта функция контентной опцией,
                   * которая пришла с сервера.
                   */
                  if (object[i].fromSerializer) {
                     /**
                      * Если это так, замкнем все что нам пришло внутри функции
                      */
                     (function(func, scope, parentOptions) {
                        object[i] = function() {
                           /**
                            * Теперь в scope функции отправим опции текущего компонента и плюс всю пачку родительских опций
                            * Важно понимать, что здесь манипулируется ссылками на объекты и каждый вызов функции шаблона
                            * будет обновлять scope на текущий актуальный!
                            */
                           return func.apply(calcFinalScope([parentOptions].concat(scope)), Utils.Common.addArgument(runner.Run, arguments));
                        };

                        /**
                         * На восстановленную функцию нужно повесить toString, потому что никто не отменял
                         * использования этих функций как строк.
                         */
                        object[i].toString = function() {
                           var args = Utils.Common.addArgument(runner.Run, arguments);
                           args[0] = calcFinalScope([parentOptions].concat(scope));
                           return func.apply(args[0], args);
                        };
                     })(object[i], scope, parentOptions);
                  }
               } else if (i === 'element' || i === 'parent' || i === 'logicParent') {
                  continue;
               } else if (typeof object[i] === 'object') {
                  this._fixMyOption(scope, parentOptions, object[i], gl + 1);
               }
            } catch (e) {}
         }
      },

      _runInBatchUpdate: function(hint, callback, args) {
         var updater = ControlBatchUpdater;
         return updater._runInBatchUpdate(hint, this, callback, args);
      },

      _runInBatchUpdateOpts: function(options) {
         var updater = ControlBatchUpdater;
         updater.ensureBatchUpdate(options.hint || 'Control._runInBatchUpdateOpts');
         return updater._runInBatchUpdateOpts(options);
      },

      _createBatchUpdateWrapper: function(hint, callback, dontBindThis) {
         var self = this;
         return function() {
            var updater = ControlBatchUpdater;

            updater.ensureBatchUpdate(hint || 'Control._runInBatchUpdateOpts');
            return updater._runInBatchUpdate(hint, dontBindThis ? this : self, callback, arguments);
         };
      },

      _haveBatchUpdate: function() {
         var updater = ControlBatchUpdater;
         return updater.haveBatchUpdate() || updater.haveApplyUpdateInProcess();
      },

      _needForceOnResizeHandler: function() {
         return ControlBatchUpdater.haveApplyUpdateInProcess();
      },

      _runBatchDelayedFunc: function(funcName, func) {
         var result;
         if (this._haveBatchUpdate()) {
            ControlBatchUpdater.addDelayedFunc(funcName, this, func);
         } else {
            result = func.apply(this);
         }
         return result;
      },

      _needRecalkInvisible: function() {
         return false;
      },

      _getBatchUpdateData: function() {
         return this._batchUpdateData;
      },

      _setBatchUpdateData: function(data) {
         this._batchUpdateData = data;
      },

      /* Возвращаем true, т.к. сейчас все контролы имеют авторазмеры (подстраиваются под контент или под родителя),
         если возвращать false то прерывается пакет расчётов и не вызывается onResizeHandler */
      _haveAutoSize: function() {
         return true;
      },

      /* eslint-disable no-irregular-whitespace */
      /**
       * Этот метод применяется для группировки изменения нескольких свойств в одну группу, так, чтобы все изменения давали
       * только одно событие {@link onPropertiesChanged}.
       * @param {Function} func Функция, группирующая изменения нескольких свойств: внутри неё должны вызываться методы контрола, изменяющие его свойства.
       * Событие {@link onPropertiesChanged} произойдёт по окончанию самого внешнего вызова {@link runInPropertiesUpdate}, если внутри этих вызовов кто-либо
       * вызывал метод {@link _notifyOnPropertyChanged}, запускающий событие на одиночное изменение свойства {@link onPropertyChanged}, и сигнализирующий об
       * изменении какого-либо свойства.
       * Контекстом (значением переменной this) внутри функции func будет контрол, у которого вызывается этот метод (runInPropertiesUpdate).
       * @param {Array|Arguments} [args] Массив аргументов, передаваемых в функцию func.
       * @remark Не используйте метод runInPropertiesUpdate с {@link https://wi.sbis.ru/doc/platform/developmentapl/interface-development/working-with-data/entity/ рекордами}, т.к. это не будет работать.
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
       * @see setProperty
       * @see getProperty
       * @see setProperties
       * @see onPropertyChanged
       * @see onPropertiesChanged
       */
      /* eslint-enable no-irregular-whitespace */
      runInPropertiesUpdate: function(func, args) {
         var result;
         try {
            this._propertiesChangedLock++;
            result = func.apply(this, args || []);
         } finally {
            this._propertiesChangedLock--;
            if (this._propertiesChangedLock === 0 && this._propertiesChangedCnt !== 0) {
               this._propertiesChangedCnt = 0;
               this._notify('onPropertiesChanged');
            }
         }
         return result;
      },

      /**
       * Метод, сигнализирующий об изменении какого-либо свойства у контрола. Этот метод запускает событие {@link onPropertyChanged},
       * а также помечает изменение во время группового изменения свойств, запущенного из метода {@link runInPropertiesUpdate}.
       * Сигнализировать об изменении свойства нужно с помощью именно этого метода, а не просто через _notify('onPropertyChanged') -
       * тогда событие {@link onPropertiesChanged} будет запускаться само по окончании группового изменения свойств.
       * Если же группового изменения свойств нет ((_notifyOnPropertyChanged вызывается вне runInPropertiesUpdate, вне группового изменения),
       * то событие {@link onPropertiesChanged} вызовется методом _notifyOnPropertyChanged сразу после события {@link onPropertyChanged}.
       * @param {String} propertyName Имя изменённого свойства.
       * @private
       * @see setProperty
       * @see getProperty
       * @see setProperties
       * @see onPropertyChanged
       * @see onPropertiesChanged
       * @see runInPropertiesUpdate
       */
      _notifyOnPropertyChanged: function(propertyName) {
         this._notify('onPropertyChanged', propertyName);
         if (this._propertiesChangedLock > 0) {
            this._propertiesChangedCnt++;
         } else {
            this._notify('onPropertiesChanged');
         }
      },


      /**
       *
       * Получить идентификатор контейнера контрола.
       * @remark
       * Контейнер - это html-элемент, ограничивающий контрол от других элементов веб-страницы.
       * Идентификатор контейнера хранится в атрибуте id и является уникальным.
       * Идентификатор, как и {@link name}, используется для получения экземпляра класса контрола.
       * @returns {String} Идентификатор контейнера контрола.
       * @example
       * Получить дочерний контрол по id. Скрыть родителя, если id равен заданному.
       * <pre>
       *    control.subscribe('onReady', function() {
       *       var id = this.getChildControlByName('Child').getId();
       *       if (id == 'div_first') {
       *          this.getParent().hide();
       *       }
       *    });
       * </pre>
       * @see get
       * @see getChildControlByName
       * @see getChildControlById
       * @see getOwnerId
       */
      getId: function() {
         if (!this._id) {
            if (this._isCorrectContainer()) {
               var id = this._id = this._container[0].id;
               if (!id || id === '') {
                  this._id = this._container[0].id = randomId();
               }
            } else {
               this._id = randomId();
            }
         }
         return this._id;
      },

      /**
       * Возвращает имя контрола.
       * Подробнее об именах контролов вы можете прочитать в описании к опции {@link name}.
       * @returns {String} Имя контрола.
       * @example
       * В зависимости от имени кнопки (btn) установить фильтр на табличное представление (tableView).
       * <pre>
       *    btn.subscribe('onClick', function() {
       *       var name = this.getName();
       *       //Field - название поля табличного представления, по которому хотим фильтровать записи
       *       tableView.setQuery({Field : name});
       *    });
       * </pre>
       * @see name
       * @see getByName
       * @see getParentByName
       * @see getChildControlByName
       */
      getName: function() {
         if (this._hasOption('name')) {
            return this._getOption('name');
         } else {
            this._$name = this._options.name = randomId('name-');
            return this._$name;
         }
      },

      /**
       * Возвращает окно, на котором построен контрол.
       * @returns {CWindow|undefined} Экземпляр класса окна, на котором построен контрол.
       * Возвращается undefined, если окна не существует.
       * @example
       * При клике на кнопку (btn) закрыть окно.
       * <pre>
       *    btn.subscribe('onClick', function() {
       *       this.getParentWindow().close();
       *    });
       * </pre>
       * @see findParent
       * @see getParent
       * @see getTopParent
       * @see getParentByName
       * @see getParentByClass
       */
      getParentWindow: function() {
         try {
            return this.getParentByClass('Lib/Control/Window/Window');
         } catch (e) {
            return undefined;
         }
      },

      _invalidateParentCache: function() {
         var parent = this.getParent();

         while (parent) {
            if (parent._childsMapIdCache) {
               delete parent._childsMapIdCache[this.getId()];
               delete parent._childsMapNameCache[this.getName()];
            }
            if (parent.allChilds) {
               for (var i = 0; i < parent.allChilds.length; i++) {
                  if (parent.allChilds[i] === this) {
                     parent.allChilds.splice(i, 1);
                     break;
                  }
               }
            }
            parent = parent.getParent();
         }
      },

      /**
       *
       * Найти родителя контрола по классу.
       * @param {Function} classConstructor Класс родителя.
       * @return {Lib/Control/AreaAbstract/AreaAbstract} Экземпляр класса родителя.
       * Если родителя с таким классом не существует, то возвращается сообщение об ошибке.
       * @example
       * <pre>
       *    //найти родителя, являющегося вкладками
       *    this.getParentByClass(Deprecated/Controls/Tabs/Tabs);
       *
       *    //найти окно (и его наследников, в т.ч. Dialog и т.п.), эквивалент this.getParentWindow()
       *    this.getParentByClass(CWindow);
       * </pre>
       * @see getParent
       * @see getParentWindow
       * @see findParent
       * @see getTopParent
       * @see getParentByName
       */
      getParentByClass: function(classConstructor) {
         if (!classConstructor) {
            throw new Error('Control.getParentByClass - искомый класс не определен');
         }
         return this.findParent(function(parent) {
            if (typeof classConstructor == 'string') {
               return cInstance.instanceOfModule(parent, classConstructor);
            } else {
               return parent instanceof classConstructor;
            }
         });
      },

      /**
       * Нужно для расчёта авторазмеров: если контейнер, как у автодополнения, лежит в body, то его не надо учитывать
       * при расчёте авторазмеров родителя.
       * @returns {boolean}
       * @protected
       */
      _isContainerInsideParent: function() {
         return this._getOption('isContainerInsideParent');
      },

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
       * Возвращает табиндекс контрола.
       * Подробнее о табиндексах контрола вы можете прочитать в описании к опции {@link tabindex}.
       * @returns {Number} Значение табиндекса.
       * @example
       * В зависимости от значения, отображаемого в выпадающем списке (fieldDropdown), установить новый tabindex полей
       * ввода (fieldString).
       * <pre>
       *    fieldDropdown.subscribe('onChange', function() {
       *       if (this.getStringValue() == 'ИП') {
       *          var index = fieldString2.getTabindex();
       *          fieldString2.hide();
       *          fieldString4.hide();
       *          fieldString3.setTabindex(index+1);
       *          fieldString5.setTabindex(index);
       *       } else {
       *          fieldString2.show();
       *          fieldString4.show();
       *       }
       *    });
       * </pre>
       * @see tabindex
       * @see setTabindex
       */
      getTabindex: function() {
         var res = this._getOption('tabindex');
         return res === undefined ? -1 : +res;
      },

      /**
       * Устанавливает табиндекс контрола.
       * Подробнее о табиндексах контрола вы можете прочитать в описании к опции {@link tabindex}.
       * @param {Number|false} tabindex Значение табиндекса, которое нужно присвоить контролу.
       * @param {Boolean} [notCalculate = false] true - не пересчитывать табиндекс соседних контролов.
       * @remark
       * Если пользователь задаёт контролу табиндекс, который уже используется, то рекомендуется пересчитать табиндекс "соседних контролов".
       * Пересчёт позволяет изменить значения таким образом, чтобы "соседние контролы" не имели одинаковый табиндекс.
       * @example
       * Если табиндекс контрола больше 1, установить новое значение.
       * <pre>
       *    control.subscribe('onReady', function() {
       *       if (this.getTabindex() > 1) {
       *          this.setTabindex(1);
       *       }
       *    });
       * </pre>
       * @see tabindex
       * @see getTabindex
       */
      setTabindex: function(tabindex, notCalculate) {
         var parent = this.getParent();
         if (!notCalculate && parent) {
            parent.changeControlTabIndex(this, tabindex);
         } else {
            this._setOption('tabindex', tabindex);
         }
         this._baseTabIndex = tabindex;
      },

      /**
       * Возвращает текст простой всплывающей подсказки.
       * Подробнее о таком типе подсказок вы можете прочитать в описании к опции {@link tooltip}.
       * @returns {String} Текст всплывающей подсказки.
       * @example
       * При готовности контрола установить всплывающую подсказку, если она не задана.
       * <pre>
       *    //tooltips - массив со всплывающими подсказками
       *    //controls - массив с контролами
       *    controls.forEach(function(element, index) {
       *       element.subscribe('onReady', function() {
       *          if (this.getTooltip() == '') this.setTooltip(tooltips[index]);
       *       });
       *    });
       * </pre>
       * @see tooltip
       * @see setTooltip
       * @see extendedTooltip
       * @see setExtendedTooltip
       * @see getExtendedTooltip
       */
      getTooltip: function() {
         return this._getOption('tooltip');
      },

      /**
       * Да, это странный метод делающий ничего. Он перегружен в другом классе.
       * Он позволяет в конкретном классе модифицировать текст подсказки
       * @param message
       * @returns {*}
       * @protected
       */
      _alterTooltipText: function(message) {
         return message;
      },

      // если this - общий компонент для компонентов откуда и куда уходит активность, для него нужно стрельнуть
      // событием onFocusInside (активность переместилась где-то внутри этого компонента)
      _callOnFocusInside: function() {
         var parent = this.getParent();
         while (parent) {
            if (parent.isActive()) {
               parent._notify('onFocusInside', {
                  to: this
               });
            }
            parent = parent.getParent();
         }
      },

      /**
       * Да, это странный метод делающий ничего. Он перегружен в другом классе.
       * Он позволяет в конкретном классе навесить модификаторы на инфобокс ( к примеру над провалившим валидацию контролом)
       * @param message
       * @returns {*}
       * @protected
       */
      _getExtendedTooltipModifiers: function() {
         return '';
      },

      /**
       * Возвращает признак, по которому можно определить нахождение фокуса на контроле.
       * Изменить положение фокуса можно с помощью опции {@link setActive}.
       * @returns {Boolean}
       * * true Фокус находится на контроле.
       * * false Фокус находится не на контроле.
       * @example
       * При готовности контрола перевести на него фокус.
       * <pre>
       *    myControl.subscribe('onReady', function() {
       *       if (!this.isActive()) this.setActive(true);
       *    });
       * </pre>
       * @see setActive
       */
      isActive: function() {
         return this._isControlActive;
      },

      _updateActiveStyles: function() {
         var active = this._isControlActive;
         if (this._isCorrectContainer()) {
            this._container.toggleClass('ws-control-inactive', !active).toggleClass('ws-has-focus', active);
         }
      },

      setContainer: function(val) {
         /**
          * Внутри VDom контейнер может смениться,
          * просто перевешиваем контрол на другой контейнер
          */
         if (this._container && this._container[0]) {
            this._container[0].wsControl = undefined;
         }

         this._container = $(val);
         this._container[0].wsControl = this;

      },

      /**
       * Отдает элемент на который необходимо сфокусироваться
       */
      _getElementToFocus: function() {
         return this._container;
      },

      /**
       *
       * Поиск родительского контрола с применением пользовательского фильтра.
       * @remark
       * Функция-фильтр должна вернуть true для окончания перебора.
       * @param {Function} filter Функция, описывающая фильтр.
       * @return {Lib/Control/AreaAbstract/AreaAbstract|null} Экземпляр класса родителя. Если не удалось ничего найти, возвращается null.
       * @example
       * Найти родителя, в котором содержится контрол с именем myControl.
       * <pre>
       *    control.findParent(function(parent) {
       *       return parent.containsByName('myControl');
       *    });
       * </pre>
       * @see getParentWindow
       * @see getParent
       * @see getTopParent
       * @see getParentByName
       * @see getParentByClass
       */
      findParent: function(filter) {
         if (typeof filter != 'function') {
            throw new Error('Control.findParent - требуется передать функцию-фильтр');
         }
         var parent = this;
         do {
            parent = parent.getParent();
         } while (parent && !filter(parent));
         return parent;
      },

      /**
       * Возвращает экземпляр класса родительского контрола.
       * @remark
       * Родительским называют контрол, который в своей вёрстке содержит несколько других контролов.
       * По отношению к нему эти контролы называются дочерними.
       * @return {Lib/Control/AreaAbstract/AreaAbstract} Экземпляр класса родительского контрола.
       * @example
       * Если два контрола имеют одного родителя, то установить второй контрол владельцем первого.
       * <pre>
       *    control.subscribe('onReady', function() {
       *       if (fieldString.getParent() === fieldCheckbox.getParent()) {
       *          fieldString.setOwner(fieldCheckbox);
       *       }
       *    });
       * </pre>
       * @see getParentWindow
       * @see getTopParent
       * @see findParent
       * @see getParentByName
       * @see getParentByClass
       */
      getParent: function() {
         return this._parent;
      },


      /**
       *
       * Получить самого дальнего родителя контрола.
       * @remark
       * Возвращает самого дальнего предка контрола, у которого нет родителя (окно или самая "верхняя" область в body).
       * @return {Lib/Control/Control} Экземпляр класса родителя.
       * @example
       * При клике на кнопку (btn) установить фильтр на табличное представление.
       * <pre>
       *    btn.subscribe('onClick', function() {
       *       var child = this.getTopParent().getChildControlByName('Табличное представление');
       *       child.setQuery({'Тип': 'Все'});
       *    });
       * </pre>
       * @see getParent
       * @see getParentWindow
       * @see findParent
       * @see getParentByName
       * @see getParentByClass
       */
      getTopParent: function() {
         var control = this;

         // getTopParent не должен возвращать OnlineBaseInnerMinCoreView (самый верхний компонент, навешанный на html).
         // Раньше у панелей не было предка, а теперь это OnlineBaseInnerMinCoreView, и чтобы этот метод работал как раньше
         // и прикладной код не сломался, добавлен костыль, при котором ищем предка, пока не уперлись в OnlineBaseInnerMinCoreView.
         // OnlineBaseInnerMinCoreView должен быть верхним предком для элементов внутри него, иначе механизм фокусов ломается.
         while (control.getParent() && !cInstance.instanceOfModule(control.getParent(), 'OnlineSbisRu/Base/View')) {
            control = control.getParent();
         }
         return control;
      },


      /**
       *
       * Найти родителя контрола по имени.
       * @param {String} name Имя родителя.
       * @returns {Lib/Control/Control} Экземпляр класса родителя.
       * @example
       * При нажатии клавиши Enter получить родителя и сохранить запись.
       * <pre>
       *    control.subscribe('onActivated', function() {
       *       this.getParentByName('Редактирование контакта').save();
       *    });
       * </pre>
       * @see getParent
       * @see getParentWindow
       * @see findParent
       * @see getTopParent
       * @see getParentByClass
       */
      getParentByName: function(name) {
         return this.findParent(function(parent) {
            return (typeof parent.getName === 'function') && parent.getName() == name;
         });
      },

      /**
       *
       * Получить связанный контекст контрола.
       * @return { Context} Связанный с контролом контекст.
       * @example
       * Установить новое значение поля из контекста контрола (fieldString).
       * <pre>
       *    fieldString.subscribe('onReady', function() {
       *       this.getLinkedContext().setValue(this.getName(), this.getValue());
       *    });
       * </pre>
       * @see linkedContext
       */
      getLinkedContext: function() {
         return this._context;
      },

      /**
       * Добавить контекст в список созданных контролом. Для этих контекстов будет вызван destroy() во
       * время destroy() контрола-владельца.
       * @param {Core/Context} context Контекст, созданный контролом
       */
      addOwnedContext: function(context) {
         if (!this._ownedContexts) {
            this._ownedContexts = [];
         }
         this._ownedContexts.push(context);
      },

      /**
       * Проверяет контейнер на правильность
       * @returns {Boolean}
       */
      _isCorrectContainer: function() {
         // Container must be valid jQuery object having only one element inside. It also should not be our Parser node.
         return this._container !== undefined && ('jquery' in this._container) && this._container.length == 1 && !this._container[0].startTag;
      },

      _onResizeHandler: function() {
      },

      _onClickHandlerThrottled: throttle(function() {
         return this._onClickHandler.apply(this, arguments);
      }, 50),
      /**
       * Обработчик пользовательского действия по контролу
       * @param {jQuery} event стандартный jQuery-ивент
       */
      _onActionHandler: function(event) {
         switch (event.type) {
            case 'click':
               var orignEvent = event.originalEvent;
               if (orignEvent === undefined) {
                  orignEvent = event;
               }
               if (this._shouldUseClickByTap()) {
                  if (clickStateTarget.indexOf(this.getId()) > -1) {
                     clickStateTarget.splice(clickStateTarget.indexOf(this.getId()), 1);
                  }
               }
               if (!orignEvent.ClickEventIsReady) {
                  if (this._getOption('activableByClick')) {
                     orignEvent.ClickEventIsReady = true;
                  }
                  //не даем обрабатывать клик чаще чем раз в 300мс если включен ClickByTap нативный клик может сработать после сгенерированного и это ни как не отловить.
                  this._getOption('clickThrottleAsynch') ? this._onClickHandlerThrottled(event) : this._onClickHandler(event);
               }
               break;
            case 'touchstart':
               if (this._shouldUseClickByTap() && !event.addedToClickState) {
                  clickStateTarget.push(this.getId());
                  event.addedToClickState = true;
                  this._tapHoldTimer = setTimeout((function() {//touchEnd может не сработать, а клик может перехватить вложенный элемент, тогда будут накапливаться состояния
                     clickStateTarget.splice(clickStateTarget.indexOf(this.getId()), 1);
                  }.bind(this)), this._clickState.tapHoldTimeout);
                  this._clickState.coords =  event.touches[0].pageX + event.touches[0].pageY;
               }
               break;
            case 'touchend':
               if (this._shouldUseClickByTap() && !event.addedToClickState) {
                  //ловим touchend только на самом верхнем контроле, чтобы не было двойного срабатывания клика
                  event.addedToClickState = true;
                  //может внезапно закончится и начаться новая drag сессия при скроле, и если при этом не проскочит touchmove сгенерируется клик.
                  clearInterval(this._tapHoldTimer);
                  if (Math.abs(this._clickState.coords - event.changedTouches[0].pageX - event.changedTouches[0].pageY) < this._clickState.maxCoordDiff) {
                     //Проверяем, сработал ли click
                     setTimeout((function () {
                        if (clickStateTarget.indexOf(this.getId()) > -1) {
                           event.target.click();
                        }
                     }.bind(this)), this._clickState.timeout);
                  } else {
                     clickStateTarget.splice(clickStateTarget.indexOf(this.getId()), 1);
                  }
               }
               break;
         }
      },

      _shouldUseClickByTap: function() {
         return this._getOption('fix165c4103') || this._getOption('emulateClickByTap');
      },

      /**
       * Обработчик клика по контролу
       */
      _onClickHandler: function(event) {
         /**
          * Need it for compatibility. We shouldn't allow AreaAbstract to move focus by click. That's why click
          * event will be stopped after it handled in DOMEnvironment.
          * @param elem
          * @private
          */
         function isVdomTarget(elem) {
            var fromVdom = false,
               curTarget = elem;
            while (curTarget) {
               if (curTarget.controlNodes) {
                  fromVdom = true;
                  break;
               }
               curTarget = curTarget.parentElement;
            }
            return fromVdom;
         }

         if (!isVdomTarget(event.target)) {
            if (this._getOption('activableByClick')) {
               if (!this._isControlActive) {
                  this.setActive(true);
               }
            }
         }
         if (this._getOption('activableByClick')) {
            event.stopPropagation();
         }
         this._notify('onClick', event);
      },

      /**
       * Ловит нажатия на клавиши клавиатуры, нотифицирует о них и использует в служебных целях, если в обработчике не сказали обратное
       * @param [rootBlock] {jQuery} - корневой элемент вёрстки, в которой нужно следить за нажатиями клавиш. Если не указан, то используется
       * основной элемент контрола, отдаваемый функцией getContainer
       */
      _initKeyboardMonitor: function(rootBlock) {
         var self = this,
            container = rootBlock || self._container;

         //слежение за нажатиями клавиш
         container.keydown(function(e) {
            var result = self._notify('onKeyPressed', e);
            if (e.which in self._keysWeHandle && result !== false && self._isAcceptKeyEvents()) {
               var res = self._keyboardHover(e);
               if (!res) {
                  e.preventDefault();
                  e.stopPropagation();
                  return false;
               }
               return res;
            }
         });
      },

      /**
       * Служебный обработчик нажатия на клавишу
       */
      _keyboardHover: function(event) {
      },

      /**
       * Может ли обрабатывать события клавиш
       * @returns {Boolean}
       * @protected
       */
      _isAcceptKeyEvents: function() {
         return this.isEnabled();
      },

      /**
       * Возвращает признак, по которому можно определить установленный режим взаимодействия с контролом.
       * Подробнее о режимах взаимодействия с контролом вы можете прочитать в описании к опции {@link enabled}.
       * @return {Boolean}
       * * true Взаимодействие с контролом разрешено.
       * * false Взаимодействие с контролом запрещено.
       * @example
       * При клике на кнопку (btn) изменить активность группы радиокнопок (fieldRadio).
       * <pre>
       *    btn.subscribe('onClick', function() {
       *       var value = fieldRadio.isEnabled();
       *       fieldRadio.setEnabled(!value);
       *    });
       * </pre>
       * @see enabled
       * @see setEnabled
       * @see allowChangeEnable
       * @see setAllowChangeEnable
       * @see isAllowChangeEnable
       */
      isEnabled: function() {
         return this._getOption('enabled');
      },

      /**
       * Устанавливает режим отображения контрола, в котором он виден на веб-странице.
       * @remark
       * Подробнее о видимости контрола читайте в описании опции {@link https://wi.sbis.ru/docs/js/SBIS3/CONTROLS/Filter/Button/Link/options/visible#visible}.
       * @example
       * Когда выпадающий список (fieldDropdown) отображает "Расширенная информация", показать дополнительные поля.
       * <pre>
       *    //fields - массив дополнительных полей ввода
       *    fieldDropdown.subscribe('onReady', function() {
       *       if (this.getStringValue() === 'Расширенная информация') {
       *          fields.forEach(function(element) {
       *             element.show();
       *          });
       *       }
       *    });
       * </pre>
       * @see visible
       * @see hide
       * @see toggle
       * @see isVisible
       * @see setVisible
       */
      show: function() {
         this._setVisibility(true);
      },

      /**
       * Устанавливает режим отображения контрола, в котором он не виден на веб-странице.
       * @remark
       * Подробнее о видимости контрола читайте в описании опции {@link https://wi.sbis.ru/docs/js/SBIS3/CONTROLS/Filter/Button/Link/options/visible/ visible}.
       * @example
       * При клике на кнопку (btn) скрыть табличное представление (tableView).
       * <pre>
       *    btn.subscribe('onClick', function() {
       *       tableView.hide();
       *    });
       * </pre>
       * @see visible
       * @see show
       * @see toggle
       * @see isVisible
       * @see setVisible
       */
      hide: function() {
         this._setVisibility(false);
      },

      /**
       * Изменяет режим отображения контрола на веб-странице.
       * @remark
       * Подробнее о видимости контрола читайте в описании опции {@link https://wi.sbis.ru/docs/js/SBIS3/CONTROLS/Filter/Button/Link/options/visible/ visible}.
       * @param {Boolean} [show] Если значение не задано, то видимость контрола изменится в противоположное состояние.
       * Значения:
       * * true Контрол виден.
       * * false Контрол скрыт.
       * @example
       * 1. При клике на кнопку (btn) показать/скрыть табличное представление (tableView).
       * <pre>
       *    btn.subscribe('onClick', function() {
       *       tableView.toggle();
       *    });
       * </pre>
       *
       * 2. Если пользователь указал в поле ввода (fieldString) допустимый возраст, показать дополнительные параметры (fieldRadio).
       * <pre>
       *    fieldString.subscribe('onChange', function(eventObject, value) {
       *       fieldRadio.toggle(parseInt(value) >= 1996);
       *    });
       * </pre>
       * @see visible
       * @see show
       * @see hide
       * @see isVisible
       * @see setVisible
       */
      toggle: function(show) {
         if (arguments.length > 0) {
            this._toggle(!!show);
         } else {
            this._toggle(!this._isVisible);
         }
      },

      _toggle: function(show) {
         if(show) {
            this.show();
         }else {
            this.hide();
         }
      },

      _setVisibility: function(visibility) {
         var parentElem, linkedLabel, hidden = !visibility;

         if (this._isVisible !== visibility) {
            this._notify('onBeforeVisibilityChange', visibility);
            this._isVisible = visibility;
            this._setOption('visible', this._isVisible);

            if (this._isCorrectContainer()) {
               if (this._container.hasClass('ws-hidden') !== hidden) {
                  this._container.toggleClass('ws-hidden', hidden);
               }

               linkedLabel = this._getLinkedLabel && this._getLinkedLabel();
               if (linkedLabel) {
                  parentElem = this._container.parent();

                  if (parentElem.hasClass('ws-labeled-control')) {
                     parentElem.toggleClass('ws-hidden', hidden);
                  } else {
                     linkedLabel.toggleClass('ws-hidden', hidden);
                  }
               }
            }

            this._notifyOnPropertyChanged('visible');

            //До окончания конструирования дочернего контрола пакетные пересчёты размеров у родителя не нужны - родитель сам
            //посчитает размеры, когда все дочерние загрузятся
            if (this.isInitialized()) {
               var updater = ControlBatchUpdater;
               if (visibility && updater._needDelayedRecalk(this)) {
                  updater._doDelayedRecalk(this);
               } else {
                  this._notifyOnSizeChanged && this._notifyOnSizeChanged(this, this);
               }
            }
            this._notify('onAfterVisibilityChange', visibility);
         }
      },

      /**
       * Определяет видимость контрола вместе со всей иерархией его родителей
       * @return {Boolean} true - Контрол и вся иерархия его родителей видны, false - контрол скрыт сам или скрыт какой-то из его родителей.
       */
      isVisibleWithParents: function() {
         var parent = this, visible = (!this.isVisible || this.isVisible()) && isElementVisible(this.getContainer());

         while (parent && visible) {
            visible = !parent.isVisible || parent.isVisible();
            parent = parent.getParent();
         }
         return visible;
      },

      /**
       * Устанавливает конфигурацию, в которой запрещается изменять режим взаимодействия с контролом.
       * Подробнее о данной конфигурации контрола читайте в описании к опции {@link allowChangeEnable}.
       * @param {Boolean} allowChangeEnable
       * * true Изменение режима взаимодействия с контролом разрешено.
       * * false Изменение режима взаимодействия с контролом запрещено.
       * @example
       * При готовности контрола разрешить изменять его активность.
       * <pre>
       *    control.subscribe('onReady', function() {
       *       if (!this.isAllowChangeEnable()) {
       *          this.setAllowChangeEnable(true);
       *       }
       *    });
       * </pre>
       * @see allowChangeEnable
       * @see enabled
       * @see isEnabled
       * @see isAllowChangeEnable
       * @see setEnabled
       */
      setAllowChangeEnable: function(allowChangeEnable) {
         this._setOption('allowChangeEnable', !!allowChangeEnable);
      },

      /**
       * Возвращает признак, по которому можно определить разрешено ли изменение режима взаимодействия с контролом.
       * Подробное о данном признаке вы можете прочитать в описании к опции {@link allowChangeEnable}.
       * @return {Boolean}
       * * true Изменение режима взаимодействия с контролом разрешено.
       * * false Изменение режима взаимодействия с контролом запрещено.
       * @example
       * Запретить изменение активности дочернего контрола.
       * <pre>
       *    control.subscribe('onReady', function() {
       *       var child = this.getChildControlByName('Поле');
       *       if (child.isAllowChangeEnable()) child.setAllowChangeEnable(false);
       *    });
       * </pre>
       * @see enabled
       * @see allowChangeEnable
       * @see setAllowChangeEnable
       * @see isEnabled
       * @see setEnabled
       */
      isAllowChangeEnable: function() {
         return this._getOption('allowChangeEnable');
      },

      _setEnabled: function(enabled) {
         enabled = !!enabled;
         if (this._enabledApplied !== enabled) {
            this._enabledApplied = enabled;

            //В ЭДО есть Action, у которого нет контейнера, и ему делают setEnable().
            //Чисто технически контрол может оказаться без контейнера
            //Поэтому проверим его существования тут.
            if (this._isCorrectContainer()) {
               this._container.toggleClass('ws-enabled', enabled).toggleClass('ws-disabled', !enabled);
            }
         }
      },

      /**
       * Устанавливает режим взаимодействия с контролом.
       * @remark
       * Подробнее о режимах взаимодействия с контролом вы можете прочитать в описании к опции {@link enabled}.
       * Изменение возможно только после того, как контрол и его предок проинициализировались. Поэтому метод рекомендуется использовать только в обработчике события {@link Lib/Control/AreaAbstract/AreaAbstract#onInitComplete}.
       * @param {Boolean} enabled
       * * true Взаимодействие с контролом разрешено.
       * * false Взаимодействие с контролом запрещено.
       * @example
       * Кнопка (btn) недоступна для клика до тех пор, пока поле ввода (fieldString) не пройдёт валидацию.
       * <pre>
       *    fieldString.subscribe('onValidate', function(event, validationResult) {
        *       btn.setEnabled(validationResult);
        *    });
       * </pre>
       * @see enabled
       * @see isEnabled
       * @see allowChangeEnable
       * @see setAllowChangeEnable
       * @see isAllowChangeEnable
       */
      setEnabled: function(enabled) {
         this._prevEnabled = undefined;
         enabled = !!enabled;

         // если в контексте лежит значение, которое отличается от устанавливаемого, то берется именно из контекста
         var self = this,
            binderOptions = ContextBinder.getBindingsForControl(this);
         binderOptions.forEach(function(binderOption) {
            objectFind(binderOption.bindings, function(binding) {
               if (binding.propName === 'enabled') {
                  if (self.getLinkedContext().hasFieldWithParents(binding.fieldName)) {
                     enabled = !!self.getLinkedContext().getValue(binding.fieldName);
                  } else {
                     enabled = !!binding.nonExistentValue;
                  }
                  return true;
               }
            });
         });

         if (this._getOption('allowChangeEnable') && enabled !== this._getOption('enabled')) {
            this._setOption('enabled', enabled);
            this._setEnabled(enabled);
         }
      },

      /**
       *
       * Получить владельца контрола.
       * @return {Lib/Control/Control|null} Экземпляр класса владельца контрола. Возвращает null, если владельца нет.
       * @example
       * При клике на кнопку (btn) перезагрузить данные табличного представления (tableView), если он - владелец кнопки.
       * <pre>
       *    btn.subscribe('onClick', function() {
       *       if (this.getOwner() === tableView) {
       *          tableView.reload();
       *       }
       *    });
       * </pre>
       * @see owner
       * @see getOwnerId
       * @see setOwner
       * @see makeOwnerName
       */
      getOwner: function(silent) {

         var owner = null,
            names, ctrlName, parentName, parent;

         // Если есть закэшированный владелец - отдадим его
         if (this._owner) {
            owner = this._owner;
         } else if (this._getOption('owner')) {
            if (this._getOption('owner').indexOf && this._getOption('owner').indexOf('/') !== -1) {
               names = this._getOption('owner').split('/');
               ctrlName = names[1];
               parentName = names[0];
            } else {
               ctrlName = this._getOption('owner');
            }

            // Если нет, но задан в опция - попробуем получить его
            try {
               // Ищем владельца у ближайшего родителя, если не задано имя родителя
               // Надо искать у ближайшего, т.к. у topParent'a может быть несколько контролов с таким именем
               if (parentName) {
                  parent = this.getParentByName(parentName);
               } else {
                  do {
                     /* Поиск начинаем с первого parent'a */
                     parent = (parent || this).getParent();
                  } while (parent && !parent.hasChildControlByName(ctrlName));
               }

               // и закэшировать, если получилось
               this._owner = owner = parent.getChildControlByName(ctrlName);
            } catch (e) {
               if (!silent) {
                  Env.IoC.resolve('ILogger').log('Control', 'Некорректно задано св-во owner или отсутствует owner c именем "' + ctrlName + '"');
               }
            }
         }

         return owner;
      },

      /**
       * Возвращает контейнер визуального отображения (DOM-элемент) контрола.
       * @return {jQuery} jQuery-элемент, в котором построен контрол.
       * @example
       * При готовности контрола установить для него дополнительный CSS-класс.
       * <pre>
       *    var dateObj = new Date();
       *    myControl.subscribe('onReady', function() {
       *       switch (dateObj.getMonth()) {
       *          case 0:
       *          case 1:
       *          case 11:
       *             this.getContainer().removeClass('ws-default').addClass('ws-winter');
       *             break
       *          default:
       *             this.getContainer().removeClass('ws-winter').addClass('ws-default');
       *             break
       *       }
       *    });
       * </pre>
       * @see isContainerInsideParent
       * @see element
       */
      getContainer: function() {
         return this._container;
      },

      /**
       * Производит отправку команды.
       * @remark
       * При отправке команды происходит следующее:
       * <ol>
       *     <li>Команда отправляется на исполнение владельцу контрола/компонента (см. {@link Lib/Control/Control#owner}).</li>
       *     <li>Если владелец не существует, то родительскому контролу/компоненту (см. {@link Lib/Control/Control#parent}) и так далее по цепочке родительских контролов/компонентов до первого функции-обработчика, который вернул *true-value* (что-то, что приводится к логическому *true*).</li>
       * </ol>
       * Объявление команды производят с помощью синглтона {@link CommandDispatcher} и его функции {@link CommandDispatcher#declareCommand}.
       * @param {String} commandName Имя команды.
       * @param {*} [agr1, ... ] Аргументы, которые будут переданы в функцию-обработчик команды.
       * @return {Boolean|*} Результат выполнения команды:
       * <ol>
       *    <li>true. Один из обработчиков команд вернул *true*, либо ни один из обработчиков команды не вернул *true-value* (!!value === true).</li>
       *    <li>false. Команда не была никем обработана, её не было ни у одного контрола.</li>
       *    <li>другой результат. Обработчик команды вернул какое-либо *true-value* (!!value === true), тогда возвращается это значение.</li>
       * </ol>
       * @example
       * 1. В зависимости от положения переключателя (switcher) отправить команду табличному представлению (tableView).
       * <pre>
       *    switcher.subscribe('onChange', function(eventObject, value) {
       *       if (value) {
       *          tableView.sendCommand('fill', {'fillData': '+7 (4855) 25245'});
       *       } else {
       *          tableView.sendCommand('reload');
       *       }
       *    });
       * </pre>
       *
       * 2. При нажатии "ОК" диалог редактирования записи отправит команду.
       * <pre>
       *    dialogRecord.sendCommand('save', readyDeferred, true);
       *    readyDeferred.addCallbacks(
       *       function() {
       *          CoreFunctions.alert('Сохранено успешно!');
       *       },
       *       function() {
       *          $ws.core.alert('Ошибка при сохранении!');
       *       }
       *    );
       * </pre>
       */
      sendCommand: function(commandName) {
         var payload = Array.prototype.slice.call(arguments, 1);
         payload.unshift(this, commandName);
         return CommandDispatcher.sendCommand.apply(CommandDispatcher, payload);
      },

      /**
       *
       * Может ли контрол получать фокус.
       * @remark
       * Метод сработает, если контрол видим, активен и у него есть табиндекс.
       * @return {Boolean} true - может получать фокус, false - нет.
       */
      canAcceptFocus: function() {
         // Обязательно надо проверять на видимость с учетом родителя, иначе могут быть проблемы
         return this.isVisible() && this.isEnabled() && this.getTabindex() && isElementVisible(this.getContainer());
      },

      /**
       *
       * Запомнить пользовательские данные в контроле.
       * @remark
       * Пользовательские данные (ПД) - это дополнительная информация, привязанная к контролу и предназначенная для
       * решения прикладных задач. Механизм ПД позволяют не создавать новую сущность и не расширять поведение контрола
       * засчёт наследования.
       * @param {String} name Имя ключа, по которому привязываются данные.
       * @param {*} value Значение, которое будет присвоено ключу.
       * @example
       * Решим задачу реализации подсчёта количества кликов по кнопке.
       * Это можно сделать, если создать новый класс и описать функцию счётчика.
       *
       * При помощи механизма ПД эта задача решается без создания новых сущностей.
       * <pre>
       *    //создаём ключ с названием clicksCounter и присваиваем ему значение 0
       *    button.setUserData('clicksCounter', 0);
       *    button.subscribe('onActivated', function() {
       *       button.setUserData('clicksCounter', button.getUserData('clicksCounter') + 1);
       *    });
       * </pre>
       * @see getUserData
       */
      setUserData: function(name, value) {
         if (!this._userData) {
            this._userData = {};
         }
         this._userData[name] = value;
      },

      /**
       *
       * Получить сохранённые пользовательские данные.
       * @remark
       * Пользовательские данные (ПД) - это дополнительная информация, привязанная к контролу и предназначенная для решения прикладных задач.
       * Механизм ПД позволяют не создавать новую сущность и не расширять поведение контрола засчёт наследования.
       * @param {String} name Имя ключа, по которому было записано значение.
       * @returns {*} Если значения нет, то возвращается undefined.
       * @example
       * Решим задачу реализации подсчёта количества кликов по кнопке.
       * Это можно сделать, если создать новый класс и описать функцию счётчика.
       *
       * При помощи механизма ПД эта задача решается без создания новых сущностей.
       * <pre>
       *    button.setUserData('clicksCounter', 0);
       *    button.subscribe('onActivated', function() {
       *       button.setUserData('clicksCounter', button.getUserData('clicksCounter') + 1);
       *    });
       * </pre>
       * @see setUserData
       */
      getUserData: function(name) {
         return this._userData && this._userData[name];
      },

      /**
       * Возвращает значение опции контрола по её названию.
       * @remark
       * Метод проверяет определён ли у контрола get-метод для опции. Если такой метод существует, то он вызывается для получения её значения.
       * Иначе проверяет наличие в секции _options соответствующего поля. Если поле определено, то метод возвращает его значение.
       * Если поле не определено, то метод генерирует исключение.
       *
       * Установить значение опции по её названию можно с помощью метода {@link setProperty}, а сразу для нескольких опций - с помощью метода {@link setProperties}.
       * @param {String} name Название опции.
       * @return {*} Возвращает значение опции или генерирует исключение, когда опция не определена.
       * @see setProperty
       * @see onPropertyChanged
       * @see onPropertiesChanged
       * @see setProperties
       */
      getProperty: function(name) {
         var
            nameUc = ucFirst(name),
            methodNameGet = 'get' + nameUc,
            hasMethodGet = typeof (this[methodNameGet]) === 'function',
            methodNameIs = 'is' + nameUc,
            hasMethodIs = typeof (this[methodNameIs]) === 'function',
            result, msg;

         if (hasMethodGet) {
            result = this[methodNameGet]();
         } else if (hasMethodIs) {
            result = this[methodNameIs]();
         } else if (this._hasOption(name)) {
            result = this._getOption(name);
         } else {
            msg = 'Метод getProperty вызвали для несуществующего свойства "' + name + '" (не определено соответствующего ему метода ' +
               methodNameGet + ' или ' + methodNameIs + ' и нет опции с именем "' + name + '"';

            throw new Error(msg);
         }

         return result;
      },

      /**
       * Устанавливает значение свойства.
       * @remark
       * Сначала проверяет, определён ли у контрола set-метод для этого свойства, и, если да, то вызывает его.
       * Иначе проверяет наличие в секции _options соотв. поля, и, если оно определено, то меняет его.
       * Если и поля такого нет, то метод setProperty кидает исключение.
       * @param {String} name Имя свойства.
       * @param {*} value Новое значение свойства.
       * @return {undefined}
       * @see getProperty
       * @see onPropertyChanged
       * @see onPropertiesChanged
       * @see setProperties
       */
      setProperty: function(name, value) {
         var
            methodName = 'set' + ucFirst(name),
            hasMethod = typeof (this[methodName]) === 'function',
            msg, result = undefined;

         if (hasMethod) {
            result = this[methodName](value);
         } else if (this._hasOption(name)) {
            this._setOption(name, value);
         } else {
            msg = 'Метод setProperty вызвали для несуществующего свойства "' + name + '" (не определено соответствующего ему метода ' +
               methodName + ' и нет опции с именем "' + name + '"';

            throw new Error(msg);
         }

         return result;
      },

      /**
       * Устанавливает несколько свойств сразу. Формат вызова: setProperties({p1: v1, p2: v2}).
       * По умолчанию просто устанавливает свойства одно за другим, вызывая метод setProperty.
       * Если компонент умеет устанавливать несколько свойств сразу, то он может переопределить этот метод.
       * @param obj
       * @see getProperty
       * @see setProperty
       * @see onPropertyChanged
       * @see onPropertiesChanged
       */
      setProperties: function(obj) {
         this.runInPropertiesUpdate(function() {
            var allowChangeEnable;
            if (obj.hasOwnProperty('allowChangeEnable')) {
               allowChangeEnable = obj.allowChangeEnable;
               delete obj.allowChangeEnable;
            }

            // если allowChangeEnable=true, эту опцию надо применять в первую очередь в пачке изменений
            if (allowChangeEnable === true) {
               this.setProperty('allowChangeEnable', true);
            }

            for (var name in obj) {
               if (obj.hasOwnProperty(name)) {
                  this.setProperty(name, obj[name]);
               }
            }

            // если allowChangeEnable=false, эту опцию надо применять в последнюю очередь в пачке изменений
            if (allowChangeEnable === false) {
               this.setProperty('allowChangeEnable', false);
            }
         });
      },

      destroy: function() {
         if (this._ownedContexts) {
            for (var i = 0; i < this._ownedContexts.length; i++) {
               if (!this._ownedContexts[i].isDestroyed()) {
                  this._ownedContexts[i].destroy();
               }
            }
            this._ownedContexts = [];
         }
      }
   };


});
