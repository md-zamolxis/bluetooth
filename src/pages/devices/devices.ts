import { Component } from '@angular/core';
import { NavController, NavParams, ActionSheetController, LoadingController } from 'ionic-angular';
import { BluetoothSerial } from '@ionic-native/bluetooth-serial';
import { Message } from '../../app/message';
import { TremolElicomFPDriver } from '../../bluetooth.serial.driver/tremol.elicom.fp/tremol.elicom.fp.driver';
import { Configuration } from '../../bluetooth.serial.driver/configuration';
import { IDevice } from '../../bluetooth.serial.driver/device';

@Component({
  selector: 'page-devices',
  templateUrl: 'devices.html'
})
export class DevicesPage {
  selectedDevice: IDevice;
  icons: string[];
  devices: Array<IDevice>;

  constructor(public navController: NavController,
    public navParams: NavParams,
    public bluetoothSerial: BluetoothSerial,
    public actionSheetController: ActionSheetController,
    public loadingCtrl: LoadingController) {
    this.selectedDevice = navParams.get('device');
    this.list();
  }

  deviceTapped(event, device) {
    this.navController.push(DevicesPage, {
      device: device
    });
    switch (device.name) {
      case "ZK00809320": {
        let buttons = Array<any>();
        buttons.push({
          text: 'Verify',
          handler: () => {
            let driver = new TremolElicomFPDriver(this.bluetoothSerial);
            let configuration = new Configuration(device);
            configuration.logEvent = true;
            configuration.logError = true;
            let loading = this.loadingCtrl.create({
              content: 'Please wait...'
            });
            loading.present();
            driver.verify(configuration).then(() => {
              loading.dismiss();
            }).catch(() => {
              loading.dismiss();
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

  list() {
    this.bluetoothSerial.list().then(devices => {
      this.devices = devices;
    }).catch(exception => {
      console.error(exception);
    });
  }

  connectSubscribe(device: any, resolve, reject) {
    let connectSubscribe = this.bluetoothSerial.connect(device.address).subscribe(() => {
      connectSubscribe.unsubscribe();
      resolve();
    }, exception => {
      connectSubscribe.unsubscribe();
      reject(Message.initException('BluetoothSerial', 'connect', exception));
    });
  }

  connectPromise(device: any) {
    return new Promise((resolve, reject) => {
      this.bluetoothSerial.isConnected().then(() => {
        this.bluetoothSerial.disconnect().then(() => {
          this.connectSubscribe(device, resolve, reject);
        }).catch(exception => {
          reject(Message.initException('BluetoothSerial', 'disconnect', exception));
        })
      }).catch(() => {
        this.connectSubscribe(device, resolve, reject);
      })
    });
  }

  async connect(device: any) {
    let connect = null;
    try {
      await this.connectPromise(device);
      console.log('Device connected.');
    }
    catch (exception) {
      connect = exception;
      console.error(Message.formatException(exception));
    }
    return connect;
  }

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

  /*initNativeHardware() {
    this.platform.ready().then(() => {
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
                this.bluetoothSendCommand(' ');
                this.bluetoothSendCommand('9');
                this.bluetoothSendCommand('01;0   ;0;0;0');
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
    })
  }*/

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

}
