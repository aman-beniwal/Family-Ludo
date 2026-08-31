export const SAVE_GAME_KEY = 'libreludo-save-game';
// v2 adds profileId to each stored player (U6). A v1 save fails validation on
// resume and is handled by the error boundary — the owner loses that one
// in-progress game, not their profiles.
// v3: colour→quadrant layout was remapped for the new board art (green TL,
// red TR, yellow BL, blue BR), so pre-v3 saves have token coordinates that no
// longer match their colour's path — bumped to discard them cleanly.
export const SAVE_VERSION = 3;
