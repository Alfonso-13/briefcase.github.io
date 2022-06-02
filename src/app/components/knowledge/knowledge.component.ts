import { Component, OnInit } from '@angular/core';
import { CardData } from 'src/app/interface/card-data';
import { DataService } from 'src/app/services/data.service';

@Component({
  selector: 'app-knowledge',
  templateUrl: './knowledge.component.html',
  styleUrls: ['./knowledge.component.scss'],
})
export class KnowledgeComponent implements OnInit {

  knowledgeCards: any[];
  listCards: CardData[];

  constructor(
    private dataService: DataService
  ) { }

  ngOnInit() {
    this.dataService.getKnowledgeData().subscribe(
      response => {
        this.knowledgeCards = response;
        this.listCards = []
        this.knowledgeCards.forEach(card => {
          this.listCards.push(this.knowledgeDatatoCard(card));
        });
        console.log('this.knowledgeCards', this.knowledgeCards);
      }
    );
  }

  knowledgeDatatoCard(data: any): CardData {
    return {
      header: data.name,
      avatarImgPath: data.image,
      listChips: !data.knowledge ? [] : data.knowledge.map(x =>  {
        return {
          "name": x.name,
          "chips" :x.experience.map( y => {
            return {
              "title" : y.title,
              "subtitle" : y.time
            }            
          })
        };        
      }) 
      /*[
        {
          name: 'Basics',
          chips: [
            { title: 'test 1', subtitle: '7 YEARS' },
            { title: 'test 2', subtitle: '6 YEARS' },
            { title: 'test 3', subtitle: '5 YEARS' }
          ]
        },
        {
          name: 'Frameworks',
          chips: [
            { title: 'test 1', subtitle: '7 YEARS' },
            { title: 'test 2', subtitle: '6 YEARS' },
            { title: 'test 3', subtitle: '5 YEARS' }
          ]
        }
      ]*/
    }
  }
}