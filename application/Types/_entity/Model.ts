/// <amd-module name="Types/_entity/Model" />
/**
 * Абстрактная модель.
 * Модели обеспечивают доступ к данным и поведению объектов предметной области (сущностям).
 * Такими сущностями могут быть, например, товары, пользователи, документы - и другие предметы окружающего мира, которые вы моделируете в своем приложении.
 *
 * В основе абстрактной модели лежит {@link Types/_entity/Record запись}.
 * Основные аспекты модели (дополнительно к аспектам записи):
 * <ul>
 *    <li>определение {@link properties собственных свойств} сущности;</li>
 *    <li>{@link getId уникальный идентификатор сущности} среди ей подобных.</li>
 * </ul>
 *
 * Поведенческие аспекты каждой сущности реализуются ее прикладным модулем в виде публичных методов.
 * Прикладные модели могут внедряться в порождающие их объекты, такие как {@link Types/_source/ISource#model источники данных} или {@link Types/_collection/RecordSet#model рекордсеты}.
 *
 * Для реализации конкретной модели используется наследование от абстрактной либо промежуточной.
 *
 * Для корректной сериализации и клонирования моделей необходимо выносить их в отдельные модули и указывать имя модуля в свойстве _moduleName каждого наследника:
 * <pre>
 *    //My/Awesome/Model.ts
 *    import {Model} from 'Types/entity';
 *    export default class AwesomeModel extends Model {
 *       _moduleName: string = 'My/Awesome/Model';
 *       //...
 *    });
 *
 *    return AwesomeModel;
 * </pre>
 *
 * Определим модель пользователя:
 * <pre>
 *    //My/Awesome/Model.ts
 *    import {Salt} from 'Application/Lib';
 *    import {Model} from 'Types/entity';
 *    export default class User extends Model{
 *       _moduleName: string = 'Application/Model/User';
 *       _$format: Array = [
 *          {name: 'login', type: 'string'},
 *          {name: 'salt', type: 'string'}
 *       ];
 *       _$idProperty: string = 'login';
 *       authenticate(password: string): boolean {
 *          return Salt.encode(this.get('login') + ':' + password) === this.get('salt');
 *       }
 *     });
 * </pre>
 * Создадим модель пользователя:
 * <pre>
 *    //Application/Controller/Test/Auth.ts
 *    import User from 'Application/Model/User';
 *    const user = new User();
 *    user.set({
 *       login: 'i.c.wiener',
 *       salt: 'grhS2Nys345fsSW3mL9'
 *    });
 *    const testOk = user.authenticate('its pizza time!');
 * </pre>
 *
 * Модели могут объединяться по принципу "матрёшки" - сырыми данными одной модели является другая модель. Для организации такой структуры следует использовать {@link Types/_entity/adapter/RecordSet адаптер рекордсета}:
 * <pre>
 *    var MyEngine, MyTransmission, myCar;
 *
 *    MyEngine = Model.extend({
 *       _$properties: {
 *          fuelType: {
 *             get: function() {
 *                return 'Diesel';
 *             }
 *          }
 *       }
 *    });
 *
 *    MyTransmission = Model.extend({
 *       _$properties: {
 *          transmissionType: {
 *             get: function() {
 *                return 'Manual';
 *             }
 *          }
 *       }
 *    });
 *
 *    myCar = new MyEngine({
 *       rawData: new MyTransmission({
 *          rawData: {
 *             color: 'Red',
 *             fuelType: '',
 *             transmissionType: ''
 *          }
 *       }),
 *       adapter: new RecordSetAdapter()
 *   });
 *
 *   myCar.get('fuelType');//'Diesel'
 *   myCar.get('transmissionType');//'Manual'
 *   myCar.get('color');//'Red'
 * </pre>
 * @class Types/_entity/Model
 * @extends Types/_entity/Record
 * @implements Types/_entity/IInstantiable
 * @mixes Types/_entity/InstantiableMixin
 * @public
 * @ignoreMethods getDefault
 * @author Мальцев А.А.
 */

import Record from './Record';
import IInstantiable from './IInstantiable';
import InstantiableMixin from './InstantiableMixin';
import {Compute} from './functor';
import {enumerator, EnumeratorCallback} from '../collection';
import {create, register} from '../di';
import {logger, mixin} from '../util';
import {Map, Set} from '../shim';

/**
 * Separator for path in object
 */
const ROUTE_SEPEARTOR = '.';

interface IGetter extends Function {
   get: (name: string) => any;
   properties: string[];
}

interface ISetter extends Function {
   set: (name: string, value: any) => any;
   properties: string[];
}

interface IProperty {
   get: IGetter;
   set?: ISetter;
   default?: (name: string) => any;
}

interface IProperties<T> {
}

export default class Model extends mixin(
   Record, InstantiableMixin
) implements IInstantiable /** @lends Types/_entity/Model.prototype */{
   /**
    * @typedef {Object} Property
    * @property {*|Function} [def] Значение по умолчанию (используется, если свойства нет в сырых данных).
    * @property {Function} [get] Метод, возвращающий значение свойства. Первым аргументом придет значение свойства в сырых данных (если оно там есть).
    * @property {Function} [set] Метод, устанавливающий значение свойства. Если метод вернет значение, отличное от undefined, то будет осуществлена попытка сохранить его в сырых данных.
    */

   /**
    * @cfg {Object.<Property>} Описание собственных свойств модели. Дополняет/уточняет свойства, уже существующие в сырых данных.
    * @name Types/_entity/Model#properties
    * @see Property
    * @see getProperties
    * @example
    * Создадим модель пользователя со свойствами:
    * <ul>
    *    <li>id (чтение/запись, динамическая конвертация, хранится в сырых данных)</li>
    *    <li>group (чтение/запись, хранится в защищенном свойстве)</li>
    *    <li>guid (только чтение, значение по умолчанию генерируется динамически)</li>
    * </ul>
    * <pre>
    *    import {Model} from 'Types/entity';
    *
    *    interface IGroup {
    *       id: sting
    *       name: sting
    *    }
    *
    *    export default class User extends Model {
    *       _$properties: Object = {
    *          id: {
    *             get(value) {
    *                return '№' + value;
    *             },
    *             set(value) {
    *                return (value + '')[0] === '№' ? value.substr(1) : value;
    *             }
    *          },
    *          group: {
    *             get() {
    *                return this._group;
    *             },
    *             set(value) {
    *                this._group = value;
    *             }
    *          },
    *          guid: {
    *             def() {
    *                return Math.random() * 999999999999999;
    *             },
    *             get(value) {
    *                return value;
    *             }
    *          }
    *       },
    *       _group: IGroup = null
    *    }
    *
    *    const user = new User({
    *       rawData: {
    *          id: 5,
    *          login: 'Keanu',
    *          firstName: 'Johnny',
    *          lastName: 'Mnemonic',
    *          job: 'Memory stick'
    *       }
    *    });
    *
    *    console.log(user.get('id'));//№5
    *    console.log(user.get('group'));//null
    *    console.log(user.get('guid'));//010a151c-1160-d31d-11b3-18189155cc13
    *    console.log(user.get('job'));//Memory stick
    *    console.log(user.get('uptime'));//undefined
    *
    *    user.set('id', '№6');
    *    console.log(user.getRawData().id);//6
    *
    *    user.set('group', {id: 1, name: 'The One'});
    *    console.log(user.get('group'));//{id: 1, name: 'The One'}
    *
    *    user.set('guid', 'new-one');//ReferenceError 'Model::set(): property "guid" is read only'
    * </pre>
    * Создадим модель пользователя со свойством displayName, которое вычисляется с использованием значений других свойств:
    * <pre>
    *    import {Model} from 'Types/entity';
    *
    *    export default class User extends {
    *       _$properties: Object = {
    *          displayName: {
    *             get() {
    *               return this.get('firstName') + ' a.k.a "' + this.get('login') + '" ' + this.get('lastName');
    *             }
    *          }
    *       }
    *    });
    *
    *    const user = new User({
    *       rawData: {
    *          login: 'Keanu',
    *          firstName: 'Johnny',
    *          lastName: 'Mnemonic'
    *       }
    *    });
    *    console.log(user.get('displayName'));//Johnny a.k.a "Keanu" Mnemonic
    * </pre>
    * Можно явно указать список свойств, от которых зависит другое свойство. В этом случае для свойств-объектов будет сбрасываться кэш, хранящий результат предыдущего вычисления:
    * <pre>
    *    import {Model, functor} from 'Types/entity';
    *
    *    export default class User extends {
    *       _$properties: any = {
    *          birthDay: {
    *             get: new functor.Compute(function() {
    *                return this.get('facebookBirthDay') || this.get('linkedInBirthDay');
    *             }, ['facebookBirthDay', 'linkedInBirthDay'])
    *          }
    *       }
    *    }
    *
    *    const user = new User();
    *    user.set('linkedInBirthDay', new Date(2010, 1, 2));
    *    console.log(user.get('birthDay'));//Tue Feb 02 2010 00:00:00
    *
    *    user.set('facebookBirthDay', new Date(2011, 3, 4));
    *    console.log(user.get('birthDay'));//Mon Apr 04 2011 00:00:00
    * </pre>
    */
   _$properties: IProperties<IProperty>;

   /**
    * @cfg {String} Название свойства, содержащего первичный ключ
    * @name Types/_entity/Model#idProperty
    * @see getIdProperty
    * @see setIdProperty
    * @see getId
    * @example
    * Зададим первичным ключом модели свойство с названием id:
    * <pre>
    *    var article = new Model({
    *       idProperty: 'id',
    *       rawData: {
    *          id: 1,
    *          title: 'How to make a Model'
    *       }
    *    });
    *    article.getId();//1
    * </pre>
    */
   _$idProperty: string;

   /**
    * @property The model is deleted in data source which it's taken from
    */
   _isDeleted: boolean;

   /**
    * @property Default values of calculated properties
    */
   _defaultPropertiesValues: Object;

   /**
    * @property Properties dependency map like 'property name' -> ['property names that depend of that one']
    */
   _propertiesDependency: Map<string, Set<string>>;

   /**
    * @property Property name which now gathering dependencies for
    */
   _propertiesDependencyGathering: string;

   /**
    * @property Properties names which calculating right now
    */
   _calculatingProperties: Set<string>;

   /**
    * @property Properties names and values which affected during the recurseve set() calls
    */
   _deepChangedProperties: Object;

   // endregion

   // region IInstantiable

   readonly '[Types/_entity/IInstantiable]': boolean;

   getInstanceId: () => string;

   constructor(options?) {
      super(options);

      // TODO: don't allow to inject properties through constructor
      this._propertiesInjected = options && 'properties' in options;

      // FIXME: backward compatibility for _options
      if (this._options) {
         // for _$properties
         if (this._options.properties) {
            const properties = {};
            Object.assign(properties, this._$properties);
            Object.assign(properties, this._options.properties);
            this._$properties = properties;
         }

         // for _$idProperty
         if (this._options.idProperty) {
            this._$idProperty = this._options.idProperty;
         }
      }

      if (!this._$idProperty) {
         this._$idProperty = this._getAdapter().getKeyField(this._getRawData()) || '';
      }
   }

   // endregion

   // region Statics

   static fromObject(data, adapter) {
      const record = Record.fromObject(data, adapter);
      if (!record) {
         return record;
      }
      return new Model({
         rawData: record.getRawData(true),
         adapter: record.getAdapter(),
         //@ts-ignore
         format: record._getFormat(true)// "Anakin, I Am Your Son"
      });
   }

   // endregion

   // region Deprecated

   /**
    * @deprecated
    */
   static extend(mixinsList: any, classExtender: any) {
      logger.info('Types/_entity/Model', 'Method extend is deprecated, use ES6 extends or Core/core-extend');

      if (!require.defined('Core/core-extend')) {
         throw new ReferenceError(
            'You should require module "Core/core-extend" to use old-fashioned "Types/_entity/Model::extend()" method.'
         );
      }
      const coreExtend = require('Core/core-extend');
      return coreExtend(this, mixinsList, classExtender);
   }

   destroy() {
      this._defaultPropertiesValues = null;
      this._propertiesDependency = null;
      this._calculatingProperties = null;
      this._deepChangedProperties = null;

      super.destroy();
   }

   // region IObject

   get(name: string): any {
      this._pushDependency(name);

      if (this._fieldsCache.has(name)) {
         return this._fieldsCache.get(name);
      }

      const property = this._$properties && this._$properties[name];

      const superValue = super.get(name);
      if (!property) {
         return superValue;
      }

      let preValue = superValue;
      if ('def' in property && !this._getRawDataAdapter().has(name)) {
         preValue = this.getDefault(name);
      }

      if (!property.get) {
         return preValue;
      }

      const value = this._processCalculatedValue(name, preValue, property, true);

      if (value !== superValue) {
         this._removeChild(superValue);
         this._addChild(value, this._getRelationNameForField(name));
      }

      if (this._isFieldValueCacheable(value)) {
         this._fieldsCache.set(name, value);
      } else if (this._fieldsCache.has(name)) {
         this._fieldsCache.delete(name);
      }

      return value;
   }

   set(name: string | Object, value?: any): void {
      if (!this._$properties) {
         super.set(name, value);
         return;
      }

      const map = this._getHashMap(name, value);
      const pairs = [];
      const propertiesErrors = [];
      const isCalculating = this._calculatingProperties ? this._calculatingProperties.size > 0 : false;

      Object.keys(map).forEach((key) => {
         this._deleteDependencyCache(key);

         // Try to set every property
         let value = map[key];
         try {
            const property = this._$properties && this._$properties[key];
            if (property) {
               if (property.set) {
                  // Remove cached value
                  if (this._fieldsCache.has(key)) {
                     this._removeChild(
                        this._fieldsCache.get(key)
                     );
                     this._fieldsCache.delete(key);
                  }

                  value = this._processCalculatedValue(key, value, property, false);
                  if (value === undefined) {
                     return;
                  }
               } else if (property.get) {
                  propertiesErrors.push(new ReferenceError(`Property "${key}" is read only`));
                  return;
               }
            }

            pairs.push([key, value, this._getRawDataValue(key)]);
         } catch (err) {
            // Collecting errors for every property
            propertiesErrors.push(err);
         }
      });

      // Collect pairs of properties
      const pairsErrors = [];
      let changedProperties = super._setPairs(pairs, pairsErrors);
      if (isCalculating && changedProperties) {
         // Here is the set() that recursive calls from another set() so just accumulate the changes
         this._deepChangedProperties = this._deepChangedProperties || {};
         Object.assign(this._deepChangedProperties, changedProperties);
      } else if (!isCalculating && this._deepChangedProperties) {
         // Here is the top level set() so do merge with accumulated changes
         if (changedProperties) {
            Object.assign(this._deepChangedProperties, changedProperties);
         }
         changedProperties = this._deepChangedProperties;
         this._deepChangedProperties = null;
      }

      // It's top level set() so notify changes if have some
      if (!isCalculating && changedProperties) {
         const changed = Object.keys(changedProperties).reduce((memo, key) => {
            memo[key] = this.get(key);
            return memo;
         }, {});
         this._notifyChange(changed);
      }

      this._checkErrors([...propertiesErrors, ...pairsErrors]);
   }

   has(name: string): boolean {
      return (this._$properties && this._$properties.hasOwnProperty(name)) || super.has(name);
   }

   // endregion

   // region IEnumerable

   /**
    * Возвращает энумератор для перебора названий свойств модели
    * @return {Types/_collection/ArrayEnumerator}
    * @example
    * Смотри пример {@link Types/_entity/Record#getEnumerator для записи}:
    */
   getEnumerator(): enumerator.Arraywise<any> {
      return create<enumerator.Arraywise<any>>('Types/collection:enumerator.Arraywise', this._getAllProperties());
   }

   /**
    * Перебирает все свойства модели (включая имеющиеся в "сырых" данных)
    * @param {Function(String, *)} callback Ф-я обратного вызова для каждого свойства. Первым аргументом придет название свойства, вторым - его значение.
    * @param {Object} [context] Контекст вызова callback.
    * @example
    * Смотри пример {@link Types/_entity/Record#each для записи}:
    */
   each(callback: EnumeratorCallback<any>, context?: Object) {
      return super.each(callback, context);
   }

   // endregion

   // region IReceiver

   relationChanged(which: any, route: string[]): any {
      // Delete cache for properties related of changed one use in-deep route
      const curr = [];
      const routeLastIndex = route.length - 1;
      route.forEach((name, index) => {
         const fieldName = this._getFieldFromRelationName(name);
         curr.push(fieldName);
         if (fieldName) {
            this._deleteDependencyCache(curr.join(ROUTE_SEPEARTOR));

            if (index === routeLastIndex && which.data instanceof Object) {
               Object.keys(which.data).forEach((key) => {
                  this._deleteDependencyCache(curr.concat([key]).join(ROUTE_SEPEARTOR));
               });
            }
         }
      });

      return super.relationChanged(which, route);
   }

   // endregion

   // region SerializableMixin

   _getSerializableState(state) {
      state = super._getSerializableState(state);

      // Properties are owned by class, not by instance
      if (!this._propertiesInjected) {
         delete state.$options.properties;
      }

      state._instanceId = this.getInstanceId();
      state._isDeleted = this._isDeleted;
      if (this._defaultPropertiesValues) {
         state._defaultPropertiesValues = this._defaultPropertiesValues;
      }

      return state;
   }

   _setSerializableState(state) {
      const fromSuper = super._setSerializableState(state);
      return function() {
         fromSuper.call(this);

         this._instanceId = state._instanceId;
         this._isDeleted = state._isDeleted;
         if (state._defaultPropertiesValues) {
            this._defaultPropertiesValues = state._defaultPropertiesValues;
         }
      };
   }

   // endregion

   // region Record

   rejectChanges(fields, spread) {
      super.rejectChanges(fields, spread);
      if (!(fields instanceof Array)) {
         this._isChanged = false;
      }
   }

   acceptChanges(fields, spread) {
      super.acceptChanges(fields, spread);
      if (!(fields instanceof Array)) {
         this._isChanged = false;
      }
   }

   isChanged(name) {
      if (!name && this._isChanged) {
         return true;
      }
      return super.isChanged(name);
   }

   // endregion

   // region Public methods

   /**
    * Возвращает описание свойств модели.
    * @return {Object.<Property>}
    * @see properties
    * @see Property
    * @example
    * Получим описание свойств модели:
    * <pre>
    *    var User = Model.extend({
    *          _$properties: {
    *             id: {
    *                get: function() {
    *                   this._id;
    *                },
    *                set: function(value) {
    *                   this._id = value;
    *                }
    *             },
    *             group: {
    *                get: function() {
    *                   this._group;
    *                }
    *             }
    *          },
    *          _id: 0
    *          _group: null
    *       }),
    *       user = new User();
    *
    *    user.getProperties();//{id: {get: Function, set: Function}, group: {get: Function}}
    * </pre>
    */
   getProperties() {
      return this._$properties;
   }

   /**
    * Возвращает значение свойства по умолчанию
    * @param {String} name Название свойства
    * @return {*}
    * @example
    * Получим дефолтное значение свойства id:
    * <pre>
    *    var User = Model.extend({
    *          _$properties: {
    *             id: {
    *                get: function() {
    *                   this._id;
    *                },
    *                def: function(value) {
    *                   return Date.now();
    *                }
    *             }
    *          },
    *          _id: 0
    *       }),
    *       user = new User();
    *
    *    user.getDefault('id');//1466419984715
    *    setTimeout(function(){
    *       user.getDefault('id');//1466419984715
    *    }, 100);
    * </pre>
    */
   getDefault(name) {
      let defaultPropertiesValues = this._defaultPropertiesValues;
      if (!defaultPropertiesValues) {
         defaultPropertiesValues = this._defaultPropertiesValues = {};
      }

      if (!defaultPropertiesValues.hasOwnProperty(name)) {
         const property = this._$properties[name];
         if (property && 'def' in property) {
            defaultPropertiesValues[name] = [property.def instanceof Function ? property.def.call(this) : property.def];
         } else {
            defaultPropertiesValues[name] = [];
         }
      }
      return defaultPropertiesValues[name][0];
   }

   /**
    * Объединяет модель с данными другой модели
    * @param {Types/_entity/Model} model Модель, с которой будет произведено объединение
    * @example
    * Объединим модели пользователя и группы пользователей:
    * <pre>
    *    var user = new Model({
    *          rawData: {
    *             id: 1,
    *             login: 'user1',
    *             group_id: 3
    *          }
    *       }),
    *       userGroup = new Model({
    *          rawData: {
    *             group_id: 3,
    *             group_name: 'Domain Users',
    *             group_members: 126
    *          }
    *       });
    *
    *    user.merge(userGroup);
    *    user.get('id');//1
    *    user.get('group_id');//3
    *    user.get('group_name');//'Domain Users'
    * </pre>
    */
   merge(model) {
      try {
         const modelData = {};
         model.each((key, val) => {
            modelData[key] = val;
         });
         this.set(modelData);
      } catch (e) {
         if (e instanceof ReferenceError) {
            logger.info(this._moduleName + '::merge(): ' + e.toString());
         } else {
            throw e;
         }
      }
   }

   /**
    * Возвращает значение первичного ключа модели
    * @return {*}
    * @see idProperty
    * @see getIdProperty
    * @see setIdProperty
    * @example
    * Получим значение первичного ключа статьи:
    * <pre>
    *    var article = new Model({
    *       idProperty: 'id',
    *       rawData: {
    *          id: 1,
    *          title: 'How to make a Model'
    *       }
    *    });
    *    article.getId();//1
    * </pre>
    */
   getId() {
      const idProperty = this.getIdProperty();
      if (!idProperty) {
         logger.info(this._moduleName + '::getId(): idProperty is not defined');
         return undefined;
      }
      return this.get(idProperty);
   }

   /**
    * Возвращает название свойства, в котором хранится первичный ключ модели
    * @return {String}
    * @see idProperty
    * @see setIdProperty
    * @see getId
    * @example
    * Получим название свойства первичного ключа:
    * <pre>
    *    var article = new Model({
    *       idProperty: 'id',
    *       rawData: {
    *          id: 1,
    *          title: 'How to make a Model'
    *       }
    *    });
    *    article.getIdProperty();//'id'
    * </pre>
    */
   getIdProperty() {
      return this._$idProperty;
   }

   /**
    * Устанавливает название свойства, в котором хранится первичный ключ модели
    * @param {String} idProperty Название свойства для первичного ключа модели.
    * @see idProperty
    * @see getIdProperty
    * @see getId
    * @example
    * Зададим название свойства первичного ключа:
    * <pre>
    *    var article = new Model({
    *       rawData: {
    *          id: 1,
    *          title: 'How to make a Model'
    *       }
    *    });
    *    article.setIdProperty('id');
    *    article.getId();//1
    * </pre>
    */
   setIdProperty(idProperty) {
      if (idProperty && !this.has(idProperty)) {
         logger.info(this._moduleName + '::setIdProperty(): property "' + idProperty + '" is not defined');
         return;
      }
      this._$idProperty = idProperty;
   }

   // endregion

   // region Protected methods

   /**
    * Возвращает массив названий всех свойств (включая свойства в "сырых" данных)
    * @return {Array.<String>}
    * @protected
    */
   protected _getAllProperties() {
      const fields = this._getRawDataFields();
      if (!this._$properties) {
         return fields;
      }

      const objProps = this._$properties;
      const props = Object.keys(objProps);
      return props.concat(fields.filter((field) => {
         return !objProps.hasOwnProperty(field);
      }));
   }

   /**
    * Вычисляет/записывает значение свойства
    * @param {String} name Имя свойства
    * @param {*} value Значение свойства
    * @param {Property} property Описание свойства
    * @param {Boolean} isReading Вычисление или запись
    * @return {*}
    * @protected
    */
   protected _processCalculatedValue(name: string, value: any, property: IProperty, isReading?: boolean) {
      // Check for recursive calculating
      let calculatingProperties = this._calculatingProperties;
      if (!calculatingProperties) {
         calculatingProperties = this._calculatingProperties = new Set();
      }
      const checkKey = name + '|' + isReading;
      if (calculatingProperties.has(checkKey)) {
         throw new Error(`Recursive value ${isReading ? 'reading' : 'writing'} detected for property "${name}"`);
      }

      // Initial conditions
      const method = isReading ? property.get : property.set;
      const isFunctor = isReading && Compute.isFunctor(method);
      const doGathering = isReading && !isFunctor;

      // Automatic dependencies gathering
      let prevGathering;
      if (isReading) {
         prevGathering = this._propertiesDependencyGathering;
         this._propertiesDependencyGathering = doGathering ? name : '';
      }

      // Save user defined dependencies
      if (isFunctor) {
         method.properties.forEach((dependFor) => {
            this._pushDependencyFor(dependFor, name);
         });
      }

      // Get or set property value
      try {
         calculatingProperties.add(checkKey);
         value = method.call(this, value);
      } finally {
         if (isReading) {
            this._propertiesDependencyGathering = prevGathering;
         }
         calculatingProperties.delete(checkKey);
      }

      return value;
   }

   /**
    * Добавляет зависимое свойство для текущего рассчитываемого
    * @param {String} name Название свойства.
    * @protected
    */
   protected _pushDependency(name: string) {
      if (this._propertiesDependencyGathering && this._propertiesDependencyGathering !== name) {
         this._pushDependencyFor(name, this._propertiesDependencyGathering);
      }
   }

   /**
    * Добавляет зависимое свойство
    * @param {String} name Название свойства.
    * @param {String} dependFor Название свойства, котороое зависит от name
    * @protected
    */
   protected _pushDependencyFor(name: string, dependFor: string) {
      let propertiesDependency = this._propertiesDependency;
      if (!propertiesDependency) {
         propertiesDependency = this._propertiesDependency = new Map();
      }

      let data;
      if (propertiesDependency.has(name)) {
         data = propertiesDependency.get(name);
      } else {
         data = new Set();
         propertiesDependency.set(name, data);
      }
      if (!data.has(dependFor)) {
         data.add(dependFor);
      }
   }

   /**
    * Удаляет закешированное значение для свойства и всех от него зависимых свойств
    * @param {String} name Название свойства.
    * @protected
    */
   protected _deleteDependencyCache(name: string) {
      const propertiesDependency = this._propertiesDependency;

      if (propertiesDependency && propertiesDependency.has(name)) {
         propertiesDependency.get(name).forEach((related) => {
            this._removeChild(this._fieldsCache.get(related));
            this._fieldsCache.delete(related);
            this._fieldsClone.delete(related);
            this._deleteDependencyCache(related);
         });
      }
   }

   // endregion
}

Object.assign(Model.prototype, {
   '[Types/_entity/Model]': true,
   '[Types/_entity/IInstantiable]': true,
   _moduleName: 'Types/entity:Model',
   _instancePrefix: 'model-',
   _$properties: null,
   _$idProperty: '',
   _isDeleted: false,
   _defaultPropertiesValues: null,
   _propertiesDependency: null,
   _propertiesDependencyGathering: '',
   _calculatingProperties: null,
   _deepChangedProperties: null
});

// FIXME: backward compatibility for check via Core/core-instance::instanceOfModule()
Model.prototype['[WS.Data/Entity/Model]'] = true;
// FIXME: backward compatibility for Core/core-extend: Model should have exactly its own property 'produceInstance'
// @ts-ignore
Model.produceInstance = Record.produceInstance;

register('Types/entity:Model', Model, {instantiate: false});
// FIXME: deprecated
register('entity.model', Model);
