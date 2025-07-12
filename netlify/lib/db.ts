
import { promises as fs } from 'fs';
import path from 'path';
import { GameState } from './types';
import { initialGameState } from './constants';

const dataDir = path.join('/tmp', 'data');

const ensureDataDir = async () => {
    try {
        await fs.access(dataDir);
    } catch {
        await fs.mkdir(dataDir, { recursive: true });
    }
};

export const getUserState = async (username: string): Promise<GameState | null> => {
    await ensureDataDir();
    const filePath = path.join(dataDir, `${username}.json`);
    try {
        const data = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(data) as GameState;
    } catch (error) {
        return null;
    }
};

export const createUserState = async (username: string): Promise<GameState> => {
    const newUserState: GameState = {
        ...(initialGameState as any), // Cast to avoid partial type issue
        username: username,
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
    await ensureDataDir();
    const filePath = path.join(dataDir, `${username}.json`);
    state.lastSaveTime = Date.now();
    await fs.writeFile(filePath, JSON.stringify(state, null, 2));
};

export const userExists = async (username: string): Promise<boolean> => {
    await ensureDataDir();
    const filePath = path.join(dataDir, `${username}.json`);
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
};
