import { IDriver } from "../driver";
import { Configuration } from "../configuration";
import { IReceipt } from "../model/receipt";
import { IVat } from "../model/vat";
import { ITender } from "../model/tender";
import { Response, ResponseType } from "../response";
import { BluetoothSerial } from "@ionic-native/bluetooth-serial";

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
        }
        return check;
    }

    private disconnect(configuration: Configuration, response: Response, exception: string, reject) {
        response.handle(ResponseType.BluetoothDisconnectError, exception, response.driver, response.duration());
        this.reject(configuration, response, reject);
    }

    private connect(configuration: Configuration, response: Response, resolve, reject) {
        let connect = this.bluetoothSerial.connect(configuration.device.address).subscribe(() => {
            connect.unsubscribe();
            this.bluetoothSerial.disconnect().then(() => {
                this.resolve(configuration, response, resolve);
            }).catch((exception: string) => {
                this.disconnect(configuration, response, exception, reject);
            });
        }, (exception: string) => {
            connect.unsubscribe();
            response.handle(ResponseType.BluetoothConnectError, exception, response.driver, response.duration());
            this.reject(configuration, response, reject);
        });
    }

    name(): string {
        return 'Tremol Elicom FP v1.0';
    }

    verify(configuration: Configuration) {
        let response = new Response(this.name(), 'verify');
        return new Promise((resolve, reject) => {
            if (this.check(configuration, response, reject)) {
                this.bluetoothSerial.isEnabled().then(() => {
                    this.bluetoothSerial.isConnected().then(() => {
                        this.bluetoothSerial.disconnect().then(() => {
                            this.connect(configuration, response, resolve, reject);
                        }).catch((exception: string) => {
                            this.disconnect(configuration, response, exception, reject);
                        });
                    }).catch(() => {
                        this.connect(configuration, response, resolve, reject);
                    });
                }).catch(() => {
                    response.handle(ResponseType.BluetoothNotEnabled);
                    this.reject(configuration, response, reject);
                });
            }
        });
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
        let response = new Response(this.name(), 'printX');
        return new Promise((resolve, reject) => {
            if (this.check(configuration, response, reject)) {
                response.handle(ResponseType.MethodNotImplemented, response.method, response.driver);
                this.reject(configuration, response, reject);
            }
        });
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