
import type { GameState } from '../../types';

interface Database {
  [userId: string]: GameState;
}

// In-memory store to simulate a database.
// In a real application, this would be replaced with calls to a real DB like FaunaDB, Supabase, etc.
const store: Database = {};

export const db = {
  get: async (userId: string): Promise<GameState | null> => {
    // console.log(`[DB MOCK] Getting state for user: ${userId}`);
    // Deep copy to prevent mutations
    return store[userId] ? JSON.parse(JSON.stringify(store[userId])) : null;
  },
  set: async (userId: string, state: GameState): Promise<void> => {
    // console.log(`[DB MOCK] Setting state for user: ${userId}`);
    // Deep copy to prevent mutations
    store[userId] = JSON.parse(JSON.stringify(state));
  },
};
