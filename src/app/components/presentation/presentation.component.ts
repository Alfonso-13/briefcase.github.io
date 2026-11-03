import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { CardData } from 'src/app/interface/card-data';
import { PresentationData } from 'src/app/interface/presentation-data';
import { DataService } from 'src/app/services/data.service';
import { combineLatest } from 'rxjs';
import { LanguageService } from 'src/app/services/language.service';

@Component({
  selector: 'app-presentation',
  standalone: false,
  templateUrl: './presentation.component.html',
  styleUrls: ['./presentation.component.scss'],
})
export class PresentationComponent implements OnInit {
  @Input() title = 'Presentation';
  listCards: CardData[];
  presentationData: PresentationData[];

  constructor(
    private dataService: DataService,
    private changeDetector: ChangeDetectorRef,
    private language: LanguageService
  ) {}

  ngOnInit(): void {
    combineLatest([
      this.dataService.getPresentationData(),
      this.language.language$,
    ]).subscribe(([response, language]) => {
      this.presentationData = response;
      this.listCards = this.presentationData.map((data) =>
        this.presentationDataToCard(data, language === 'es')
      );
      this.changeDetector.detectChanges();
    });
  }

  presentationDataToCard(presentationData: PresentationData, spanish = false): CardData {
    return {
      avatarImgPath: presentationData.avatarImgPath,
      header: spanish ? presentationData.headerEs || presentationData.header : presentationData.header,
      title: spanish ? presentationData.titleEs || presentationData.title : presentationData.title,
      subtitle: spanish ? presentationData.subtitleEs || presentationData.subtitle : presentationData.subtitle,
      content: spanish ? presentationData.contentEs || presentationData.content : presentationData.content,
    };
  }
}
