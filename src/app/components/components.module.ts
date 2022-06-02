import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { EducationComponent } from '../education/education.component';
import { FooterComponent } from './footer/footer.component';
import { HeaderComponent } from './header/header.component';
import { PresentationComponent } from './presentation/presentation.component';
import { SwiperModule } from 'swiper/angular';
import { CardComponent } from './card/card.component';
import { SlideCardsComponent } from './slide-cards/slide-cards.component';
import { KnowledgeComponent } from './knowledge/knowledge.component';

@NgModule({
  declarations: [
    HeaderComponent,
    FooterComponent,
    PresentationComponent,
    EducationComponent,    
    CardComponent,
    SlideCardsComponent,
    KnowledgeComponent
  ],
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    SwiperModule
  ],
  exports: [
    HeaderComponent,
    FooterComponent,
    PresentationComponent,
    EducationComponent,
    CardComponent,
    SlideCardsComponent,
    KnowledgeComponent
  ]
})
export class ComponentsModule { }
