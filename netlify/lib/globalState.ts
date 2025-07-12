
import { promises as fs } from 'fs';
import path from 'path';
import { GlobalState, NPCPersonality, NPCState } from './types';
import { INITIAL_NPC_STATE } from './constants';

const FAKE_PLAYER_NAMES = ['Zenith', 'Nova', 'Orion', 'Cygnus', 'Draco', 'Lyra', 'Aquila', 'Centurion', 'Void', 'Stalker', 'Pulsar', 'Goliath'];

const dataDir = path.join('/tmp', 'cosmic-lord-data');
const GLOBAL_STATE_PATH = path.join(dataDir, 'globalState.json');

const ensureDataDir = async () => {
    try {
        await fs.access(dataDir);
    } catch {
        await fs.mkdir(dataDir, { recursive: true });
    }
};

const seededRandom = (seed: number) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
};

const getPlanetImage = (seed: number) => {
    const planetTypeSeed = seededRandom(seed);
    if (planetTypeSeed > 0.8) return '🌋'; // Volcanic
    if (planetTypeSeed > 0.6) return '🧊'; // Ice
    if (planetTypeSeed > 0.4) return '🏜️'; // Desert
    return '🪐'; // Temperate
};

const createInitialWorld = (): GlobalState => {
    const state: GlobalState = {
        npcStates: {},
        debrisFields: {},
        playerPlanets: {},
    };
    const now = Date.now();

    const GALAXY = 1;
    for (let system = 1; system <= 50; system++) {
        for (let position = 1; position <= 15; position++) {
            const coords = `${GALAXY}:${system}:${position}`;
            const planetSeed = GALAXY * 1000000 + system * 1000 + position;

            if (seededRandom(planetSeed) > 0.6) { // ~40% chance for NPC
                const nameIndex = Math.floor(seededRandom(planetSeed * 2) * FAKE_PLAYER_NAMES.length);
                const personalitySeed = seededRandom(planetSeed * 3);
                let personality = NPCPersonality.BALANCED;
                if (personalitySeed > 0.66) personality = NPCPersonality.AGGRESSIVE;
                else if (personalitySeed < 0.33) personality = NPCPersonality.ECONOMIC;

                state.npcStates[coords] = {
                    ...JSON.parse(JSON.stringify(INITIAL_NPC_STATE)),
                    lastUpdateTime: now,
                    name: FAKE_PLAYER_NAMES[nameIndex],
                    image: getPlanetImage(planetSeed * 4),
                    personality: personality
                };
            }
        }
    }
    return state;
};

export const getGlobalState = async (): Promise<GlobalState> => {
    await ensureDataDir();
    try {
        const data = await fs.readFile(GLOBAL_STATE_PATH, 'utf-8');
        return JSON.parse(data) as GlobalState;
    } catch (error) {
        console.log("Global state not found, creating initial world...");
        const newWorld = createInitialWorld();
        await writeGlobalState(newWorld);
        return newWorld;
    }
};

export const writeGlobalState = async (state: GlobalState): Promise<void> => {
    await ensureDataDir();
    await fs.writeFile(GLOBAL_STATE_PATH, JSON.stringify(state, null, 2));
};

export const findAndClaimEmptyPlanet = async (username: string): Promise<string> => {
    const globalState = await getGlobalState();
    
    // Search for an empty planet within the generated systems
    for (let s_offset = 0; s_offset < 50; s_offset++) {
        const system = 1 + Math.floor(seededRandom(Date.now() + s_offset) * 50);
        for (let position = 1; position <= 15; position++) {
            const coords = `1:${system}:${position}`;
            if (!globalState.npcStates[coords] && !globalState.playerPlanets[coords]) {
                globalState.playerPlanets[coords] = { owner: username, name: `Planeta Matka` };
                await writeGlobalState(globalState);
                return coords;
            }
        }
    }
    throw new Error("Nie znaleziono wolnej planety! Skontaktuj się z administratorem.");
};
