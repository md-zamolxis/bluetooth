import { ICommand } from "../command";
import { Interval } from "../interval";

export class TremolElicomFPCommand implements ICommand {

    public request: string;
    public response: ArrayBuffer;
    public requestData: Array<number>;
    public requestRaw: string;
    public responseData: Uint8Array;
    public responseRaw: string;
    public isValid: boolean;
    public interval: Interval;

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