
import { GameState, QueueItem, MissionType, MerchantStatus, PirateMercenaryStatus, AsteroidImpactType, AncientArtifactStatus, SpacePlagueState, BoostType, Boost, ExplorationOutcomeType, ExpeditionOutcomeType, BattleReport, SpyReport, Loot, DebrisField, ShipType, BuildingType, MerchantInfoMessage, EspionageEventMessage, PirateMessage, AsteroidImpactMessage, ResourceVeinMessage, AncientArtifactMessage, SpacePlagueMessage, ExpeditionMessage, BattleMessage, SpyMessage, ColonizationMessage, ExplorationMessage, Fleet } from './types';
import { ALL_GAME_OBJECTS, BUILDING_DATA, SHIPYARD_DATA, INITIAL_PIRATE_MERCENARY_STATE, INITIAL_RESOURCE_VEIN_BONUS, INITIAL_SPACE_PLAGUE_STATE, DEBRIS_FIELD_RECOVERY_RATE, PROTECTED_RESOURCES_FACTOR, PLAYER_HOME_COORDS } from './constants';
import { calculateProductions, calculateMaxResources } from './calculations';
import { calculateCombatStats, calculateTotalPower, getUnitsCost } from './utils';

// Helper to format numbers for notifications
const formatNumber = (num: number): string => {
    return Math.floor(num).toLocaleString('pl-PL');
};

export const getBoostNameForNotif = (boost: Omit<Boost, 'id' | 'duration'>) => {
    switch(boost.type) {
        case BoostType.EXTRA_BUILD_QUEUE: return `Dodatkowa kolejka budowy (${boost.level})`;
        case BoostType.RESOURCE_PRODUCTION_BOOST: return `Produkcja +${boost.level}%`;
        case BoostType.COMBAT_TECH_BOOST: return `Kalibracja Broni Polowej (+${boost.level}%)`;
        case BoostType.ARMOR_TECH_BOOST: return `Wzmocnienie Pancerza (+${boost.level}%)`;
        case BoostType.DRIVE_TECH_BOOST: return `Dopalacz napędu (+${boost.level}%)`;
        case BoostType.CONSTRUCTION_COST_REDUCTION: return `Zniżka na budowę/badania (-${boost.level}%)`;
        default: return 'Nieznany bonus';
    }
}

export const processExpeditionOutcome = (mission: GameState['fleetMissions'][0], shipLevels: GameState['shipLevels']): { message: ExpeditionMessage, finalFleet: Fleet, finalLoot: Loot } => {
    // This is a complex function, translated from the original App.tsx
    const rand = Math.random();
    let outcome: ExpeditionOutcomeType;
    const details: ExpeditionMessage['details'] = { fleetSent: mission.fleet };
    let finalFleet: Fleet = { ...mission.fleet };
    let finalLoot: Loot = {};

    if (rand < 0.15) { // Find resources
        outcome = ExpeditionOutcomeType.FIND_RESOURCES;
        const resourceGain = { metal: 1000, crystal: 500 };
        details.resourcesGained = resourceGain;
        finalLoot = { ...finalLoot, ...resourceGain };
    } else if (rand < 0.20) { // Find money
        outcome = ExpeditionOutcomeType.FIND_MONEY;
        const creditsGained = 5000;
        details.creditsGained = creditsGained;
        finalLoot = { ...finalLoot, credits: creditsGained };
    } else if (rand < 0.50) { // Nothing
        outcome = ExpeditionOutcomeType.NOTHING;
    } else { // Lost fleet
        outcome = ExpeditionOutcomeType.LOST;
        details.fleetLost = { ...finalFleet };
        finalFleet = {};
    }

    const message: ExpeditionMessage = {
        id: `msg-${Date.now()}-exp`, type: 'expedition', timestamp: Date.now(), isRead: false,
        subject: `Raport z Wyprawy [${mission.targetCoords}]`,
        outcome,
        details,
    };
    return { message, finalFleet, finalLoot };
};

export function processOffline(initialState: GameState): { updatedState: GameState, notifications: string[] } {
    const notifications: string[] = [];
    let state = JSON.parse(JSON.stringify(initialState)) as GameState;

    const offlineTimeMs = Date.now() - state.lastSaveTime;
    if (offlineTimeMs < 1000) {
        return { updatedState: state, notifications };
    }
    const offlineSeconds = Math.floor(offlineTimeMs / 1000);
    const now = Date.now();
    
    // --- 1. Resource Production ---
    const productions = calculateProductions(state.buildings, state.resourceVeinBonus, state.colonies, state.activeBoosts);
    const maxResources = calculateMaxResources(state.buildings);
    state.resources.metal = Math.min(maxResources.metal, state.resources.metal + productions.metal / 3600 * offlineSeconds);
    state.resources.crystal = Math.min(maxResources.crystal, state.resources.crystal + productions.crystal / 3600 * offlineSeconds);
    state.resources.deuterium = Math.min(maxResources.deuterium, state.resources.deuterium + productions.deuterium / 3600 * offlineSeconds);
    state.credits += state.blackMarketHourlyIncome / 3600 * offlineSeconds;

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
        if (now >= mission.returnTime) {
            let finalFleet = mission.fleet;
            let finalLoot: Loot = mission.loot || {};
            if (mission.missionType === MissionType.EXPEDITION) {
                 const { message, finalFleet: expFleet, finalLoot: expLoot } = processExpeditionOutcome(mission, state.shipLevels);
                 state.messages.unshift(message);
                 finalFleet = expFleet;
                 finalLoot = expLoot;
            } else {
                notifications.push(`Flota powróciła z misji [${mission.targetCoords}].`);
            }
            for (const shipType in finalFleet) {
                 state.fleet[shipType as ShipType] = (state.fleet[shipType as ShipType] || 0) + (finalFleet[shipType as ShipType] || 0);
            }
            state.resources.metal = Math.min(maxResources.metal, state.resources.metal + (finalLoot.metal || 0));
            state.resources.crystal = Math.min(maxResources.crystal, state.resources.crystal + (finalLoot.crystal || 0));
            state.resources.deuterium = Math.min(maxResources.deuterium, state.resources.deuterium + (finalLoot.deuterium || 0));
            state.credits += finalLoot.credits || 0;
        } else if (now >= mission.arrivalTime && !mission.processedArrival) {
            mission.processedArrival = true;
            notifications.push(`Flota dotarła do celu [${mission.targetCoords}].`);
            // Simplified: In a full implementation, combat/spy logic would run here.
            activeMissions.push(mission);
        } else {
            activeMissions.push(mission);
        }
    });
    state.fleetMissions = activeMissions;

    // --- 4. Handle Timed Events ---
    if (state.merchantState.status === MerchantStatus.INCOMING && now >= state.merchantState.arrivalTime) {
        state.merchantState.status = MerchantStatus.ACTIVE;
        state.merchantState.departureTime = now + 2 * 3600 * 1000;
        notifications.push("Kupiec przybył!");
    } else if (state.merchantState.status === MerchantStatus.ACTIVE && now >= state.merchantState.departureTime) {
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
