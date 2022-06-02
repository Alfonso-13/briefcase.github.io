import { Component, OnInit } from '@angular/core';
import { CardData } from 'src/app/interface/card-data';
import { PresentationData } from 'src/app/interface/presentation-data';
import { DataService } from 'src/app/services/data.service';

@Component({
  selector: 'app-presentation',
  templateUrl: './presentation.component.html',
  styleUrls: ['./presentation.component.scss'],
})
export class PresentationComponent implements OnInit {

  listCards: CardData[];
  presentationData: PresentationData[];

  constructor(
    private dataService: DataService
  ) {}

  ngOnInit(): void {
    this.dataService.getPresentationData().subscribe(
      response => {
        this.presentationData = response;
        this.listCards = [];
        this.presentationData.forEach(presentationData => {          
          this.listCards.push(this.presentationDataToCard(presentationData));
        });
      }
    );
  }

  presentationDataToCard(presentationData: any): CardData {
    return {
      avatarImgPath: presentationData.avatarImgPath,
      header: presentationData.header,
      title: presentationData.title,
      subtitle: presentationData.subtitle,
      content: presentationData.content
    }
  }
}
