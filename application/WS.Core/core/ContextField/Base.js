/* global define */
define('Core/ContextField/Base', [
   'Core/core-extend'
], function(
   coreExtend
) {
   'use strict';

   /**
    * Базовый класс для поддержки типов в контексте
    * @class Core/ContextField/Base
    * @author Мальцев А.А.
    */
   var Base = coreExtend.extend(/** @lends Core/ContextField/Base.prototype*/{
      '[Core/ContextField/Base]': true,

      /**
       * @member {Function} Модуль, который поддерживает контекст
       */
      _module: null,

      /**
       * Конструктор
       * @param {Function} module Конструктор типа, поддерживаемого контекстом
       */
      constructor: function Base(module) {
         if (typeof module !== 'function') {
            throw new ReferenceError('Argument "module" must be a function.');
         }
         this._module = module;
      },

      /**
       * Подтверждает, что данный тип значения обрабатывается этим модулем
       * @param {Object} value Значение в контексте
       * @return {Boolean}
       */
      is: function(value) {
         return value instanceof this._module;
      },

      /**
       * Конвертирует значение в контексте в JSON
       * @param {Object} value Значение в контексте
       * @param {Boolean} deep Включая вложенные значения
       * @return {Object}
       */
      toJSON: function(value, deep) {
         if (!deep || !value || !value.each) {
            return value;
         }
         var result = {};
         value.each(function(key, value) {
            result[key] = value;
         });
         return result;
      }
   });

   return Base;
});
