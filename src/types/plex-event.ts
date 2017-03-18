import { PlayState } from './play-state';

export interface PlexEvent {
  NotificationContainer: {
      type: 'playing';
      PlaySessionStateNotification: {
        key: string;
        viewOffset: number;
        state: PlayState;
      }[];
  };
};
