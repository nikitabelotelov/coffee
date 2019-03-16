define('Coffee/Settings/SettingsModel/SettingsModel', [
    'require',
    'exports',
    'Coffee/Data/DataStore'
], function (require, exports, DataStore_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    '/Coffee/Data/DataStore';
    var SettingsStruct = {
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
        'Цветовая схема холодный': {
            'Красный': 'rCold',
            'Зеленый': 'gCold',
            'Синий': 'bCold',
            'Прозрачность': 'aCold'
        },
        'Цветовая схема горячий': {
            'Красный': 'rHot',
            'Зеленый': 'gHot',
            'Синий': 'bHot',
            'Прозрачность': 'aHot'
        }
    };
    var SettingsModel = /** @class */
    function () {
        function SettingsModel(settingsData) {
            this._version = 0;
            this.data = settingsData;
        }
        SettingsModel.prototype.getVersion = function () {
            return this._version;
        };
        ;
        SettingsModel.prototype.upVersion = function () {
            this._version++;
            DataStore_1.DataStore.sendSettings(this);
        };
        ;
        SettingsModel.prototype.serialize = function () {
            var parsedSettings = this.data;
            var result = {};
            for (var i in parsedSettings) {
                for (var j in parsedSettings[i]) {
                    result[parsedSettings[i][j].dataFieldName] = parsedSettings[i][j].value;
                }
            }
            return result;
        };
        ;
        SettingsModel.parseSettings = function (rawSettings) {
            var result = {};
            for (var groupName in SettingsStruct) {
                result[groupName] = {};
                for (var fieldName in SettingsStruct[groupName]) {
                    result[groupName][fieldName] = {};
                    result[groupName][fieldName].value = rawSettings[SettingsStruct[groupName][fieldName]];
                    result[groupName][fieldName].dataFieldName = SettingsStruct[groupName][fieldName];
                }
            }
            return result;
        };
        ;
        ;
        SettingsModel.prototype.getSetting = function (groupName, settingName) {
            return this.data[groupName][settingName].value;
        };
        ;
        SettingsModel.prototype.setSetting = function (value, groupName, settingName) {
            this.data[groupName][settingName].value = value;
            this.upVersion();
        };
        ;
        return SettingsModel;
    }();
    exports.SettingsModel = SettingsModel;
    ;
});