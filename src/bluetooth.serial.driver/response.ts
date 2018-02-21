export enum ResponseType {
    ConfigurationNotDefined = 'Configuration not defined [{0}] driver.',
    ConfigurationDeviceNotDefined = 'Configuration device not defined [{0}] driver.',
    MethodNotImplemented = 'Method [{0}] is not implemented yet for [{1}] driver.',
    MethodNotSupported = 'Method [{0}] is not supported by [{1}] driver.',
    BluetoothNotEnabled = 'Bluetooth not enabled.',
    BluetoothConnectError = 'Bluetooth error [{0}] has occurred on connecting to [{1}] driver.',
    BluetoothDisconnectError = 'Bluetooth error [{0}] has occurred on disconnecting to [{1}] driver.'
}

export class Response {

    message: string;
    startedOn: Date;
    endedOn: Date;
    responseType: ResponseType;
    parameters?: any;

    constructor(public driver: string, public method: string) {
        this.startedOn = new Date();
    }

    format(responseType?: ResponseType, ...parameters) {
        if (responseType != undefined) {
            this.responseType = responseType;
            this.parameters = parameters;
            this.message = null;
            if (responseType !== null) {
                this.message = responseType;
                if (parameters != null) {
                    this.message = this.message.replace(/{(\d+)}/g, function (match, index) {
                        return parameters[index] === undefined ? match : parameters[index];
                    });
                }
            }
        }
        this.endedOn = new Date();
    }

    logStart() {
        console.log(`Method ${this.method} has been started in ${this.driver} driver at ${this.startedOn}.`);
    }

    logEnd() {
        console.log(`Method ${this.method} has been ended in ${this.driver} driver at ${this.endedOn}.`);
    }

    logError() {
        if (this.message != null) {
            console.error(this.message);
        }
    }

}
