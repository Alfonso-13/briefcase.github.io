import { Component, Input, ViewChild } from '@angular/core';
import { PersonalData } from 'src/app/interface/personal-data';
import { IonPopover } from '@ionic/angular';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent {
  @Input() personalData: PersonalData;

  @ViewChild('contactMenu', { static: true }) contactMenu: IonPopover;

  openContactMenu(ev: Event) {
    this.contactMenu.event = ev;
    this.contactMenu.present();
  }
}
