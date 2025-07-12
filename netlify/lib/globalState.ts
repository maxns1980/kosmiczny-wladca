import { getStore } from '@netlify/blobs';
import { GlobalState, NPCPersonality, NPCState } from './types';
import { INITIAL_NPC_STATE } from './constants';

const FAKE_PLAYER_NAMES = ['Zenith', 'Nova', 'Orion', 'Cygnus', 'Draco', 'Lyra', 'Aquila', 'Centurion', 'Void', 'Stalker', 'Pulsar', 'Goliath'];
const WORLD_CREATION_TIME = 1672531200000; // Jan 1 2023 00:00:00 UTC

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
                    lastUpdateTime: WORLD_CREATION_TIME,
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
    const store = getStore('gameState');
    const worldState = await store.get('world', { type: 'json' });

    if (worldState) {
        return worldState as GlobalState;
    }

    console.log("Global state blob not found, creating initial world...");
    const newWorld = createInitialWorld();
    await writeGlobalState(newWorld);
    return newWorld;
};

export const writeGlobalState = async (state: GlobalState): Promise<void> => {
    const store = getStore('gameState');
    await store.setJSON('world', state);
};

export const findAndClaimEmptyPlanet = async (username: string): Promise<string> => {
    const globalState = await getGlobalState();
    
    // Search for an empty planet systematically and deterministically
    const GALAXY = 1;
    for (let system = 1; system <= 50; system++) { // The world is created up to system 50
        for (let position = 1; position <= 15; position++) {
            const coords = `${GALAXY}:${system}:${position}`;
            // Check if the coordinate is not taken by an NPC or another player
            if (!globalState.npcStates[coords] && !globalState.playerPlanets[coords]) {
                // Claim it
                globalState.playerPlanets[coords] = { owner: username, name: `Planeta Matka` };
                await writeGlobalState(globalState);
                return coords;
            }
        }
    }

    // If no planet is found (highly unlikely with the current settings)
    throw new Error("Nie znaleziono wolnej planety! Wszechświat jest pełny.");
};
