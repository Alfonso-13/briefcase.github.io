import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { CardData } from 'src/app/interface/card-data';
import { KnowledgeCategory } from 'src/app/interface/knowledge-data';
import { DataService } from 'src/app/services/data.service';
import { combineLatest } from 'rxjs';
import { LanguageService } from 'src/app/services/language.service';

@Component({
  selector: 'app-knowledge-section',
  standalone: false,
  templateUrl: './knowledge-section.component.html',
  styleUrls: ['./knowledge-section.component.scss'],
})
export class KnowledgeSectionComponent implements OnInit {
  private readonly technologiesPerCard = 6;
  @Input() title = 'Knowledge';
  listCards: CardData[] = [];

  constructor(
    private readonly dataService: DataService,
    private readonly changeDetector: ChangeDetectorRef,
    private readonly language: LanguageService
  ) {}

  ngOnInit(): void {
    combineLatest([
      this.dataService.getKnowledgeData(),
      this.language.language$,
    ]).subscribe(([categories]) => {
      this.listCards = categories.flatMap((category) => this.categoryToCards(category));
      this.changeDetector.detectChanges();
    });
  }

  private categoryToCards(category: KnowledgeCategory): CardData[] {
    const technologies = category.knowledge.flatMap((group) =>
      group.experience.map((experience) => ({
        group: this.language.group(group.name),
        title: experience.title,
        subtitle: this.language.duration(experience.time),
      }))
    );
    const pageCount = Math.max(1, Math.ceil(technologies.length / this.technologiesPerCard));

    return Array.from({ length: pageCount }, (_, pageIndex) => {
      const pageTechnologies = technologies.slice(
        pageIndex * this.technologiesPerCard,
        (pageIndex + 1) * this.technologiesPerCard
      );
      const groups = pageTechnologies.reduce<Map<string, typeof pageTechnologies>>(
        (result, technology) => {
          const entries = result.get(technology.group) ?? [];
          entries.push(technology);
          result.set(technology.group, entries);
          return result;
        },
        new Map()
      );

      return {
        header: this.language.category(category.name),
        avatarImgPath: category.image,
        subtitle: pageCount > 1
          ? `${technologies.length} ${this.language.translate('knowledge.technologies')} · ${pageIndex + 1} / ${pageCount}`
          : `${category.knowledge.length} ${this.language.translate('knowledge.clusters')} · ${technologies.length} ${this.language.translate('knowledge.technologies')}`,
        title: this.language.translate('knowledge.domain'),
        content: this.language.current === 'es'
          ? category.descriptionEs || category.description || this.language.translate('knowledge.fallback')
          : category.description || this.language.translate('knowledge.fallback'),
        listChips: Array.from(groups, ([name, entries]) => ({
          name,
          chips: entries.map((entry) => ({ title: entry.title, subtitle: entry.subtitle })),
        })),
      };
    });
  }
}
