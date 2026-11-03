import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { NavigationSection } from '../interface/navigation-config';

@Injectable({
  providedIn: 'root',
})
export class PortfolioNavigationService {
  private readonly sectionRequest = new Subject<NavigationSection['id']>();

  readonly sectionRequest$ = this.sectionRequest.asObservable();

  navigateTo(sectionId: NavigationSection['id']): void {
    this.sectionRequest.next(sectionId);
  }
}
