import { Component } from '@angular/core';
import { NavController, NavParams, ActionSheetController, Toast, ToastController, Loading, LoadingController } from 'ionic-angular';
import { BluetoothSerial } from '@ionic-native/bluetooth-serial';
import { TremolElicomFPDriver } from '../../bluetooth.serial.driver/tremol.elicom.fp/tremol.elicom.fp.driver';
import { Configuration } from '../../bluetooth.serial.driver/configuration';
import { IDevice } from '../../bluetooth.serial.driver/device';
import { Message } from '../../bluetooth.serial.driver/message';
import { ISequence } from '../../bluetooth.serial.driver/sequence';

export enum DevicesPageMessageType {
  BluetoothListError = 'Bluetooth list cannot load due [{0}] error.',
  MethodSuccess = 'Driver [{0}]: success - method [{1}] has successfully been invoked in [{2}] milliseconds.',
  MethodError = 'Driver [{0}]: error - exception [{1}] has been raised in [{2}] milliseconds.'
}

@Component({
  selector: 'page-devices',
  templateUrl: 'devices.html'
})
export class DevicesPage {

  private toast: Toast;
  private loading: Loading;
  private selectedDevice: IDevice;
  private devices: Array<IDevice>;

  constructor(public navController: NavController,
    public navParams: NavParams,
    public bluetoothSerial: BluetoothSerial,
    public actionSheetController: ActionSheetController,
    public toastCtrl: ToastController,
    public loadingController: LoadingController) {
    this.selectedDevice = navParams.get('device');
    this.list();
  }

  private list() {
    this.load();
    this.bluetoothSerial.list().then(devices => {
      this.devices = devices;
      this.show();
    }).catch((exception: string) => {
      this.show(Message.format(DevicesPageMessageType.BluetoothListError, exception));
    });
  }

  private load() {
    this.toast = this.toastCtrl.create({
      position: 'bottom',
      duration: 3000
    });
    this.loading = this.loadingController.create({
      content: 'Please wait...'
    });
    this.loading.present();
  }

  private show(message?: string) {
    this.loading.dismiss();
    if (message == undefined) {
      return;
    }
    this.toast.setMessage(message);
    this.toast.present();
  }

  private success(sequence: ISequence) {
    this.show(Message.format(DevicesPageMessageType.MethodSuccess, sequence.driver.name(), sequence.method, sequence.interval.duration()));
  }

  private error(sequence: ISequence) {
    this.show(Message.format(DevicesPageMessageType.MethodError, sequence.driver.name(), sequence.error.value, sequence.interval.duration()));
  }

  public deviceTapped(event, device) {
    this.navController.setRoot(DevicesPage, {
      device: device
    });
    switch (device.name) {
      case "ZK00809320": {
        let driver = new TremolElicomFPDriver(this.bluetoothSerial);
        let configuration = new Configuration(device);
        configuration.logMessage = configuration.logError = configuration.logCommandResponse = configuration.logCommandSuccess = true;
        let buttons = Array<any>();
        buttons.push({
          text: 'Verify',
          handler: () => {
            this.load();
            driver.verify(configuration).then((sequence: ISequence) => {
              this.success(sequence);
            }).catch((sequence: ISequence) => {
              this.error(sequence);
            });
          }
        });
        buttons.push({
          text: 'Print',
          handler: () => {
            this.load();
            driver.print(configuration, null, null, null).then((sequence: ISequence) => {
              this.success(sequence);
            }).catch((sequence: ISequence) => {
              this.error(sequence);
            });
          }
        });
        buttons.push({
          text: 'PrintX',
          handler: () => {
            //this.initNativeHardware();
            this.load();
            driver.printX(configuration).then((sequence: ISequence) => {
              this.success(sequence);
            }).catch((sequence: ISequence) => {
              this.error(sequence);
            });
          }
        });
        buttons.push({
          text: 'PrintZ',
          handler: () => {
            this.load();
            driver.printZ(configuration).then((sequence: ISequence) => {
              this.success(sequence);
            }).catch((sequence: ISequence) => {
              this.error(sequence);
            });
          }
        });
        buttons.push({
          text: 'Cancel',
          role: 'cancel'
        });
        let actionSheet = this.actionSheetController.create({
          title: 'Actions',
          buttons: buttons
        });
        actionSheet.present();
        break;
      }
    }
  }
  /*
    writePromise(command: string) {
      let message = new Message('BluetoothSerial');
      message.command = command;
      return new Promise((resolve, reject) => {
        let subscribeRawData = this.bluetoothSerial.subscribeRawData().subscribe((responseData: ArrayBuffer) => {
          message.read(responseData);
          subscribeRawData.unsubscribe();
          resolve(message);
        }, exception => {
          subscribeRawData.unsubscribe();
          reject(message.init('subscribeRawData', exception));
        });
        if (!message.write(message.command)) {
          reject(message.init('write', 'Bad command.'));
        }
        this.bluetoothSerial.write(message.requestData).then(requestRaw => {
          message.requestRaw = requestRaw;
        }).catch(exception => {
          reject(message.init('write', exception));
        });
      });
      //return message;
    }
  
    async write() {
      let write = null;
      try {
        //await this.connectPromise(this.device);
        let message = await this.writePromise(' ');
        console.log(Message.formatCommand(message));
        message = await this.writePromise('9');
        console.log(Message.formatCommand(message));
        message = await this.writePromise('01;0   ;0;0;0');
        console.log(Message.formatCommand(message));
      }
      catch (exception) {
        write = exception;
        console.error(Message.formatException(exception));
      }
      return write;
    }
  
    initNativeHardware() {
        this.bluetoothSerial.list().then((list: Array<any>) => {
          if (list && list.length > 0) {
            this.bluetoothSerial.connect(list.find(x => x.name == 'ZK00809320').address).subscribe(res => {
              console.log(res);
              this.bluetoothSerial.isConnected().then(isConnected => {
                console.log('isConnected', isConnected);
                if (isConnected) {
                  this.bluetoothSerial.subscribeRawData().subscribe((raw: ArrayBuffer) => {
                    console.log('raw', raw);
                    if (raw == null || raw.byteLength < 6) {
                      return;
                    }
                    debugger;
                    //var raw_data = new ArrayBuffer(raw.Length - 1);
                    this.raw_data = new Uint8Array((raw as ArrayBuffer).slice(1, raw.byteLength));
                    const paper = this.IsHigh(1, 0);
                    const ReadOnlyFiscalMemory = this.IsHigh(0, 0);
                    const OpenFiscalReceipt = this.IsHigh(2, 1);
                    //Array.Copy(data, 1, raw_data, 0, raw_data.Length);
                  })
                  this.bluetoothSendCommand('|X');
                  //this.bluetoothSendCommand(' ');
                  //this.bluetoothSendCommand('9');
                  //this.bluetoothSendCommand('01;0   ;0;0;0');
                }
              })
            }, err => {
              console.log('bluetoothSerial.connect', err);
            })
          }
          console.log(list);
          //alert(JSON.stringify(list));
        }).catch(err => {
          console.log(err);
        })
    }
  
    raw_data: Uint8Array;
    cmd_id: number = 0;
    next_cmd_id: number = 0;
    STX: number = 2;
    ETX: number = 10;
  
    private IsHigh(byteIndex: number, bitIndex: number): boolean {
      return (this.raw_data[byteIndex] & (1 << bitIndex)) != 0;
    }
  
    MakeCRC(data: Array<number>, start: number, len: number) {
      let crc = 0;
  
      for (let i: number = 0; i < len; i++) {
        crc ^= data[start + i];
      }
      data[start + len] = ((crc >> 4) | '0'.charCodeAt(0));
      data[start + len + 1] = ((crc & 15) | '0'.charCodeAt(0));
    }
  
    bluetoothSendCommand(command: string = '') {
  
      let data_cmd: Array<number> = [];
      // var url = ' ';
      // var data = [];
      for (let i = 0; i < command.length; i++) {
        data_cmd.push(command.charCodeAt(i));
      }
      const data_len = data_cmd.length + 2;
      if (data_len > 250 && data_cmd[0] != 0x4D) {
        debugger;
        //throw new FPException(FPLibError.BAD_INPUT_DATA);
      }
  
      let data = new Array(data_cmd.length + 6);
  
      for (let index = 0; index < data.length; index++) {
        data[index] = 0;
      }
  
      this.cmd_id = (((++this.next_cmd_id) % 0x7F) + 0x20);
      data[0] = this.STX;
      data[1] = (data_len + 0x20);
      data[2] = this.cmd_id;
  
      // data_cmd = data_cmd.slice(0, 3);
  
      for (let index = 0; index < data.length; index++) {
        const element = data[index];
        if (index >= 3) {
          data[index] = data_cmd.shift();
        }
      }
      //    data = data.concat(data_cmd);
  
  
      // this.raw_data = new Uint8Array((raw as ArrayBuffer).slice(1, raw.byteLength - 1));
  
      //  debugger;
  
      // Array.Copy(data_cmd, 0, data, 3, data_cmd.Length);
      this.MakeCRC(data, 1, data_len);
      data[data.length - 1] = this.ETX;
      // last_response_raw = null;
      this.bluetoothSerial.write(data).then(writed => {
        console.log('writed', writed);
        this.bluetoothSerial.read().then(readed => {
          console.log('readed', readed);
        }).catch(err => {
          console.log(err);
        })
      }).catch(err => {
        console.log(err);
      })
    }
  */
}
