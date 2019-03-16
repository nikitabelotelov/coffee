define('Coffee/Data/DataStore', [
    'require',
    'exports'
], function (require, exports) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var InfoStruct = {
        'Группа 1': 'currentGroup1P',
        'Группа 2': 'currentGroup2P',
        'Пар': 'tParReceived'
    };
    var DataStore = {
        socket: null,
        messageHandlers: new Array(),
        initialSettings: null,
        _parseInfo: function (rawData, dataStruct) {
            var result = {};
            for (var fieldName in dataStruct) {
                result[fieldName] = {};
                result[fieldName].value = rawData[dataStruct[fieldName]];
                result[fieldName].dataFieldName = dataStruct[fieldName];
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
        on: function (eventName, callback) {
            this.messageHandlers[eventName] = callback;
        },
        removeHandler: function (eventName) {
            this.messageHandlers[eventName] = null;
        },
        _handleMessage: function (message) {
            var result = JSON.parse(message);
            var data = result.data;
            if (result.type) {
                switch (result.type) {
                case 'initialSettings':
                    this.initialSettings = data;
                    break;
                case 'currentInfoUpdate':
                    data = this._parseInfo(data, InfoStruct);
                    break;
                }
                if (this.messageHandlers[result.type]) {
                    this.messageHandlers[result.type].call(this, data);
                }
            }
        },
        getInitialSettings: function () {
            return this.initialSettings;
        },
        sendSettings: function (settings) {
            if (!this.socket) {
                return null;
            }
            var serialized = settings.serialize();
            this.socket.send(JSON.stringify({
                type: 'newSettings',
                data: serialized
            }));
        },
        closeConnection: function () {
            this.socket.close();
        }
    };
    exports.DataStore = DataStore;
});