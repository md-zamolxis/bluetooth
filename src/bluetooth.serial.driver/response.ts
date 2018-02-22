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

    handle(responseType?: ResponseType, ...parameters) {
        if (responseType != undefined) {
            this.responseType = responseType;
            this.parameters = parameters;
            this.message = Response.format(responseType, parameters);
        }
        this.endedOn = new Date();
    }

    static format(pattern: string, ...parameters): string {
        let format = null;
        if (pattern !== null) {
            format = pattern;
            if (parameters != null) {
                format = format.replace(/{(\d+)}/g, function (match, index) {
                    return parameters[index] === undefined ? match : parameters[index];
                });
            }
        }
        return format;
    }

    logStart() {
        console.log(`Method [${this.method}] has been started in [${this.driver}] driver at [${this.startedOn}].`);
    }

    logEnd() {
        console.log(`Method [${this.method}] has been ended in [${this.driver}] driver at [${this.endedOn}].`);
    }

    logError() {
        if (this.message == null) {
            return;
        }
        console.error(this.message);
    }

    time(): number {
        return this.endedOn.getTime() - this.startedOn.getTime();
    }

}
