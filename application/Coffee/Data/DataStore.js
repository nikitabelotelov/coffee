define('Coffee/Data/DataStore', [
    'require',
    'exports'
], function (require, exports) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var SettingsStruct = {
        G1: {
            val1: 'val1',
            val2: 'val2'
        },
        G2: {
            val3: 'val3',
            val4: 'val4'
        },
        G3: { val5: 'val5' }
    };
    exports.SettingsStruct = SettingsStruct;
    var DataStore = {
        socket: null,
        messageHandlers: new Array(),
        _parseDataStructure: function (rawData, dataStruct) {
            var result = {};
            for (var groupName in dataStruct) {
                result[groupName] = {};
                for (var fieldName in dataStruct[groupName]) {
                    result[groupName][fieldName] = rawData[fieldName];
                }
            }
            return result;
        },
        initDataStore: function () {
            var _this = this;
            return new Promise(function (resolve, reject) {
                _this.socket = new WebSocket('ws://localhost:8080');
                _this.socket.onopen = function () {
                    console.log('Соединение установлено.');
                    resolve();
                };
                _this.socket.onclose = function (event) {
                    if (event.wasClean) {
                        console.log('Соединение закрыто чисто');
                    } else {
                        console.log('Обрыв соединения');    // например, "убит" процесс сервера
                    }
                    // например, "убит" процесс сервера
                    console.log('Код: ' + event.code + ' причина: ' + event.reason);
                };
                _this.socket.onmessage = function (event) {
                    _this._handleMessage(event.data);
                    console.log('Получены данные ' + event.data);
                };
                _this.socket.onerror = function (error) {
                    console.log('Ошибка ' + error.message);
                    reject();
                };
            });
        },
        onSettingsUpdated: function (callback) {
            this.messageHandlers['settingsUpdated'] = callback;
        },
        _handleMessage: function (message) {
            var result = JSON.parse(message);
            var data = result.data;
            if (result.type) {
                switch (result.type) {
                case 'settingsUpdated':
                    data = this._parseDataStructure(data, SettingsStruct);
                default:
                    if (this.messageHandlers[result.type]) {
                        this.messageHandlers[result.type].call(this, data);
                    }
                }
            }
        },
        closeConnection: function () {
            this.socket.close();
        }
    };
    exports.DataStore = DataStore;
});