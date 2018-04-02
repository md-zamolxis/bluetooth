import { IDevice } from "./device";

export class Configuration {
    
    logEvent: boolean;
    logError: boolean;

    constructor(public device: IDevice) {
    }

}
