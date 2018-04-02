import { IDriver } from "../driver";
import { Configuration } from "../configuration";
import { IReceipt } from "../model/receipt";
import { IVat } from "../model/vat";
import { ITender } from "../model/tender";
import { Response, ResponseType } from "../response";
import { BluetoothSerial } from "@ionic-native/bluetooth-serial";
import { TremolElicomFPCommand } from "./tremol.elicom.fp.command";

export class TremolElicomFPDriver implements IDriver {

    constructor(private bluetoothSerial: BluetoothSerial) {
    }

    private resolve(configuration: Configuration, response: Response, resolve) {
        response.handle();
        if (configuration.logEvent) {
            response.logEnd();
        }
        resolve(response);
    }

    private reject(configuration: Configuration, response: Response, reject) {
        if (configuration.logError) {
            response.logError();
        }
        reject(response);
    }

    private check(configuration: Configuration, response: Response, reject): boolean {
        let check = false;
        if (configuration == null) {
            response.handle(ResponseType.ConfigurationNotDefined, response.driver);
            this.reject(configuration, response, reject);
        }
        else if (configuration.device == null) {
            response.handle(ResponseType.ConfigurationDeviceNotDefined, response.driver);
            this.reject(configuration, response, reject);
        }
        else {
            if (configuration.logEvent) {
                response.logStart();
            }
            check = true;
            if (response.commands != null) {
                for (let index = 0; index < response.commands.length; index++) {
                    let command = new TremolElicomFPCommand(response.commands[index].request);
                    let valid = command != null && command.write();
                    response.commands[index] = command
                    if (valid) {
                        continue;
                    }
                    check = false;
                    response.handle(ResponseType.CommandInvalid, command.request, index, response.driver);
                    this.reject(configuration, response, reject);
                    break;
                }
            }
        }
        return check;
    }

    private rejectDisconnect(configuration: Configuration, response: Response, exception: string, reject) {
        response.handle(ResponseType.BluetoothDisconnectError, exception, response.driver, response.duration());
        this.reject(configuration, response, reject);
    }

    private bluetoothDisconnect(configuration: Configuration, response: Response, resolve, reject) {
        this.bluetoothSerial.disconnect().then(() => {
            this.resolve(configuration, response, resolve);
        }).catch((exception: string) => {
            this.rejectDisconnect(configuration, response, exception, reject);
        });
    }

    private bluetoothWrite(configuration: Configuration, response: Response, command: TremolElicomFPCommand, reject) {
        this.bluetoothSerial.write(command.requestData).then((requestData: any) => {

        }).catch((exception: string) => {
            this.rejectDisconnect(configuration, response, exception, reject);
        });
    }

    private bluetoothConnect(configuration: Configuration, response: Response, resolve, reject) {
        let connect = this.bluetoothSerial.connect(configuration.device.address).subscribe(() => {
            connect.unsubscribe();
            if (response.commands != null && response.commands.length > 0) {
                let commandIndex = 0;
                let subscribeRawData = this.bluetoothSerial.subscribeRawData().subscribe((responseData: ArrayBuffer) => {
                    if (commandIndex == response.commands.length - 1) {
                        subscribeRawData.unsubscribe();
                    }
                    let command = response.commands[commandIndex] as TremolElicomFPCommand;
                    command.read(responseData);
                    //TO DO handle response
                    //TO DO log command
                    commandIndex++;
                }, (exception: string) => {
                    subscribeRawData.unsubscribe();
                    response.commandSubscribeRawDataErrorIndex = commandIndex;
                    //TO DO handle error
                    //TO DO log command
                    commandIndex++;
                });
                for (let index = 0; index < response.commands.length; index++) {
                    let command = response.commands[index] as TremolElicomFPCommand;
                    this.bluetoothSerial.write(command.requestData).then((requestData: any) => {
                        //TO DO log command
                    }).catch((exception: string) => {
                        response.commandWriteErrorIndex = index;
                        //TO DO handle error
                        //TO DO log command
                    });
                }
            }
            this.bluetoothDisconnect(configuration, response, resolve, reject)
        }, (exception: string) => {
            connect.unsubscribe();
            response.handle(ResponseType.BluetoothConnectError, exception, response.driver, response.duration());
            this.reject(configuration, response, reject);
        });
    }

    private request(configuration: Configuration, response: Response) {
        return new Promise((resolve, reject) => {
            if (this.check(configuration, response, reject)) {
                this.bluetoothSerial.isEnabled().then(() => {
                    this.bluetoothSerial.isConnected().then(() => {
                        this.bluetoothSerial.disconnect().then(() => {
                            this.bluetoothConnect(configuration, response, resolve, reject);
                        }).catch((exception: string) => {
                            this.rejectDisconnect(configuration, response, exception, reject);
                        });
                    }).catch(() => {
                        this.bluetoothConnect(configuration, response, resolve, reject);
                    });
                }).catch(() => {
                    response.handle(ResponseType.BluetoothNotEnabled);
                    this.reject(configuration, response, reject);
                });
            }
        });
    }

    name(): string {
        return 'Tremol Elicom FP v1.0';
    }

    verify(configuration: Configuration) {
        let response = new Response(this.name(), 'verify');
        return this.request(configuration, response);
    }

    print(configuration: Configuration, receipt: IReceipt, vats: Array<IVat>, tenders: Array<ITender>) {
        let response = new Response(this.name(), 'print');
        return new Promise((resolve, reject) => {
            if (this.check(configuration, response, reject)) {
                response.handle(ResponseType.MethodNotImplemented, response.method, response.driver);
                this.reject(configuration, response, reject);
            }
        });
    }

    printX(configuration: Configuration) {
        let response = new Response(this.name(), 'printX', [{request: 'IZ', reply: null}]);
        return this.request(configuration, response);
    }

    printZ(configuration: Configuration) {
        let response = new Response(this.name(), 'printZ');
        return new Promise((resolve, reject) => {
            if (this.check(configuration, response, reject)) {
                response.handle(ResponseType.MethodNotImplemented, response.method, response.driver);
                this.reject(configuration, response, reject);
            }
        });
    }

}