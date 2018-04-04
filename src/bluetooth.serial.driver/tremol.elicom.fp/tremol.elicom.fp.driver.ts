import { IDriver } from "../driver";
import { Configuration } from "../configuration";
import { IReceipt } from "../model/receipt";
import { IVat } from "../model/vat";
import { ITender } from "../model/tender";
import { BluetoothSerial } from "@ionic-native/bluetooth-serial";
import { TremolElicomFPSequence } from "./tremol.elicom.fp.sequence";
import { Message, MessageType } from "../message";
import { ISequence } from "../sequence";

export class TremolElicomFPDriver implements IDriver {

    constructor(private bluetoothSerial: BluetoothSerial) {
    }

    public name(): string {
        return 'Tremol Elicom FP v1.0';
    }

    public verify(configuration: Configuration): Promise<ISequence> {
        let sequence = new TremolElicomFPSequence(this.bluetoothSerial, configuration, this, 'verify');
        return sequence.handle();
    }

    public print(configuration: Configuration, receipt: IReceipt, vats: Array<IVat>, tenders: Array<ITender>): Promise<ISequence> {
        /*let sequence = new TremolElicomFPSequence(this.bluetoothSerial, configuration, this, 'print');
        sequence.error = new Message(MessageType.MethodNotImplementedError, sequence.driver.name(), sequence.method);
        return new Promise<ISequence>((resolve, reject) => {
            reject(sequence);
        });*/
       let sequence = new TremolElicomFPSequence(this.bluetoothSerial, configuration, this, 'print', [
           { request: ' ' },
           { request: '9' },
           { request: '01;0   ;0;0;0' },
        ]);
       return sequence.handle();
   }

    public printX(configuration: Configuration): Promise<ISequence> {
        let sequence = new TremolElicomFPSequence(this.bluetoothSerial, configuration, this, 'printX', [{ request: 'IX' }]);
        return sequence.handle();
    }

    public printZ(configuration: Configuration): Promise<ISequence> {
        let sequence = new TremolElicomFPSequence(this.bluetoothSerial, configuration, this, 'printZ', [{ request: 'IZ' }]);
        return sequence.handle();
    }

}