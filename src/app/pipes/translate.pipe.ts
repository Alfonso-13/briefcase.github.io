import { Pipe, PipeTransform } from '@angular/core';
import { LanguageService } from '../services/language.service';

@Pipe({
  name: 'translate',
  standalone: false,
  pure: false,
})
export class TranslatePipe implements PipeTransform {
  constructor(private readonly language: LanguageService) {}

  transform(key: string): string {
    return this.language.translate(key);
  }
}
