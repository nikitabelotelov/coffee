/// <amd-module name="Types/_source/BindingMixin" />
/**
 * Миксин, позволяющий задавать привязку CRUD к контракту источника.
 * @mixin Types/_source/BindingMixin
 * @public
 * @author Мальцев А.А.
 */
define('Types/_source/BindingMixin', [
    'require',
    'exports',
    'tslib'
], function (require, exports, tslib_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var BindingMixin = /** @lends Types/_source/BindingMixin.prototype */
    {
        '[Types/_source/BindingMixin]': true,
        /**
         * @cfg {Object} Соответствие методов CRUD контракту. Определяет, как именно источник реализует каждый метод CRUD.
         * @name Types/_source/BindingMixin#binding
         * @see getBinding
         * @see create
         * @see read
         * @see destroy
         * @see query
         * @see copy
         * @see merge
         * @example
         * Подключаем пользователей через HTTP API, для каждого метода CRUD укажем путь в URL:
         * <pre>
         *    var dataSource = new HttpSource({
         *       endpoint: {
         *          address: '//some.server/',
         *          contract: 'users/'
         *       },
         *       binding: {
         *          create: 'add/',//dataSource.create() calls //some.server/users/add/ via HTTP
         *          read: 'load/',//dataSource.read() calls //some.server/users/load/ via HTTP
         *          update: 'save/',//dataSource.update() calls //some.server/users/save/ via HTTP
         *          destroy: 'delete/',//dataSource.destroy() calls //some.server/users/delete/ via HTTP
         *          query: 'list/'//dataSource.query() calls //some.server/users/list/ via HTTP
         *       }
         *    });
         * </pre>
         * Подключаем пользователей через RPC, для каждого метода CRUD укажем суффикс в имени удаленного метода:
         * <pre>
         *    var dataSource = new RpcSource({
         *       endpoint: {
         *          address: '//some.server/rpc-gate/',
         *          contract: 'Users'
         *       },
         *       binding: {
         *          create: 'Add',//dataSource.create() calls UsersAdd() via RPC
         *          read: 'Load',//dataSource.read() calls UsersLoad() via RPC
         *          update: 'Save',//dataSource.update() calls UsersSave() via RPC
         *          destroy: 'Delete',//dataSource.destroy() calls UsersDelete() via RPC
         *          query: 'List'//dataSource.query() calls UsersList() via RPC
         *       }
         *    });
         * </pre>
         */
        _$binding: {
            /**
             * @cfg {String} Операция создания записи через метод {@link create}.
             * @name Types/_source/BindingMixin#binding.create
             */
            create: 'create',
            /**
             * @cfg {String} Операция чтения записи через метод {@link read}.
             * @name Types/_source/BindingMixin#binding.read
             */
            read: 'read',
            /**
             * @cfg {String} Операция обновления записи через метод {@link update}.
             * @name Types/_source/BindingMixin#binding.update
             */
            update: 'update',
            /**
             * @cfg {String} Операция удаления записи через метод {@link destroy}.
             * @name Types/_source/BindingMixin#binding.destroy
             */
            destroy: 'delete',
            /**
             * @cfg {String} Операция получения списка записей через метод {@link query}.
             * @name Types/_source/BindingMixin#binding.query
             */
            query: 'query',
            /**
             * @cfg {String} Операция копирования записей через метод {@link copy}.
             * @name Types/_source/BindingMixin#binding.copy
             */
            copy: 'copy',
            /**
             * @cfg {String} Операция объединения записей через метод {@link merge}.
             * @name Types/_source/BindingMixin#binding.merge
             */
            merge: 'merge',
            /**
             * @cfg {String} Операция перемещения записи через метод {@link move}.
             * @name Types/_source/BindingMixin#binding.move
             */
            move: 'move'
        },
        constructor: function (options) {
            if (options && options.binding instanceof Object) {
                options.binding = tslib_1.__assign({}, this._$binding, options.binding);
            }
        },
        /**
         * Возвращает соответствие методов CRUD контракту источника.
         * @return {Object}
         * @example
         * Получим имя метода, отвечающего за чтение списка сотрудников:
         * <pre>
         *     var dataSource = new SbisService({
         *        endpoint: 'Employee',
         *        binding: {
         *          query: 'MyCustomList'
         *        }
         *     });
         *     console.log(dataSource.getBinding().query);//'MyCustomList'
         * </pre>
         * Выполним вызов, который вернет данные статьи:
         * <pre>
         *    var articlesSource = new RestSource({
         *       binding: {
         *          create: '/api/article/add/',
         *          read: '/api/article/read/',
         *          update: '/api/article/save/',
         *          destroy: '/api/article/remove/'
         *       },
         *       idProperty: 'id'
         *    });
         *    console.log('Calling read() method via ' + dataSource.getBinding().read);
         *    //'Calling read() method via /api/article/read/'
         *    articlesSource.read(13);
         *   //Cause HTTP request to /api/article/read/?id=13
         * </pre>
         */
        getBinding: function () {
            return tslib_1.__assign({}, this._$binding);
        },
        setBinding: function (binding) {
            this._$binding = binding;
        }
    };
    exports.default = BindingMixin;
});