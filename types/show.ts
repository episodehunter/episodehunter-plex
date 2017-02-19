import { PlayState } from './play-state';

export interface Show {
  theTvDbId?: string;
  season?: string;
  episode?: string;
  duration?: number;
  viewOffset?: number;
  playState: PlayState;
};
