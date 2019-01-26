/// <amd-module name="Types/_entity/adapter/Abstract" />
/**
 * Абстрактный адаптер для данных.
 * Это абстрактный класс, не предназначенный для создания самостоятельных экземпляров.
 * @class Types/Adapter/Abstract
 * @mixes Types/Entity/DestroyableMixin
 * @implements Types/Adapter/IAdapter
 * @mixes Types/Entity/SerializableMixin
 * @public
 * @author Мальцев А.А.
 */

import DestroyableMixin from '../DestroyableMixin';
import IAdapter from './IAdapter';
import ITable from './ITable';
import IRecord from './IRecord';
import SerializableMixin from '../SerializableMixin';
import {mixin} from '../../util';
import toSql, {MODE as toSqlMode} from '../date/toSql';

const serializer = (function() {
   let serialize = function(data) {
      if (data instanceof Array) {
         return serializeArray(data);
      } else if (data && typeof data === 'object') {
         return serializeObject(data);
      } else {
         return data;
      }
   };

   let serializeArray = function(arr) {
      return arr.map(function(item) {
         return serialize(item);
      });
   };

   let serializeObject = function(obj) {
      if (typeof obj.getRawData === 'function') {
         //Instance of Types/Entity/Record || Types/Collection/RecordSet || Types/Source/DataSet
         return obj.getRawData(true);
      } else if (obj instanceof Date) {
         let mode = toSqlMode.DATETIME;
         obj = <ExtendDate>obj;
         if (obj.getSQLSerializationMode) {
            switch (obj.getSQLSerializationMode()) {
               case (<ExtendDateConstructor>Date).SQL_SERIALIZE_MODE_DATE:
                  mode = toSqlMode.DATE;
                  break;
               case (<ExtendDateConstructor>Date).SQL_SERIALIZE_MODE_TIME:
                  mode = toSqlMode.TIME;
                  break;
            }
         }
         return toSql(obj, mode);
      } else {
         //Check if 'obj' is a scalar value wrapper
         if (obj.valueOf) {
            obj = obj.valueOf();
         }
         if (obj && typeof obj === 'object') {
            return serializePlainObject(obj);
         }
         return obj;
      }
   };

   let serializePlainObject = function(obj) {
      let result = {};

      let proto = Object.getPrototypeOf(obj);
      if (proto !== null && proto !== Object.prototype) {
         throw new TypeError('Unsupported object type. Only plain objects can be serialized.');
      }

      let keys = Object.keys(obj);
      let key;
      for (let i = 0; i < keys.length; i++) {
         key = keys[i];
         result[key] = serialize(obj[key]);
      }
      return result;
   };

   return {
      serialize: serialize
   };
})();

export default abstract class Abstract extends mixin(
   DestroyableMixin, SerializableMixin
) implements IAdapter /** @lends Types/Adapter/Abstract.prototype */{
   readonly '[Types/_entity/adapter/IAdapter]': boolean;

   /**
    * @property Разделитель для обозначения пути в данных
    */
   _pathSeparator: string;

   constructor() {
      super();
      SerializableMixin.constructor.call(this);
   }

   getProperty(data: any, property: string): any {
      property = property || '';
      let parts = property.split(this._pathSeparator);
      let result;
      for (let i = 0; i < parts.length; i++) {
         result = i
            ? (result ? result[parts[i]] : undefined)
            : (data ? data[parts[i]] : undefined);
      }
      return result;
   }

   setProperty(data: any, property: string, value: any) {
      if (!data || !(data instanceof Object)) {
         return;
      }
      property = property || '';
      let parts = property.split(this._pathSeparator);
      let current = data;
      for (let i = 0, max = parts.length - 1; i <= max; i++) {
         if (i === max) {
            current[parts[i]] = value;
         } else {
            if (current[parts[i]] === undefined) {
               current[parts[i]] = {};
            }
            current = current[parts[i]];
         }
      }
   }

   serialize(data: any): any {
      return serializer.serialize(data);
   }

   forRecord(data: any, tableData?): IRecord {
      throw new Error('Method must be implemented');
   }

   forTable(data: any): ITable {
      throw new Error('Method must be implemented');
   }

   getKeyField(data: any): string {
      throw new Error('Method must be implemented');
   }
}

Abstract.prototype['[Types/_entity/adapter/Abstract]'] = true;
// @ts-ignore
Abstract.prototype['[Types/_entity/adapter/IAdapter]'] = true;
Abstract.prototype._pathSeparator = '.';
