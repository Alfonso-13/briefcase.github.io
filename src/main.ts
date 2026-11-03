import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';
import { register } from 'swiper/element/bundle';
import { addIcons } from 'ionicons';
import {
  codeWorking,
  logoGithub,
  logoLinkedin,
  mail,
  moonOutline,
  personCircleOutline,
  sunnyOutline,
} from 'ionicons/icons';

register();
addIcons({
  codeWorking,
  logoGithub,
  logoLinkedin,
  mail,
  moonOutline,
  personCircleOutline,
  sunnyOutline,
});

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.log(err));
