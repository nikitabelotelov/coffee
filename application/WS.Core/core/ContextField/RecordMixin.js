/* global define */
define('Core/ContextField/RecordMixin', [
   'Types/shim',
   'Types/collection',
   'Core/Context'
], function(
   shim,
   collection,
   CoreContext
) {
   'use strict';
   var Map = shim.Map;
   var processedRecords = new Map(),
      transactionLevel = 0,
      applyProcessed = function() {
         //record.set() can cause a new transaction, backup data first
         var items = [];
         processedRecords.forEach(function(values, owner) {
            items.push([owner, values]);
         });
         processedRecords.clear();

         items.forEach(function(data) {
            var item = data[0],
               values = data[1];
            if (item['[Data/_entity/IObject]']) {
               item.set(values);
            } else {
               Object.keys(values).forEach(function(key) {
                  item.set(key, values[key]);
               });
            }
         });
      };

   /**
    * Миксин, определяющий работу с рекордом в контексте
    * @mixin Core/ContextField/RecordMixin
    * @author Мальцев А.А.
    */
   var RecordMixin = /** @lends Core/ContextField/RecordMixin.prototype*/{
      '[Core/ContextField/RecordMixin]': true,

      /**
    * Возвращает значение поля контекста по пути.
    * @param {Type/entity#Record} value Поле контекста
    * @param {Array.<String>} keyPath Путь до значения
    * @return {*}
    */
      get: function(value, keyPath) {
         var key,
            subValueFound,
            subValue,
            subType,
            processedValues;

         if (keyPath.length === 0) {
            return value;
         }

         key = keyPath[0];
         subValueFound = false;

         if (transactionLevel > 0 && processedRecords.has(value)) {
            processedValues = processedRecords.get(value);
            if (key in processedValues) {
               subValue = processedValues[key];
               subValueFound = true;
            }
         }

         if (!subValueFound) {
            subValue = value.get(key);
         }

         if (subValue === undefined) {
            return CoreContext.NonExistentValue;
         }

         subType = CoreContext.getValueType(subValue);
         return subType.get(subValue, keyPath.slice(1));
      },

      /**
    * Возвращает признак, что значение поля контекста изменилось
    * @param {Type/entity#Record} oldValue Поле контекста
    * @param {Array.<String>} keyPath Путь до значения
    * @param {*} value Значение, сравниваемое с текущим
    * @return {Boolean}
    */
      setWillChange: function(oldValue, keyPath, value) {
         var result,
            subValue,
            key,
            subType;

         if (keyPath.length === 0) {
            return oldValue !== value;
         }

         key = keyPath[0];
         subValue = oldValue.get(key);

         // Если есть owner (RecordSet), то мы не можем менять формат записи
         if (oldValue.getOwner &&
         oldValue.getOwner() &&
         (oldValue.getOwner() instanceof collection.RecordSet)
         ) {
            result = subValue !== undefined;
         } else {
            result = subValue !== value;
         }

         if (result) {
            subType = CoreContext.getValueType(subValue);
            result = subType.setWillChange(subValue, keyPath.slice(1), value);
         }

         return result;
      },

      /**
    * Устанавливает значение поля контекста
    * @param {Type/entity#Record} oldValue Поле контекста
    * @param {Array.<String>} keyPath Путь до значения
    * @param {*} value Новое значение
    * @return {*}
    */
      set: function(oldValue, keyPath, value) {
         var result,
            subValue,
            newSubValue,
            key,
            subType;

         if (keyPath.length === 0) {
            return value;
         }

         key = keyPath[0];
         subValue = oldValue.get(key);
         if (subValue !== undefined) {
            if (keyPath.length === 1) {
               var values;
               if (processedRecords.has(oldValue)) {
                  values = processedRecords.get(oldValue);
               } else {
                  values = {};
               }
               values[key] = value;
               processedRecords.set(oldValue, values);
               result = oldValue;
            } else {
               subType = CoreContext.getValueType(subValue);
               newSubValue = subType.set(subValue, keyPath.slice(1), value);
               if (subValue === newSubValue) {
                  result = oldValue;
               } else {
                  result = RecordMixin.set(oldValue, [key], newSubValue);
               }
            }
         } else if (subValue === undefined && keyPath.length === 1) {
         // Если поля в записи нет, попробуем его добавить
            if (oldValue.has(key)) {
               oldValue.set(key, value);
            } else {
               this._module.addFieldTo(oldValue, key, value);
            }
            result = oldValue;
         }

         if (transactionLevel === 0) {
            applyProcessed();
         }

         return result;
      },

      transaction: function() {
         if (transactionLevel === 0) {
            processedRecords.clear();
         }
         transactionLevel++;
      },

      commit: function() {
         transactionLevel--;
         if (transactionLevel === 0) {
            applyProcessed();
         }
      },

      /**
    * Удаляет значение поля контекста
    * @param {Type/entity#Record} oldValue Поле контекста
    * @param {Array.<String>} keyPath Путь до значения
    * @return {Object}
    */
      remove: function(oldValue, keyPath) {
         var key,
            subValue,
            subType,
            res,
            changed;

         changed = keyPath.length !== 0;
         if (changed) {
            key = keyPath[0];
            changed = oldValue.has(key);
            if (changed) {
               subValue = oldValue.get(key);
               changed = keyPath.length === 1;
               if (changed) {
                  changed = subValue !== null;
                  if (changed) {
                     oldValue.set(key, null);
                  }
               } else {
                  subType = CoreContext.getValueType(subValue);
                  res = subType.remove(subValue, keyPath.slice(1));
                  changed = res.changed;
                  if (changed) {
                     oldValue.set(key, res.value);
                  }
               }
            }
         }

         return {
            value: oldValue,
            changed: changed
         };
      }
   };

   return RecordMixin;
});
