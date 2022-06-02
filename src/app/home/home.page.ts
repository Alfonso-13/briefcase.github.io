import { Component, ViewEncapsulation , ViewChild } from "@angular/core";
// import Swiper core and required modules
import SwiperCore, { Pagination } from "swiper";

// install Swiper modules
SwiperCore.use([Pagination]);

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class HomePage {

  constructor() {}

  pagination = {
    clickable: true,
    renderBullet: function (index, className) {
      let title=''
      let icon='';
      switch(index) {
        case 0:
          title='Presentation';
          icon ='<ion-icon name="person-circle-outline"></ion-icon>';
          break;
        case 1:
          title='Education';
          icon='<ion-icon name="briefcase-outline"></ion-icon>';
          break;
        case 2:
          title='Knowledge';
          icon ='<ion-icon name="list-outline"></ion-icon>';
          break;
      }
      return '' +
      '<span class="' + className + '" style="width: auto !important;">' +            
      icon + 
      '&nbsp' +
      title +       
      '</span>'
    },
  };

}
