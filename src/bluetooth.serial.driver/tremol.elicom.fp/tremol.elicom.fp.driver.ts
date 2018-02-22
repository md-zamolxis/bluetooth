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

    private invoke(configuration: Configuration, response: Response) {
        if (configuration == null) {
            response.handle(ResponseType.ConfigurationNotDefined, response.driver);
            throw response;
        }
        else if (configuration.device == null) {
            response.handle(ResponseType.ConfigurationDeviceNotDefined, response.driver);
            throw response;
        }
        else if (configuration.logEvent) {
            response.logStart();
        }
    }

    private resolvePromise(configuration: Configuration, response: Response, resolve) {
        response.handle();
        if (configuration.logEvent) {
            response.logEnd();
        }
        resolve(response);
    }

    private rejectPromise(configuration: Configuration, response: Response, reject) {
        if (configuration.logError) {
            response.logError();
        }
        reject(response);
    }

    private disconnect(configuration: Configuration, response: Response, exception: string, reject) {
        response.handle(ResponseType.BluetoothDisconnectError, exception, response.driver);
        this.rejectPromise(configuration, response, reject);
}

    private connect(configuration: Configuration, response: Response, resolve, reject) {
        let connect = this.bluetoothSerial.connect(configuration.device.address).subscribe(() => {
            connect.unsubscribe();
            this.bluetoothSerial.disconnect().then(() => {
                this.resolvePromise(configuration, response, resolve);
            }).catch((exception: string) => {
                this.disconnect(configuration, response, exception, reject);
            });
        }, (exception: string) => {
            connect.unsubscribe();
            response.handle(ResponseType.BluetoothConnectError, exception, response.driver);
            this.rejectPromise(configuration, response, reject);
        });
    }

    name(): string {
        return 'Tremol Elicom FP v1.0';
    }

    verify(configuration: Configuration) {
        let response = new Response(this.name(), 'verify');
        this.invoke(configuration, response);
        return new Promise((resolve, reject) => {
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
                this.rejectPromise(configuration, response, reject);
            });
        });
    }

    print(configuration: Configuration, receipt: IReceipt, vats: Array<IVat | any>, tenders: Array<ITender>) {
        let response = new Response(this.name(), 'print');
        response.handle(ResponseType.MethodNotImplemented, response.method, response.driver);
        throw response;
    }

    printX(configuration: Configuration) {
        let response = new Response(this.name(), 'printX');
        response.handle(ResponseType.MethodNotImplemented, response.method, response.driver);
        throw response;
    }

    printZ(configuration: Configuration) {
        let response = new Response(this.name(), 'printZ');
        response.handle(ResponseType.MethodNotImplemented, response.method, response.driver);
        throw response;
    }

}