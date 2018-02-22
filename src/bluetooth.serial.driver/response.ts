export enum ResponseType {
    ConfigurationNotDefined = 'Configuration not defined in [{0}] driver.',
    ConfigurationDeviceNotDefined = 'Configuration device not defined in [{0}] driver.',
    MethodNotImplemented = 'Method [{0}] is not implemented yet for [{1}] driver.',
    MethodNotSupported = 'Method [{0}] is not supported by [{1}] driver.',
    BluetoothNotEnabled = 'Bluetooth not enabled.',
    BluetoothConnectError = 'Bluetooth error [{0}] has occurred on connecting to [{1}] driver within [{2}] milliseconds.',
    BluetoothDisconnectError = 'Bluetooth error [{0}] has occurred on disconnecting to [{1}] driver within [{2}] milliseconds.',
    MethodStart = 'Method [{0}] has been started in [{1}] driver at [{2}].',
    MethodEnd = 'Method [{0}] has been ended in [{1}] driver at [{2}] within [{3}] milliseconds.'
}

export class Response {

    message: string;
    startedOn: Date;
    endedOn: Date;
    responseType: ResponseType;
    parameters?: any;

    static replace(pattern, parameters) {
        return pattern.replace(/{(\d+)}/g, function (match, index) {
            return parameters[index] === undefined ? match : parameters[index];
        });
    }

    static format(pattern: string, ...parameters): string {
        let format = null;
        if (pattern !== null) {
            format = pattern;
            if (parameters != null) {
                format = Response.replace(format, parameters);
            }
        }
        return format;
    }

    constructor(public driver: string, public method: string) {
        this.startedOn = new Date();
    }

    handle(responseType?: ResponseType, ...parameters) {
        if (responseType != undefined) {
            this.responseType = responseType;
            this.parameters = parameters;
            this.message = null;
            if (responseType !== null) {
                this.message = responseType;
                if (parameters != null) {
                    this.message = Response.replace(this.message, parameters);
                }
            }
        }
        this.endedOn = new Date();
    }

    logStart() {
        console.log(Response.format(ResponseType.MethodStart, this.method, this.driver, this.startedOn));
    }

    logEnd() {
        console.log(Response.format(ResponseType.MethodEnd, this.method, this.driver, this.endedOn, this.duration()));
    }

    logError() {
        if (this.message == null) {
            return;
        }
        console.error(this.message);
    }

    duration(): number {
        return this.endedOn.getTime() - this.startedOn.getTime();
    }

}
