export interface PortfolioIntroState {
  reducedMotion: boolean;
  alreadySeen: boolean;
  replayRequested: boolean;
}

export function shouldPlayPortfolioIntro(state: PortfolioIntroState): boolean {
  return !state.reducedMotion && (!state.alreadySeen || state.replayRequested);
}
