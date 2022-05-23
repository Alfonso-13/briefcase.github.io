import { Component } from '@angular/core';
import { Platform } from '@ionic/angular';
import { DataService } from './services/data.service';
import { Observable } from 'rxjs';
import { PersonalData } from './interface/personal-data';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {
  
  personalData: PersonalData;
  
  constructor(
    private platform: Platform,    
    private dataService: DataService
  ) {
    this.initializeApp();
  }

  async initializeApp() {
    this.platform.ready().then( async () => {
       this.dataService.getPersonalData().subscribe(
         response => {          
          this.personalData = response;
          console.log('this.presentationData', this.personalData);
         }
       );
    });
  }
}
