import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { IonicRouteStrategy } from '@ionic/angular/ionic-route-strategy';
import { IonApp, provideIonicAngular } from '@ionic/angular';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { HttpClientModule } from '@angular/common/http';
import { ComponentsModule } from './components/components.module';

@NgModule({
    declarations: [AppComponent],
    imports: [
        BrowserModule,
        IonApp,
        AppRoutingModule,
        HttpClientModule,
        ComponentsModule,
    ],
    providers: [
        provideIonicAngular(),
        { provide: RouteReuseStrategy, useClass: IonicRouteStrategy }
    ],
    bootstrap: [AppComponent]
})
export class AppModule {}
