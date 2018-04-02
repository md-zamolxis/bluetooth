import { ICommand } from "../command";

export class TremolElicomFPCommand implements ICommand {

    requestData: Array<number>;
    requestRaw: string;
    reply: string;
    replyData: Uint8Array;

    constructor(public request: string = '') {
    }

    isHigh(replyRaw: Uint8Array, byteIndex: number, bitIndex: number): boolean {
        return (replyRaw && (replyRaw[byteIndex] & (1 << bitIndex)) != 0);
    }

    readOnlyFiscalMemory() {
        return this.isHigh(this.replyData, 0, 0);
    }

    paper() {
        return this.isHigh(this.replyData, 1, 0);
    }

    openFiscalReceipt() {
        return this.isHigh(this.replyData, 2, 0);
    }

    crc(commandData: Array<number>, start: number, length: number) {
        let crc = 0;
        for (let index: number = 0; index < length; index++) {
            crc ^= commandData[start + index];
        }
        commandData[start + length] = ((crc >> 4) | '0'.charCodeAt(0));
        commandData[start + length + 1] = ((crc & 15) | '0'.charCodeAt(0));
    }

    write() {
        let valid = true;
        let commandData: Array<number> = [];
        for (let index = 0; index < this.request.length; index++) {
            commandData.push(this.request.charCodeAt(index));
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

    read(replyData: ArrayBuffer) {
        if (replyData == null || replyData.byteLength < 6) {
            return;
        }
        this.replyData = new Uint8Array((replyData as ArrayBuffer).slice(1, replyData.byteLength));
        this.reply = String.fromCharCode.apply(null, this.replyData);
    }
}