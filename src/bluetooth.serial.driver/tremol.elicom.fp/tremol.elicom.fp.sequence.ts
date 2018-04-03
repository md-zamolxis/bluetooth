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
                this.commands.push(command);
            }
        }
        this.logMessage(this.configuration.logMessage, Message.format(MessageType.MethodStartMessage, this.driver.name(), this.method, this.interval.startedOn));
    }

    private logMessage(isEnabled: boolean, message: string) {
        if (isEnabled) {
            console.log(message);
        }
    }

    private logError(error: Message) {
        if (this.configuration.logError) {
            console.error(error.value);
        }
    }

    private validate() {
        return new Promise((resolve, reject) => {
            if (this.configuration == null) {
                this.error = new Message(MessageType.ConfigurationNotDefinedError, this.driver.name());
            }
            else if (this.configuration.device == null) {
                this.error = new Message(MessageType.ConfigurationDeviceNotDefinedError, this.driver.name());
            }
            else {
                for (let index = 0; index < this.commands.length; index++) {
                    let command = this.commands[index];
                    this.input(command);
                    if (command.isValid) {
                        continue;
                    }
                    this.error = new Message(MessageType.CommandInvalid, this.driver.name(), command.request, index);
                    break;
                }
            }
            if (this.error == null) {
                resolve(this);
            }
            else {
                reject(this);
            }
        });
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
        let commandLength = commandData.length + 2;
        command.isValid = !(commandLength > 250 && commandData[0] != 0x4D);
        if (command.isValid) {
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
    }

    private output(command: TremolElicomFPCommand, reply: ArrayBuffer) {
        command.reply = reply;
        if (reply == null || reply.byteLength < 6) {
            return;
        }
        command.replyData = new Uint8Array((reply as ArrayBuffer).slice(1, reply.byteLength));
        command.replyRaw = String.fromCharCode.apply(null, command.replyData);
    }

    private isEnabled(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this.bluetoothSerial.isEnabled().then(() => {
                resolve(true);
            }).catch(() => {
                this.error = new Message(MessageType.BluetoothNotEnabledError, this.driver.name());
                reject();
            });
        });
    }

    private isConnected(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this.bluetoothSerial.isConnected().then(() => {
                resolve(true);
            }).catch(() => {
                resolve(false);
            });
        });
    }

    private connect(isConnected: boolean): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (isConnected) {
                this.bluetoothSerial.disconnect().then(() => {
                }).catch((exception: string) => {
                    this.error = new Message(MessageType.BluetoothDisconnectError, this.driver.name(), exception, this.interval.duration());
                    reject();
                });
            }
            let connect = this.bluetoothSerial.connect(this.configuration.device.address).subscribe(() => {
                connect.unsubscribe();
                resolve(true);
            }, (exception: string) => {
                this.error = new Message(MessageType.BluetoothConnectError, this.driver.name(), exception, this.interval.duration());
                connect.unsubscribe();
                reject();
            });
        });
    }

    private write(command: TremolElicomFPCommand): Promise<boolean> {
        return new Promise((resolve, reject) => {
            command.interval = new Interval();
            let subscribeRawData = this.bluetoothSerial.subscribeRawData().subscribe((reply: ArrayBuffer) => {
                subscribeRawData.unsubscribe();
                this.output(command, reply);
                command.interval.endedOn = null;
                this.logMessage(this.configuration.logCommandResponse, Message.format(MessageType.CommandResponse, this.driver.name(), command.request, command.replyRaw, command.interval.endedOn, command.interval.duration()));
                resolve(true);
            }, (exception: string) => {
                this.error = new Message(MessageType.CommandError, this.driver.name(), command.request, exception, command.interval.endedOn, command.interval.duration());
                subscribeRawData.unsubscribe();
                reject();
            });
            this.bluetoothSerial.write(command.requestData).then((requestData: any) => {
                this.logMessage(this.configuration.logCommandSuccess, Message.format(MessageType.CommandSuccess, this.driver.name(), command.request, command.interval.endedOn, command.interval.duration()));
            }).catch((exception: string) => {
                this.error = new Message(MessageType.CommandError, this.driver.name(), command.request, exception, command.interval.endedOn, command.interval.duration());
                reject();
            });
        });
    }

    private disconnect(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this.bluetoothSerial.disconnect().then(() => {
                resolve(true)
            }).catch((exception: string) => {
                resolve(false);
            });
        });
    }

    public async handle(): Promise<ISequence> {
        let isConnected = false;
        try {
            await this.validate();
            let isEnabled = await this.isEnabled();
            if (isEnabled) {
                isConnected = await this.isConnected();
                isConnected = await this.connect(isConnected);
                if (isConnected) {
                    for (let index = 0; index < this.commands.length; index++) {
                        await this.write(this.commands[index]);
                    }
                }
                this.logMessage(this.configuration.logMessage, Message.format(MessageType.MethodEndMessage, this.driver.name(), this.method, this.interval.endedOn, this.interval.duration()));
            }
        }
        catch (exception) {
            this.logError(this.error);
        }
        finally {
            if (isConnected) {
                await this.disconnect();
            }
        }
        return new Promise<ISequence>((resolve, reject) => {
            if (this.error == null) {
                resolve(this);
            }
            else {
                reject(this);
            }
        });
    }

}