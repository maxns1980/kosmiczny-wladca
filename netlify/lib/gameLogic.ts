

import { GameState, QueueItem, MissionType, MerchantStatus, PirateMercenaryStatus, AsteroidImpactType, AncientArtifactStatus, SpacePlagueState, BoostType, Boost, ExplorationOutcomeType, ExpeditionOutcomeType, BattleReport, SpyMessage, BattleMessage, Loot, DebrisField, ShipType, Fleet, MerchantInfoMessage, EspionageEventMessage, PirateMessage, AsteroidImpactMessage, ResourceVeinMessage, AncientArtifactMessage, SpacePlagueMessage, OfflineSummaryMessage, ExpeditionMessage, ColonizationMessage, ExplorationMessage, BuildingType } from './types';
import { ALL_GAME_OBJECTS, BUILDING_DATA, SHIPYARD_DATA, INITIAL_PIRATE_MERCENARY_STATE, INITIAL_RESOURCE_VEIN_BONUS, INITIAL_SPACE_PLAGUE_STATE, DEBRIS_FIELD_RECOVERY_RATE, PROTECTED_RESOURCES_FACTOR, PLAYER_HOME_COORDS, RESEARCH_DATA } from './constants';
import { calculateProductions, calculateMaxResources } from '../../src/utils/calculations';
import { calculateCombatStats, calculateTotalPower, getUnitsCost, getFleetValue } from './utils';
import { evolveNpc } from './npcLogic';

const formatNumber = (num: number): string => {
    return Math.floor(num).toLocaleString('pl-PL');
};

const formatTime = (seconds: number) => {
    if (seconds < 0) seconds = 0;
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
}

export const getBoostNameForNotif = (boost: Omit<Boost, 'id' | 'duration'>) => {
    switch(boost.type) {
        case BoostType.EXTRA_BUILD_QUEUE: return `Dodatkowa kolejka budowy (${boost.level})`;
        case BoostType.RESOURCE_PRODUCTION_BOOST: return `Produkcja +${boost.level}%`;
        case BoostType.COMBAT_TECH_BOOST: return `Kalibracja Broni Polowej (+${boost.level})`;
        case BoostType.ARMOR_TECH_BOOST: return `Wzmocnienie Pancerza (+${boost.level})`;
        default: return 'Nieznany bonus';
    }
}

export const processExpeditionOutcome = (mission: GameState['fleetMissions'][0], shipLevels: GameState['shipLevels']): { message: ExpeditionMessage, finalFleet: Fleet, finalLoot: Loot } => {
    const fleetValue = getFleetValue(mission.fleet, shipLevels);
    const rand = Math.random();

    let outcome: ExpeditionOutcomeType;
    const details: ExpeditionMessage['details'] = { fleetSent: mission.fleet };
    let finalFleet: Fleet = { ...mission.fleet };
    let finalLoot: Loot = {};

    if (rand < 0.15) { // 15% find resources
        outcome = ExpeditionOutcomeType.FIND_RESOURCES;
        const resourceGain = { metal: Math.floor(Math.random() * fleetValue * 0.1), crystal: Math.floor(Math.random() * fleetValue * 0.05) };
        details.resourcesGained = resourceGain;
        finalLoot = { ...finalLoot, ...resourceGain };
    } else if (rand < 0.20) { // 5% find credits
        outcome = ExpeditionOutcomeType.FIND_MONEY;
        const creditsGained = Math.floor(fleetValue * 0.2 + Math.random() * 5000);
        details.creditsGained = creditsGained;
        finalLoot = { ...finalLoot, credits: creditsGained };
    } else if (rand < 0.25) { // 5% find fleet
        outcome = ExpeditionOutcomeType.FIND_FLEET;
        const foundFleet: Fleet = { [ShipType.LIGHT_FIGHTER]: Math.ceil(fleetValue / 20000) };
        details.fleetGained = foundFleet;
        finalFleet[ShipType.LIGHT_FIGHTER] = (finalFleet[ShipType.LIGHT_FIGHTER] || 0) + (foundFleet[ShipType.LIGHT_FIGHTER] || 0);
    } else if (rand < 0.50) { // 25% nothing
        outcome = ExpeditionOutcomeType.NOTHING;
    } else if (rand < 0.65) { // 15% pirates
        outcome = ExpeditionOutcomeType.PIRATES;
        const lossPercent = 0.1 + Math.random() * 0.2;
        details.fleetLost = {};
        for (const ship in finalFleet) {
            const losses = Math.ceil((finalFleet[ship as ShipType] || 0) * lossPercent);
            if (losses > 0) {
                details.fleetLost[ship as ShipType] = losses;
                finalFleet[ship as ShipType] = Math.max(0, (finalFleet[ship as ShipType] || 0) - losses);
            }
        }
    } else if (rand < 0.90) { // 25% more outcomes (aliens, delay)
        outcome = ExpeditionOutcomeType.ALIENS;
        const lossPercent = 0.2 + Math.random() * 0.4;
        details.fleetLost = {};
        for (const ship in finalFleet) {
            const losses = Math.ceil((finalFleet[ship as ShipType] || 0) * lossPercent);
             if (losses > 0) {
                details.fleetLost[ship as ShipType] = losses;
                finalFleet[ship as ShipType] = Math.max(0, (finalFleet[ship as ShipType] || 0) - losses);
            }
        }
    } else { // 10% lost
        outcome = ExpeditionOutcomeType.LOST;
        details.fleetLost = { ...finalFleet };
        finalFleet = {};
    }

    const message: ExpeditionMessage = {
        id: `msg-${Date.now()}-exp`, type: 'expedition', timestamp: Date.now(), isRead: false,
        subject: `Raport z Wyprawy [${mission.targetCoords}]`, outcome, details,
    };

    return { message, finalFleet, finalLoot };
};


export function processOffline(initialState: GameState): { updatedState: GameState, notifications: string[] } {
    const notifications: string[] = [];
    let state = JSON.parse(JSON.stringify(initialState)) as GameState;
    const now = Date.now();
    const offlineSeconds = (now - state.lastSaveTime) / 1000;

    if (offlineSeconds < 1) {
        return { updatedState: state, notifications };
    }
    
    // --- 1. Resource & Credit Production ---
    const productions = calculateProductions(state.buildings, state.resourceVeinBonus, state.colonies, state.activeBoosts);
    const maxResources = calculateMaxResources(state.buildings);
    state.resources.metal = Math.min(maxResources.metal, state.resources.metal + productions.metal / 3600 * offlineSeconds);
    state.resources.crystal = Math.min(maxResources.crystal, state.resources.crystal + productions.crystal / 3600 * offlineSeconds);
    state.resources.deuterium = Math.min(maxResources.deuterium, state.resources.deuterium + productions.deuterium / 3600 * offlineSeconds);
    
    // Black Market Income
    const blackMarketHoursPassed = (now - state.lastBlackMarketIncomeCheck) / (3600 * 1000);
    if(blackMarketHoursPassed >= 1) {
        const hours = Math.floor(blackMarketHoursPassed);
        state.credits += state.blackMarketHourlyIncome * hours;
        const blackMarketLevel = state.buildings[BuildingType.BLACK_MARKET];
        if (blackMarketLevel > 0) {
             const minIncome = 50 * Math.pow(1.1, blackMarketLevel - 1);
             const maxIncome = 200 * Math.pow(1.1, blackMarketLevel - 1);
             state.blackMarketHourlyIncome = minIncome + Math.random() * (maxIncome - minIncome);
        }
        state.lastBlackMarketIncomeCheck = now;
    }

    // --- Process NPC Evolution ---
    const npcUpdates: GameState['npcStates'] = {};
    for (const coords in state.npcStates) {
        const npc = state.npcStates[coords];
        const timeSinceLastUpdate = now - npc.lastUpdateTime;
        // Evolve if more than 5 minutes passed since last individual update
        if (timeSinceLastUpdate > 5 * 60 * 1000) {
            const evolutionResult = evolveNpc(npc, timeSinceLastUpdate / 1000, coords);
            npcUpdates[coords] = evolutionResult.updatedNpc;
            if (evolutionResult.mission) {
                state.npcFleetMissions.push(evolutionResult.mission);
                const attackerNpc = evolutionResult.updatedNpc;
                notifications.push(`Wykryto flotę gracza ${attackerNpc.name} (NPC) z [${coords}] zmierzającą w Twoją stronę!`);
            }
        } else {
            npcUpdates[coords] = npc; // Keep the old one if not updated
        }
    }
    state.npcStates = npcUpdates;


    // --- 2. Process Build Queue ---
    const completedQueueItems = state.buildQueue.filter(item => now >= item.endTime);
    if (completedQueueItems.length > 0) {
        completedQueueItems.forEach(item => {
            const objectInfo = ALL_GAME_OBJECTS[item.id as keyof typeof ALL_GAME_OBJECTS];
            notifications.push(`${objectInfo.name} ${item.type.match(/^(ship|defense)$/) ? 'zbudowano' : 'ukończono na poziomie'} ${item.levelOrAmount}!`);
            if (item.type === 'building') state.buildings[item.id as keyof typeof state.buildings] = item.levelOrAmount;
            else if (item.type === 'research') state.research[item.id as keyof typeof state.research] = item.levelOrAmount;
            else if (item.type === 'ship_upgrade') state.shipLevels[item.id as keyof typeof state.shipLevels] = item.levelOrAmount;
            else if (item.type === 'ship') state.fleet[item.id as keyof typeof state.fleet] = (state.fleet[item.id as keyof typeof state.fleet] || 0) + item.levelOrAmount;
            else if (item.type === 'defense') state.defenses[item.id as keyof typeof state.defenses] = (state.defenses[item.id as keyof typeof state.defenses] || 0) + item.levelOrAmount;
        });
        state.buildQueue = state.buildQueue.filter(item => now < item.endTime);
    }
    
    // --- 3. Process Fleet Missions ---
    const activeMissions: GameState['fleetMissions'] = [];
    state.fleetMissions.forEach(mission => {
        if (now >= mission.returnTime) { // Mission is over
            let finalFleet = mission.fleet;
            let finalLoot: Loot = mission.loot || {};
            if (mission.missionType === MissionType.EXPEDITION) {
                 const { message, finalFleet: expFleet, finalLoot: expLoot } = processExpeditionOutcome(mission, state.shipLevels);
                 state.messages.unshift(message);
                 finalFleet = expFleet;
                 finalLoot = expLoot;
            } else {
                 notifications.push(`Flota powróciła z misji na [${mission.targetCoords}].`);
            }
            // Return fleet and loot to player
            for (const shipType in finalFleet) {
                 state.fleet[shipType as ShipType] = (state.fleet[shipType as ShipType] || 0) + (finalFleet[shipType as ShipType] || 0);
            }
            state.resources.metal = Math.min(maxResources.metal, state.resources.metal + (finalLoot.metal || 0));
            state.resources.crystal = Math.min(maxResources.crystal, state.resources.crystal + (finalLoot.crystal || 0));
            state.resources.deuterium = Math.min(maxResources.deuterium, state.resources.deuterium + (finalLoot.deuterium || 0));
            state.credits += finalLoot.credits || 0;
        } else {
            activeMissions.push(mission);
        }
    });
    state.fleetMissions = activeMissions;

    // --- 4. Timed Events ---
    // Merchant
    if (now - state.lastMerchantCheckTime > 6 * 3600 * 1000) {
        state.lastMerchantCheckTime = now;
        if (state.merchantState.status === MerchantStatus.INACTIVE && Math.random() < 0.35) {
            state.merchantState.status = MerchantStatus.INCOMING;
            state.merchantState.arrivalTime = now + 5 * 3600 * 1000;
        }
    }
    if (state.merchantState.status === MerchantStatus.INCOMING && now >= state.merchantState.arrivalTime) {
        state.merchantState.status = MerchantStatus.ACTIVE;
        state.merchantState.departureTime = now + 2 * 3600 * 1000;
        notifications.push("Kupiec przybył!");
    }
    if (state.merchantState.status === MerchantStatus.ACTIVE && now >= state.merchantState.departureTime) {
        state.merchantState.status = MerchantStatus.INACTIVE;
        notifications.push("Kupiec odleciał.");
    }

    // --- 5. Update Boosts ---
    const newActiveBoosts: GameState['activeBoosts'] = {};
    for (const key in state.activeBoosts) {
        const boostType = key as BoostType;
        const boost = state.activeBoosts[boostType];
        if (boost && boost.endTime > now) {
            newActiveBoosts[boostType] = boost;
        } else {
            notifications.push(`Bonus "${getBoostNameForNotif({ type: boostType, level: (boost as any).level || 1 })}" wygasł.`);
        }
    }
    state.activeBoosts = newActiveBoosts;

    state.lastSaveTime = now;
    return { updatedState: state, notifications };
}
