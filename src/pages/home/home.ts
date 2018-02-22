import { Component } from '@angular/core';
import { NavController, Platform, Toast, ToastController, Loading, LoadingController } from 'ionic-angular';
import { BluetoothSerial } from '@ionic-native/bluetooth-serial';
import { Response } from '../../bluetooth.serial.driver/response';

export enum HomePageMessageType {
  PlatformNotReady = 'Platfor not ready due [${0}] error.',
  BluetoothEnabled = 'Bluetooth enabled.',
  BluetoothDisabled = 'Bluetooth disabled.',
  BluetoothCannotEnable = 'Bluetooth cannot enable due [{0}] error.'
}

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  toast: Toast;
  loading: Loading;
  ready: boolean;
  enabled: boolean;

  constructor(
    public navCtrl: NavController,
    public platform: Platform,
    public bluetoothSerial: BluetoothSerial,
    public toastCtrl: ToastController,
    public loadingController: LoadingController) {
    this.check();
  }

  load() {
    this.toast = this.toastCtrl.create({
      position: 'bottom',
      duration: 3000
    });
    this.loading = this.loadingController.create({
      content: 'Please wait...'
    });
    this.loading.present();
  }

  show(message?: string) {
    this.loading.dismiss();
    if (message == undefined) {
      return;
    }
    this.toast.setMessage(message);
    this.toast.present();
  }

  check() {
    this.load();
    this.platform.ready().then(() => {
      this.ready = true;
      this.bluetoothSerial.isEnabled().then(() => {
        this.enabled = true;
        this.show(HomePageMessageType.BluetoothEnabled);
      }).catch((exception: string) => {
        this.enabled = false;
        this.show(HomePageMessageType.BluetoothDisabled);
      });
    }).catch((exception: string) => {
      this.ready = false;
      this.enabled = false;
      this.show(Response.format(HomePageMessageType.PlatformNotReady, exception));
    });
  }

  change() {
    this.load();
    this.platform.ready().then(() => {
      this.ready = true;
      this.bluetoothSerial.isEnabled().then(() => {
        this.enabled = true;
        this.show(HomePageMessageType.BluetoothEnabled);
      }).catch((exception: string) => {
        this.bluetoothSerial.enable().then(() => {
          this.enabled = true;
          this.show(HomePageMessageType.BluetoothEnabled);
        }).catch((exception: string) => {
          this.enabled = false;
          this.show(Response.format(HomePageMessageType.BluetoothCannotEnable, exception));
        });
      });
    }).catch((exception: string) => {
      this.ready = false;
      this.enabled = false;
      this.show(Response.format(HomePageMessageType.PlatformNotReady, exception));
    });
  }

}
