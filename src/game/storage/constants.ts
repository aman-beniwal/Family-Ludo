export const SAVE_GAME_KEY = 'libreludo-save-game';
// v2 adds profileId to each stored player (U6). A v1 save fails validation on
// resume and is handled by the error boundary — the owner loses that one
// in-progress game, not their profiles.
export const SAVE_VERSION = 2;
