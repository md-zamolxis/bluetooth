export enum MessageType {

    MethodNotImplementedError = 'Driver [{0}]: error - method [{1}] is not implemented yet.',
    MethodNotSupportedError = 'Driver [{0}]: error - method [{1}] is not supported.',

    ConfigurationNotDefinedError = 'Driver [{0}]: error - configuration not defined.',
    ConfigurationDeviceNotDefinedError = 'Driver [{0}]: error - configuration device not defined.',

    BluetoothNotEnabledError = 'Driver [{0}]: status - bluetooth not enabled.',
    BluetoothDisconnectSuccess = 'Driver [{0}]: success - bluetooth has been successfully disconnected within [{1}] milliseconds.',
    BluetoothDisconnectError = 'Driver [{0}]: error - bluetooth disconnecting exception [{1}] has occurred within [{2}] milliseconds.',
    BluetoothConnectSuccess = 'Driver [{0}]: success - bluetooth has been successfully connected within [{1}] milliseconds.',
    BluetoothConnectError = 'Driver [{0}]: error - bluetooth connecting exception [{1}] has occurred within [{2}] milliseconds.',

    CommandInvalid = 'Driver [{0}]: invalid - command [{1}] at [{2}] index has invalid format.',
    CommandRequest = 'Driver [{0}]: request - command [{1}] has been requested at [{2}] within [{3}] milliseconds.',
    CommandResponse = 'Driver [{0}]: response - command [{1}] has returned a response [{2}] at [{3}] within [{4}] milliseconds.',
    CommandError = 'Driver [{0}]: error - command [{1}] has thrown an exception [{2}] at [{3}] within [{4}] milliseconds.',

    MethodStartMessage = 'Driver [{0}]: message - method [{1}] has been started at [{2}].',
    MethodEndMessage = 'Driver [{0}]: message - method [{1}] has been ended at [{2}] within [{3}] milliseconds.'

}

export class Message {

    public messageType: MessageType;
    public parameters?: any;
    public value: string;

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
                format = Message.replace(format, parameters);
            }
        }
        return format;
    }

    constructor(messageType?: MessageType, ...parameters) {
        if (messageType != undefined) {
            this.messageType = messageType;
            this.parameters = parameters;
            this.value = null;
            if (messageType !== null) {
                this.value = messageType;
                if (parameters != null) {
                    this.value = Message.replace(this.value, parameters);
                }
            }
        }
    }

}