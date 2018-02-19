import { Component } from '@angular/core';
import { NavController, NavParams, Platform, ActionSheetController } from 'ionic-angular';
import { BluetoothSerial } from '@ionic-native/bluetooth-serial';

@Component({
  selector: 'page-command',
  templateUrl: 'command.html'
})
export class CommandPage {
  selectedItem: any;
  icons: string[];
  items: Array<{ code: number, title: string, note: string, icon: string }>;

  constructor(
    public navController: NavController,
    public navParams: NavParams,
    private bluetoothSerial: BluetoothSerial,
    private platform: Platform,
    public actionSheetController: ActionSheetController) {
    this.selectedItem = navParams.get('item');
    this.items = [
      { code: 0, title: "Enable", note: "Bluetooth Enable", icon: "bluetooth" },
      { code: 1, title: "List", note: "Bluetooth List", icon: "bluetooth" }
    ];
  }

  async itemTapped(event, item) {
    this.navController.push(CommandPage, {
      item: item
    });
    let enable = await this.enable();
    if (enable != null) return;
    switch (item.code) {
      case 0: {
        if (enable == null) {
          console.log("Bluetooth enabled.");
        }
        break;
      }
      case 1: {
        await this.list();
        break;
      }
    }
  }

  enablePromise() {
    return new Promise((resolve, reject) => {
      this.platform.ready().then(() => {
        this.bluetoothSerial.isEnabled().then(() => {
          resolve();
        }).catch(() => {
          this.bluetoothSerial.enable().then(() => {
            resolve();
          }).catch(exception => {
            reject("Bluetooth not enabled due error: " + exception);
          })
        })
      }).catch(exception => {
        reject("Platform not ready due error: " + exception);
      })
    });
  }

  async enable() {
    let enable = null;
    try {
      await this.enablePromise();
    }
    catch (exception) {
      enable = exception;
      console.error(exception);
    }
    return enable;
  }

  async list() {
    let list = await this.bluetoothSerial.list();
    let buttons = Array<any>();
    list.map(device => {
      buttons.push({
        text: device.name,
        handler: () => {
          this.connect(device);
        }
      })
    });
    buttons.push({
      text: 'Cancel',
      role: 'cancel'
    });
    let actionSheet = this.actionSheetController.create({
      title: 'Devices',
      buttons: buttons
    });
    actionSheet.present();
  }

  connectSubscribe(device: any, resolve, reject) {
    this.bluetoothSerial.connect(device.address).subscribe(() => {
      resolve();
    }, exception => {
      reject("Bluetooth device not connected due error: " + exception);
    });
  }

  connectPromise(device: any) {
    return new Promise((resolve, reject) => {
      this.bluetoothSerial.isConnected().then(isConnected => {
        this.bluetoothSerial.disconnect().then(() => {
          this.connectSubscribe(device, resolve, reject);
        }).catch(exception => {
          reject("Bluetooth device not disconnected due error: " + exception);
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
      console.log("Device connected.");
    }
    catch (exception) {
      connect = exception;
      console.error(exception);
    }
    return connect;
  }

  initNativeHardware() {
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
                this.bluetoothSendCommand(" ");
                this.bluetoothSendCommand("9");
                this.bluetoothSendCommand("01;0   ;0;0;0");
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

  bluetoothSendCommand(command: string = "") {

    let data_cmd: Array<number> = [];
    // var url = " ";
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
