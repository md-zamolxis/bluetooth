import { Component } from '@angular/core';
import { NavController, Platform, Toast, ToastController, Loading, LoadingController } from 'ionic-angular';
import { BluetoothSerial } from '@ionic-native/bluetooth-serial';
import { Message } from '../../bluetooth.serial.driver/message';

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

  private toast: Toast;
  private loading: Loading;
  private ready: boolean;
  private enabled: boolean;

  constructor(
    public navCtrl: NavController,
    public platform: Platform,
    public bluetoothSerial: BluetoothSerial,
    public toastCtrl: ToastController,
    public loadingController: LoadingController) {
    this.check();
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

  private check() {
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
      this.show(Message.format(HomePageMessageType.PlatformNotReady, exception));
    });
  }

  public change() {
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
          this.show(Message.format(HomePageMessageType.BluetoothCannotEnable, exception));
        });
      });
    }).catch((exception: string) => {
      this.ready = false;
      this.enabled = false;
      this.show(Message.format(HomePageMessageType.PlatformNotReady, exception));
    });
  }

}
