import { Component } from '@angular/core';
import { NavController, NavParams, Platform } from 'ionic-angular';
import { BluetoothSerial } from '@ionic-native/bluetooth-serial';

@Component({
  selector: 'page-list',
  templateUrl: 'list.html'
})
export class ListPage {
  selectedItem: any;
  icons: string[];
  items: Array<{code: number, title: string, note: string, icon: string}>;
  isPlatforReady: boolean;

  constructor(
    public navController: NavController, 
    public navParams: NavParams, 
    private bluetoothSerial: BluetoothSerial,
    private platform: Platform) {
      this.platform.ready().then(() => {
        this.selectedItem = navParams.get('item');
        this.items =[
          {code: 0, title: "Initialize", note: "Initialize Bluetooth", icon: "bluetooth"}
        ];
      }).catch(error => {
        this.isPlatforReady = false;
        console.log("Cannot initialize platform due error: " + error);
      });
  }

  itemTapped(event, item) {
    this.navController.push(ListPage, {
      item: item
    });
    if (item.code == 0){
      this.initialize();
    }
  }

  checkPlatfor(){
    if (!this.isPlatforReady){
      console.log("Platform not initialized.");
    }
  }

  initialize(){

  }

  initNativeHardware() {
    this.platform.ready().then(() => {
      this.bluetoothSerial.list().then((list : Array<any>) => {
        if (list && list.length > 0) {
          this.bluetoothSerial.connect(list.find(x=>x.name == 'ZK00809320').address).subscribe(res => {
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
