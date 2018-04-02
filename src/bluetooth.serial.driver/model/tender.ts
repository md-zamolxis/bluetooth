export enum TenderType {
    Undefined = 0,
    Cash = 1,
    Card = 2,
    Voucher = 3,
    Credit = 4
}

export interface ITender {

    code: string;
    type: TenderType;
    name: string;
    
}
