import { Component, Input } from '@angular/core';
import { CardData } from 'src/app/interface/card-data';

@Component({
  selector: 'app-slide-cards',
  standalone: false,
  templateUrl: './slide-cards.component.html',
  styleUrls: ['./slide-cards.component.scss'],
})
export class SlideCardsComponent {
  @Input() title = '';
  @Input() listCards: CardData[] = [];
}
