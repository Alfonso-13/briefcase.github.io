import { Component } from '@angular/core';
import { LoadingController, Platform } from '@ionic/angular';
import { DataService } from './services/data.service';
//import { Device } from '@capacitor/device';
import { MenuItem } from './interface/menuItem';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {
  componentes: Observable<MenuItem[]>;
  personalData: any;

  constructor(
    private platform: Platform,    
    private dataService: DataService
  ) {
    this.initializeApp();
  }

  async initializeApp() {
    this.platform.ready().then( async () => {
      this.componentes = this.dataService.getMenuOpts();      
       this.dataService.getPersonalData().subscribe(
         response => {          
          this.personalData = response;
          console.log('this.presentationData', this.personalData);
         }
       );
    });
  }
}
