define('Core/helpers/Hcontrol/makeInstanceCompatible', [
   'Core/Control',
   'Core/Abstract.compatible',
   'Lib/Control/Control.compatible',
   'Lib/Control/AreaAbstract/AreaAbstract.compatible',
   'Lib/Control/BaseCompatible/BaseCompatible'
], function(Control, AbstractCompatible, ControlCompatible, AreaAbstractCompatible, BaseCompatible) {
   /**
    * Есть модули, которые сами управляют своей совместимостью, автоматическое
    * подмешивание makeInstanceCompatible в _afterCreate им только мешает
    */
   var compatibleBlacklist = [
      'Core/CompoundContainer',
      'Controls/Popup/Compatible/CompoundAreaForOldTpl/CompoundArea',
      'Controls/Popup/Manager/Popup'
   ];

   /**
    * Есть модули, которые хотят внутри себя видить только чистый вдом. В таком случае
    * не подмешиваем их детям слой совместимости, даже если они находятся на старой
    * странице.
    */
   var cleanVdomContainers = [
      'Controls/Popup/Compatible/CompoundAreaForNewTpl/CompoundArea'
   ];

   /**
    * Есть ли указанный модуль в списке заблокированных для подмешивания
    * makeInstanceCompatible
    * @param {string} moduleName
    */
   function isModuleBlocked(moduleName) {
      return compatibleBlacklist.indexOf(moduleName) >= 0;
   }

   function mix(inst, mixin) {
      for (var key in mixin) {
         if (mixin.hasOwnProperty(key) && !inst[key]) {
            inst[key] = mixin[key];
         }
      }
   }

   function mixWithModuleMarker(inst, mixin, moduleName) {
      mix(inst, mixin);

      // При подмешивании поведения из модулей слоя совместимости, поставим
      // специальные маркеры, чтобы core-instance правильно определял присутствие
      // этих миксинов в инстансе
      inst['[' + moduleName + ']'] = true;
      if (!inst._mixins) {
         inst._mixins = [];
      }
   }

   // https://online.sbis.ru/opendoc.html?guid=ba5bf3a7-fb07-41a0-b830-e5a7649c15d3
   // На старых страницах теперь используют вдомные EDO-опенеры для задач. При изменении
   // задачи изнутри панели вызывается событие beforeItemEndEdit, которое позволяет
   // например обновить строку реестра.
   // Утверждается, что это событие всплывало до EDO-опенера, и через него наружу,
   // в старое не-вдомное окружение. Подтвердить мне это не удалось (на моем старом
   // стенде (январь) событие не всплывает дальше EDO-опенера), но у всплытия
   // есть свидетели по ссылке выше.
   // В 19.110 фиксим это, генерируя подписку на вдомное событие, и пробрасывая его в
   // не-вдомное окружение. В 19.200 разбираемся, что же на самом деле произошло и
   // удаляем этот код.
   // https://online.sbis.ru/opendoc.html?guid=1dac6ffa-1382-42f8-bce7-349eb803f2ca
   function fixEdoOpenerEvent(inst) {
      var
         container = inst._container.length ? inst._container[0] : inst._container,
         handler = function() {
            AbstractCompatible._notify.apply(this, ['beforeItemEndEdit', Array.prototype.slice.call(arguments, 1)]);
         }.bind(inst);

      handler.control = inst;

      container.eventProperties = container.eventProperties || {};
      container.eventProperties['on:beforeitemendedit'] = container.eventProperties['on:beforeitemendedit'] || [];
      container.eventProperties['on:beforeitemendedit'].push({
         args: [],
         fn: handler,
         name: 'event',
         value: 'onBeforeItemEndEditHandler'
      });
   }

   function doIt(inst, props, fromCtr) {
      // Подмешиваем поведение из модулей слоя совместимости
      mixWithModuleMarker(inst, BaseCompatible, 'Lib/Control/BaseCompatible/BaseCompatible');
      mixWithModuleMarker(inst, AreaAbstractCompatible, 'Lib/Control/AreaAbstract/AreaAbstract.compatible');
      mixWithModuleMarker(inst, ControlCompatible, 'Lib/Control/Control.compatible');
      mixWithModuleMarker(inst, AbstractCompatible, 'Core/Abstract.compatible');

      // Определение слоя совместимости.
      // Логика такая, если создается контрол НЕ внутри CompoundControl
      // Пытаемся считать, что слоя совместимости нет, для того, чтобы не определять все
      // свойства, которые нужны CompoundControl
      // А также чтобы не пытаться зарегистрироваться в списке детей родителя и т.д.
      inst.isCompatibleLayout = function(cfg) {
         if (!this.$constructor) {
            return false;
         }
         var parCompatible = cfg && cfg.parent && cfg.parent.isCompatibleLayout && cfg.parent.isCompatibleLayout(cfg.parent._options);
         return parCompatible === undefined ? !!this.$constructor : parCompatible;
      };

      inst._saveOptionsBase = inst.saveOptions;
      inst.saveOptions = function(options, controlNode) {
         this._saveOptionsBase(options, controlNode);
         return BaseCompatible.saveOptions.call(this, options, controlNode);
      };

      inst._getInternalOption = function(name) {
         var result;
         if (this._internalOptions && this._internalOptions[name] !== undefined) {
            result = this._internalOptions[name];
         } else {
            result = BaseCompatible._getInternalOption.call(this, name);
         }
         return result;
      };

      inst._compatBaseDestroy = inst.destroy;
      inst.destroy = function() {
         inst._compatBaseDestroy.apply(this, arguments);

         // inst мог вручную в своем destroy вызвать destroy из BaseCompatible.
         // В таком случае у него уже будет выставлен флаг _isDestroyed
         if (!this._isDestroyed) {
            BaseCompatible.destroy.apply(this, arguments);
            ControlCompatible.destroy.apply(this, arguments);
         }
      };

      /**
       * Метод задания значения служебной опции
       * @param {String} name Имя служебной опции
       * @param {*} value Значение опции
       */
      inst._setInternalOptionBase = inst._setInternalOption;
      inst._setInternalOption = function(name, value) {
         inst._setInternalOptionBase.call(this, name, value);
         BaseCompatible._setInternalOption.call(this, name, value);
      };

      /**
       * Метод задания служебных опций
       * @param {Object} internal Объект, содержащий ключи и значения устанавливаемых служебных опций
       */
      inst._setInternalOptionsBase = inst._setInternalOptions;
      inst._setInternalOptions = function(internal) {
         inst._setInternalOptionsBase.call(this, internal);
         BaseCompatible._setInternalOptions.call(this, internal);
      };

      inst._base_blur = inst._blur;
      inst._blur = function() {
         inst._base_blur.apply(this, arguments);
         var activeElement = document.activeElement,
            $activeElement = $(activeElement),
            oldControl = $activeElement.wsControl();
         if (oldControl && oldControl.isActive() && !oldControl.iWantVDOM) {
            oldControl.setActive(false);
         }

      };

      inst._getDecOptions = function() {
         return this._decOptions;
      };

      inst.hasCompatible = function() {
         return true;
      };


      var backContainer = inst._container;

      // Вызываем deprecatedContr из BaseCompatible, чтобы проинициализировать
      // все поля, которые могут понадобиться старым контролам
      if (inst.deprecatedContr) {
         inst.deprecatedContr(props || inst._options);
      }

      if (backContainer && backContainer instanceof Node) {
         inst._container = $(backContainer);
         if (!inst._options.element) {
            inst._options.element = backContainer;
         }
      }

      // Определяем значения опций для декорирования: class, style,
      // data-component, config
      if (!inst._decOptions) {
         inst._decOptions = inst._prepareDecOptions();
      }

      if (!inst.isCompatibleLayout(props || inst._options) && fromCtr) {
         //must clean options only from constructor
         inst._savedOptions = props || inst._options;
         inst._options = {};
      }

      // На старых страницах EDO-опенер используется следующим образом:
      // 1. Создается с помощью createControl
      // 2. Сразу после создания для него вызывают makeInstanceCompatible
      // Отлавливаем строго эту ситуацию, чтобы никак не влиять на другие
      // компоненты, и генерируем подписку на необходимое событие.
      // Будет удалено https://online.sbis.ru/opendoc.html?guid=1dac6ffa-1382-42f8-bce7-349eb803f2ca
      if (inst._moduleName === 'EDO3/Opener/Dialog' && inst._$createdFromCode) {
         fixEdoOpenerEvent(inst);
      }
   }

   function needMix(cfg) {
      if (cfg.parent && cleanVdomContainers.indexOf(cfg.parent._moduleName) >= 0) {
         return false;
      }
      if (cfg.parent && cfg.parent.hasCompatible && cfg.parent.hasCompatible()) {
         return true;
      }
      if (cfg.parent && cfg.parent._dotTplFn) {
         return true;
      }
      if (cfg._logicParent && cfg._logicParent.hasCompatible && cfg._logicParent.hasCompatible()) {
         return true;
      }
      if (cfg._logicParent && cfg._logicParent._dotTplFn) {
         return true;
      }
      return cfg.parent && cfg.parent._options ? needMix(cfg.parent._options) : false;
   }

   /**
    * Функция makeInstanceCompatible(inst) встраивает слой совместимости
    * в конкретный инстанс контрола inst.
    *
    * Для этого она подмешивает к инстансу поведение из модулей BaseCompatible,
    * AreaAbstract.compatible, Control.compatible и Abstract.compatible
    *
    * С таким vdom-компонентом, к которому подмешан слой совместимости, могут
    * "прозрачно" работать CompoundControl'ы.
    */
   var makeInstanceCompatible = function(inst, opts) {
      if (!Control.prototype.__pathedByMandatoryProfessor) {
         Control.prototype.__pathedByMandatoryProfessor = true;
         Control.prototype._afterCreateBase = Control.prototype._afterCreate;
         Control.prototype._afterCreate = function(cfg) {
            if (Control.prototype._afterCreateBase) {
               Control.prototype._afterCreateBase.apply(this, arguments);
            }
            if (!isModuleBlocked(this._moduleName) && (needMix(cfg) || cfg.iWantBeWS3)) {
               var props = {};
               mix(props, cfg);
               doIt(this, props, true);
               this._doneCompat = true;
            }
         };
         Control._getInheritOptionsDefault = Control._getInheritOptions;

         Control._getInheritOptions = function(ctor) {
            var inherit = Control._getInheritOptionsDefault(ctor);

            /*Нужно сделать так, чтобы у всех контролов в режиме совместимости без темы
            * вставала тема онллайн, потому что в cssке сгенерированны классы с префиком online*/
            if (!inherit.theme) {
               inherit.theme = 'online';
            }
            return inherit;
         };

      } else if (inst._doneCompat) {
         return;
      }

      doIt(inst, opts);
      inst._doneCompat = true;
   };

   makeInstanceCompatible.newWave = true;

   return makeInstanceCompatible;
});
