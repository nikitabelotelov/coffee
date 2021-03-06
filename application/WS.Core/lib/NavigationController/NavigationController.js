/**
 * Created with JetBrains PhpStorm.
 * User: tm.baeva
 * Date: 23.04.13
 * Time: 14:12
 * To change this template use File | Settings | File Templates.
 */
define('Lib/NavigationController/NavigationController', [
   'Env/Env',
   'Env/Event',
   'Core/Deferred',
   'Core/core-clone',
   'Core/HashManager'
], function(Env,  EnvEvent, Deferred, cClone, HashManager) {

   'use strict';

   /**
    * @author Бегунов А.В.
    * @class Lib/NavigationController/NavigationController
    * @public
    * @singleton
    */
   var NavigationController  = /** @lends Lib/NavigationController/NavigationController.prototype */{
      _storageByStateKey: {},
      _waitingByStateKey: {},
      _luntik: null,
      _storage : [],
      _needToParseHash: false, //флаг, который при обновлении хэша указывает, что надо обязательно запустить применение состояний
      /**
       * конструктор
       */
      init : function(){
         var self = this;
         if (Env.constants.saveLastState) {
            this._loadLastState();
            if (!Env.constants.$win) {
               Env.constants.$win = $(window);
               Env.constants.$doc = $(document);
            }
            Env.constants.$win.on('unload', function(){
               if (!window.location.search){
                  self._saveLastState();
               }
            });
            if (Env.constants.browser.isMobileSafari){
               window.addEventListener('pagehide', function(){
                  self._saveLastState();
               });
            }
         }
         this._initLuntikHandler();
         this._parseHash();
         HashManager.subscribe('onChange', function(){
            var
               changed = true,
               hash = decodeURIComponent(HashManager.get('ws-nc')),
               buf,
               state;

            hash = hash ? hash.split(';') : [];
            if (hash.length == self._storage.length){
               changed = false;
               for (var i = hash.length - 1; i >= 0; i--){
                  buf = hash[i].split('=');
                  state = String(self._storage[i].state).replace(/;|=|%/g,function(str){
                     return {';': ':s:', '=': ':e:', '%': ':p:'}[str];
                  });
                  if (self._storage[i].stateKey != buf[0] || state != buf[1]) {
                     changed = true;
                     break;
                  }
               }
            }

            if (changed || self._needToParseHash){
               self._needToParseHash = false;
               self._parseHash();
            }
         });
      },
      _initLuntikHandler: function(){
         var
            self = this,
            luntik = EnvEvent.Bus.channel('luntik');//в этот канал падает событие onInit при готовности каждого контрола

         luntik.subscribe('onInit', function(e, inst){
            var stateKey = inst.getStateKey();

            if (stateKey){
               self._storageByStateKey[stateKey] = inst;
               if (self._waitingByStateKey[stateKey] && !self._waitingByStateKey[stateKey].isReady()){
                  try{
                     self._waitingByStateKey[stateKey].callback(inst);
                  }
                  finally{
                     delete self._waitingByStateKey[stateKey];
                  }
               }
               inst.subscribe('onDestroy', function(){
                  delete self._storageByStateKey[this.getStateKey()];
               });
            }
         });
      },
      _containsByStateKey: function(stateKey){
         return !!this._storageByStateKey[stateKey];
      },
      _getByStateKey: function(stateKey){
         return this._storageByStateKey[stateKey];
      },
      _waitByStateKey: function(stateKey){
         return this._waitingByStateKey[stateKey] = (this._waitingByStateKey[stateKey] || new Deferred());
      },
      _getHashWithoutMSID: function(){
         return decodeURI(window.location.hash).replace(/(&msid=s\d+)|(msid=s\d+&?)/g, '').replace(/^#*/g, '');
      },
      /**
       * Понимает текущее состояние, сохраняет его в localStorage
       * @private
       */
      _saveLastState: function(){
         var
            page = decodeURI(window.location.pathname),
            state = {},
            sid = Env.cookie.get('sid'),
            hash = this._getHashWithoutMSID(),
            stateInStorage = this._getLastState();

         if (stateInStorage && stateInStorage.hasOwnProperty(sid)) {
            stateInStorage[sid][page] = hash;
            state = stateInStorage;
         }
         else{
            state = {};
            state[sid] = {};
            state[sid][page] = hash;
         }
         this._setLastState(state);
      },
      /**
       * Восстанавливает последнее состояние для текущей страницы
       * @private
       */
      _loadLastState: function(){
         var
            page = decodeURI(window.location.pathname),
            hash = this._getHashWithoutMSID(),
            sid = Env.cookie.get('sid'),
            lastState = this._getLastState(),
            lastHash;

         if (!window.location.search &&
             !hash.length &&
             lastState &&
             lastState[sid] &&
             (lastHash = lastState[sid][page])
            ) {
            //если хэш пустой, то восстанавливаем последнее состояние
            HashManager.setHash([window.location.hash.replace(/^#/, ''), lastHash].join(window.location.hash.length ? '&' : ''), true);
         }
      },
      /**
       * Получение последнего состояния из localStorage
       * @returns {Object|undefined}
       * @private
       */
      _getLastState: function(){
         try{
            return JSON.parse(window.localStorage.getItem('lastState'));
         }
         catch (e) {
            return undefined;
         }
      },
      /**
       * Запись последнего состояния в localStorage
       * @param lastState
       * @private
       */
      _setLastState: function(lastState){
         try {
            window.localStorage.setItem('lastState', JSON.stringify(lastState));
         } catch(e){}
      },
      /**
       * Тоже самое что и updateState только не зависит от флага applied
       */
      updateStateForce: function(stateKey, state, replace){
         this.updateState(stateKey, state, replace, true);
      },
      _checkAndSaveState: function(stateKey) {
         for (var i in this._storage) {
            if (stateKey ? (this._storage[i].stateKey === stateKey) && !this._storage[i].saved : !this._storage[i].saved) {
               HashManager.pushState();
               return;
            }
         }
      },
      saveAllStates: function() {
         for (var j in this._storage) {
            if (this._storage.hasOwnProperty(j)) {
               this._storage[j].saved = true;
            }
         }
      },
      /**
       * Запоминает состояние контрола
       * @param {String} stateKey идентификатор для хранения состояния
       * @param {String|Number} state состояние контрола
       * @param {Boolean} replace не записывать состояние в историю браузера
       * @param {Boolean} force игнорировать флаг applied
       */
      updateState : function(stateKey, state, replace, force){
         // Не записываем стейт если у контрола нет имени
         if (stateKey) {
            for (var i = 0, l = this._storage.length; i < l; i++){
               if (this._storage[i].stateKey == stateKey){
                  if (!force && !this._storage[i].applied) {
                     return;
                  }
                  if (this._storage[i].state !== state && !replace) {
                     this._checkAndSaveState();
                  }
                  this._storage[i].state = state;
                  this._updateHash(!this._storage[i].saved ? replace : true, [], this._storage[i].saved);
                  this._storage[i].saved = false;
                  return;
               }
            }
            this._pushState(stateKey, state, true, false); // первое применение состояния не сохраняем
            this._updateHash(true, [], true); //первое применение состояния контрола не пишем в историю
         }
      },
      /**
       * Устанавливает состояние для контрола/контролов
       * @param {String | Object} stateKey - идентификатор для хранения состояния, которому нуобходимо установить состояние, или hashMap состояний,
       * где ключ - идентификатор для хранения состояния, значение - состоянияе контрола
       * @param {*} [state] - состояние контрола
       */
      setState: function(stateKey, state){
         var states = {};
         if (!stateKey){
            throw new Error('NavigationController.setState :: wrong control stateKey');
         }

         if (typeof stateKey == 'object'){
            states = stateKey;
         }
         else{
            states[stateKey] = state;
         }

         for (var s in states){
            if (states.hasOwnProperty(s)){
               if (states[s] === undefined && this._containsByStateKey(s)){
                  this.removeState(this._getByStateKey(s));
               }
               else{
                  var found = false;
                  for (var i = 0, l = this._storage.length; i < l; i++){
                     if (this._storage[i].stateKey == s){
                        found = true;
                        if (this._storage[i].state !== states[s]){
                           this._storage[i].state = states[s];
                           this._needToParseHash = true;
                        }
                     }
                  }
                  if (!found){
                     this._pushState(s, states[s]);
                     this._needToParseHash = true;
                  }
               }
            }
         }

         this._updateHash();
      },
      /**
       * Добавляет в хранилище имя контрола и его состояние
       * @param {String} stateKey идентификатор для хранения состояния контрола
       * @param {String} state состояние контрола
       * @param {Boolean} [applied] применено ли состояние к контролу
       * @param {Boolean} [saved] сохранено ли состояние контрола (по умолчанию true)
       * @private
       */
      _pushState : function(stateKey, state, applied, saved){
         if (saved === undefined) saved = true;
         this._storage.push({
            stateKey : stateKey,
            state : state,
            applied: applied,
            saved: saved
         });
      },
      /**
       * Обновляет location.hash
       * @param {Boolean} [replace] replace === true - первое применение состояния контрола не пишем в историю, иначе пишем
       * @param {Array} [skipKeys] — ключи, которые следует не добавлять в хэш
       * @private
       */
      _updateHash: function(replace, skipKeys, forceReplace){
         var hash = [];
         //skipKeys может быть пустым, например при вызове _updateHash() из setState(). Но при этом ключи в hash все равно нужно добавлять.
         //Поэтому, если аргумент skipKeys не передан, то положим туда пустой массив
         if (!skipKeys) {
            skipKeys = [];
         }
         for (var i = 0, l = this._storage.length; i < l; i++){
            if (skipKeys.indexOf(this._storage[i].stateKey) === -1) {
               hash.push(
                  [
                     this._storage[i].stateKey,
                     ('' + this._storage[i].state).replace(/;|=|%/g,function(str){
                        return {';': ':s:', '=': ':e:', '%': ':p:'}[str];
                     })
                  ].join('='));
            }
         }
         HashManager.set('ws-nc', hash.join(';'), replace, forceReplace);  //первое применение состояния контрола не пишем в историю
      },
      /**
       * Удаляет ключи keys из location.hash
       * @param {Array} [keys] — ключи, которые следует удалить
       * @private
       */
      _removeFromHash: function(keys, forceReplace) {
         var hash = decodeURIComponent(HashManager.get('ws-nc')),
             hashStateKeys = [];

         hash = hash ? hash.split(';') : [];

         hash.forEach(function(value){
            hashStateKeys.push(value.split('=')[0]);
         });

         for (var l = keys.length - 1; l >= 0; l--){
            if(hashStateKeys.indexOf(keys[l]) === -1) {
               keys.splice(l, 1);
            }
         }

         if (keys.length) {
            this._updateHash(true, keys, forceReplace);
         }
      },

      /**
       * Парсит хэш
       * @private
       */
      _parseHash : function(){
         var
            hash = decodeURIComponent(HashManager.get('ws-nc')),
            buf,
            storage = cClone(this._storage),
            saved;

         // Чистить надо раньше
         this._storage = [];

         if (hash == 'undefined') {
            this._checkChangeState([], storage);
            return;
         }

         hash = hash ? hash.split(';') : [];
         this._checkChangeState(hash, storage);
         for (var i = 0, l = hash.length; i < l; i++){
            if(!!hash[i]){
               saved = false;
               buf = hash[i].split('=');
               for (var s in storage) {
                  if (storage[s].stateKey === buf[0]) {
                     saved = true;
                     break;
                  }
               }
               this._pushState(buf[0], buf[1].replace(/:(s|e|p):/g,function(str, e){
                  return {'s':';','e':'=','p':'%'}[e];
               }), false, saved);
            }
         }
         this._buildChain();
      },
      /**
       * Сверяет состояния контролов из hash с их состояниями в _storage. Если из hash пропало состояние, то у его контрола
       * вызовем метод applyEmptyState, если он есть
       * @param hash
       * @param storage
       */
      _checkChangeState: function(hash, storage){
         var
               self = this,
               hashStateKeys = [];

         if (!hash.length) {
            this._storage = [];
         }

         hash.forEach(function(value){
            hashStateKeys.push(value.split('=')[0]);
         });
         storage.forEach(function(value){
            if(hashStateKeys.indexOf(value.stateKey) === -1){
               self._checkAndApplyEmptyState(value.stateKey);
            }
         });
      },
      _checkAndApplyEmptyState: function(stateKeyOrInst){
         var inst = stateKeyOrInst;
         if(typeof stateKeyOrInst === 'string'){
            if(this._containsByStateKey(stateKeyOrInst)){
               inst = this._getByStateKey(stateKeyOrInst);
            }
         }
         if(typeof inst.applyEmptyState === 'function'){
            inst.applyEmptyState();
         }
      },
      /**
       * Возвращает запомненное состояние контрола по имени
       * @param stateKey
       * @return {*}
       */
      getStateByKey: function(stateKey){
         for (var i = 0, l = this._storage.length; i < l; i++){
            if (this._storage[i].stateKey == stateKey) {
               return this._storage[i];
            }
         }
      },
      /**
       * Составляем цепочку контролов и применяемых к ним состояний
       * @private
       */
      _buildChain : function(){
         var
            self = this,
            storageItem,
            arrayForLoop = this._storage.concat();

         function waitChildCb(inst){
            inst.once('onStateChanged', function applyState(){
               var state = self.getStateByKey(inst.getStateKey());
               if (state){
                  state.applied = true;
                  inst.applyState(state.state);
               }
            });
            return inst;
         }

         for (var i = 0, l = arrayForLoop.length; i < l; i++){
            storageItem = arrayForLoop[i];

            if (!storageItem.stateKey) {
               continue;
            }

            if (this._containsByStateKey(storageItem.stateKey)){
               var c = this._getByStateKey(storageItem.stateKey);
               storageItem.applied = true;
               c.applyState(storageItem.state);
            }
            else{
               this._waitByStateKey(storageItem.stateKey).addCallback(waitChildCb);
            }
         }
      },
      /**
       * Удаляем состояние контрола из внутреннего хранилища состояний
       * @param inst
       * @param {Boolean} [applyEmptyState = true] Установит "пустое" состояние контролу
       */
      removeState : function(inst, applyEmptyState){
         var stateKey = inst.getStateKey(),
             tempStateKey;

         if (stateKey) {
            for (var l = this._storage.length - 1; l >= 0; l--){
               var stateFromStorage = this._storage[l];
               if(stateFromStorage.stateKey === stateKey){
                  tempStateKey = stateFromStorage.stateKey;
                  this._checkAndSaveState(stateKey);
                  var forceReplace = stateFromStorage.saved;
                  this._storage.splice(l, 1);
                  this._removeFromHash([tempStateKey], forceReplace);
                  if (applyEmptyState || applyEmptyState === undefined) {
                     this._checkAndApplyEmptyState(inst);
                  }
                  break;
               }
            }
         }
      }
   };

   return NavigationController;

});
