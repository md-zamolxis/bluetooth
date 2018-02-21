import { Configuration } from "./configuration";
import { IReceipt } from "./model/receipt";
import { IVat } from "./model/vat";
import { ITender } from "./model/tender";

export interface IDriver {

    name(): string;

    verify(configuration: Configuration);

    print(configuration: Configuration, receipt: IReceipt, vats: Array<IVat>, tenders: Array<ITender>);

    printX(configuration: Configuration);

    printZ(configuration: Configuration);

}
