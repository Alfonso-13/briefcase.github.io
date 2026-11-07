import { Component, OnDestroy, OnInit } from '@angular/core';
import { shouldPlayPortfolioIntro } from './portfolio-intro.utils';

interface IntroStar {
  x: number;
  y: number;
  size: number;
  delay: number;
}

@Component({
  selector: 'app-portfolio-intro',
  standalone: false,
  templateUrl: './portfolio-intro.component.html',
  styleUrls: ['./portfolio-intro.component.scss'],
})
export class PortfolioIntroComponent implements OnInit, OnDestroy {
  private readonly storageKey = 'briefcase.portfolio-intro.v1';
  private fallbackTimer?: ReturnType<typeof setTimeout>;

  visible = false;
  readonly stars: IntroStar[] = Array.from({ length: 28 }, (_, index) => ({
    x: (index * 37 + 11) % 97,
    y: (index * 61 + 7) % 91,
    size: 1 + (index % 3),
    delay: (index % 9) * 90,
  }));
  readonly asteroids = Array.from({ length: 26 }, (_, index) => ({
    angle: index * (360 / 26),
    radius: 76 + (index % 4) * 3,
    size: 2 + (index % 3),
  }));

  ngOnInit(): void {
    const replayRequested = new URLSearchParams(window.location.search).has('intro');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let alreadySeen = false;

    try {
      alreadySeen = window.sessionStorage.getItem(this.storageKey) === 'true';
    } catch {
      // Treat unavailable session storage as a first visit.
    }

    this.visible = shouldPlayPortfolioIntro({ reducedMotion, alreadySeen, replayRequested });

    if (!this.visible) {
      return;
    }

    document.documentElement.classList.add('portfolio-intro-playing');

    try {
      window.sessionStorage.setItem(this.storageKey, 'true');
    } catch {
      // The cinematic entrance remains functional when session storage is unavailable.
    }

    this.fallbackTimer = setTimeout(() => this.finish(), 5000);
  }

  ngOnDestroy(): void {
    this.clearTimer();
    document.documentElement.classList.remove('portfolio-intro-playing');
  }

  onAnimationEnd(event: AnimationEvent): void {
    if (event.animationName === 'portfolio-intro-reveal') {
      this.finish();
    }
  }

  private finish(): void {
    if (!this.visible) {
      return;
    }

    this.visible = false;
    this.clearTimer();
    document.documentElement.classList.remove('portfolio-intro-playing');
  }

  private clearTimer(): void {
    if (this.fallbackTimer) {
      clearTimeout(this.fallbackTimer);
      this.fallbackTimer = undefined;
    }
  }
}
