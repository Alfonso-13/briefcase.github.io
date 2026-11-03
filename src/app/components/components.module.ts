import { CommonModule } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonAvatar,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonChip,
  IonFooter,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonPopover,
  IonToolbar,
} from '@ionic/angular';
import { EducationComponent } from '../education/education.component';
import { FooterComponent } from './footer/footer.component';
import { HeaderComponent } from './header/header.component';
import { PresentationComponent } from './presentation/presentation.component';
import { CardComponent } from './card/card.component';
import { SlideCardsComponent } from './slide-cards/slide-cards.component';
import { KnowledgeComponent } from './knowledge/knowledge.component';
import { KnowledgeSectionComponent } from './knowledge-section/knowledge-section.component';
import { TranslatePipe } from '../pipes/translate.pipe';

@NgModule({
  declarations: [
    HeaderComponent,
    FooterComponent,
    PresentationComponent,
    EducationComponent,
    CardComponent,
    SlideCardsComponent,
    KnowledgeComponent,
    KnowledgeSectionComponent,
    TranslatePipe
  ],
  imports: [
    CommonModule,
    FormsModule,
    IonAvatar,
    IonButton,
    IonButtons,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardSubtitle,
    IonCardTitle,
    IonChip,
    IonFooter,
    IonHeader,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonPopover,
    IonToolbar,
  ],
  exports: [
    HeaderComponent,
    FooterComponent,
    PresentationComponent,
    EducationComponent,
    CardComponent,
    SlideCardsComponent,
    KnowledgeComponent,
    KnowledgeSectionComponent,
    TranslatePipe
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ComponentsModule { }
