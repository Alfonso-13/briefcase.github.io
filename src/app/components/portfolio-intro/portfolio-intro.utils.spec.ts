import { describe, expect, it } from 'vitest';
import { shouldPlayPortfolioIntro } from './portfolio-intro.utils';

describe('shouldPlayPortfolioIntro', () => {
  it('plays on the first visit of a browser session', () => {
    expect(shouldPlayPortfolioIntro({
      reducedMotion: false,
      alreadySeen: false,
      replayRequested: false,
    })).toBe(true);
  });

  it('does not repeat during the same browser session', () => {
    expect(shouldPlayPortfolioIntro({
      reducedMotion: false,
      alreadySeen: true,
      replayRequested: false,
    })).toBe(false);
  });

  it('allows an explicit replay from the URL', () => {
    expect(shouldPlayPortfolioIntro({
      reducedMotion: false,
      alreadySeen: true,
      replayRequested: true,
    })).toBe(true);
  });

  it('always respects reduced-motion preferences', () => {
    expect(shouldPlayPortfolioIntro({
      reducedMotion: true,
      alreadySeen: false,
      replayRequested: true,
    })).toBe(false);
  });
});
