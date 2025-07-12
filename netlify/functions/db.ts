import { getStore } from '@netlify/blobs';
import type { GameState } from '../../types';

const STORE_NAME = 'game-states';

export const db = {
  get: async (userId: string): Promise<GameState | null> => {
    const store = getStore(STORE_NAME);
    const state = await store.get(userId, { type: 'json' });
    return state as GameState | null;
  },
  set: async (userId: string, state: GameState): Promise<void> => {
    const store = getStore(STORE_NAME);
    await store.setJSON(userId, state);
  },
};
