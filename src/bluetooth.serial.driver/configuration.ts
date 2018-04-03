import { IDevice } from "./device";

export class Configuration {
    
    public logMessage: boolean;
    public logError: boolean;
    public logCommandResponse: boolean;
    public logCommandSuccess: boolean;

    constructor(public device: IDevice) {
    }

}
