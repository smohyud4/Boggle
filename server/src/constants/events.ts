export const EVENTS = {
  CONNECTION: 'connection',

  JOIN_ROOM: 'join_room',
  LEAVE_ROOM: 'leave_room',
  START_GAME: 'start_game',
  SUBMIT_WORDS: 'submit_words',
  BEGIN_ROUND: 'begin_round',
  GAME_STARTING: 'game_starting',

  ROOM_JOINED: 'room_joined',
  LOBBY_UPDATED: 'lobby_updated',
  ROUND_START: 'round_start',
  ROUND_RESULT: 'round_result',
  GAME_OVER: 'game_over',
  GAME_CANCELLED: 'game_cancelled',
  PLAYER_LEFT: 'player_left',
  ERROR: 'error_event',
} as const;
