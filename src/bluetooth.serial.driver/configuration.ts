import { IDevice } from "./device";

export class Configuration {
    
    public logMessage: boolean;
    public logError: boolean;
    public logCommandRequest: boolean;
    public logCommandResponse: boolean;

    constructor(public device: IDevice) {
    }

}
