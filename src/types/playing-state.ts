import { PlayState } from './play-state';

export interface PlayingState {
  viewOffset: number;
  playState: PlayState;
  key: string;
};
