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

  show() {
    this.toast = this.toastCtrl.create({
      position: 'bottom',
      duration: 3000
    });
    this.loading = this.loadingController.create({
      content: 'Please wait...'
    });
    this.loading.present();
  }

  check() {
    this.show();
    this.platform.ready().then(() => {
      this.ready = true;
      this.bluetoothSerial.isEnabled().then(() => {
        this.enabled = true;
        this.loading.dismiss();
        this.toast.setMessage(HomePageMessageType.BluetoothEnabled);
        this.toast.present();
      }).catch((exception: string) => {
        this.enabled = false;
        this.loading.dismiss();
        this.toast.setMessage(HomePageMessageType.BluetoothDisabled);
        this.toast.present();
      });
    }).catch((exception: string) => {
      this.ready = false;
      this.enabled = false;
      this.loading.dismiss();
      this.toast.setMessage(Response.format(HomePageMessageType.PlatformNotReady, exception));
      this.toast.present();
    });
  }

  change() {
    this.show();
    this.platform.ready().then(() => {
      this.ready = true;
      this.bluetoothSerial.isEnabled().then(() => {
        this.enabled = true;
        this.loading.dismiss();
        this.toast.setMessage(HomePageMessageType.BluetoothEnabled);
        this.toast.present();
      }).catch((exception: string) => {
        this.bluetoothSerial.enable().then(() => {
          this.enabled = true;
          this.loading.dismiss();
          this.toast.setMessage(HomePageMessageType.BluetoothEnabled);
          this.toast.present();
        }).catch((exception: string) => {
          this.enabled = false;
          this.loading.dismiss();
          this.toast.setMessage(Response.format(HomePageMessageType.BluetoothCannotEnable, exception));
          this.toast.present();
        });
      });
    }).catch((exception: string) => {
      this.ready = false;
      this.enabled = false;
      this.loading.dismiss();
      this.toast.setMessage(Response.format(HomePageMessageType.PlatformNotReady, exception));
      this.toast.present();
    });
  }

}
