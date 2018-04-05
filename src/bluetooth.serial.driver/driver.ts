import { Configuration } from "./configuration";
import { IReceipt } from "./model/receipt";
import { IVat } from "./model/vat";
import { ITender } from "./model/tender";
import { ISequence } from "./sequence";

export interface IDriver {

    name(): string;

    status(configuration: Configuration): Promise<ISequence>;

    print(configuration: Configuration, receipt: IReceipt, vats: Array<IVat>, tenders: Array<ITender>): Promise<ISequence>;

    printX(configuration: Configuration): Promise<ISequence>;

    printZ(configuration: Configuration): Promise<ISequence>;

}
