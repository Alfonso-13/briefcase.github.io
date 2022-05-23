import { Component, Input } from '@angular/core';
import { PersonalData } from 'src/app/interface/personal-data';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent{

  @Input() personalData: PersonalData;

}
