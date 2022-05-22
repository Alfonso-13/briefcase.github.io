import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { AppRoutingModule } from '../app-routing.module';
import { MenuListComponent } from './menu-list/menu-list.component';
import { MenuComponent } from './menu.component';

@NgModule({  
  declarations: [
    MenuComponent,
    MenuListComponent
  ],
  imports: [
    CommonModule,
    IonicModule,
    AppRoutingModule
  ],
  exports: [
    MenuComponent
  ],
})
export class MenuModule {}
