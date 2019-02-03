define('Coffee/Data/DataStore', [
    'require',
    'exports'
], function (require, exports) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var InfoStruct = {
        'Группа 1': {
            'Температура': 'g1TSet',
            'Время предсмачивания': 'g1TimeSet',
            'Время автоматической варки 1': 'g1AutoMode1',
            'Время автоматической варки 2': 'g1AutoMode2',
            'Время пост-предсмачивания': 'g1_1TimeSet'
        },
        'Группа 2': {
            'Температура': 'g2TSet',
            'Время предсмачивания': 'g2TimeSet',
            'Время автоматической варки 1': 'g2AutoMode1',
            'Время автоматической варки 2': 'g2AutoMode2',
            'Время пост-предсмачивания': 'g2_1TimeSet'
        },
        'Паровой бойлер': { 'Давление': 'parTSet' },
        'Цветовая схема': {
            'Холодный красный': 'rCold',
            'Холодный зеленый': 'gCold',
            'Холодный синий': 'bCold',
            'Холодный прозрачный': 'aCold',
            'Горячий красный': 'rHot',
            'Горячий зеленый': 'gHot',
            'Горячий синий': 'bHot',
            'Горячий прозрачный': 'aHot'
        }
    };
    exports.InfoStruct = InfoStruct;
    var DataStore = {
        socket: null,
        messageHandlers: new Array(),
        _parseDataStructure: function (rawData, dataStruct) {
            var result = {};
            for (var groupName in dataStruct) {
                result[groupName] = {};
                for (var fieldName in dataStruct[groupName]) {
                    result[groupName][fieldName] = rawData[dataStruct[groupName][fieldName]];
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
        onRawDataUpdated: function (callback) {
            this.messageHandlers['rawDataSetting'] = callback;
        },
        _handleMessage: function (message) {
            var result = JSON.parse(message);
            var data = result.data;
            if (result.type) {
                switch (result.type) {
                case 'rawDataSetting':
                    data = this._parseDataStructure(data, InfoStruct);
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