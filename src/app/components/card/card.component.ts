import { Component, Input } from '@angular/core';
import { CardData } from 'src/app/interface/card-data';

@Component({
  selector: 'app-card',
  standalone: false,
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.scss'],
})
export class CardComponent {
  @Input() cardData: CardData;
}
