import { IProduct } from "./product";

export interface IReceiptItem {
    code: string;
    product: IProduct;
    quantity: number;
    price: number;
}
