import { Component, Input } from '@angular/core';
import { Observable } from 'rxjs';
import { MenuItem } from '../interface/menuItem';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss'],
})
export class MenuComponent{

  @Input()
  personalData: any;

  @Input()
  componentes: Observable<MenuItem[]>;
  
  constructor( ) { }
  
}
