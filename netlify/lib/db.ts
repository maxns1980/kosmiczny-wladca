import { getStore } from '@netlify/blobs';
import { GameState } from './types';
import { initialGameState } from './constants';
import { findAndClaimEmptyPlanet } from './globalState';

export const getUserState = async (username: string): Promise<GameState | null> => {
    const store = getStore('userStates');
    const state = await store.get(username, { type: 'json' });
    return state ? (state as GameState) : null;
};

export const createUserState = async (username: string): Promise<GameState> => {
    const homePlanetCoords = await findAndClaimEmptyPlanet(username);

    const newUserState: GameState = {
        ...(JSON.parse(JSON.stringify(initialGameState))), // Deep copy
        username: username,
        homePlanet: homePlanetCoords,
        lastSaveTime: Date.now(),
        lastMerchantCheckTime: Date.now(),
        lastPirateCheckTime: Date.now(),
        lastAsteroidCheckTime: Date.now(),
        lastResourceVeinCheckTime: Date.now(),
        lastArtifactCheckTime: Date.now(),
        lastSpacePlagueCheckTime: Date.now(),
        lastBlackMarketIncomeCheck: Date.now(),
    };
    await writeUserState(username, newUserState);
    return newUserState;
};

export const writeUserState = async (username: string, state: GameState): Promise<void> => {
    const store = getStore('userStates');
    state.lastSaveTime = Date.now();
    await store.setJSON(username, state);
};

export const userExists = async (username: string): Promise<boolean> => {
    const store = getStore('userStates');
    // .get() returns a value (even an empty one) for existing keys, or null if not found.
    const state = await store.get(username);
    return state !== null;
};
