define('Core/RightsManager', [
   'require',
   'Env/Env',
   'Core/helpers/Object/isEmpty',
   'Core/helpers/Object/find',
   'Core/Deferred',
   'Core/core-instance'
], function(
   require,
   Env,
   isEmptyObject,
   objectFind,
   Deferred,
   coreIns
) {
   /**
    * Менеджер работы с правами.
    * Класс предназначен для синхронной проверки прав на зону доступа.
    * Варианты результата проверки:
    * <ul>
    *    <li>нет прав;</li>
    *    <li>права на просмотр;</li>
    *    <li>права на просмотр и запись.</li>
    * </ul>
    * Права в шаблоне задаются при помощи атрибута <b>data-access="ЗонаДоступа"</b> или <b>data-access="ЗонаДоступа|Ограничение"</b> в теге компонента.
    * При построении будет проверен доступ пользователя к указанной зоне доступа (с учетом ограничения, если оно задано), и в зависимости от
    * его уровня доступа компонент может быть либо заблокирован от изменений (disabled), если пользователь имеет доступ только на чтение,
    * либо совсем скрыт, если пользователь не имеет доступа к указанной зоне (либо чтение запрещено ограничением).
    * @public
    * @class Core/RightsManager
    * @author Бегунов А.В.
    * @singleton
    */

   var RightsManager = /** @lends Core/RightsManager.prototype */{
      ALLOW_MASK: 1,
      READ_MASK: 1 << 1,
      WRITE_MASK: 1 << 2,
      ADMIN_MASK: 1 << 3,

      /**
       * Проверяет: нужна ли проверка прав на текущем сервисе.
       * @return {Boolean}
       */
      rightsNeeded: function() {
         if (typeof process !== 'undefined') {
            var serviceConfig;
            try {
               serviceConfig = process.application.getCurrentService();
            } catch (e) {
               // ignore
            }

            return serviceConfig && serviceConfig.rightsNeeded();
         } else if (window) {
            return (window.rights && !isEmptyObject(window.rights)) || Env.constants.rights || false;
         }
      },

      /**
       * Возвращает права доступа.
       * @remark
       * Также обратите внимание на метод {@link checkAccessRights}.
       * @param {String|Number|Array.<String|Number>} [zones] Идентификаторы зон доступа.
       * @param {Object} [userRights] Пользовательский объект с правами. Если не передан, или передан <b>null</b>, будет использоваться список прав, соответствующий роли пользователя.
       * @param {Boolean} [returnObjects] Флаг, показывающий, что для каждой зоны нужно возвращать объект с правами и примененными ограничениями.
       * @return {Object} Объект, ключами которого являются переданные идентификаторы зон доступа. Возвращаемое для каждой зоны доступа значение зависит от значения параметра <b>returnObjects</b>.
       * Если <b>returnObject</b> не передан, или установлен <b>false</b>, то для каждой зоны будет возвращено числовое значение доступа. Для получения уровня доступа нужно выполнить логическое "И" с нужной для вас маской.
       * Пример масок:
       * <ul>
       *     <li>RightsManager.ADMIN_MASK - уровень доступа администрирование (dec - 8; bin - 00001000);</li>
       *     <li>RightsManager.WRITE_MASK - уровень доступа изменение/запись (dec - 4; bin - 00000100);</li>
       *     <li>RightsManager.READ_MASK - уровень доступа чтение/просмотр (dec - 2; bin - 00000010);</li>
       *     <li>RightsManager.ALLOW_MASK - для получения значения allow; показывает, что ниже по иерархии от этой зоны есть разрешенная (dec - 1; bin - 00000001);</li>
       *     <li>Для уровня доступа "запрещено" маски нет, т.к. возвращаемое значение равно нулю.</li>
       * </ul>
       * Если <b>returnObject</b> установлен <b>true</b>, то для каждой зоны доступа будет возвращен объект с числовым значением доступа и примененными к зоне ограничениями.
       * Пример использования:
       * <pre>
       * // запрашиваем объект прав на зону Example
       * var right = RightsManager.getRights(['Example'], null, true);
       * console.log(right);
       *
       * // ... в консоли ...
       * {
       *    'Example': {
       *       flags: 7,           // числовое значение доступа
       *       restrictions: {
       *          readOnlyRestriction: 2,
       *          writeRestriction: 4,
       *          writeRestriction2: 6
       *       }
       *    }
       * }
       * </pre>
       * @example
       * Так использовали раньше:
       * <pre>
       * // проверяем: разрешена ли зона доступа "Роли" на запись
       * if (RightsManager.checkRights(['Роли'])['Роли'].access == 2) ...
       * // В консоли можем увидеть предупреждение .. checkRights Метод будет удален в 3.18 ..
       * </pre>
       * Как нужно использовать сейчас:
       * <pre>
       * if (RightsManager.getRights(['Роли'])['Роли'] & RightsManager.WRITE_MASK) ...
       * // Если значение больше нуля, уровень доступа "Запись" для зоны "Роли" есть.
       * </pre>
       * Для получения объекта с правами и ограничениями, использовать так:
       * <pre>
       * // Запрашиваем права на зону Роли
       * var right = RightsManager.getRights(['Роли'], null, true)['Роли'];
       * // Проверяем: разрешена ли зона доступа "Роли" на запись
       * if (right.flags & RightsManager.WRITE_MASK) {
       *    // ... проверяем ограничение roleList
       *    if (right.restrictions['roleList'] & RightsManager.WRITE_MASK) {
       *       //... разрешены и чтение и запись
       *    } else if (right.restrictions['roleList'] & RightsManager.READ_MASK) {
       *       //... разрешено только чтение
       *    } else {
       *       //... если roleList отсутствует в списке ограничений, значит запрещено все
       *    }
       * }
       * </pre>
       * @see checkAccessRights
       */
      getRights: function(zones, userRights, returnObjects) {
         var rights, result = {};

         if (userRights) {
            rights = userRights;
         } else if (this.rightsNeeded()) {
            if (process && process.domain && process.domain.req && process.domain.req.rights && !isEmptyObject(process.domain.req.rights)) {
                // Если мы на препроцессоре и в req есть права
               rights = process.domain.req.rights;
            } else if (window && window.rights && !isEmptyObject(window.rights)) {
               // Если мы на клиенте и в window есть права
               rights = window.rights;
            } else if (process || Env.constants.rights) {
               // Если у нас нет прав и мы на препроцессоре, или на клиенте с активированным _const.rights
               rights = this.readUserRights();
            }
         }

         rights = rights || {};

         if (zones && !(rights instanceof Deferred)) {
            var checkRights = !isEmptyObject(rights);
            if (!(zones instanceof Array)) {
               zones = [zones];
            }

            for (var i in zones) {
               if (zones.hasOwnProperty(i)) {
                  var zone = zones[i];
                  if (checkRights) {
                     result[zone] = returnObjects ?
                        rights[zone] || { flags: 0, restrictions: {} } :
                        rights[zone] && rights[zone].flags || rights[zone] || 0;
                  } else {
                     // Если нет прав на сервисе, по умолчанию все разрешено.
                     var fullAcces = this.ALLOW_MASK | this.WRITE_MASK | this.READ_MASK | this.ADMIN_MASK;
                     result[zone] = returnObjects ?
                        rights[zone] || { flags: fullAcces, restrictions: {} } : fullAcces;
                  }
               }
            }
         } else if (!returnObjects && !(rights instanceof Deferred)) {
            // если не просят возвращать объекты, возвращаем только flags для совместимости
            // если получили Deferred, не трогаем, так как прав еще нет
            for (var key in rights) {
               if (rights.hasOwnProperty(key)) {
                  var right = rights[key];
                  if (typeof right === 'object') {
                     result[key] = right.flags;
                  } else {
                     result[key] = right;
                  }
               }
            }
         } else {
            result = rights;
         }

         return result;
      },
      // TODO: переделать на асинхронный, может даже переназвать. Вообще есть ли целесообразность этого метода? Может лучше checkAccessRights
      /**
       * Проверяет права на зоны доступа.
       * @deprecated Используйте метод {@link getRights}.
       * @remark
       * @param {String|Array} zones Массив идентификаторов зон доступа.
       * @param {Array.<String|Array>} zones Массив идентификаторов зон доступа.
       * Возможные значения поля access:
       * <ul>
       *    <li>{Number} <b>access</b> соответствует методу "ПроверкаПрав.НаличиеДействия";
       *        <ul>
       *            <li>0 - действие запрещено;</li>
       *            <li>1 - разрешён просмотр;</li>
       *            <li>2 - разрешены просмотр и запись.</li>
       *        </ul>
       *    </li>
       *    <li>{Boolean} <b>allow</b> соответствует методу "ПроверкаПрав.ПраваНаЗонуДоступа".</li>
       * </ul>
       * @example
       * Такой вызов:
       * <pre>
       *    RightsManager.checkRights(['zone0', 'zone1', 'zone2']);
       * </pre>
       * Вернёт:
       * <pre>
       * {
       *    zone0: {
       *       access: 0,
       *       allow: true
       *    },
       *    zone1: {
       *       access: 1,
       *       allow: false
       *    },
       *    zone2: {
       *       access: 2,
       *       allow: true
       *    }
       * }
       * </pre>
       * @see getRights
       */
      checkRights: function(zones) {
         if (Env.constants.isBrowserPlatform) {
            Env.IoC.resolve('ILogger').info('$ws.single.RightsManager.checkRights',
               'Метод будет удален в 3.18. ' +
               'Для получения объекта с правами используйте .getRights([zones]). ' +
               'Для плучения значения allow вызовите getRights([zones]) и используйте логическое И для полей объекта с RightsManager.ALLOW_MASK');
         }

         var r = this.getRights(null, null, true);
         var checkRights = r && !isEmptyObject(r);
         var result = {};

         if (!(zones instanceof Array)) {
            zones = [zones];
         }

         for (var i in zones) {
            if (zones.hasOwnProperty(i)) {
               var zone = zones[i];
               if (checkRights) {
                  var zoneWithoutRestriction = this._parseZoneName(zone).zone;

                  result[zone] = {};
                  result[zone].access = r && this.checkAccessRights([zone]) || 0;
                  // allow вычисляем по правам на зону доступа, ограничения на него не влияют
                  result[zone].allow = r[zoneWithoutRestriction] && r[zoneWithoutRestriction].flags > 0 || false;
               } else {
                  result[zone] = { allow: true, access: 2 };
               }
            }
         }

         return result;
      },

      /**
       * Проверить права доступа.
       * @remark
       * Если для пользователя не назначена зона которая есть у контрола, то ее не учитываем.
       * Если не назначена ни одна из зон доступа контрола, доступ открыт.
       * Иногда требуется понять: зона или массив зон больше или меньше определенного уровня доступа.
       * @param {String|Number|Array.<String|Number>} access Зона/зоны доступа для проверки.
       * Для каждой зоны может быть указано ограничение через вертикальную черту - Example|someRestriction, тогда уровень доступа будет вычислен с учетом ограничения.
       * @param {Object} [rights] Список прав пользователя. Если не передан, будет использоваться список прав, соответствующий роли пользователя.
       * @returns {Number}
       * Метод вернет значения: 0 - запрет, 1 - просмотр, 2 - запись. Уровень доступа "Администрирование" данный метод не покрывает, вернёт значение 2 - запись.
       * @example
       * <pre>
       * var accessValue = RightsManager.checkAccessRights(['Роли', 'Сотрудники', 'Поставщики|Prices']);
       * if (accessValue === 2) {
       *    // хотя бы одна из зон обладает уровнем доступа "Запись"
       *    ...
       * } else if (accessValue === 1) {
       *    // хотя бы одна из зон обладает уровнем доступа "Чтение"
       *    ...
       * } else {
       *    // доступ запрещен
       *    ...
       * }
       * </pre>
       * @see getRights
       */
      checkAccessRights: function(access, rights) {
         var
            currentAccess = 2,
            maxAccess = 0;

         if (rights === undefined) {
            rights = this.getRights(null, null, true);
         }

         if (this.rightsNeeded() && Object.keys(rights).length) {
            currentAccess = 0;

            for (var i = 0, l = access.length; i < l; i++) {
               var
                  elem = access[i],
                  accessZone,
                  accessRestriction,
                  currentZone;

               elem = typeof(elem) === 'string' ? elem.trim() : elem;
               elem = this._parseZoneName(elem);
               accessZone = elem.zone;
               accessRestriction = elem.restriction;
               currentZone = rights[accessZone];

               if (currentZone) {
                  var
                     rightsObj, accessFlags,
                     restrictionFlags = this.READ_MASK | this.WRITE_MASK; // если ограничений нет, будем считать что они разрешены

                  /**
                   *  Если на проверку приходит сложная конструкция вида "zone|myOrg"
                   *  то указанное огранчиение (myOrg) по зоне, мы должны попытаться проверить влюбом случае, даже если у зоны нет ограничений впринципе.
                   *  если ограничения нет - считаем, что оно запрещено
                   *  если нет даже поля restriction - считаем, что все ограничения на зоне запрещены
                   *
                   *  приходится писать currentZone.flags || currentZone; т.к. в местах сериализации PS  и в слое совместимости реализована логика:
                   *  если нет ограничений на зоне, значит вернем только значение flags, а не весь обьект. (скрины в задаче)
                   *  https://online.sbis.ru/opendoc.html?guid=76859dfc-7a8c-472d-9b15-b77e8be35359
                   *  Формат зоны досутпа один объект с полями flags и restriction, restriction может отсутствовать.
                   *  Старый формат "зона: значение" больше не используется, поддерживать не нужно.
                   */
                  accessFlags = currentZone.flags || currentZone;
                  if (accessRestriction) {
                     if (currentZone.restrictions) {
                        restrictionFlags = currentZone.restrictions[accessRestriction];
                     } else {
                        restrictionFlags = 0;
                     }
                  }

                  rightsObj = this._applyMasks(accessFlags, restrictionFlags);
                  if (maxAccess < rightsObj.access) {
                     maxAccess = rightsObj.access;
                  }
               }
            }
         }

         return currentAccess || maxAccess;
      },

      /**
       * Рекурсивно ищет в Node атрибуты data-access
       * @param node
       * @return {Boolean}
       */
      hasDataAccess: function(node) {
         if ('data-access' in node.attributes) {
            return true;
         }

         var self = this;

         return !!objectFind(node.childNodes, function(child) {
            if (child.nodeName === 'options' || child.nodeName === 'opts') {
               return self.hasDataAccess(child);
            } else {
               return false;
            }
         });
      },

      /**
       * Проверяет каждую колонку во вью на наличие у пользователя прав на нее.
       * @param {Array} columnsOpts Массив Node - опций колонок
       * @returns {Array} Массив Node - разрешенных на чтение колонок
       * @private
       */
      _getAccessibleColumns: function(columnsOpts) {
         var
            self = this,
            res = [];

         // проходим по всем колонкам и оставляем только те, у которых нет data-access
         // или на них есть доступ хотя бы на чтение
         for (var key in columnsOpts) {
            if (columnsOpts.hasOwnProperty(key)) {
               var
                  column = columnsOpts[key],
                  access = column.getAttribute('data-access');
               if (!access || self.checkAccessRights(access.split(',')) > 0) {
                  res.push(column);
               }
            }
         }

         return res;
      },

      /**
       * Проверяет права на колонки в DataGridView, удаляет запрещенные на чтение.
       * @param node
       * @returns {boolean}
       * @private
       */
      _checkRightsForColumns: function(node) {
         var
            self = this,
            componentName = node.getAttribute('data-component'),
            component, componentPrototype;


         if (!componentName) {
            // если не компонент, то не проверяем
            return false;
         }

         component = require(componentName);
         componentPrototype = component.prototype;
         if (componentName !== 'SBIS3.CONTROLS/DataGridView' &&
            !coreIns.instanceOfModule(componentPrototype, 'SBIS3.CONTROLS/DataGridView')) {
            // если компонент, но не DataGridView и не его наследник, то не проверяем
            return false;
         }

         for (var key in node.childNodes) {
            if (node.childNodes.hasOwnProperty(key)) {
               // ищем опции колонок: <options name="columns" type="array">
               var child = node.childNodes[key];
               if ((child.nodeName === 'options' || child.nodeName === 'opts') && child.getAttribute('name') === 'columns') {
                  // заменяем колонки, оставляя только доступные
                  child.childNodes = self._getAccessibleColumns(child.childNodes);
               }
            }
         }
         return true;
      },

      /**
       * Проверяет права для табов, убирает табы
       * @param node
       */
      _checkRightsForTabs: function(node) {
         var
            componentName = node.getAttribute('data-component'),
            component, componentPrototype,
            optionName = '';

         if (!componentName) {
            return false;
         }

         component = require(componentName);
         componentPrototype = component.prototype;

         function check(mixin) {
            return coreIns.instanceOfMixin(componentPrototype, mixin);
         }
         if (check('Lib/Mixins/HasItemsMixin')) {
            optionName = 'items';
         } else if (check('SBIS3.CONTROLS/Mixins/ItemsControlMixin')) {
            optionName = 'items';
         } else if (check('SBIS3.CONTROLS/Mixins/DSMixin')) {
            optionName = 'items';
         } else if (check('Lib/Mixins/HasTabsMixin')) {
            optionName = 'tabs';
         }

         var self = this,
            attrName,
            attrType;

         if (optionName) {
            for (var key in node.childNodes) {
               if (node.childNodes.hasOwnProperty(key)) {
                  var
                     child = node.childNodes[key];
                  if (child.nodeName === 'options' || child.nodeName === 'opts') {
                     attrName = child.getAttribute('name');
                     attrType = child.getAttribute('type');
                     if (attrName === optionName && attrType && attrType.toLowerCase() === 'array') {
                        var newTabs = [];
                        for (var childIndex in child.childNodes) {
                           if (child.childNodes.hasOwnProperty(childIndex)) {
                              var
                                 tab = child.childNodes[childIndex],
                                 attr = tab.getAttribute('data-access');
                              if (attr) {
                                 if (self.checkAccessRights(attr.split(',')) !== 0) {
                                    newTabs.push(tab);
                                 }
                              } else {
                                 newTabs.push(tab);
                              }
                           }
                        }
                        child.childNodes = newTabs;
                     }
                  }
               }
            }
            return true;
         }
         return false;
      },

      _operationsName: {
         markOperations: 1,
         massOperations: 1,
         selectedOperations: 1
      },

      /**
       * Проверяет права панели операций
       * @param node
       */
      _checkRightsForOperationsPanel: function(node) {
         var self = this;

         function operationFilter(option) {
            var newOperations = [];
            for (var key in option.childNodes) {
               if (option.childNodes.hasOwnProperty(key)) {
                  var
                     operation = option.childNodes[key];
                  if (operation.getAttribute('name') === 'userOperations') {
                     operationFilter(operation);
                     newOperations.push(operation);
                  } else {
                     var attr = operation.getAttribute('data-access');
                     if (attr) {
                        if (self.checkAccessRights(attr.split(',')) === 2) {
                           newOperations.push(operation);
                        }
                     } else {
                        newOperations.push(operation);
                     }
                  }
               }
            }
            option.childNodes = newOperations;
         }

         var componentName = node.getAttribute('data-component');
         if (componentName === 'Deprecated/Controls/OperationsPanel/OperationsPanel') {
            for (var key in node.childNodes) {
               if (node.childNodes.hasOwnProperty(key)) {
                  var
                     child = node.childNodes[key];
                  if (child.nodeName === 'options' || child.nodeName === 'opts') {
                     if (child.getAttribute('name') in self._operationsName) {
                        operationFilter(child);
                     }
                  }
               }
            }
            return true;
         }

         return false;
      },

      /**
       * Ищет опцию display
       * @param node
       * @return {Object}
       * @private
       */
      _findDisplayNode: function(node) {
         return objectFind(node.childNodes, function(elem) {
            return (elem.nodeType == 1 && (elem.nodeName === 'options' || elem.nodeName === 'opts') && elem.getAttribute('name') === 'display');
         });
      },

      /**
       * Надо найти опцию readOnly и заменить ей значение
       * Должна лежать в опциях контрола на верхнем уровне.
       * Но для табличных представлений лежит в <options name = "display">
       * Ну а если нет опции, надо вставить.
       * Пока не реализовано, да и надо ли: если есть <options name = "display">, то вставляем туда
       * @param node
       * @param nodeName
       * @param value
       * @param parserUtilities
       * @private
       */
      _changeOption: function(node, nodeName, value, parserUtilities) {
         var childNode = objectFind(node.childNodes, function(elem) {
            return (elem.nodeType == 1 && (elem.nodeName === 'option' || elem.nodeName === 'opt') && elem.getAttribute('name') === nodeName);
         });

         if (childNode) {
            childNode.childNodes = [];
            childNode.setAttribute('value', value);
         } else {
            // TODO: как обойтись без этого?
            node.childNodes = parserUtilities.parse('<option name="' + nodeName + '" value="' + value + '"></option>').childNodes.concat(node.childNodes);
         }
      },

      /**
       * Применяет права к XHTML документу
       * @param node - текущий узел
       * @param parserUtilities
       * @returns {String}
       */
      applyRights: function(node, parserUtilities) {
         var attr = node.getAttribute('data-access');

         if (!attr) {
            // Если у нас компонент не табы, то возможно панель операций
            if (!this._checkRightsForTabs(node)) {
               this._checkRightsForOperationsPanel(node);
            }
            this._checkRightsForColumns(node);
            return node;
         }

         if (attr) {
            switch (this.checkAccessRights(attr.split(','))) {
               case 0:
                  return null;
               case 1:
                  // Меняем права если "только для чтения", иначе отдадим как есть
                  var displayNode = this._findDisplayNode(node);
                  if (displayNode) {
                     this._changeOption(displayNode, 'readOnly', true, parserUtilities);
                     this._changeOption(node, 'enabled', true, parserUtilities);
                     this._changeOption(node, 'allowChangeEnable', false, parserUtilities);
                  } else {
                     this._changeOption(node, 'enabled', false, parserUtilities);
                     this._changeOption(node, 'allowChangeEnable', false, parserUtilities);
                  }
               // return; // убран намерено
               //noinspection FallthroughInSwitchStatementJS
               case 2:
                  this._checkRightsForTabs(node);
                  this._checkRightsForColumns(node);
                  return node;
            }
         }

         return node;
      },

      /**
       * Фукнция получения прав с БЛ
       * @param {Types/source} [source] Источник данных
       * @return {Core/Deferred}
       */
      readUserRights: function(source) {
         var def = new Deferred();
         def.addErrback(function (e) {
            return e;
         });
         require(['Types/source'], function (sourceLib) {
            source = source || new sourceLib.SbisService({
                  endpoint: 'CheckRights'
               });
            source.call('AccessAreasJSON', {})
               .addCallback(function(response) {
                  def.callback(response.getRawData());
               })
               .addErrback(function(e) {
                  Env.IoC.resolve('ILogger').error('User rights', 'Transport error', e);
                  def.errback(e);
               });
         }, function(){
            if (!source) {
               throw new Error('Для проверки прав необходим модуль Types/source');
            }
         });
         return def;
      },

      /**
       * По флагам и ограничениям на чтение и запись отдает старый объект с правами доступа
       * @param flags Флаги зоны доступа
       * @param {Number|undefined} restrictionFlags Флаги ограничений. Если undefined, считается, что ограничение запрещает все
       * @return {Object}
       * @private
       */
      _applyMasks: function (flags, restrictionFlags) {
         //TODO в 3.7.4 будет удален checkRights и этот метод будет возвращать только access вместо объекта

         if (typeof flags === 'object') {
            flags = flags.flags;
         }

         if (!restrictionFlags) {
            restrictionFlags = 0;
         }

         var
            allow = this._checkMask(flags, this.ALLOW_MASK),
            read = (this._checkMask(flags, this.READ_MASK) && this._checkMask(restrictionFlags, this.READ_MASK)) ? 1 : 0,
            write = (this._checkMask(flags, this.WRITE_MASK) && this._checkMask(restrictionFlags, this.WRITE_MASK)) ? 2 : 0,
            admin = this._checkMask(flags, this.ADMIN_MASK) ? Math.max(read, write) : 0; // для admin доступа также может быть ограничено чтение/запись

         return {
            access: Math.max(read, write, admin),
            allow: allow,
            flags: flags
         };
      },

      /**
       * Проверяет переданные флаги по переданной маске.
       * @param flags Флаги
       * @param mask Проверочная маска
       * @returns {Boolean}
       * @private
       */
      _checkMask: function(flags, mask) {
         return (flags & mask) === mask;
      },

      /**
       * Делит переданную строку на название зоны доступа и название ограничения.
       * @param {String} zoneName Строка с названием зоны и ограничения
       * @returns {{zone: String название зоны, restriction: String название ограничения}}
       * @example Примеры задания зон доступа с ограничениями:
       * <ul>
       *    <li>ТолькоЗона</li>
       *    <li>Зона|Ограничение</li>
       * </ul>
       * @private
       */
      _parseZoneName: function(zoneName) {
         var
            /*parseRegex = /(?:(?:^\[(['"])(.+?)\1\])|(?:^(.+?)(?=\.|\[|$)))(?:(?:\[(['"])(.+?)\4\]$)|(?:\.(.+)$))?/i,
            res = zoneName.match(parseRegex)*/
            // пока используем вертикальную черту в качестве разделителя
            res = zoneName.split('|');

         return {
            zone: res[0],
            restriction: res[1]
         };
      }
   };

   return RightsManager;
});
