export type View = 'buildings' | 'research' | 'shipyard' | 'defense' | 'fleet' | 'messages' | 'merchant' | 'galaxy' | 'fleet_upgrades';

export enum BuildingType {
  METAL_MINE = 'METAL_MINE',
  CRYSTAL_MINE = 'CRYSTAL_MINE',
  DEUTERIUM_SYNTHESIZER = 'DEUTERIUM_SYNTHESIZER',
  SOLAR_PLANT = 'SOLAR_PLANT',
  RESEARCH_LAB = 'RESEARCH_LAB',
  SHIPYARD = 'SHIPYARD',
  METAL_STORAGE = 'METAL_STORAGE',
  CRYSTAL_STORAGE = 'CRYSTAL_STORAGE',
  DEUTERIUM_TANK = 'DEUTERIUM_TANK',
  BLACK_MARKET = 'BLACK_MARKET',
}

export enum BuildingCategory {
    RESOURCE = 'RESOURCE',
    INDUSTRIAL = 'INDUSTRIAL',
    STORAGE = 'STORAGE',
}

export enum ResearchType {
    ENERGY_TECHNOLOGY = 'ENERGY_TECHNOLOGY',
    COMPUTER_TECHNOLOGY = 'COMPUTER_TECHNOLOGY',
    WEAPON_TECHNOLOGY = 'WEAPON_TECHNOLOGY',
    COMBUSTION_DRIVE = 'COMBUSTION_DRIVE',
    SPY_TECHNOLOGY = 'SPY_TECHNOLOGY',
    IMPULSE_DRIVE = 'IMPULSE_DRIVE',
    LASER_TECHNOLOGY = 'LASER_TECHNOLOGY',
    ION_TECHNOLOGY = 'ION_TECHNOLOGY',
    PLASMA_TECHNOLOGY = 'PLASMA_TECHNOLOGY',
    ARMOR_TECHNOLOGY = 'ARMOR_TECHNOLOGY',
    SHIELDING_TECHNOLOGY = 'SHIELDING_TECHNOLOGY',
    HYPERSPACE_DRIVE = 'HYPERSPACE_DRIVE',
    ASTROPHYSICS = 'ASTROPHYSICS',
    GRAVITON_TECHNOLOGY = 'GRAVITON_TECHNOLOGY',
    AI_TECHNOLOGY = 'AI_TECHNOLOGY',
}

export enum ShipType {
    LIGHT_FIGHTER = 'LIGHT_FIGHTER',
    MEDIUM_FIGHTER = 'MEDIUM_FIGHTER',
    HEAVY_FIGHTER = 'HEAVY_FIGHTER',
    CARGO_SHIP = 'CARGO_SHIP',
    MEDIUM_CARGO_SHIP = 'MEDIUM_CARGO_SHIP',
    HEAVY_CARGO_SHIP = 'HEAVY_CARGO_SHIP',
    SPY_PROBE = 'SPY_PROBE',
    RECYCLER = 'RECYCLER',
    CRUISER = 'CRUISER',
    BATTLESHIP = 'BATTLESHIP',
    DESTROYER = 'DESTROYER',
    BOMBER = 'BOMBER',
    COLONY_SHIP = 'COLONY_SHIP',
    RESEARCH_VESSEL = 'RESEARCH_VESSEL',
    BATTLECRUISER = 'BATTLECRUISER',
    DEATHSTAR = 'DEATHSTAR',
}

export enum DefenseType {
    ROCKET_LAUNCHER = 'ROCKET_LAUNCHER',
    LIGHT_LASER_CANNON = 'LIGHT_LASER_CANNON',
    HEAVY_LASER_CANNON = 'HEAVY_LASER_CANNON',
    ION_CANNON = 'ION_CANNON',
    PLASMA_TURRET = 'PLASMA_TURRET',
}

export type GameObject = BuildingType | ResearchType | ShipType | DefenseType;

export interface Resources {
  metal: number;
  crystal: number;
  deuterium: number;
}

export type BuildingLevels = {
  [key in BuildingType]: number;
};

export type ResearchLevels = {
    [key in ResearchType]: number;
};

export type ShipLevels = {
    [key in ShipType]: number;
};

export type Fleet = {
    [key in ShipType]?: number;
};

export type Defenses = {
    [key in DefenseType]?: number;
};

export type QueueItemType = 'building' | 'research' | 'ship' | 'defense' | 'ship_upgrade';

export interface QueueItem {
    id: GameObject;
    type: QueueItemType;
    levelOrAmount: number;
    startTime: number;
    endTime: number;
    buildTime: number;
}

export enum MissionType {
    ATTACK = 'ATTACK',
    SPY = 'SPY',
    HARVEST = 'HARVEST',
    EXPEDITION = 'EXPEDITION',
    COLONIZE = 'COLONIZE',
    EXPLORE = 'EXPLORE',
}

export interface FleetMission {
    id: string;
    fleet: Fleet;
    missionType: MissionType;
    targetCoords: string;
    startTime: number;
    arrivalTime: number;
    returnTime: number;
    processedArrival: boolean;
    loot: Loot;
    explorationEndTime?: number; 
    processedExploration?: boolean;
}

export interface NPCFleetMission {
    id: string;
    sourceCoords: string;
    fleet: Fleet;
    missionType: MissionType;
    startTime: number;
    arrivalTime: number;
}

export interface SpyReport {
    targetCoords: string;
    resources: Partial<Resources>;
    fleet: Partial<Fleet>;
    defenses: Partial<Defenses>;
    buildings: Partial<BuildingLevels>;
    research: Partial<ResearchLevels>;
}

export interface Loot {
    metal?: number;
    crystal?: number;
    deuterium?: number;
    credits?: number;
}

export type CombatStats = {
    attack: number;
    shield: number;
    structuralIntegrity: number;
};

export interface BattleReport {
    id: string;
    targetCoords: string;
    attackerName: string;
    defenderName: string;
    isPlayerAttacker: boolean;
    attackerFleet: Fleet;
    defenderFleet: Fleet;
    defenderDefenses: Defenses;
    attackerLosses: Partial<Fleet>;
    defenderLosses: Partial<Fleet>;
    defenderDefensesLosses: Partial<Defenses>;
    loot: Loot;
    debrisCreated: Partial<Resources>;
}


type BaseMessage = {
    id: string;
    timestamp: number;
    isRead: boolean;
    subject: string;
};

export type SpyMessage = BaseMessage & { type: 'spy'; report: SpyReport; };
export type BattleMessage = BaseMessage & { type: 'battle'; report: BattleReport; };

export enum MerchantStatus { INACTIVE = 'INACTIVE', INCOMING = 'INCOMING', ACTIVE = 'ACTIVE' }
export type MerchantExchangeRates = { [key in keyof Resources]: { buy: number; sell: number }; };
export interface MerchantState { status: MerchantStatus; arrivalTime: number; departureTime: number; rates: MerchantExchangeRates; }
export type MerchantInfoMessage = BaseMessage & { type: 'merchant'; merchantStatus: MerchantStatus; eventTime: number; };

export type EspionageEventMessage = BaseMessage & { type: 'espionage_event'; spyCoords: string; spyName?: string; };

export enum PirateMercenaryStatus { INACTIVE = 'INACTIVE', INCOMING = 'INCOMING', AVAILABLE = 'AVAILABLE', DEPARTED = 'DEPARTED' }
export interface PirateMercenaryState { status: PirateMercenaryStatus; fleet: Fleet; hireCost: number; arrivalTime: number; departureTime: number; }
export type PirateMessage = BaseMessage & { type: 'pirate'; pirateState: PirateMercenaryState; };

export enum AsteroidImpactType { DAMAGE = 'DAMAGE', BONUS = 'BONUS' }
export type AsteroidImpactMessage = BaseMessage & { type: 'asteroid_impact'; impactType: AsteroidImpactType; details: { buildingId?: BuildingType; newLevel?: number; resourceType?: keyof Omit<Resources, 'deuterium'>; amount?: number; } };

export interface ResourceVeinBonus { active: boolean; resourceType: keyof Resources | null; endTime: number; bonusMultiplier: number; }
export type ResourceVeinMessage = BaseMessage & { type: 'resource_vein'; resourceType: keyof Resources; status: 'activated' | 'expired'; bonusEndTime: number; };

export enum AncientArtifactStatus { INACTIVE = 'INACTIVE', AWAITING_CHOICE = 'AWAITING_CHOICE' }
export enum AncientArtifactChoice { STUDY = 'STUDY', SELL = 'SELL', IGNORE = 'IGNORE' }
export interface AncientArtifactState { status: AncientArtifactStatus; }
export type AncientArtifactMessage = BaseMessage & { type: 'ancient_artifact'; choice: AncientArtifactChoice; outcome: { success?: boolean; technology?: ResearchType; newLevel?: number; creditsGained?: number; } };

export interface SpacePlagueState { active: boolean; infectedShip: ShipType | null; endTime: number; }
export type SpacePlagueMessage = BaseMessage & { type: 'space_plague'; infectedShip: ShipType; status: 'activated' | 'expired'; };

export type OfflineSummaryMessage = BaseMessage & { type: 'offline_summary'; duration: number; events: string[]; };

export enum ExpeditionOutcomeType { FIND_RESOURCES = 'FIND_RESOURCES', FIND_MONEY = 'FIND_MONEY', FIND_FLEET = 'FIND_FLEET', NOTHING = 'NOTHING', PIRATES = 'PIRATES', ALIENS = 'ALIENS', DELAY = 'DELAY', LOST = 'LOST' }
export type ExpeditionMessage = BaseMessage & { type: 'expedition'; outcome: ExpeditionOutcomeType; details: { fleetSent: Fleet; resourcesGained?: Partial<Resources>; creditsGained?: number; fleetGained?: Partial<Fleet>; fleetLost?: Partial<Fleet>; delaySeconds?: number; } };

export interface Colony { id: string; name: string; creationTime: number; }
export type ColonizationMessage = BaseMessage & { type: 'colonization'; coords: string; success: boolean; };

export enum BoostType { EXTRA_BUILD_QUEUE = 'EXTRA_BUILD_QUEUE', RESOURCE_PRODUCTION_BOOST = 'RESOURCE_PRODUCTION_BOOST', COMBAT_TECH_BOOST = 'COMBAT_TECH_BOOST', ARMOR_TECH_BOOST = 'ARMOR_TECH_BOOST', DRIVE_TECH_BOOST = 'DRIVE_TECH_BOOST', CONSTRUCTION_COST_REDUCTION = 'CONSTRUCTION_COST_REDUCTION', CONSTRUCTION_TIME_REDUCTION = 'CONSTRUCTION_TIME_REDUCTION', STORAGE_PROTECTION_BOOST = 'STORAGE_PROTECTION_BOOST', SECTOR_ACTIVITY_SCAN = 'SECTOR_ACTIVITY_SCAN', ABANDONED_COLONY_LOOT = 'ABANDONED_COLONY_LOOT' }
export interface Boost { id: string; type: BoostType; level: number; duration: number; }
export interface Inventory { boosts: Boost[]; }
export interface ActiveBoosts { [BoostType.EXTRA_BUILD_QUEUE]?: { level: number; endTime: number; }; [BoostType.RESOURCE_PRODUCTION_BOOST]?: { level: number; endTime: number; }; [BoostType.COMBAT_TECH_BOOST]?: { level: number; endTime: number; }; [BoostType.ARMOR_TECH_BOOST]?: { level: number; endTime: number; }; [BoostType.DRIVE_TECH_BOOST]?: { level: number; endTime: number; }; [BoostType.STORAGE_PROTECTION_BOOST]?: { level: number; endTime: number; }; [BoostType.SECTOR_ACTIVITY_SCAN]?: { endTime: number; }; }

export enum ExplorationOutcomeType { FIND_BOOST = 'FIND_BOOST', FIND_RESOURCES = 'FIND_RESOURCES', NOTHING = 'NOTHING', HOSTILES = 'HOSTILES', FIND_SHIP_WRECK = 'FIND_SHIP_WRECK' }
export type ExplorationMessage = BaseMessage & { type: 'exploration'; outcome: ExplorationOutcomeType; details: { targetCoords: string; foundBoost?: Boost; resourcesGained?: Partial<Resources>; fleetLost?: Partial<Fleet>; fleetGained?: Partial<Fleet>; } };

export type Message = SpyMessage | BattleMessage | MerchantInfoMessage | EspionageEventMessage | PirateMessage | AsteroidImpactMessage | ResourceVeinMessage | AncientArtifactMessage | SpacePlagueMessage | OfflineSummaryMessage | ExpeditionMessage | ColonizationMessage | ExplorationMessage;

export type DebrisField = Partial<Resources>;

export enum NPCPersonality { ECONOMIC = 'ECONOMIC', AGGRESSIVE = 'AGGRESSIVE', BALANCED = 'BALANCED' }
export interface NPCState { resources: Resources; buildings: BuildingLevels; research: ResearchLevels; fleet: Fleet; defenses: Defenses; lastUpdateTime: number; personality: NPCPersonality; name: string; image: string; }
export type NPCStates = Record<string, NPCState>;


// Main Game State Object
export interface GameState {
    username: string;
    resources: Resources;
    buildings: BuildingLevels;
    research: ResearchLevels;
    shipLevels: ShipLevels;
    fleet: Fleet;
    defenses: Defenses;
    fleetMissions: FleetMission[];
    npcFleetMissions: NPCFleetMission[];
    messages: Message[];
    buildQueue: QueueItem[];
    credits: number;
    merchantState: MerchantState;
    lastMerchantCheckTime: number;
    pirateMercenaryState: PirateMercenaryState;
    lastPirateCheckTime: number;
    lastAsteroidCheckTime: number;
    resourceVeinBonus: ResourceVeinBonus;
    lastResourceVeinCheckTime: number;
    ancientArtifactState: AncientArtifactState;
    lastArtifactCheckTime: number;
    spacePlague: SpacePlagueState;
    lastSpacePlagueCheckTime: number;
    lastSaveTime: number;
    npcStates: NPCStates;
    awardedBonuses: BuildingType[];
    debrisFields: Record<string, DebrisField>;
    colonies: Colony[];
    inventory: Inventory;
    activeBoosts: ActiveBoosts;
    activeCostReduction: number;
    blackMarketHourlyIncome: number;
    lastBlackMarketIncomeCheck: number;
}
