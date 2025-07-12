
import { GameState, QueueItem, MissionType, MerchantStatus, PirateMercenaryStatus, AsteroidImpactType, AncientArtifactStatus, SpacePlagueState, BoostType, Boost, ExplorationOutcomeType, ExpeditionOutcomeType, BattleReport, SpyMessage, BattleMessage, Loot, DebrisField, ShipType, Fleet, MerchantInfoMessage, EspionageEventMessage, PirateMessage, AsteroidImpactMessage, ResourceVeinMessage, AncientArtifactMessage, SpacePlagueMessage, OfflineSummaryMessage, ExpeditionMessage, ColonizationMessage, ExplorationMessage, BuildingType, GlobalState } from './types';
import { ALL_GAME_OBJECTS, BUILDING_DATA, SHIPYARD_DATA, INITIAL_PIRATE_MERCENARY_STATE, INITIAL_RESOURCE_VEIN_BONUS, INITIAL_SPACE_PLAGUE_STATE, DEBRIS_FIELD_RECOVERY_RATE, PROTECTED_RESOURCES_FACTOR, RESEARCH_DATA } from './constants';
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


export function processOffline(initialPlayerState: GameState, initialGlobalState: GlobalState): { updatedPlayerState: GameState, updatedGlobalState: GlobalState, notifications: string[] } {
    const notifications: string[] = [];
    let playerState = JSON.parse(JSON.stringify(initialPlayerState)) as GameState;
    let globalState = JSON.parse(JSON.stringify(initialGlobalState)) as GlobalState;
    const now = Date.now();
    const offlineSeconds = (now - playerState.lastSaveTime) / 1000;

    if (offlineSeconds < 1) {
        return { updatedPlayerState: playerState, updatedGlobalState: globalState, notifications };
    }
    
    const productions = calculateProductions(playerState.buildings, playerState.resourceVeinBonus, playerState.colonies, playerState.activeBoosts);
    const maxResources = calculateMaxResources(playerState.buildings);
    playerState.resources.metal = Math.min(maxResources.metal, playerState.resources.metal + productions.metal / 3600 * offlineSeconds);
    playerState.resources.crystal = Math.min(maxResources.crystal, playerState.resources.crystal + productions.crystal / 3600 * offlineSeconds);
    playerState.resources.deuterium = Math.min(maxResources.deuterium, playerState.resources.deuterium + productions.deuterium / 3600 * offlineSeconds);
    
    const blackMarketHoursPassed = (now - playerState.lastBlackMarketIncomeCheck) / (3600 * 1000);
    if(blackMarketHoursPassed >= 1) {
        const hours = Math.floor(blackMarketHoursPassed);
        playerState.credits += playerState.blackMarketHourlyIncome * hours;
        const blackMarketLevel = playerState.buildings[BuildingType.BLACK_MARKET];
        if (blackMarketLevel > 0) {
             const minIncome = 50 * Math.pow(1.1, blackMarketLevel - 1);
             const maxIncome = 200 * Math.pow(1.1, blackMarketLevel - 1);
             playerState.blackMarketHourlyIncome = minIncome + Math.random() * (maxIncome - minIncome);
        }
        playerState.lastBlackMarketIncomeCheck = now;
    }

    // --- Process NPC Evolution ---
    const allPlayerPlanetsCoords = Object.keys(globalState.playerPlanets);
    for (const coords in globalState.npcStates) {
        const npc = globalState.npcStates[coords];
        const timeSinceLastUpdate = now - npc.lastUpdateTime;
        if (timeSinceLastUpdate > 5 * 60 * 1000) { // Evolve every 5 mins
            const evolutionResult = evolveNpc(npc, timeSinceLastUpdate / 1000, coords, allPlayerPlanetsCoords);
            globalState.npcStates[coords] = evolutionResult.updatedNpc;
            if (evolutionResult.mission) {
                if ((evolutionResult.mission.missionType === 'ATTACK' || evolutionResult.mission.missionType === 'SPY') && (globalState.playerPlanets[evolutionResult.mission.targetCoords]?.owner === playerState.username)) {
                    playerState.npcFleetMissions.push(evolutionResult.mission);
                    const missionText = evolutionResult.mission.missionType === 'ATTACK' ? 'atakującą' : 'szpiegującą';
                    notifications.push(`Wykryto flotę gracza ${npc.name} (NPC) z [${coords}] ${missionText} Twoją planetę!`);
                }
            }
        }
    }

    // --- Process Player Build Queue ---
    const completedQueueItems = playerState.buildQueue.filter(item => now >= item.endTime);
    if (completedQueueItems.length > 0) {
        completedQueueItems.forEach(item => {
            const objectInfo = ALL_GAME_OBJECTS[item.id as keyof typeof ALL_GAME_OBJECTS];
            notifications.push(`${objectInfo.name} ${item.type.match(/^(ship|defense)$/) ? 'zbudowano' : 'ukończono na poziomie'} ${item.levelOrAmount}!`);
            if (item.type === 'building') playerState.buildings[item.id as keyof typeof playerState.buildings] = item.levelOrAmount;
            else if (item.type === 'research') playerState.research[item.id as keyof typeof playerState.research] = item.levelOrAmount;
            else if (item.type === 'ship_upgrade') playerState.shipLevels[item.id as keyof typeof playerState.shipLevels] = item.levelOrAmount;
            else if (item.type === 'ship') playerState.fleet[item.id as keyof typeof playerState.fleet] = (playerState.fleet[item.id as keyof typeof playerState.fleet] || 0) + item.levelOrAmount;
            else if (item.type === 'defense') playerState.defenses[item.id as keyof typeof playerState.defenses] = (playerState.defenses[item.id as keyof typeof playerState.defenses] || 0) + item.levelOrAmount;
        });
        playerState.buildQueue = playerState.buildQueue.filter(item => now < item.endTime);
    }
    
    // --- Process Player Fleet Missions ---
    const activeMissions: GameState['fleetMissions'] = [];
    playerState.fleetMissions.forEach(mission => {
        if (now >= mission.returnTime) { // Mission is over
            let finalFleet = mission.fleet;
            let finalLoot: Loot = mission.loot || {};
            if (mission.missionType === MissionType.EXPEDITION) {
                 const { message, finalFleet: expFleet, finalLoot: expLoot } = processExpeditionOutcome(mission, playerState.shipLevels);
                 playerState.messages.unshift(message);
                 finalFleet = expFleet;
                 finalLoot = expLoot;
            } else {
                 notifications.push(`Flota powróciła z misji na [${mission.targetCoords}].`);
            }
            for (const shipType in finalFleet) {
                 playerState.fleet[shipType as ShipType] = (playerState.fleet[shipType as ShipType] || 0) + (finalFleet[shipType as ShipType] || 0);
            }
            playerState.resources.metal = Math.min(maxResources.metal, playerState.resources.metal + (finalLoot.metal || 0));
            playerState.resources.crystal = Math.min(maxResources.crystal, playerState.resources.crystal + (finalLoot.crystal || 0));
            playerState.resources.deuterium = Math.min(maxResources.deuterium, playerState.resources.deuterium + (finalLoot.deuterium || 0));
            playerState.credits += finalLoot.credits || 0;
        } else {
            activeMissions.push(mission);
        }
    });
    playerState.fleetMissions = activeMissions;

    // --- Timed Events ---
    if (now - playerState.lastMerchantCheckTime > 6 * 3600 * 1000) {
        playerState.lastMerchantCheckTime = now;
        if (playerState.merchantState.status === MerchantStatus.INACTIVE && Math.random() < 0.35) {
            playerState.merchantState.status = MerchantStatus.INCOMING;
            playerState.merchantState.arrivalTime = now + 5 * 3600 * 1000;
        }
    }
    if (playerState.merchantState.status === MerchantStatus.INCOMING && now >= playerState.merchantState.arrivalTime) {
        playerState.merchantState.status = MerchantStatus.ACTIVE;
        playerState.merchantState.departureTime = now + 2 * 3600 * 1000;
        notifications.push("Kupiec przybył!");
    }
    if (playerState.merchantState.status === MerchantStatus.ACTIVE && now >= playerState.merchantState.departureTime) {
        playerState.merchantState.status = MerchantStatus.INACTIVE;
        notifications.push("Kupiec odleciał.");
    }

    // Update Boosts
    const newActiveBoosts: GameState['activeBoosts'] = {};
    for (const key in playerState.activeBoosts) {
        const boostType = key as BoostType;
        const boost = playerState.activeBoosts[boostType];
        if (boost && boost.endTime > now) {
            newActiveBoosts[boostType] = boost;
        } else {
            notifications.push(`Bonus "${getBoostNameForNotif({ type: boostType, level: (boost as any).level || 1 })}" wygasł.`);
        }
    }
    playerState.activeBoosts = newActiveBoosts;

    playerState.lastSaveTime = now;
    return { updatedPlayerState: playerState, updatedGlobalState: globalState, notifications };
}
