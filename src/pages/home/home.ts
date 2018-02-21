import { Component } from '@angular/core';
import { NavController, Platform } from 'ionic-angular';
import { BluetoothSerial } from '@ionic-native/bluetooth-serial';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  ready: boolean;
  enabled: boolean;

  constructor(public navCtrl: NavController, public platform: Platform, public bluetoothSerial: BluetoothSerial) {
    this.check();
  }

  check() {
    this.ready = false;
    this.enabled = false;
    this.platform.ready().then(() => {
      this.ready = true;
      this.bluetoothSerial.isEnabled().then(() => {
        this.enabled = true;
      }).catch(exception => {
        console.error(exception);
      });
    }).catch(exception => {
      console.error(exception);
    });
  }

  change() {
    if (!this.ready) {
      return;
    }
    this.enabled = false;
    this.bluetoothSerial.isEnabled().then(() => {
      this.enabled = true;
    }).catch(exception => {
      this.bluetoothSerial.enable().then(() => {
        this.enabled = true;
      }).catch(exception => {
        console.error(exception);
      });
    });
  }

}
