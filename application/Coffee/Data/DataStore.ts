let InfoStruct = {
    "Группа 1": "currentGroup1P",
    "Группа 2": "currentGroup2P",
    "Пар": "tParReceived"
}

let DataStore = {
    socket: null,
    messageHandlers: new Array<Function>(),
    initialSettings: null,
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
        let serialized = settings.serialize();
        this.socket.send(JSON.stringify({ type: "newSettings", data: serialized }));
    },
    closeConnection(): void {
        this.socket.close();
    }
};

export {DataStore};