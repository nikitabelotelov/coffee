let SettingsStruct = {
    G1: {
        val1: "val1",
        val2: "val2"
    },
    G2: {
        val3: "val3",
        val4: "val4"
    },
    G3: {
        val5: "val5"
    }
}

let DataStore = {
    socket: null,
    messageHandlers: new Array<Function>(),
    parseDataStructure(rawData, dataStruct): any {
        let result = {};
        for(let groupName in dataStruct) {
            result[groupName] = {};
            for(let fieldName in dataStruct[groupName]) {
                result[groupName][fieldName] = rawData[fieldName];
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
                this.handleMessage(event.data);
                console.log("Получены данные " + event.data);
            };
            this.socket.onerror = (error) => {
                console.log("Ошибка " + error.message);
                reject();
            };
        });
    },
    onSettingsUpdated(callback: Function) {
        this.messageHandlers["settingsUpdated"] = callback;
    },
    handleMessage(message): any {
        let result = JSON.parse(message);
        let data = result.data;
        if (result.type) {
            switch(result.type) {
                case "settingsUpdated":
                    data = this.parseDataStructure(data, SettingsStruct);
                default:
                    if(this.messageHandlers[result.type]) {
                        this.messageHandlers[result.type].call(this, data);
                    }
            }
        }
    }
};

export {DataStore, SettingsStruct};