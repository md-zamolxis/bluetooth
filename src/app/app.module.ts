import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule } from '@angular/core';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';

import { Bluetooth } from './app.component';
import { HomePage } from '../pages/home/home';
import { DevicesPage } from '../pages/devices/devices';

import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { BluetoothSerial } from '@ionic-native/bluetooth-serial';

@NgModule({
  declarations: [
    Bluetooth,
    HomePage,
    DevicesPage
  ],
  imports: [
    BrowserModule,
    IonicModule.forRoot(Bluetooth),
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    Bluetooth,
    HomePage,
    DevicesPage
  ],
  providers: [
    StatusBar,
    SplashScreen,
    BluetoothSerial,
    {provide: ErrorHandler, useClass: IonicErrorHandler}
  ]
})
export class AppModule {}
