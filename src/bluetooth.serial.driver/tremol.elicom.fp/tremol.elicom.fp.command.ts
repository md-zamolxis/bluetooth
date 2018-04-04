import { ICommand } from "../command";
import { Interval } from "../interval";
import { Message } from "../message";

export class TremolElicomFPCommand implements ICommand {

    public request: string;
    public requestData: Array<number>;
    public response: string;
    public responseData: Uint8Array;
    public status: string;
    public number: number;
    public isValid: boolean;
    public interval: Interval;
    public error: Message;

    constructor(request: string = '') {
        this.request = request;
    }

    public isHigh(responseRaw: Uint8Array, byteIndex: number, bitIndex: number): boolean {
        return (responseRaw && (responseRaw[byteIndex] & (1 << bitIndex)) != 0);
    }

    public readOnlyFiscalMemory(): boolean {
        return this.isHigh(this.responseData, 0, 0);
    }

    public paper(): boolean {
        return this.isHigh(this.responseData, 1, 0);
    }

    public openFiscalReceipt(): boolean {
        return this.isHigh(this.responseData, 2, 0);
    }

}