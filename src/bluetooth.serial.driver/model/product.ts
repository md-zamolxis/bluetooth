import { IVat } from "./vat";

export interface IProduct {
    code: string;
    name: number;
    vat?: IVat;
}
