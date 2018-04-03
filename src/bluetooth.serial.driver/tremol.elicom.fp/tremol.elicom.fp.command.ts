import { ICommand } from "../command";
import { Interval } from "../interval";

export class TremolElicomFPCommand implements ICommand {

    public request: string;
    public reply: ArrayBuffer;
    public requestData: Array<number>;
    public requestRaw: string;
    public replyData: Uint8Array;
    public replyRaw: string;
    public isValid: boolean;
    public interval: Interval;

    constructor(request: string = '') {
        this.request = request;
    }

    public isHigh(replyRaw: Uint8Array, byteIndex: number, bitIndex: number): boolean {
        return (replyRaw && (replyRaw[byteIndex] & (1 << bitIndex)) != 0);
    }

    public readOnlyFiscalMemory(): boolean {
        return this.isHigh(this.replyData, 0, 0);
    }

    public paper(): boolean {
        return this.isHigh(this.replyData, 1, 0);
    }

    public openFiscalReceipt(): boolean {
        return this.isHigh(this.replyData, 2, 0);
    }

}