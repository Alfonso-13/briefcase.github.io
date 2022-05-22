import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent{

  @Input() title;
  @Input() backButton: boolean = false;
  @Input() defaultH: string = '/';

  constructor() { }
}
