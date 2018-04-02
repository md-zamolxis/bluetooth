import { IReceiptItem } from "./receipt.item";
import { ITender } from "./tender";

export interface IReceipt {

    code: string;
    tender: ITender;
    receiptItems: Array<IReceiptItem>;
    
}
