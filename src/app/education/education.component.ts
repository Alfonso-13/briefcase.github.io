import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { CardData } from '../interface/card-data';
import { DataService } from '../services/data.service';
import { EducationData } from '../interface/education-data';
import { combineLatest } from 'rxjs';
import { LanguageService } from '../services/language.service';

@Component({
  selector: 'app-education',
  standalone: false,
  templateUrl: './education.component.html',
  styleUrls: ['./education.component.scss'],
})
export class EducationComponent implements OnInit {
  @Input() title = 'Education';

  educationCards: EducationData[];
  listCards: CardData[];

  constructor(
    private dataService: DataService,
    private changeDetector: ChangeDetectorRef,
    private language: LanguageService
  ) {}

  ngOnInit() {
    combineLatest([
      this.dataService.getEducationData(),
      this.language.language$,
    ]).subscribe(
      ([response, language]) => {
        this.educationCards = response;
        this.listCards = this.educationCards.map((card) =>
          this.educationDatatoCard(card, language === 'es')
        );
        this.changeDetector.detectChanges();
      }
    );
  }

  educationDatatoCard(data: EducationData, spanish = false): CardData {
    return  {
      header: spanish ? data.nameEs || data.name : data.name,
      title: spanish ? data.titleEs || data.title : data.title,
      subtitle: spanish ? data.subtitleEs || data.subtitle : data.subtitle,
      contentHtml: spanish ? data.descriptionEs || data.description : data.description,
      avatarImgPath: data.image
    };
  }
}
