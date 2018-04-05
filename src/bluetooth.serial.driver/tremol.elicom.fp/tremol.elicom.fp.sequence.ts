import { TremolElicomFPCommand } from "./tremol.elicom.fp.command";
import { ICommand } from "../command";
import { Configuration } from "../configuration";
import { IDriver } from "../driver";
import { Message, MessageType } from "../message";
import { BluetoothSerial } from "@ionic-native/bluetooth-serial";
import { Interval } from "../interval";
import { ISequence } from "../sequence";

export class TremolElicomFPSequence implements ISequence {

    private commandId: number = 0;
    private nextCommandId: number = 0;
    private STX: number = 2;
    private ETX: number = 10;
    private timeout: number = 1000;
    private subscribeRawData: any;
    private connect: any;

    public configuration: Configuration
    public driver: IDriver;
    public method: string;
    public interval: Interval;
    public commands: Array<TremolElicomFPCommand> = new Array<TremolElicomFPCommand>();
    public command: TremolElicomFPCommand;
    public error: Message;

    constructor(private bluetoothSerial: BluetoothSerial, configuration: Configuration, driver: IDriver, method: string, commands?: Array<ICommand>) {
        this.configuration = configuration;
        this.driver = driver;
        this.method = method;
        if (this.configuration != null && this.configuration.timeout != null) {
            this.timeout = this.configuration.timeout;
        }
        this.interval = new Interval();
        if (commands != null) {
            for (let index = 0; index < commands.length; index++) {
                this.commands.push(new TremolElicomFPCommand(commands[index].request));
            }
        }
    }

    private crc(commandData: Array<number>, start: number, length: number) {
        let crc = 0;
        for (let index: number = 0; index < length; index++) {
            crc ^= commandData[start + index];
        }
        commandData[start + length] = ((crc >> 4) | '0'.charCodeAt(0));
        commandData[start + length + 1] = ((crc & 15) | '0'.charCodeAt(0));
    }

    private input(command: TremolElicomFPCommand) {
        let commandData: Array<number> = [];
        for (let index = 0; index < command.request.length; index++) {
            commandData.push(command.request.charCodeAt(index));
        }
        command.isValid = !(commandData.length > 248 && commandData[0] != 0x4D);
        let commandLength = commandData.length + 2;
        command.requestData = new Array(commandData.length + 6);
        for (let index = 0; index < command.requestData.length; index++) {
            command.requestData[index] = 0;
        }
        this.commandId = (((++this.nextCommandId) % 0x7F) + 0x20);
        command.requestData[0] = this.STX;
        command.requestData[1] = (commandLength + 0x20);
        command.requestData[2] = this.commandId;
        for (let index = 0; index < command.requestData.length; index++) {
            if (index >= 3) {
                command.requestData[index] = commandData.shift();
            }
        }
        this.crc(command.requestData, 1, commandLength);
        command.requestData[command.requestData.length - 1] = this.ETX;
    }

    private output(command: TremolElicomFPCommand, responseRaw: ArrayBuffer) {
        command.responseRaw = responseRaw;
        if (responseRaw != null && responseRaw.byteLength >= 6) {
            command.responseData = new Uint8Array(responseRaw.slice(1, responseRaw.byteLength));
            command.response = String.fromCharCode.apply(null, command.responseData);
        }
    }

    private start() {
        this.connect = this.bluetoothSerial.connect(this.configuration.device.address).subscribe(() => {
            this.interval.end();
            this.handleMessage(
                this.configuration.logMessage,
                Message.format(
                    MessageType.BluetoothConnectSuccess,
                    this.driver.name(),
                    this.interval.startedOn
                )
            );
            this.send(0);
        }, (exception: string) => {
            this.interval.end();
            this.handleError(
                MessageType.BluetoothConnectError,
                this.driver.name(),
                exception,
                this.interval.duration()
            );
        });
    }

    private send(index: number) {
        if (this.error != null) {
            index == this.commands.length;
        }
        if (index < this.commands.length) {
            this.command = this.commands[index];
            this.command.index = index;
            this.command.interval = new Interval();
            this.input(this.command);
            if (this.command.isValid) {
                this.bluetoothSerial.write(this.command.requestData).then((status: string) => {
                    this.command.status = status;
                    this.command.interval.end();
                    this.handleMessage(
                        this.configuration.logCommandRequest,
                        Message.format(
                            MessageType.CommandRequest,
                            this.driver.name(),
                            this.command.request,
                            this.command.interval.endedOn,
                            this.command.interval.duration()
                        )
                    );
                    setTimeout(() => {
                        this.send(index++);
                    }, this.timeout);
                }).catch((exception: string) => {
                    this.interval.end();
                    this.handleError(
                        MessageType.CommandError,
                        this.driver.name(),
                        this.command.request,
                        exception,
                        this.interval.endedOn,
                        this.interval.duration()
                    );
                });
            }
            else {
                this.interval.end();
                this.handleError(
                    MessageType.CommandInvalid,
                    this.driver.name(),
                    this.command.request,
                    this.command.index
                );
            }
        }
        else {
            this.subscribeRawData.unsubscribe();
            this.interval.end();
            this.bluetoothSerial.disconnect().then(() => {
                this.handleMessage(
                    this.configuration.logMessage,
                    Message.format(
                        MessageType.BluetoothDisconnectSuccess,
                        this.driver.name(),
                        this.interval.startedOn
                    )
                );
                this.interval.end();
                this.handleMessage(
                    this.configuration.logMessage,
                    Message.format(
                        MessageType.MethodEndMessage,
                        this.driver.name(),
                        this.method,
                        this.interval.endedOn,
                        this.interval.duration()
                    )
                );
            }).catch((exception: string) => {
                this.connect.unsubscribe();
                this.handleError(
                    MessageType.BluetoothDisconnectError,
                    this.driver.name(),
                    exception,
                    this.interval.duration()
                );
            });
        }
    }

    private handleMessage(isEnabled: boolean, message: string) {
        if (isEnabled) {
            console.log(message);
        }
    }

    private handleError(messageType?: MessageType, ...parameters) {
        if (this.interval.endedOn == null) {
            this.interval.end();
        }
        if (this.command != null) {
            this.command.status = "Error";
            if (this.command.interval.endedOn == null) {
                this.command.interval.end();
            }
        }
        this.error = new Message(messageType, parameters);
        if (this.configuration == null || this.configuration.logError) {
            console.error(this.error.value);
        }
    }

    public handleCommands() {
        if (this.configuration == null) {
            this.handleError(MessageType.ConfigurationNotDefinedError, this.driver.name());
        }
        else if (this.configuration.device == null) {
            this.handleError(MessageType.ConfigurationDeviceNotDefinedError, this.driver.name());
        }
        else {
            this.handleMessage(
                this.configuration.logMessage,
                Message.format(
                    MessageType.MethodStartMessage,
                    this.driver.name(),
                    this.method,
                    this.interval.startedOn
                )
            );
            this.bluetoothSerial.isEnabled().then(() => {
                this.subscribeRawData = this.bluetoothSerial.subscribeRawData().subscribe((responseRaw: ArrayBuffer) => {
                    this.output(this.command, responseRaw);
                    this.command.interval.end();
                    this.handleMessage(
                        this.configuration.logCommandResponse,
                        Message.format(
                            MessageType.CommandResponse,
                            this.driver.name(),
                            this.command.request,
                            this.command.response,
                            this.command.interval.endedOn,
                            this.command.interval.duration()
                        )
                    );
                }, (exception: string) => {
                    this.interval.end();
                    this.handleError(
                        MessageType.CommandError,
                        this.driver.name(),
                        this.command.request,
                        exception,
                        this.interval.endedOn,
                        this.interval.duration()
                    );
                });
                this.bluetoothSerial.isConnected().then(() => {
                    this.bluetoothSerial.disconnect().then(() => {
                        this.interval.end();
                        this.handleMessage(
                            this.configuration.logMessage,
                            Message.format(
                                MessageType.BluetoothDisconnectSuccess,
                                this.driver.name(),
                                this.interval.startedOn
                            )
                        );
                        this.start();
                    }).catch((exception: string) => {
                        this.interval.end();
                        this.handleError(
                            MessageType.BluetoothDisconnectError,
                            this.driver.name(),
                            exception,
                            this.interval.duration()
                        );
                    });
                }).catch(() => {
                    this.start();
                });
            }).catch(() => {
                this.handleError(
                    MessageType.BluetoothNotEnabledError,
                    this.driver.name()
                );
            });
        }
    }

}