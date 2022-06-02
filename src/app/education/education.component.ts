import { Component, OnInit } from '@angular/core';
import { CardData } from '../interface/card-data';
import { DataService } from '../services/data.service';

@Component({
  selector: 'app-education',
  templateUrl: './education.component.html',
  styleUrls: ['./education.component.scss'],
})
export class EducationComponent implements OnInit {

  educationCards: any[];
  listCards: CardData[];

  constructor(
    private dataService: DataService
  ) {}

  ngOnInit() {
    this.dataService.getEducationData().subscribe(
      response => {
        this.educationCards = response;
        this.listCards = []
        this.educationCards.forEach(educationCard => {
          this.listCards.push(this.educationDatatoCard(educationCard));
        });
        console.log('this.educationCards', this.educationCards);
        console.log('this.listCards', this.listCards);
      }
    );
  }

  educationDatatoCard(data: any): CardData {
    return  {     
      header: data.name,
      title: data.title,
      subtitle: data.subtitle,
      contentHtml : data.description,
      avatarImgPath: data.image
    }
  }
}
