
import { 
    BuildingType, Resources, BuildingLevels, ResearchLevels, ResearchType, Fleet, QueueItem, GameObject, 
    Defenses, FleetMission, MissionType, DefenseType, ShipType, Message, SpyReport, BattleReport, Loot, 
    SpyMessage, BattleMessage, MerchantState, MerchantStatus, MerchantInfoMessage, NPCStates, NPCState, EspionageEventMessage, NPCFleetMission, ShipLevels, DebrisField,
    PirateMercenaryState, PirateMercenaryStatus, PirateMessage, AsteroidImpactMessage, AsteroidImpactType,
    ResourceVeinBonus, ResourceVeinMessage,
    AncientArtifactState, AncientArtifactStatus, AncientArtifactChoice, AncientArtifactMessage,
    SpacePlagueState, SpacePlagueMessage, OfflineSummaryMessage,
    ExpeditionMessage, ExpeditionOutcomeType, CombatStats,
    Colony, ColonizationMessage,
    Inventory, ActiveBoosts, BoostType, Boost, ExplorationMessage, ExplorationOutcomeType, GameState, NPCPersonality
} from '../../types';
import { 
    INITIAL_RESOURCES, INITIAL_BUILDING_LEVELS, INITIAL_RESEARCH_LEVELS, INITIAL_FLEET, INITIAL_DEFENSES, 
    BUILDING_DATA, RESEARCH_DATA, SHIPYARD_DATA, DEFENSE_DATA, TICK_INTERVAL, ALL_GAME_OBJECTS, INITIAL_MERCHANT_STATE, 
    NPC_STATES_KEY, INITIAL_NPC_FLEET_MISSIONS, INITIAL_SHIP_LEVELS, SHIP_UPGRADE_DATA, INITIAL_DEBRIS_FIELDS, 
    DEBRIS_FIELD_RECOVERY_RATE, PLAYER_HOME_COORDS, PROTECTED_RESOURCES_FACTOR, INITIAL_PIRATE_MERCENARY_STATE, 
    INITIAL_RESOURCE_VEIN_BONUS, INITIAL_ANCIENT_ARTIFACT_STATE, INITIAL_SPACE_PLAGUE_STATE, INITIAL_COLONIES, COLONY_INCOME_BONUS_PER_HOUR,
    INITIAL_INVENTORY, INITIAL_ACTIVE_BOOSTS, INITIAL_NPC_STATE, BASE_STORAGE_CAPACITY
} from '../../constants';

export const formatNumber = (num: number): string => {
    return Math.floor(num).toLocaleString('pl-PL');
};

export const calculateMaxResources = (buildings: BuildingLevels): Resources => {
    const metalCapacity = BUILDING_DATA[BuildingType.METAL_STORAGE].capacity?.(buildings[BuildingType.METAL_STORAGE]) ?? BASE_STORAGE_CAPACITY;
    const crystalCapacity = BUILDING_DATA[BuildingType.CRYSTAL_STORAGE].capacity?.(buildings[BuildingType.CRYSTAL_STORAGE]) ?? BASE_STORAGE_CAPACITY;
    const deuteriumCapacity = BUILDING_DATA[BuildingType.DEUTERIUM_TANK].capacity?.(buildings[BuildingType.DEUTERIUM_TANK]) ?? BASE_STORAGE_CAPACITY;

    return {
      metal: metalCapacity,
      crystal: crystalCapacity,
      deuterium: deuteriumCapacity,
    };
};

export const calculateProductions = (buildings: BuildingLevels, resourceVeinBonus: ResourceVeinBonus, colonies: Colony[], activeBoosts: ActiveBoosts) => {
    const energyProduction = BUILDING_DATA[BuildingType.SOLAR_PLANT].production?.(buildings[BuildingType.SOLAR_PLANT]) ?? 0;
    
    const energyConsumption = (Object.keys(buildings) as BuildingType[]).reduce((total, type) => {
        const buildingInfo = BUILDING_DATA[type as BuildingType];
        if (buildings[type as BuildingType] > 0) {
           return total + (buildingInfo.energyConsumption?.(buildings[type as BuildingType]) ?? 0);
        }
        return total;
    }, 0);
    
    const efficiency = energyProduction >= energyConsumption ? 1 : Math.max(0, energyProduction / energyConsumption);
    
    let metalProd = (BUILDING_DATA[BuildingType.METAL_MINE].production?.(buildings[BuildingType.METAL_MINE]) ?? 0) * efficiency;
    let crystalProd = (BUILDING_DATA[BuildingType.CRYSTAL_MINE].production?.(buildings[BuildingType.CRYSTAL_MINE]) ?? 0) * efficiency;
    let deuteriumProd = (BUILDING_DATA[BuildingType.DEUTERIUM_SYNTHESIZER].production?.(buildings[BuildingType.DEUTERIUM_SYNTHESIZER]) ?? 0) * efficiency;

    if (resourceVeinBonus.active && resourceVeinBonus.resourceType) {
        if (resourceVeinBonus.resourceType === 'metal') {
            metalProd *= resourceVeinBonus.bonusMultiplier;
        } else if (resourceVeinBonus.resourceType === 'crystal') {
            crystalProd *= resourceVeinBonus.bonusMultiplier;
        } else if (resourceVeinBonus.resourceType === 'deuterium') {
            deuteriumProd *= resourceVeinBonus.bonusMultiplier;
        }
    }

    if (activeBoosts[BoostType.RESOURCE_PRODUCTION_BOOST]) {
        const boostPercent = activeBoosts[BoostType.RESOURCE_PRODUCTION_BOOST]!.level / 100;
        metalProd *= (1 + boostPercent);
        crystalProd *= (1 + boostPercent);
        deuteriumProd *= (1 + boostPercent);
    }

    const colonyCount = colonies.length;
    metalProd += colonyCount * COLONY_INCOME_BONUS_PER_HOUR.metal;
    crystalProd += colonyCount * COLONY_INCOME_BONUS_PER_HOUR.crystal;
    deuteriumProd += colonyCount * COLONY_INCOME_BONUS_PER_HOUR.deuterium;

    return {
        metal: metalProd,
        crystal: crystalProd,
        deuterium: deuteriumProd,
        energy: { produced: energyProduction, consumed: energyConsumption, efficiency: efficiency }
    };
};

const getUnitsCost = (units: Partial<Fleet | Defenses>): Resources => {
    let cost: Resources = { metal: 0, crystal: 0, deuterium: 0 };
    for (const [unitId, count] of Object.entries(units)) {
        if (!count || count === 0) continue;
        const unitData = ALL_GAME_OBJECTS[unitId as keyof typeof ALL_GAME_OBJECTS];
        const unitCost = unitData.cost(1);
        cost.metal += unitCost.metal * count;
        cost.crystal += unitCost.crystal * count;
        cost.deuterium += (unitCost.deuterium || 0) * count;
    }
    return cost;
}

const getFleetValue = (fleet: Fleet, shipLevels: ShipLevels): number => {
    let value = 0;
    for (const [shipId, count] of Object.entries(fleet)) {
        if (!count || count === 0) continue;
        const shipData = SHIPYARD_DATA[shipId as ShipType];
        const shipLevel = shipLevels[shipId as ShipType] || 0;
        const cost = shipData.cost(1);
        const shipValue = (cost.metal + cost.crystal + cost.deuterium) * (1 + shipLevel * 0.1);
        value += shipValue * count;
    }
    return value;
};

const calculateCombatStats = (
    baseStats: CombatStats,
    research: ResearchLevels,
    activeBoosts: ActiveBoosts,
    upgradeLevel: number = 0,
    isPlagued: boolean = false
): CombatStats => {
    const weaponTechLevel = (research[ResearchType.WEAPON_TECHNOLOGY] || 0) + (activeBoosts[BoostType.COMBAT_TECH_BOOST]?.level || 0);
    const armorTechLevel = (research[ResearchType.ARMOR_TECHNOLOGY] || 0) + (activeBoosts[BoostType.ARMOR_TECH_BOOST]?.level || 0);
    
    let finalAttack = baseStats.attack * (1 + weaponTechLevel * 0.1) * (1 + upgradeLevel * 0.1);
    if (isPlagued) {
        finalAttack *= 0.8;
    }

    const finalShield = baseStats.shield * (1 + (research[ResearchType.SHIELDING_TECHNOLOGY] || 0) * 0.1) * (1 + upgradeLevel * 0.1);
    const finalStructuralIntegrity = baseStats.structuralIntegrity * (1 + armorTechLevel * 0.1) * (1 + upgradeLevel * 0.1);

    return {
        attack: finalAttack,
        shield: finalShield,
        structuralIntegrity: finalStructuralIntegrity,
    };
};

const calculateTotalPower = (
    units: Fleet | Defenses, 
    research: ResearchLevels, 
    shipLevels: ShipLevels | null, // null for defenses
    spacePlague?: SpacePlagueState,
    activeBoosts: ActiveBoosts = {}
): number => {
    let totalPower = 0;
    for (const [unitId, count] of Object.entries(units)) {
        if (!count || count <= 0) continue;
        const unitData = ALL_GAME_OBJECTS[unitId as keyof typeof ALL_GAME_OBJECTS];
        
        if (!('attack' in unitData)) {
            continue;
        }

        const isShip = "cargoCapacity" in unitData;

        const upgradeLevel = (isShip && shipLevels) ? shipLevels[unitId as ShipType] || 0 : 0;
        const isPlagued = (isShip && spacePlague) ? spacePlague.active && spacePlague.infectedShip === unitId : false;

        const finalStats = calculateCombatStats(unitData, research, activeBoosts, upgradeLevel, isPlagued);
        
        const unitPower = finalStats.attack + finalStats.shield + (finalStats.structuralIntegrity / 10);
        totalPower += unitPower * count;
    }
    return totalPower;
};

export const processExpeditionOutcome = (mission: FleetMission, shipLevels: ShipLevels): { message: ExpeditionMessage, finalFleet: Fleet, finalLoot: Loot } => {
    const fleetValue = getFleetValue(mission.fleet, shipLevels);
    const rand = Math.random();

    let outcome: ExpeditionOutcomeType;
    const details: ExpeditionMessage['details'] = { fleetSent: mission.fleet };
    let finalFleet: Fleet = { ...mission.fleet };
    let finalLoot: Loot = {};

    if (rand < 0.15) { // 15% find resources
        outcome = ExpeditionOutcomeType.FIND_RESOURCES;
        const resourceGain = {
            metal: Math.floor(Math.random() * fleetValue * 0.1),
            crystal: Math.floor(Math.random() * fleetValue * 0.05),
            deuterium: Math.floor(Math.random() * fleetValue * 0.02),
        };
        details.resourcesGained = resourceGain;
        finalLoot = { ...finalLoot, ...resourceGain };
    } else if (rand < 0.20) { // 5% find credits
        outcome = ExpeditionOutcomeType.FIND_MONEY;
        const creditsGained = Math.floor(fleetValue * 0.2 + Math.random() * 5000);
        details.creditsGained = creditsGained;
        finalLoot = { ...finalLoot, credits: creditsGained };
    } else if (rand < 0.25) { // 5% find fleet
        outcome = ExpeditionOutcomeType.FIND_FLEET;
        const foundFleet: Fleet = {};
        if (Math.random() < 0.5) foundFleet[ShipType.LIGHT_FIGHTER] = Math.ceil(fleetValue / 20000);
        else foundFleet[ShipType.CARGO_SHIP] = Math.ceil(fleetValue / 30000);
        details.fleetGained = foundFleet;
        for (const ship in foundFleet) {
            finalFleet[ship as ShipType] = (finalFleet[ship as ShipType] || 0) + (foundFleet[ship as ShipType] || 0);
        }
    } else if (rand < 0.50) { // 25% nothing
        outcome = ExpeditionOutcomeType.NOTHING;
    } else if (rand < 0.65) { // 15% pirates
        outcome = ExpeditionOutcomeType.PIRATES;
        const lossPercent = 0.1 + Math.random() * 0.2; // 10-30% loss
        details.fleetLost = {};
        for (const ship in finalFleet) {
            const losses = Math.ceil((finalFleet[ship as ShipType] || 0) * lossPercent);
            if (losses > 0) {
                details.fleetLost[ship as ShipType] = losses;
                finalFleet[ship as ShipType] = (finalFleet[ship as ShipType] || 0) - losses;
                if (finalFleet[ship as ShipType]! < 0) finalFleet[ship as ShipType] = 0;
            }
        }
    } else if (rand < 0.75) { // 10% aliens
        outcome = ExpeditionOutcomeType.ALIENS;
        const lossPercent = 0.2 + Math.random() * 0.4; // 20-60% loss
        details.fleetLost = {};
         for (const ship in finalFleet) {
            const losses = Math.ceil((finalFleet[ship as ShipType] || 0) * lossPercent);
            if (losses > 0) {
                details.fleetLost[ship as ShipType] = losses;
                finalFleet[ship as ShipType] = (finalFleet[ship as ShipType] || 0) - losses;
                 if (finalFleet[ship as ShipType]! < 0) finalFleet[ship as ShipType] = 0;
            }
        }
    } else if (rand < 0.90) { // 15% delay
        outcome = ExpeditionOutcomeType.DELAY;
        details.delaySeconds = 30 * 60 + Math.random() * 60 * 60; // 30-90 min delay
    } else { // 10% lost
        outcome = ExpeditionOutcomeType.LOST;
        details.fleetLost = { ...finalFleet };
        finalFleet = {};
    }

    const message: ExpeditionMessage = {
        id: `msg-${Date.now()}-exp`,
        type: 'expedition',
        timestamp: Date.now(),
        isRead: false,
        subject: `Raport z Wyprawy [${mission.targetCoords}]`,
        outcome,
        details,
    };

    return { message, finalFleet, finalLoot };
};

// Seeded random function for consistent galaxy generation
const seededRandom = (seed: number) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
};
const FAKE_PLAYER_NAMES = ['Zenith', 'Nova', 'Orion', 'Cygnus', 'Draco', 'Lyra', 'Aquila', 'Centurion', 'Void', 'Stalker', 'Pulsar', 'Goliath'];
const getPlanetImage = (seed: number) => {
    const planetTypeSeed = seededRandom(seed);
    if (planetTypeSeed > 0.8) return '🌋'; // Volcanic
    if (planetTypeSeed > 0.6) return '🧊'; // Ice
    if (planetTypeSeed > 0.4) return '🏜️'; // Desert
    return '🪐'; // Temperate
}

export const evolveNpc = (npc: NPCState, offlineSeconds: number, coords: string): { updatedNpc: NPCState, mission: NPCFleetMission | null } => {
    let evolvedNpc = { ...npc };
    // This is a simplified version of the logic from utils/npcLogic.ts for brevity
    // In a real scenario, you'd import directly from that file.
    const productions = calculateProductions(evolvedNpc.buildings, {active: false, resourceType: null, endTime: 0, bonusMultiplier: 1}, [], {});
    const maxResources = calculateMaxResources(evolvedNpc.buildings);
    evolvedNpc.resources.metal = Math.min(maxResources.metal, evolvedNpc.resources.metal + (productions.metal / 3600) * offlineSeconds);
    evolvedNpc.resources.crystal = Math.min(maxResources.crystal, evolvedNpc.resources.crystal + (productions.crystal / 3600) * offlineSeconds);
    evolvedNpc.resources.deuterium = Math.min(maxResources.deuterium, evolvedNpc.resources.deuterium + (productions.deuterium / 3600) * offlineSeconds);
    
    evolvedNpc.lastUpdateTime = Date.now();
    return { updatedNpc: evolvedNpc, mission: null }; // Mission logic omitted for simplicity here
};

export const initializeNpc = (coords: string): NPCState => {
    const now = Date.now();
    const planetSeed = parseInt(coords.replace(/:/g, ''));
    const nameIndex = Math.floor(seededRandom(planetSeed * 2) * FAKE_PLAYER_NAMES.length);
    const personalitySeed = seededRandom(planetSeed * 3);
    let personality = NPCPersonality.BALANCED;
    if (personalitySeed > 0.66) personality = NPCPersonality.AGGRESSIVE;
    else if (personalitySeed < 0.33) personality = NPCPersonality.ECONOMIC;

    return {
        ...INITIAL_NPC_STATE,
        lastUpdateTime: now,
        name: FAKE_PLAYER_NAMES[nameIndex],
        image: getPlanetImage(planetSeed * 4),
        personality: personality
    };
};
