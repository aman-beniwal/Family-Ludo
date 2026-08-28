import { describe, expect, it } from 'vitest';
import { validateStoredState } from '../../src/game/storage/validator';
import { SAVE_VERSION } from '../../src/game/storage/constants';

function storedPlayer(overrides: Record<string, unknown> = {}) {
  return {
    name: 'Asha',
    colour: 'blue',
    isBot: false,
    numberOfConsecutiveSix: 0,
    playerFinishTime: -1,
    tokens: Array.from({ length: 4 }, (_, id) => ({
      id,
      coordinates: { x: 0, y: 0 },
      isLocked: true,
      isActive: false,
      hasTokenReachedHome: false,
    })),
    profileId: null,
    ...overrides,
  };
}

function storedSave(players: unknown[]) {
  return {
    version: SAVE_VERSION,
    saveTime: 1,
    currentPlayerColour: 'blue',
    playerFinishOrder: [],
    players,
    dice: [
      { diceNumber: 1, colour: 'blue' },
      { diceNumber: 1, colour: 'red' },
    ],
    session: { gameStartTime: 0, gameInactiveTime: 0 },
  };
}

describe('save schema (v2 profileId)', () => {
  it('accepts a stored player carrying a profileId', () => {
    const res = validateStoredState(
      storedSave([storedPlayer({ profileId: 'p1' }), storedPlayer({ colour: 'red' })])
    );
    expect(res.success).toBe(true);
  });

  it('accepts a null profileId (human without a linked profile / bot)', () => {
    const res = validateStoredState(
      storedSave([storedPlayer({ profileId: null }), storedPlayer({ colour: 'red' })])
    );
    expect(res.success).toBe(true);
  });

  it('rejects a legacy (v1) player missing profileId entirely', () => {
    const legacy = storedPlayer();
    delete (legacy as Record<string, unknown>).profileId;
    const res = validateStoredState(storedSave([legacy, storedPlayer({ colour: 'red' })]));
    expect(res.success).toBe(false);
  });
});
