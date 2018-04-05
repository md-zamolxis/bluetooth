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

  public selectedDevice: IDevice;
  public devices: Array<IDevice>;

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
    sequence.interval.end();
    this.show(Message.format(DevicesPageMessageType.MethodSuccess, sequence.driver.name(), sequence.method, sequence.interval.duration()));
  }

  private error(sequence: ISequence) {
    sequence.interval.end();
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
        configuration.logMessage = configuration.logError = configuration.logCommandRequest = configuration.logCommandResponse = true;
        configuration.timeout = 1000;
        let buttons = Array<any>();
        buttons.push({
          text: 'Status',
          handler: () => {
            this.load();
            driver.status(configuration).then((sequence: ISequence) => {
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
  
}
