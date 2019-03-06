import {DataStore} from "../../Data/DataStore";

"/Coffee/Data/DataStore";

let SettingsStruct = {
    "Группа 1": {
        "Температура": "g1TSet",
        "Время предсмачивания": "g1TimeSet",
        "Время автоматической варки 1": "g1AutoMode1",
        "Время автоматической варки 2": "g1AutoMode2",
        "Время пост-предсмачивания": "g1_1TimeSet"
    },
    "Группа 2": {
        "Температура": "g2TSet",
        "Время предсмачивания": "g2TimeSet",
        "Время автоматической варки 1": "g2AutoMode1",
        "Время автоматической варки 2": "g2AutoMode2",
        "Время пост-предсмачивания": "g2_1TimeSet"
    },
    "Паровой бойлер": {
        "Давление": "parTSet"
    },
    "Цветовая схема холодный": {
        "Красный": "rCold",
        "Зеленый": "gCold",
        "Синий": "bCold",
        "Прозрачность": "aCold"
    },
    "Цветовая схема горячий": {
        "Красный": "rHot",
        "Зеленый": "gHot",
        "Синий": "bHot",
        "Прозрачность": "aHot"
    }
};

class SettingsModel {
    private data: any;
    public _version: number = 0;
    public getVersion() {
        return this._version;
    };
    private upVersion() {
        this._version++;
        DataStore.sendSettings(this);
    };
    serialize(): any {
        let parsedSettings = this.data;
        let result = {};
        for (let i in parsedSettings) {
            for (let j in parsedSettings[i]) {
                result[parsedSettings[i][j].dataFieldName] = parsedSettings[i][j].value;
            }
        }
        return result;
    };
    static parseSettings(rawSettings): any {
        let result = {};
        for (let groupName in SettingsStruct) {
            result[groupName] = {};
            for (let fieldName in SettingsStruct[groupName]) {
                result[groupName][fieldName] = {};
                result[groupName][fieldName].value = rawSettings[SettingsStruct[groupName][fieldName]];
                result[groupName][fieldName].dataFieldName = SettingsStruct[groupName][fieldName];
            }
        }
        return result;
    };
    public constructor(settingsData) {
        this.data = settingsData;
    };
    public getSetting(groupName: string, settingName: string): any {
        return this.data[groupName][settingName].value;
    };
    public setSetting(value, groupName: string, settingName: string): any {
        this.data[groupName][settingName].value = value;
        this.upVersion();
    };
};

export {SettingsModel};