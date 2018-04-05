import { ICommand } from "../command";
import { Interval } from "../interval";
import { Message } from "../message";

export class TremolElicomFPCommand implements ICommand {

    public index: number;
    public interval: Interval;
    public isValid: boolean;
    public request: string;
    public requestData: Array<number>;
    public responseRaw: ArrayBuffer;
    public responseData: Uint8Array;
    public response: string;
    public status: string;
    public number: number;

    constructor(request: string = '') {
        this.request = request;
    }

    public isHigh(responseData: Uint8Array, byteIndex: number, bitIndex: number): boolean {
        return (responseData && (responseData[byteIndex] & (1 << bitIndex)) != 0);
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