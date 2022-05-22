import { Component, OnInit } from '@angular/core';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css']
})
export class FooterComponent implements OnInit {

  companyName: string = '';
  urlCompany: string;
  urlFace: string;
  urlDeveloper: string;

  constructor() { }

  ngOnInit(): void {
    /*
    this.companyName = environment.company;
    this.urlCompany = environment.urlCompany;
    this.urlFace = environment.urlFace;

    this.urlDeveloper = environment.urlDeveloper;
    */
  }

}
