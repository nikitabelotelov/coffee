/// <amd-module name="Types/_source/Remote" />
/**
 * Источник данных, работающий удаленно.
 * Это абстрактный класс, не предназначенный для создания самостоятельных экземпляров.
 * @class Types/_source/Remote
 * @extends Types/_source/Base
 * @implements Types/_source/ICrud
 * @implements Types/_source/ICrudPlus
 * @implements Types/_source/IProvider
 * @mixes Types/_entity/ObservableMixin
 * @mixes Types/_source/DataCrudMixin
 * @mixes Types/_source/BindingMixin
 * @mixes Types/_source/EndpointMixin
 * @ignoreOptions passing passing.create passing.read passing.update passing.destroy passing.query passing.copy
 * passing.merge passing.move
 * @public
 * @author Мальцев А.А.
 */

import Base, {IOptions as IBaseOptions} from './Base';
import ICrud from './ICrud';
import ICrudPlus from './ICrudPlus';
import IProvider, {IEndpoint} from './IProvider';
import DataMixin from './DataMixin';
import DataCrudMixin from './DataCrudMixin';
import BindingMixin from './BindingMixin';
import EndpointMixin from './EndpointMixin';
import OptionsMixin from './OptionsMixin';
import Query from './Query';
import DataSet from './DataSet';
import {IAbstract} from './provider';
import {Record, ObservableMixin} from '../entity';
import {RecordSet} from '../collection';
import {create} from '../di';
import {mixin, logger} from '../util';
// @ts-ignore
import Deferred = require('Core/Deferred');

export interface IPassing {
   create: (meta?: Object) => Object;
   read: (key: string | number, meta?: Object) => Object;
   update: (data: Record | RecordSet<Record>, meta?: Object) => Object;
   destroy: (keys: string | string[], meta?: Object) => Object;
   query: (query: Query) => Object;
   copy: (key: string | number, meta?: Object) => Object;
   merge: (from: string | number, to: string | number) => Object;
   move: (from: string | number, to: string | number, meta?: Object) => Object;
}

export interface IOptions extends IBaseOptions {
   updateOnlyChanged?: boolean;
   navigationType?: string;
}

// tslint:disable-next-line:ban-comma-operator
const global = (0, eval)('this');
const DeferredCanceledError = global.DeferredCanceledError;

/**
 * Типы навигации для query()
 */
const NAVIGATION_TYPE = {
   PAGE: 'Page',
   OFFSET: 'Offset'
};

function isNull(value: any): boolean {
   return value === null || value === undefined;
}

function isEmpty(value: any): boolean {
   return value === '' || isNull(value);
}

/**
 * Формирует данные, передваемые в провайдер при вызове create().
 * @param [meta] Дополнительные мета данные, которые могут понадобиться для создания записи
 */
function passCreate(meta?: object): object[] {
   return [meta];
}

/**
 * Формирует данные, передваемые в провайдер при вызове read().
 * @param key Первичный ключ записи
 * @param [meta] Дополнительные мета данные
 */
function passRead(key: string, meta?: Object): any[] {
   return [key, meta];
}

/**
 * Формирует данные, передваемые в провайдер при вызове update().
 * @param data Обновляемая запись или рекордсет
 * @param [meta] Дополнительные мета данные
 */
function passUpdate(data: Record|RecordSet<Record>, meta?: Object): any[] {
   if (this._$options.updateOnlyChanged) {
      const idProperty = this._getValidIdProperty(data);
      if (!isEmpty(idProperty)) {
         if (DataMixin.isModelInstance(data) && !isNull(data.get(idProperty))) {
            // Filter record fields
            const Record = require('Types/entity').Record;
            const changed = data.getChanged();
            changed.unshift(idProperty);
            data = Record.filterFields(data, changed);
         } else if (DataMixin.isListInstance(data)) {
            // Filter recordset fields
            data = ((source) => {
               const RecordSet = require('Types/collection').RecordSet;
               const result = new RecordSet({
                  adapter: source._$adapter,
                  idProperty: source._$idProperty
               });

               source.each((record) => {
                  if (isNull(record.get(idProperty)) || record.isChanged()) {
                     result.add(record);
                  }
               });

               return result;
            })(data);
         }
      }
   }
   return [data, meta];
}

/**
 * Формирует данные, передваемые в провайдер при вызове destroy().
 * @param keys Первичный ключ, или массив первичных ключей записи
 * @param [meta] Дополнительные мета данные
 */
function passDestroy(keys: string | string[], meta?: Object|Record): any[] {
   return [keys, meta];
}

/**
 * Формирует данные, передваемые в провайдер при вызове query().
 * @param [query] Запрос
 */
function passQuery(query: Query): Query[] {
   return [query];
}

/**
 * Формирует данные, передваемые в провайдер при вызове copy().
 * @param key Первичный ключ записи
 * @param [meta] Дополнительные мета данные
 */
function passCopy(key: string, meta?: Object): any[] {
   return [key, meta];
}

/**
 * Формирует данные, передваемые в провайдер при вызове merge().
 * @param from Первичный ключ записи-источника (при успешном объедининии запись будет удалена)
 * @param to Первичный ключ записи-приёмника
 */
function passMerge(from: string, to: string): string[] {
   return [from, to];
}

/**
 * Формирует данные, передваемые в провайдер при вызове move().
 * @param items Перемещаемая запись.
 * @param target Идентификатор целевой записи, относительно которой позиционируются перемещаемые.
 * @param [meta] Дополнительные мета данные.
 */
function passMove(from: any[], to: string, meta?: object): any[] {
   return [from, to, meta];
}

export default abstract class Remote extends mixin(
   Base, ObservableMixin, DataCrudMixin, BindingMixin, EndpointMixin
) implements ICrud, ICrudPlus, IProvider /** @lends Types/_source/Remote.prototype */{

   /**
    * @typedef {String} NavigationType
    * @variant Page По номеру страницы: передается номер страницы выборки и количество записей на странице.
    * @variant Offset По смещению: передается смещение от начала выборки и количество записей на странице.
    */

   /**
    * @cfg {Types/_source/Provider/IAbstract} Объект, реализующий сетевой протокол для обмена в режиме клиент-сервер
    * @name Types/_source/Remote#provider
    * @see getProvider
    * @see Types/di
    * @example
    * <pre>
    *    var dataSource = new RemoteSource({
    *       endpoint: '/users/'
    *       provider: new AjaxProvider()
    *    });
    * </pre>
    */
   protected _$provider: IAbstract | string;

   /**
    * @cfg {Object} Методы подготовки аргументов по CRUD контракту.
    * @name Types/_source/Remote#passing
    * @example
    * Подключаем пользователей через HTTP API, для метода create() передадим данные как объект с полем 'data':
    * <pre>
    *    var dataSource = new HttpSource({
    *       endpoint: '//some.server/users/',
    *       prepare: {
    *          create: function(meta) {
    *             return {
    *                data: meta
    *             }
    *          }
    *       }
    *    });
    * </pre>
    */
   protected _$passing: IPassing;

   protected _$options: IOptions;

   /**
    * Объект, реализующий сетевой протокол для обмена в режиме клиент-сервер
    */
   protected _provider: IAbstract;

   // @ts-ignore
   protected constructor(options?: Object) {
      // @ts-ignore
      BindingMixin.constructor.call(this, options);
      // @ts-ignore
      EndpointMixin.constructor.call(this, options);
      super(options);
      ObservableMixin.call(this, options);

      this._publish('onBeforeProviderCall');
   }

   // region ICrud

   readonly '[Types/_source/ICrud]': boolean = true;

   create(meta?: Object): ExtendPromise<Record> {
      return this._callProvider(
         this._$binding.create,
         this._$passing.create.call(this, meta)
      ).addCallback(
         (data) => this._loadAdditionalDependencies().addCallback(
            () => this._prepareCreateResult(data)
         )
      );
   }

   read(key: any, meta?: Object): ExtendPromise<Record> {
      return this._callProvider(
         this._$binding.read,
         this._$passing.read.call(this, key, meta)
      ).addCallback(
         (data) => this._loadAdditionalDependencies().addCallback(
            () => this._prepareReadResult(data)
         )
      );
   }

   update(data: Record | RecordSet<Record>, meta?: Object): ExtendPromise<null> {
      return this._callProvider(
         this._$binding.update,
         this._$passing.update.call(this, data, meta)
      ).addCallback(
         (key) => this._prepareUpdateResult(data, key)
      );
   }

   destroy(keys: any | any[], meta?: Object): ExtendPromise<null> {
      return this._callProvider(
         this._$binding.destroy,
         this._$passing.destroy.call(this, keys, meta)
      );
   }

   query(query: Query): ExtendPromise<DataSet> {
      return this._callProvider(
         this._$binding.query,
         this._$passing.query.call(this, query)
      ).addCallback(
         (data) => this._loadAdditionalDependencies().addCallback(
            () => this._prepareQueryResult(data)
         )
      );
   }

   // endregion

   // region ICrudPlus

   readonly '[Types/_source/ICrudPlus]': boolean = true;

   merge(from: string | number, to: string | number): ExtendPromise<any> {
      return this._callProvider(
         this._$binding.merge,
         this._$passing.merge.call(this, from, to)
      );
   }

   copy(key: string | number, meta?: Object): ExtendPromise<Record> {
      return this._callProvider(
         this._$binding.copy,
         this._$passing.copy.call(this, key, meta)
      ).addCallback(
         (data) => this._prepareReadResult(data)
      );
   }

   move(items: Array<string | number>, target: string | number, meta?: Object): ExtendPromise<any> {
      return this._callProvider(
         this._$binding.move,
         this._$passing.move.call(this, items, target, meta)
      );
   }

   // endregion

   // region IProvider

   readonly '[Types/_source/IProvider]': boolean = true;

   getEndpoint(): IEndpoint {
      return EndpointMixin.getEndpoint.call(this);
   }

   getProvider(): IAbstract {
      if (!this._provider) {
         this._provider = this._createProvider(this._$provider, {
            endpoint: this._$endpoint,
            options: this._$options
         });
      }

      return this._provider;
   }

   // endregion

   // region Protected methods

   /**
    * Инстанциирует провайдер удаленного доступа
    * @param {String|Types/_source/Provider/IAbstract} provider Алиас или инстанс
    * @param {Object} options Аргументы конструктора
    * @return {Types/_source/Provider}
    * @protected
    */
   protected _createProvider(provider: IAbstract | string, options: object): IAbstract {
      if (!provider) {
         throw new Error('Remote access provider is not defined');
      }
      if (typeof provider === 'string') {
         provider = create<IAbstract>(provider, options);
      }

      return provider;
   }

   /**
    * Вызывает удаленный сервис через провайдер
    * @param {String} name Имя сервиса
    * @param {Object|Array} [args] Аргументы вызова
    * @return {Core/Deferred} Асинхронный результат операции
    * @protected
    */
   protected _callProvider(name: string, args: object): ExtendPromise<any> {
      const provider = this.getProvider();

      const eventResult = this._notify('onBeforeProviderCall', name, args);
      if (eventResult !== undefined) {
         args = eventResult;
      }

      const result = provider.call(
         name,
         this._prepareProviderArguments(args)
      );

      if (this._$options.debug) {
         result.addErrback((error) => {
            if (error instanceof DeferredCanceledError) {
               logger.info(this._moduleName, `calling of remote service "${name}" has been cancelled.`);
            } else {
               logger.error(this._moduleName, `remote service "${name}" throws an error "${error.message}".`);
            }
            return error;
         });
      }

      return result;
   }

   /**
    * Подготавливает аргументы к передаче в удаленный сервис
    * @param {Object} [args] Аргументы вызова
    * @return {Object|undefined}
    * @protected
    */
   protected _prepareProviderArguments(args: object): object {
      return this.getAdapter().serialize(args);
   }

   protected _getValidIdProperty(data: any): string {
      const idProperty = this.getIdProperty();
      if (!isEmpty(idProperty)) {
         return idProperty;
      }
      if (typeof data.getIdProperty === 'function') {
         return data.getIdProperty();
      }

      // FIXME: тут стоит выбросить исключение, поскольку в итоге возвращаем пустой idProperty
      return idProperty;
   }

   // endregion

   // region Statics

   static get NAVIGATION_TYPE(): any {
      return NAVIGATION_TYPE;
   }
   // endregion
}

Object.assign(Remote.prototype, /** @lends Types/_source/Remote.prototype */{
   '[Types/_source/Remote]': true,
   _moduleName: 'Types/source:Remote',
   _provider: null,
   _$provider: null,
   _$passing: {
      /**
       * @cfg {Function} Метод подготовки аргументов при вызове {@link create}.
       * @name Types/_source/Remote#passing.create
       */
      create: passCreate,

      /**
       * @cfg {Function} Метод подготовки аргументов при вызове {@link read}.
       * @name Types/_source/Remote#passing.read
       */
      read: passRead,

      /**
       * @cfg {Function} Метод подготовки аргументов при вызове {@link update}.
       * @name Types/_source/Remote#passing.update
       */
      update: passUpdate,

      /**
       * @cfg {Function} Метод подготовки аргументов при вызове {@link destroy}.
       * @name Types/_source/Remote#passing.destroy
       */
      destroy: passDestroy,

      /**
       * @cfg {Function} Метод подготовки аргументов при вызове {@link query}.
       * @name Types/_source/Remote#passing.query
       */
      query: passQuery,

      /**
       * @cfg {Function} Метод подготовки аргументов при вызове {@link copy}.
       * @name Types/_source/Remote#passing.copy
       */
      copy: passCopy,

      /**
       * @cfg {Function} Метод подготовки аргументов при вызове {@link merge}.
       * @name Types/_source/Remote#passing.merge
       */
      merge: passMerge,

      /**
       * @cfg {Function} Метод подготовки аргументов при вызове {@link move}.
       * @name Types/_source/Remote#passing.move
       */
      move: passMove
   },
   _$options: OptionsMixin.addOptions(Base, {
      /**
       * @cfg {Boolean} При сохранении отправлять только измененные записи (если обновляется набор записей) или только
       * измененые поля записи (если обновляется одна запись).
       * @name Types/_source/Remote#options.updateOnlyChanged
       * @remark
       * Задавать опцию имеет смысл только если указано значение опции {@link idProperty}, позволяющая отличить новые
       * записи от уже существующих.
       */
      updateOnlyChanged: false,

      /**
       * @cfg {NavigationType} Тип навигации, используемой в методе {@link query}.
       * @name Types/_source/Remote#options.navigationType
       * @example
       * Получим заказы магазина за сегодня с двадцать первого по тридцатый c использованием навигации через смещение:
       * <pre>
       *    var dataSource = new RemoteSource({
       *          endpoint: 'Orders'
       *          options: {
       *             navigationType: RemoteSource.prototype.NAVIGATION_TYPE.OFFSET
       *          }
       *       }),
       *       query = new Query();
       *
       *    query.select([
       *          'id',
       *          'date',
       *          'amount'
       *       ])
       *       .where({
       *          'date': new Date()
       *       })
       *       .orderBy('id')
       *       .offset(20)
       *       .limit(10);
       *
       *    dataSource.query(query).addCallbacks(function(dataSet) {
       *       var orders = dataSet.getAll();
       *    }, function(error) {
       *       console.error(error);
       *    });
       * </pre>
       */
      navigationType: NAVIGATION_TYPE.PAGE
   })
});

// FIXME: backward compatibility for SbisFile/Source/BL
// @ts-ignore
Remote.prototype._prepareArgumentsForCall = Remote.prototype._prepareProviderArguments;
