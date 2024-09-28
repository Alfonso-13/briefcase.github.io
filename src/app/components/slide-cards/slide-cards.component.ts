import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { CardData } from 'src/app/interface/card-data';

// import Swiper core and required modules
import SwiperCore, { Pagination, Mousewheel } from "swiper";

// install Swiper modules
SwiperCore.use([Pagination, Mousewheel]);

@Component({
  selector: 'app-slide-cards',
  templateUrl: './slide-cards.component.html',
  styleUrls: ['./slide-cards.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class SlideCardsComponent implements OnInit {

  @Input()
  title: string;

  @Input()
  listCards: CardData[];

  constructor() { }

  ngOnInit() {}

  pagination = {
    clickable: true,
    renderBullet: function (index, className) {      
      return '<span class="' + className + '"></span>"';
    },
  };  

  mousewheel = {
    forceToAxis: true,
  };
}
