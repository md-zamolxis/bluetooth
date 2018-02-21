export class Message {
    module: string;
    method: string;
    exception: string;
    command: string;
    requestData: Array<number>;
    requestRaw: string;
    responseData: ArrayBuffer;
    responseRaw: Uint8Array;

    constructor(module: string) {
        this.module = module;
    }

    init(method: string, exception: string) {
        this.method = method;
        this.exception = exception;
        return this;
    }

    static initException(module: string, method: string, exception: string) {
        let message = new Message(module);
        return message.init(method, exception);
    }

    static formatException(message) {
        let formatException = message;
        if (message instanceof Message) {
            formatException = `An exception ${message.exception} has occurred on invoking method ${message.method} in module ${message.module}.`;
        }
        return formatException;
    }

    static formatCommand(message) {
        let formatCommand = message;
        if (message instanceof Message) {
            formatCommand = `Command - ${message.command}; request data - ${message.requestData}; request raw - ${message.requestRaw}; response data - ${message.responseData}; response raw - ${message.responseRaw}.`;
        }
        return formatCommand;
    }

    read(responseData: ArrayBuffer) {
        this.responseData = responseData;
        if (this.responseData == null || this.responseData.byteLength < 6) {
            return;
        }
        this.responseRaw = new Uint8Array((this.responseData as ArrayBuffer).slice(1, this.responseData.byteLength));
    }

    isHigh(responseRaw: Uint8Array, byteIndex: number, bitIndex: number): boolean {
        return (responseRaw && (responseRaw[byteIndex] & (1 << bitIndex)) != 0);
    }

    readOnlyFiscalMemory() {
        return this.isHigh(this.responseRaw, 0, 0);
    }

    paper() {
        return this.isHigh(this.responseRaw, 1, 0);
    }

    openFiscalReceipt() {
        return this.isHigh(this.responseRaw, 2, 0);
    }

    crc(commandData: Array<number>, start: number, length: number) {
        let crc = 0;
        for (let index: number = 0; index < length; index++) {
            crc ^= commandData[start + index];
        }
        commandData[start + length] = ((crc >> 4) | '0'.charCodeAt(0));
        commandData[start + length + 1] = ((crc & 15) | '0'.charCodeAt(0));
    }

    write(command: string = '') {
        let valid = true;
        let commandData: Array<number> = [];
        for (let index = 0; index < command.length; index++) {
            commandData.push(command.charCodeAt(index));
        }
        let length = commandData.length + 2;
        if (length > 250 && commandData[0] != 0x4D) {
            valid = false;
        }
        else {
            this.requestData = new Array(commandData.length + 6);
            for (let index = 0; index < this.requestData.length; index++) {
                this.requestData[index] = 0;
            }
            let commandId = 0;
            let nextCommandId = 0;
            commandId = (((++nextCommandId) % 0x7F) + 0x20);
            this.requestData[0] = 2;
            this.requestData[1] = (length + 0x20);
            this.requestData[2] = commandId;
            for (let index = 0; index < this.requestData.length; index++) {
                if (index >= 3) {
                    this.requestData[index] = commandData.shift();
                }
            }
            this.crc(this.requestData, 1, length);
            this.requestData[this.requestData.length - 1] = 10;
        }
        return valid;
    }

}