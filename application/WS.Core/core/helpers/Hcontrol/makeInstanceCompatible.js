define('Core/helpers/Hcontrol/makeInstanceCompatible', [
   'Core/Control',
   'Core/Abstract.compatible',
   'Lib/Control/Control.compatible',
   'Lib/Control/AreaAbstract/AreaAbstract.compatible',
   'Lib/Control/BaseCompatible/BaseCompatible'
], function(Control, AbstractCompatible, ControlCompatible, AreaAbstractCompatible, BaseCompatible) {
   function mix(inst, mixin) {
      for (var key in mixin) {
         if (mixin.hasOwnProperty(key) && !inst[key]) {
            inst[key] = mixin[key];
         }
      }
   }

   function doIt(inst, props, fromCtr) {
      // Подмешиваем поведение из модулей слоя совместимости
      mix(inst, BaseCompatible);
      mix(inst, AreaAbstractCompatible);
      mix(inst, ControlCompatible);
      mix(inst, AbstractCompatible);

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
         if (this._internalOptions[name] !== undefined) {
            result = this._internalOptions[name];
         } else {
            result = BaseCompatible._getInternalOption.call(this, name);
         }
         return result;
      };

      inst._compatBaseDestroy = inst.destroy;
      inst.destroy = function() {
         inst._compatBaseDestroy.apply(this, arguments);
         BaseCompatible.destroy.apply(this, arguments);
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
   }

   function needMix(cfg) {
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
            if (needMix(cfg) || cfg.iWantBeWS3) {
               var props = {};
               mix(props, cfg);
               doIt(this, props, true);
               this._doneCompat = true;
            }
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