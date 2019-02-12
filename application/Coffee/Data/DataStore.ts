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

let InfoStruct = {
    "Группа 1": "currentGroup1P",
    "Группа 2": "currentGroup2P",
    "Пар": "tParReceived"
}

let DataStore = {
    socket: null,
    messageHandlers: new Array<Function>(),
    initialSettings: null,
    _serializeSettings(parsedSettings): any {
        var data = {};
        for (let i in parsedSettings) {
            for (let j in parsedSettings[i]) {
                data[parsedSettings[i][j].dataFieldName] = parsedSettings[i][j].value;
            }
        }
        return data;
    },
    _parseDataStructure(rawData, dataStruct): any {
        let result = {};
        for (let groupName in dataStruct) {
            result[groupName] = {};
            for (let fieldName in dataStruct[groupName]) {
                result[groupName][fieldName] = {};
                result[groupName][fieldName].value = rawData[dataStruct[groupName][fieldName]];
                result[groupName][fieldName].dataFieldName = dataStruct[groupName][fieldName];
            }
        }
        return result;
    },
    _parseInfo(rawData, dataStruct): any {
        let result = {};
        for (let fieldName in dataStruct) {
            result[fieldName] = {};
            result[fieldName].value = rawData[dataStruct[fieldName]];
            result[fieldName].dataFieldName = dataStruct[fieldName];
        }
        return result;
    },
    initDataStore(): Promise<any> {
        return new Promise((resolve, reject) => {
            this.socket = new WebSocket("ws://localhost:8080");
            this.socket.onopen = () => {
                console.log("Соединение установлено.");
                resolve();
            };
            this.socket.onclose = (event) => {
                if (event.wasClean) {
                    console.log('Соединение закрыто чисто');
                } else {
                    console.log('Обрыв соединения'); // например, "убит" процесс сервера
                }
                console.log('Код: ' + event.code + ' причина: ' + event.reason);
            };
            this.socket.onmessage = (event) => {
                this._handleMessage(event.data);
                console.log("Получены данные " + event.data);
            };
            this.socket.onerror = (error) => {
                console.log("Ошибка " + error.message);
                reject();
            };
        });
    },
    on(eventName: string, callback: Function) {
        this.messageHandlers[eventName] = callback;
    },
    removeHandler(eventName) {
        this.messageHandlers[eventName] = null;
    },
    _handleMessage(message): any {
        let result = JSON.parse(message);
        let data = result.data;
        if (result.type) {
            switch (result.type) {
                case "initialSettings":
                    data = this._parseDataStructure(data, SettingsStruct);
                    this.initialSettings = data;
                    break;
                case "currentInfoUpdate":
                    data = this._parseInfo(data, InfoStruct);
                    break;
            }
            if (this.messageHandlers[result.type]) {
                this.messageHandlers[result.type].call(this, data);
            }
        }
    },
    getInitialSettings(): any {
        return this.initialSettings;
    },
    sendSettings(settings): void {
        if(!this.socket) {
            return null;
        }
        let serialized = this._serializeSettings(settings);
        this.socket.send(JSON.stringify({ type: "newSettings", data: serialized }));
    },
    closeConnection(): void {
        this.socket.close();
    }
};

export {DataStore, SettingsStruct};