let InfoStruct = {
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
    "Цветовая схема": {
        "Холодный красный": "rCold",
        "Холодный зеленый": "gCold",
        "Холодный синий": "bCold",
        "Холодный прозрачный": "aCold",
        "Горячий красный": "rHot",
        "Горячий зеленый": "gHot",
        "Горячий синий": "bHot",
        "Горячий прозрачный": "aHot"
    }
};

let DataStore = {
    socket: null,
    messageHandlers: new Array<Function>(),
    _parseDataStructure(rawData, dataStruct): any {
        let result = {};
        for (let groupName in dataStruct) {
            result[groupName] = {};
            for (let fieldName in dataStruct[groupName]) {
                result[groupName][fieldName] = rawData[dataStruct[groupName][fieldName]];
            }
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
    onRawDataUpdated(callback: Function) {
        this.messageHandlers["rawDataSetting"] = callback;
    },
    _handleMessage(message): any {
        let result = JSON.parse(message);
        let data = result.data;
        if (result.type) {
            switch (result.type) {
                case "rawDataSetting":
                    data = this._parseDataStructure(data, InfoStruct);
                default:
                    if (this.messageHandlers[result.type]) {
                        this.messageHandlers[result.type].call(this, data);
                    }
            }
        }
    },
    closeConnection(): void {
        this.socket.close();
    }
};

export {DataStore, InfoStruct};