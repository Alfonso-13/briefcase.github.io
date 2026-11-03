import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { HomePage } from './home.page';

import { HomePageRoutingModule } from './home-routing.module';
import { ComponentsModule } from '../components/components.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    HomePageRoutingModule,
    ComponentsModule
  ],
  declarations: [
    HomePage
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class HomePageModule {}
