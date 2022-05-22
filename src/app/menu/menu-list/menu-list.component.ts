import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { MenuItem } from 'src/app/interface/menuItem';

@Component({
  selector: 'app-menu-list',
  templateUrl: './menu-list.component.html',
  styleUrls: ['./menu-list.component.scss'],
})
export class MenuListComponent {

  @Input() pages: Observable<MenuItem[]>;
  
  constructor(
    private router: Router) { 

  }
}
