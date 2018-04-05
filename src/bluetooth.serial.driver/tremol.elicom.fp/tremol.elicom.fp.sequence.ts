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

    public configuration: Configuration
    public driver: IDriver;
    public method: string;
    public interval: Interval;
    public error: Message;
    public commands: Array<TremolElicomFPCommand> = new Array<TremolElicomFPCommand>();

    constructor(private bluetoothSerial: BluetoothSerial, configuration: Configuration, driver: IDriver, method: string, commands?: Array<ICommand>) {
        this.configuration = configuration;
        this.driver = driver;
        this.method = method;
        this.interval = new Interval();
        if (commands != null) {
            for (let index = 0; index < commands.length; index++) {
                let command = new TremolElicomFPCommand(commands[index].request);
                command.index = index;
                this.commands.push(command);
            }
        }
    }

    private logMessage(isEnabled: boolean, message: string) {
        if (isEnabled) {
            console.log(message);
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

    private valid(command: TremolElicomFPCommand): Array<number> {
        let commandData: Array<number> = [];
        for (let index = 0; index < command.request.length; index++) {
            commandData.push(command.request.charCodeAt(index));
        }
        command.isValid = !(commandData.length > 248 && commandData[0] != 0x4D);
        return commandData;
    }

    private input(command: TremolElicomFPCommand) {
        let commandData: Array<number> = this.valid(command);
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

    private reject(command: TremolElicomFPCommand, reject, messageType?: MessageType, ...parameters) {
        command.status = "Error";
        this.error = new Message(messageType, parameters);
        if (this.configuration == null || this.configuration.logError) {
            console.error(this.error.value);
        }
        reject(this);
    }

    private write(command: TremolElicomFPCommand, resolve, reject) {
        let connect = this.bluetoothSerial.connect(this.configuration.device.address).subscribe(() => {
            let subscribeRawData = this.bluetoothSerial.subscribeRawData().subscribe((responseRaw: ArrayBuffer) => {
                this.output(command, responseRaw);
                command.interval.end();
                this.logMessage(this.configuration.logCommandResponse, Message.format(MessageType.CommandResponse, this.driver.name(), command.request, command.response, command.interval.endedOn, command.interval.duration()));
                subscribeRawData.unsubscribe();
                connect.unsubscribe();
                resolve(this);
            }, (exception: string) => {
                subscribeRawData.unsubscribe();
                connect.unsubscribe();
                command.interval.end();
                this.reject(command, reject, MessageType.CommandError, this.driver.name(), command.request, exception, command.interval.endedOn, command.interval.duration());
            });
            this.bluetoothSerial.write(command.requestData).then((status: string) => {
                command.status = status;
                command.interval.end();
                this.logMessage(this.configuration.logCommandRequest, Message.format(MessageType.CommandRequest, this.driver.name(), command.request, command.interval.endedOn, command.interval.duration()));
            }).catch((exception: string) => {
                command.interval.end();
                this.reject(command, reject, MessageType.CommandError, this.driver.name(), command.request, exception, command.interval.endedOn, command.interval.duration());
            });
        }, (exception: string) => {
            connect.unsubscribe();
            command.interval.end();
            this.reject(command, reject, MessageType.BluetoothConnectError, this.driver.name(), exception, command.interval.duration());
        });
    }

    private send(command: TremolElicomFPCommand): Promise<ISequence> {
        let timeout = 1000;
        if (this.configuration != null && this.configuration.timeout != null){
            timeout = this.configuration.timeout;
        }
        return new Promise<ISequence>((resolve, reject) => {
            setTimeout(() => {
                command.interval = new Interval();
                if (this.configuration == null) {
                    command.interval.end();
                    this.reject(command, reject, MessageType.ConfigurationNotDefinedError, this.driver.name());
                }
                else if (this.configuration.device == null) {
                    command.interval.end();
                    this.reject(command, reject, MessageType.ConfigurationDeviceNotDefinedError, this.driver.name());
                }
                else {
                    if (command.index == 0) {
                        this.logMessage(this.configuration.logMessage, Message.format(MessageType.MethodStartMessage, this.driver.name(), this.method, this.interval.startedOn));
                    }
                    this.valid(command);
                    if (command.isValid) {
                        this.input(command);
                        this.bluetoothSerial.isEnabled().then(() => {
                            this.bluetoothSerial.isConnected().then(() => {
                                this.bluetoothSerial.disconnect().then(() => {
                                    this.write(command, resolve, reject);
                                }).catch((exception: string) => {
                                    command.interval.end();
                                    this.reject(command, reject, MessageType.BluetoothDisconnectError, this.driver.name(), exception, command.interval.duration());
                                });
                            }).catch(() => {
                                this.write(command, resolve, reject);
                            });
                        }).catch(() => {
                            command.interval.end();
                            this.reject(command, reject, MessageType.BluetoothNotEnabledError, this.driver.name());
                        });
                    }
                    else {
                        command.interval.end();
                        this.reject(command, reject, MessageType.CommandInvalid, this.driver.name(), command.request, command.index);
                    }
                }
            }, timeout);
        });
    }

    public async handle(): Promise<ISequence> {
        try {
            for (let index = 0; index < this.commands.length; index++) {
                await this.send(this.commands[index]);
            }
            this.interval.end();
            this.logMessage(this.configuration.logMessage, Message.format(MessageType.MethodEndMessage, this.driver.name(), this.method, this.interval.endedOn, this.interval.duration()));
            return new Promise<ISequence>((resolve, reject) => {
                resolve(this);
            });
        }
        catch {
            return new Promise<ISequence>((resolve, reject) => {
                reject(this);
            });
        }
    }

}