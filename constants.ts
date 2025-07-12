

import { BuildingType, ResearchType, ShipType, DefenseType, Resources, BuildingLevels, ResearchLevels, Fleet, Defenses, BuildingCategory, MerchantState, MerchantStatus, NPCState, NPCFleetMission, ShipLevels, DebrisField, PirateMercenaryState, PirateMercenaryStatus, ResourceVeinBonus, AncientArtifactState, AncientArtifactStatus, SpacePlagueState, CombatStats, Colony, Inventory, ActiveBoosts } from './types';

export const TICK_INTERVAL = 1000; // ms
export const BASE_STORAGE_CAPACITY = 10000;
export const NPC_STATES_KEY = 'cosmic-lord-npc-states';
export const PLAYER_HOME_COORDS = '1:42:8';
export const DEBRIS_FIELD_RECOVERY_RATE = 0.3; // 30% of destroyed units' cost becomes debris
export const PROTECTED_RESOURCES_FACTOR = 0.1; // 10% of storage capacity is protected from raids
export const COLONY_INCOME_BONUS_PER_HOUR: Resources = {
    metal: 500,
    crystal: 250,
    deuterium: 100,
};

export const INITIAL_RESOURCES: Resources = {
  metal: 500,
  crystal: 500,
  deuterium: 0,
};

export const INITIAL_BUILDING_LEVELS: BuildingLevels = {
  [BuildingType.METAL_MINE]: 1,
  [BuildingType.CRYSTAL_MINE]: 1,
  [BuildingType.DEUTERIUM_SYNTHESIZER]: 0,
  [BuildingType.SOLAR_PLANT]: 1,
  [BuildingType.RESEARCH_LAB]: 0,
  [BuildingType.SHIPYARD]: 0,
  [BuildingType.METAL_STORAGE]: 0,
  [BuildingType.CRYSTAL_STORAGE]: 0,
  [BuildingType.DEUTERIUM_TANK]: 0,
  [BuildingType.BLACK_MARKET]: 0,
};

export const INITIAL_RESEARCH_LEVELS: ResearchLevels = {
    [ResearchType.ENERGY_TECHNOLOGY]: 0,
    [ResearchType.COMPUTER_TECHNOLOGY]: 0,
    [ResearchType.WEAPON_TECHNOLOGY]: 0,
    [ResearchType.COMBUSTION_DRIVE]: 0,
    [ResearchType.SPY_TECHNOLOGY]: 0,
    [ResearchType.IMPULSE_DRIVE]: 0,
    [ResearchType.ARMOR_TECHNOLOGY]: 0,
    [ResearchType.SHIELDING_TECHNOLOGY]: 0,
    [ResearchType.HYPERSPACE_DRIVE]: 0,
    [ResearchType.LASER_TECHNOLOGY]: 0,
    [ResearchType.ION_TECHNOLOGY]: 0,
    [ResearchType.PLASMA_TECHNOLOGY]: 0,
    [ResearchType.ASTROPHYSICS]: 0,
    [ResearchType.GRAVITON_TECHNOLOGY]: 0,
    [ResearchType.AI_TECHNOLOGY]: 0,
};

export const INITIAL_SHIP_LEVELS: ShipLevels = {
    [ShipType.LIGHT_FIGHTER]: 0,
    [ShipType.MEDIUM_FIGHTER]: 0,
    [ShipType.HEAVY_FIGHTER]: 0,
    [ShipType.CARGO_SHIP]: 0,
    [ShipType.MEDIUM_CARGO_SHIP]: 0,
    [ShipType.HEAVY_CARGO_SHIP]: 0,
    [ShipType.SPY_PROBE]: 0,
    [ShipType.RECYCLER]: 0,
    [ShipType.CRUISER]: 0,
    [ShipType.BATTLESHIP]: 0,
    [ShipType.DESTROYER]: 0,
    [ShipType.BOMBER]: 0,
    [ShipType.COLONY_SHIP]: 0,
    [ShipType.RESEARCH_VESSEL]: 0,
    [ShipType.BATTLECRUISER]: 0,
    [ShipType.DEATHSTAR]: 0,
};

export const INITIAL_FLEET: Fleet = {};
export const INITIAL_DEFENSES: Defenses = {};
export const INITIAL_COLONIES: Colony[] = [];
export const INITIAL_NPC_FLEET_MISSIONS: NPCFleetMission[] = [];
export const INITIAL_DEBRIS_FIELDS: Record<string, DebrisField> = {};
export const INITIAL_INVENTORY: Inventory = { boosts: [] };
export const INITIAL_ACTIVE_BOOSTS: ActiveBoosts = {};


export const INITIAL_MERCHANT_STATE: MerchantState = {
    status: MerchantStatus.INACTIVE,
    arrivalTime: 0,
    departureTime: 0,
    rates: {
        metal: { buy: 2, sell: 1 },
        crystal: { buy: 4, sell: 2 },
        deuterium: { buy: 6, sell: 3 },
    }
};

export const INITIAL_PIRATE_MERCENARY_STATE: PirateMercenaryState = {
    status: PirateMercenaryStatus.INACTIVE,
    fleet: {},
    hireCost: 0,
    arrivalTime: 0,
    departureTime: 0,
};

export const INITIAL_RESOURCE_VEIN_BONUS: ResourceVeinBonus = {
    active: false,
    resourceType: null,
    endTime: 0,
    bonusMultiplier: 1.25,
};

export const INITIAL_ANCIENT_ARTIFACT_STATE: AncientArtifactState = {
    status: AncientArtifactStatus.INACTIVE,
};

export const INITIAL_SPACE_PLAGUE_STATE: SpacePlagueState = {
    active: false,
    infectedShip: null,
    endTime: 0,
};


export const INITIAL_NPC_STATE: Omit<NPCState, 'lastUpdateTime' | 'personality' | 'name' | 'image'> = {
    resources: { metal: 1000, crystal: 500, deuterium: 100 },
    buildings: { ...INITIAL_BUILDING_LEVELS, METAL_MINE: 2, CRYSTAL_MINE: 1, SOLAR_PLANT: 2 },
    research: { ...INITIAL_RESEARCH_LEVELS },
    fleet: {},
    defenses: {},
};


type BaseGameObjectInfo = {
    name: string;
    description: string;
    icon?: string;
    cost: (levelOrAmount: number) => Resources;
    requirements?: Partial<BuildingLevels & ResearchLevels>;
    buildTime: (levelOrAmount: number) => number; // in seconds
}

type BuildingInfo = BaseGameObjectInfo & {
    category: BuildingCategory;
    icon: string;
    image?: string;
    production?: (level: number) => number;
    energyConsumption?: (level: number) => number;
    capacity?: (level: number) => number;
}


type ShipInfo = BaseGameObjectInfo & CombatStats & {
    icon: string;
    image?: string;
    cargoCapacity: number;
    speed: number;
    drive: ResearchType;
    requiredEnergy?: number;
}

type DefenseInfo = BaseGameObjectInfo & CombatStats & {
    icon: string;
};

type ShipUpgradeInfo = Omit<BaseGameObjectInfo, 'icon'>;

export const BUILDING_DATA: Record<BuildingType, BuildingInfo> = {
  [BuildingType.METAL_MINE]: {
    name: "Kopalnia Metalu",
    category: BuildingCategory.RESOURCE,
    description: "Wydobywa metal z jądra planety. Metal jest podstawowym surowcem budowlanym.",
    icon: "🔩",
    image: "metal.jpg",
    cost: (level) => ({ metal: Math.floor(60 * Math.pow(1.5, level - 1)), crystal: Math.floor(15 * Math.pow(1.5, level - 1)), deuterium: 0 }),
    buildTime: (level) => Math.floor(((60 * Math.pow(1.5, level - 1)) + (15 * Math.pow(1.5, level - 1))) / 2500 * 360),
    production: (level) => Math.floor(30 * level * Math.pow(1.1, level)),
    energyConsumption: (level) => Math.floor(10 * level * Math.pow(1.1, level)),
  },
  [BuildingType.CRYSTAL_MINE]: {
    name: "Kopalnia Kryształu",
    category: BuildingCategory.RESOURCE,
    description: "Wydobywa kryształy, niezbędne do zaawansowanych technologii i budynków.",
    icon: "💎",
    image: "krysztal.jpg",
    cost: (level) => ({ metal: Math.floor(48 * Math.pow(1.6, level - 1)), crystal: Math.floor(24 * Math.pow(1.6, level - 1)), deuterium: 0 }),
    buildTime: (level) => Math.floor(((48 * Math.pow(1.6, level - 1)) + (24 * Math.pow(1.6, level - 1))) / 2500 * 360),
    production: (level) => Math.floor(20 * level * Math.pow(1.1, level)),
    energyConsumption: (level) => Math.floor(10 * level * Math.pow(1.1, level)),
  },
  [BuildingType.DEUTERIUM_SYNTHESIZER]: {
    name: "Syntezator Deuteru",
    category: BuildingCategory.RESOURCE,
    description: "Pozyskuje deuter z wody. Deuter jest paliwem dla statków i niektórych elektrowni.",
    icon: "💧",
    image: "deuter.jpg",
    cost: (level) => ({ metal: Math.floor(225 * Math.pow(1.5, level - 1)), crystal: Math.floor(75 * Math.pow(1.5, level - 1)), deuterium: 0 }),
    buildTime: (level) => Math.floor(((225 * Math.pow(1.5, level - 1)) + (75 * Math.pow(1.5, level - 1))) / 2500 * 360),
    production: (level) => (level > 0 ? Math.floor(10 * level * Math.pow(1.1, level)) : 0),
    energyConsumption: (level) => Math.floor(20 * level * Math.pow(1.1, level)),
  },
  [BuildingType.SOLAR_PLANT]: {
    name: "Elektrownia Słoneczna",
    category: BuildingCategory.RESOURCE,
    description: "Produkuje energię z promieniowania gwiazdy, zasilając budynki na planecie.",
    icon: "☀️",
    image: "elektrownia.jpg",
    cost: (level) => ({ metal: Math.floor(75 * Math.pow(1.5, level - 1)), crystal: Math.floor(30 * Math.pow(1.5, level - 1)), deuterium: 0 }),
    buildTime: (level) => Math.floor(((75 * Math.pow(1.5, level - 1)) + (30 * Math.pow(1.5, level - 1))) / 2500 * 360),
    production: (level) => Math.floor(20 * level * Math.pow(1.1, level)),
  },
  [BuildingType.RESEARCH_LAB]: {
    name: "Laboratorium Badawcze",
    icon: "🔬",
    category: BuildingCategory.INDUSTRIAL,
    description: "Centrum rozwoju technologicznego twojego imperium. Umożliwia prowadzenie badań.",
    image: "laboratorium.jpg",
    cost: level => ({ metal: 200 * Math.pow(2, level-1), crystal: 400 * Math.pow(2, level-1), deuterium: 200 * Math.pow(2, level-1) }),
    buildTime: level => Math.floor((200 * Math.pow(2, level-1) + 400 * Math.pow(2, level-1) + 200 * Math.pow(2, level-1)) / 2500 * 360),
    energyConsumption: level => Math.floor(25 * level * Math.pow(1.1, level)),
  },
  [BuildingType.SHIPYARD]: {
      name: "Stocznia",
      icon: "🛠️",
      category: BuildingCategory.INDUSTRIAL,
      description: "Buduje statki i struktury obronne. Wymaga Laboratorium na poziomie 1.",
      image: "stocznia.jpg",
      cost: level => ({ metal: 400 * Math.pow(2, level-1), crystal: 200 * Math.pow(2, level-1), deuterium: 100 * Math.pow(2, level-1) }),
      buildTime: level => Math.floor((400 * Math.pow(2, level-1) + 200 * Math.pow(2, level-1) + 100 * Math.pow(2, level-1)) / 2500 * 360),
      energyConsumption: level => Math.floor(50 * level * Math.pow(1.1, level)),
      requirements: { [BuildingType.RESEARCH_LAB]: 1 },
  },
  [BuildingType.BLACK_MARKET]: {
      name: "Czarny Rynek",
      icon: "💹",
      category: BuildingCategory.INDUSTRIAL,
      description: "Generuje losowy dochód w kredytach co godzinę. Ryzyko się opłaca... czasami.",
      cost: level => ({ metal: 300 * Math.pow(2, level-1), crystal: 500 * Math.pow(2, level-1), deuterium: 200 * Math.pow(2, level-1) }),
      buildTime: level => Math.floor((300 * Math.pow(2, level-1) + 500 * Math.pow(2, level-1) + 200 * Math.pow(2, level-1)) / 2500 * 360),
      energyConsumption: level => Math.floor(30 * level * Math.pow(1.1, level)),
      requirements: { [BuildingType.RESEARCH_LAB]: 3, [ResearchType.COMPUTER_TECHNOLOGY]: 2 },
  },
  [BuildingType.METAL_STORAGE]: {
      name: "Magazyn Metalu",
      icon: "📦",
      category: BuildingCategory.STORAGE,
      description: "Zwiększa pojemność magazynową dla metalu. Chroni część surowców przed grabieżą.",
      cost: level => ({ metal: 1000 * Math.pow(2, level-1), crystal: 0, deuterium: 0 }),
      buildTime: level => Math.floor((1000 * Math.pow(2, level-1)) / 2500 * 360),
      capacity: level => BASE_STORAGE_CAPACITY * Math.pow(1.6, level),
  },
  [BuildingType.CRYSTAL_STORAGE]: {
      name: "Magazyn Kryształu",
      icon: "📦",
      category: BuildingCategory.STORAGE,
      description: "Zwiększa pojemność magazynową dla kryształu. Chroni część surowców przed grabieżą.",
      cost: level => ({ metal: 1000 * Math.pow(2, level-1), crystal: 500 * Math.pow(2, level-1), deuterium: 0 }),
      buildTime: level => Math.floor(((1000 * Math.pow(2, level-1)) + (500 * Math.pow(2, level-1))) / 2500 * 360),
      capacity: level => BASE_STORAGE_CAPACITY * Math.pow(1.6, level),
  },
  [BuildingType.DEUTERIUM_TANK]: {
      name: "Zbiornik Deuteru",
      icon: "🛢️",
      category: BuildingCategory.STORAGE,
      description: "Zwiększa pojemność magazynową dla deuteru. Chroni część surowców przed grabieżą.",
      cost: level => ({ metal: 1000 * Math.pow(2, level-1), crystal: 1000 * Math.pow(2, level-1), deuterium: 0 }),
      buildTime: level => Math.floor(((1000 * Math.pow(2, level-1)) + (1000 * Math.pow(2, level-1))) / 2500 * 360),
      capacity: level => BASE_STORAGE_CAPACITY * Math.pow(1.6, level),
  },
};

export const RESEARCH_DATA: Record<ResearchType, BaseGameObjectInfo & {icon: string}> = {
    [ResearchType.ENERGY_TECHNOLOGY]: {
        name: "Technologia energetyczna",
        description: "Zwiększa wydajność produkcji energii i pozwala na rozwój zaawansowanych technologii.",
        icon: "⚡",
        cost: level => ({ metal: 0, crystal: 800 * Math.pow(2, level - 1), deuterium: 400 * Math.pow(2, level - 1) }),
        buildTime: level => Math.floor((800 * Math.pow(2, level-1) + 400 * Math.pow(2, level-1)) / 2500 * 360),
        requirements: { [BuildingType.RESEARCH_LAB]: 1 },
    },
    [ResearchType.ARMOR_TECHNOLOGY]: {
        name: "Technologia pancerza",
        description: "Zwiększa wytrzymałość strukturalną statków i obrony o 10% za każdy poziom.",
        icon: "🧱",
        cost: level => ({ metal: 1000 * Math.pow(2, level - 1), crystal: 0, deuterium: 0 }),
        buildTime: level => Math.floor((1000 * Math.pow(2, level-1)) / 2500 * 360),
        requirements: { [BuildingType.RESEARCH_LAB]: 2 },
    },
     [ResearchType.SHIELDING_TECHNOLOGY]: {
        name: "Technologia osłon",
        description: "Wzmacnia tarcze ochronne wszystkich jednostek o 10% na poziom.",
        icon: "🛡️",
        cost: level => ({ metal: 200 * Math.pow(2, level - 1), crystal: 600 * Math.pow(2, level - 1), deuterium: 0 }),
        buildTime: level => Math.floor((200 * Math.pow(2, level-1) + 600 * Math.pow(2, level-1)) / 2500 * 360),
        requirements: { [BuildingType.RESEARCH_LAB]: 6, [ResearchType.ENERGY_TECHNOLOGY]: 3 },
    },
    [ResearchType.WEAPON_TECHNOLOGY]: {
        name: "Technologia bojowa",
        description: "Zwiększa siłę ognia jednostek bojowych o 10% na poziom.",
        icon: "💥",
        cost: level => ({ metal: 800 * Math.pow(2, level - 1), crystal: 200 * Math.pow(2, level - 1), deuterium: 0 }),
        buildTime: level => Math.floor((800 * Math.pow(2, level-1) + 200 * Math.pow(2, level-1)) / 2500 * 360),
        requirements: { [BuildingType.RESEARCH_LAB]: 4 },
    },
    [ResearchType.LASER_TECHNOLOGY]: {
        name: "Technologia laserowa",
        description: "Odblokowuje podstawową broń energetyczną i jej ulepszenia.",
        icon: "🔴",
        cost: level => ({ metal: 200 * Math.pow(2, level-1), crystal: 100 * Math.pow(2, level-1), deuterium: 0 }),
        buildTime: level => Math.floor((200 * Math.pow(2, level-1) + 100 * Math.pow(2, level-1)) / 2500 * 360),
        requirements: { [BuildingType.RESEARCH_LAB]: 1, [ResearchType.ENERGY_TECHNOLOGY]: 2 },
    },
    [ResearchType.ION_TECHNOLOGY]: {
        name: "Technologia jonowa",
        description: "Odblokowuje broń jonową, wyspecjalizowaną w niszczeniu tarcz.",
        icon: "🔵",
        cost: level => ({ metal: 1000 * Math.pow(2, level - 1), crystal: 300 * Math.pow(2, level-1), deuterium: 100 * Math.pow(2, level-1) }),
        buildTime: level => Math.floor((1000 * Math.pow(2, level-1) + 300 * Math.pow(2, level-1) + 100 * Math.pow(2, level-1)) / 2500 * 360),
        requirements: { [BuildingType.RESEARCH_LAB]: 4, [ResearchType.LASER_TECHNOLOGY]: 5, [ResearchType.ENERGY_TECHNOLOGY]: 4 },
    },
    [ResearchType.PLASMA_TECHNOLOGY]: {
        name: "Technologia plazmowa",
        description: "Najwyższy poziom technologii zbrojeniowej, zadający ogromne obrażenia.",
        icon: "🟣",
        cost: level => ({ metal: 2000 * Math.pow(2, level - 1), crystal: 4000 * Math.pow(2, level-1), deuterium: 1000 * Math.pow(2, level-1) }),
        buildTime: level => Math.floor((2000 * Math.pow(2, level-1) + 4000 * Math.pow(2, level-1) + 1000 * Math.pow(2, level-1)) / 2500 * 360),
        requirements: { [BuildingType.RESEARCH_LAB]: 4, [ResearchType.ION_TECHNOLOGY]: 5, [ResearchType.WEAPON_TECHNOLOGY]: 8 },
    },
    [ResearchType.COMBUSTION_DRIVE]: {
        name: "Napęd spalinowy",
        description: "Podstawowy napęd dla małych statków. Każdy poziom zwiększa ich prędkość o 10%.",
        icon: "🔥",
        cost: level => ({ metal: 400 * Math.pow(2, level-1), crystal: 0, deuterium: 600 * Math.pow(2, level-1) }),
        buildTime: level => Math.floor((400 * Math.pow(2, level-1) + 600 * Math.pow(2, level-1)) / 2500 * 360),
        requirements: { [BuildingType.RESEARCH_LAB]: 1, [ResearchType.ENERGY_TECHNOLOGY]: 1 },
    },
    [ResearchType.IMPULSE_DRIVE]: {
        name: "Napęd impulsowy",
        description: "Ulepszony napęd dla cięższych statków. Każdy poziom zwiększa ich prędkość o 20%.",
        icon: "💨",
        cost: level => ({ metal: 2000 * Math.pow(2, level-1), crystal: 4000 * Math.pow(2, level-1), deuterium: 600 * Math.pow(2, level-1) }),
        buildTime: level => Math.floor((2000 * Math.pow(2, level-1) + 4000 * Math.pow(2, level-1) + 600 * Math.pow(2, level-1)) / 2500 * 360),
        requirements: { [BuildingType.RESEARCH_LAB]: 2, [ResearchType.ENERGY_TECHNOLOGY]: 1 },
    },
    [ResearchType.HYPERSPACE_DRIVE]: {
        name: "Napęd nadprzestrzenny",
        description: "Najszybszy napęd dla okrętów bojowych. Każdy poziom zwiększa ich prędkość o 30%.",
        icon: "🌀",
        cost: level => ({ metal: 10000 * Math.pow(2, level-1), crystal: 20000 * Math.pow(2, level-1), deuterium: 6000 * Math.pow(2, level-1) }),
        buildTime: level => Math.floor((10000 * Math.pow(2, level-1) + 20000 * Math.pow(2, level-1) + 6000 * Math.pow(2, level-1)) / 2500 * 360),
        requirements: { [BuildingType.RESEARCH_LAB]: 7, [ResearchType.IMPULSE_DRIVE]: 5, [ResearchType.SHIELDING_TECHNOLOGY]: 5 },
    },
    [ResearchType.COMPUTER_TECHNOLOGY]: {
        name: "Technologia komputerowa",
        description: "Zwiększa liczbę slotów floty i pozwala na budowę bardziej zaawansowanych statków.",
        icon: "💻",
        cost: level => ({ metal: 0, crystal: 400 * Math.pow(2, level - 1), deuterium: 600 * Math.pow(2, level - 1) }),
        buildTime: level => Math.floor((400 * Math.pow(2, level-1) + 600 * Math.pow(2, level-1)) / 2500 * 360),
        requirements: { [BuildingType.RESEARCH_LAB]: 1 },
    },
    [ResearchType.AI_TECHNOLOGY]: {
        name: "Technologia AI",
        description: "Zaawansowana technologia, która automatyzuje i optymalizuje operacje. Każdy poziom odblokowuje nowe możliwości, takie jak ulepszone szpiegostwo, dodatkowe sloty flot, czy zautomatyzowane misje.",
        icon: "🧠",
        cost: level => ({ metal: 500 * Math.pow(2, level - 1), crystal: 4000 * Math.pow(2, level - 1), deuterium: 1500 * Math.pow(2, level - 1) }),
        buildTime: level => Math.floor((500 * Math.pow(2, level-1) + 4000 * Math.pow(2, level-1) + 1500 * Math.pow(2, level-1)) / 2500 * 360),
        requirements: { [BuildingType.RESEARCH_LAB]: 10, [ResearchType.COMPUTER_TECHNOLOGY]: 8 },
    },
    [ResearchType.SPY_TECHNOLOGY]: {
        name: "Technologia szpiegowska",
        description: "Pozwala na budowę sond szpiegowskich i zbieranie informacji o wrogich planetach.",
        icon: "👁️",
        cost: level => ({ metal: 200 * Math.pow(2, level-1), crystal: 1000 * Math.pow(2, level-1), deuterium: 200 * Math.pow(2, level-1) }),
        buildTime: level => Math.floor((200 * Math.pow(2, level-1) + 1000 * Math.pow(2, level-1) + 200 * Math.pow(2, level-1)) / 2500 * 360),
        requirements: { [BuildingType.RESEARCH_LAB]: 3 },
    },
    [ResearchType.ASTROPHYSICS]: {
        name: "Astrofizyka",
        description: "Badania nad astrofizyką pozwalają na organizowanie większej liczby wypraw oraz na zakładanie nowych kolonii. Każdy poziom zwiększa limit wypraw o 1 i pozwala na kontrolę 1 dodatkowej kolonii.",
        icon: "🔭",
        cost: level => ({ metal: 4000 * Math.pow(1.75, level-1), crystal: 8000 * Math.pow(1.75, level-1), deuterium: 4000 * Math.pow(1.75, level-1) }),
        buildTime: level => Math.floor((4000 * Math.pow(1.75, level-1) + 8000 * Math.pow(1.75, level-1) + 4000 * Math.pow(1.75, level-1)) / 2500 * 360),
        requirements: { [BuildingType.RESEARCH_LAB]: 3, [ResearchType.SPY_TECHNOLOGY]: 4, [ResearchType.IMPULSE_DRIVE]: 3 },
    },
    [ResearchType.GRAVITON_TECHNOLOGY]: {
        name: "Technologia grawitonowa",
        description: "Eksperymentalne badanie, które w przyszłości może odblokować niszczycielskie możliwości.",
        icon: "⚫",
        cost: level => ({ metal: 0, crystal: 0, deuterium: 0 }), // Requires energy, handled separately
        buildTime: level => 1,
        requirements: { [BuildingType.RESEARCH_LAB]: 12 },
    },
};

export const SHIPYARD_DATA: Record<ShipType, ShipInfo> = {
    [ShipType.LIGHT_FIGHTER]: {
        name: "Lekki myśliwiec",
        description: "Szybka i zwinna jednostka, idealna do szybkich ataków i obrony.",
        icon: "🛰️",
        image: "mlekki.jpg",
        cost: () => ({ metal: 3000, crystal: 1000, deuterium: 0 }),
        buildTime: () => Math.floor((3000 + 1000) / 2500 * 360),
        requirements: { [BuildingType.SHIPYARD]: 1, [ResearchType.COMBUSTION_DRIVE]: 1 },
        attack: 50,
        shield: 10,
        structuralIntegrity: 4000,
        cargoCapacity: 50,
        speed: 12500,
        drive: ResearchType.COMBUSTION_DRIVE,
    },
    [ShipType.MEDIUM_FIGHTER]: {
        name: "Średni myśliwiec",
        description: "Silniejszy od lekkiego myśliwca, idealny kompromis między siłą ognia a pancerzem. Posiada małą ładownię.",
        icon: "✈️",
        image: "msredni.jpg",
        cost: () => ({ metal: 6000, crystal: 4000, deuterium: 0 }),
        buildTime: () => Math.floor((6000 + 4000) / 2500 * 360),
        requirements: { [BuildingType.SHIPYARD]: 3, [ResearchType.COMBUSTION_DRIVE]: 4, [ResearchType.ARMOR_TECHNOLOGY]: 2 },
        attack: 120,
        shield: 25,
        structuralIntegrity: 10000,
        cargoCapacity: 100,
        speed: 10000,
        drive: ResearchType.COMBUSTION_DRIVE,
    },
    [ShipType.HEAVY_FIGHTER]: {
        name: "Ciężki myśliwiec",
        description: "Potężnie uzbrojony i opancerzony, kręgosłup floty uderzeniowej. Wolniejszy, ale niszczycielski.",
        icon: "🛸",
        image: "mciezki.jpg",
        cost: () => ({ metal: 20000, crystal: 7000, deuterium: 2000 }),
        buildTime: () => Math.floor((20000 + 7000 + 2000) / 2500 * 360),
        requirements: { [BuildingType.SHIPYARD]: 5, [ResearchType.HYPERSPACE_DRIVE]: 1, [ResearchType.WEAPON_TECHNOLOGY]: 3, [ResearchType.ARMOR_TECHNOLOGY]: 4 },
        attack: 250,
        shield: 100,
        structuralIntegrity: 27000,
        cargoCapacity: 200,
        speed: 7500,
        drive: ResearchType.HYPERSPACE_DRIVE,
    },
    [ShipType.CARGO_SHIP]: {
        name: "Mały transporter",
        description: "Służy do transportu surowców między planetami.",
        icon: "🚚",
        image: "mtrafo.jpg",
        cost: () => ({ metal: 2000, crystal: 2000, deuterium: 0 }),
        buildTime: () => Math.floor((2000 + 2000) / 2500 * 360),
        requirements: { [BuildingType.SHIPYARD]: 2, [ResearchType.COMBUSTION_DRIVE]: 2 },
        attack: 5,
        shield: 10,
        structuralIntegrity: 4000,
        cargoCapacity: 5000,
        speed: 5000,
        drive: ResearchType.COMBUSTION_DRIVE,
    },
    [ShipType.MEDIUM_CARGO_SHIP]: {
        name: "Średni transporter",
        description: "Większa pojemność i lepsze opancerzenie. Niezawodny transport surowców z lekkim uzbrojeniem do samoobrony.",
        icon: "🚛",
        image: "tsredni.jpg",
        cost: () => ({ metal: 6000, crystal: 6000, deuterium: 0 }),
        buildTime: () => Math.floor((6000 + 6000) / 2500 * 360),
        requirements: { [BuildingType.SHIPYARD]: 4, [ResearchType.COMBUSTION_DRIVE]: 3 },
        attack: 10,
        shield: 50,
        structuralIntegrity: 12000,
        cargoCapacity: 15000,
        speed: 5000,
        drive: ResearchType.COMBUSTION_DRIVE,
    },
    [ShipType.HEAVY_CARGO_SHIP]: {
        name: "Ciężki transporter",
        description: "Ogromny statek do transportu astronomicznych ilości surowców. Wolny, ale posiada potężną ładownię i wzmocniony pancerz.",
        icon: "🛳️",
        image: "tduzy.jpg",
        cost: () => ({ metal: 20000, crystal: 20000, deuterium: 5000 }),
        buildTime: () => Math.floor((20000 + 20000 + 5000) / 2500 * 360),
        requirements: { [BuildingType.SHIPYARD]: 6, [ResearchType.IMPULSE_DRIVE]: 4 },
        attack: 20,
        shield: 200,
        structuralIntegrity: 45000,
        cargoCapacity: 50000,
        speed: 2500,
        drive: ResearchType.IMPULSE_DRIVE,
    },
    [ShipType.SPY_PROBE]: {
        name: "Sonda szpiegowska",
        description: "Niezwykle szybka, bezzałogowa jednostka przeznaczona do zbierania informacji. Praktycznie bezbronna.",
        icon: "📡",
        cost: () => ({ metal: 0, crystal: 1000, deuterium: 0 }),
        buildTime: () => Math.floor(1000 / 2500 * 360),
        requirements: { [BuildingType.SHIPYARD]: 3, [ResearchType.SPY_TECHNOLOGY]: 1, [ResearchType.COMBUSTION_DRIVE]: 3 },
        attack: 0,
        shield: 0,
        structuralIntegrity: 1000,
        cargoCapacity: 5,
        speed: 100000000,
        drive: ResearchType.COMBUSTION_DRIVE,
    },
    [ShipType.RECYCLER]: {
        name: "Recykler",
        description: "Specjalistyczny statek do zbierania surowców z pól zniszczeń. Nieuzbrojony, ale posiada ogromną ładownię.",
        icon: "🗑️",
        cost: () => ({ metal: 10000, crystal: 6000, deuterium: 2000 }),
        buildTime: () => Math.floor((10000 + 6000 + 2000) / 2500 * 360),
        requirements: { [BuildingType.SHIPYARD]: 4, [ResearchType.IMPULSE_DRIVE]: 2, [ResearchType.SHIELDING_TECHNOLOGY]: 1 },
        attack: 1,
        shield: 10,
        structuralIntegrity: 16000,
        cargoCapacity: 20000,
        speed: 2000,
        drive: ResearchType.IMPULSE_DRIVE,
    },
    [ShipType.CRUISER]: {
        name: "Krążownik",
        description: "Następca Ciężkiego Myśliwca. Doskonały do zwalczania rojów mniejszych statków. Podstawa każdej większej floty ofensywnej.",
        icon: "⛨",
        cost: () => ({ metal: 25000, crystal: 15000, deuterium: 5000 }),
        buildTime: () => Math.floor((25000 + 15000 + 5000) / 2500 * 360),
        requirements: { [BuildingType.SHIPYARD]: 6, [ResearchType.IMPULSE_DRIVE]: 5, [ResearchType.ION_TECHNOLOGY]: 2 },
        attack: 400,
        shield: 150,
        structuralIntegrity: 40000,
        cargoCapacity: 800,
        speed: 10000,
        drive: ResearchType.IMPULSE_DRIVE,
    },
    [ShipType.BATTLESHIP]: {
        name: "Okręt Wojenny",
        description: "Prawdziwy kolos bojowy. Jego głównym zadaniem jest niszczenie ciężkich okrętów i przełamywanie solidnych linii obronnych.",
        icon: "🛡️",
        cost: () => ({ metal: 45000, crystal: 15000, deuterium: 10000 }),
        buildTime: () => Math.floor((45000 + 15000 + 10000) / 2500 * 360),
        requirements: { [BuildingType.SHIPYARD]: 8, [ResearchType.HYPERSPACE_DRIVE]: 4 },
        attack: 1000,
        shield: 500,
        structuralIntegrity: 75000,
        cargoCapacity: 1500,
        speed: 4000,
        drive: ResearchType.HYPERSPACE_DRIVE,
    },
    [ShipType.DESTROYER]: {
        name: "Niszczyciel",
        description: "Wyspecjalizowany 'zabójca' ciężkich okrętów. Niezwykle skuteczny, ale wrażliwy na ataki dużej liczby myśliwców.",
        icon: "🗡️",
        cost: () => ({ metal: 60000, crystal: 50000, deuterium: 15000 }),
        buildTime: () => Math.floor((60000 + 50000 + 15000) / 2500 * 360),
        requirements: { [BuildingType.SHIPYARD]: 9, [ResearchType.HYPERSPACE_DRIVE]: 6, [ResearchType.PLASMA_TECHNOLOGY]: 5 },
        attack: 2000,
        shield: 100,
        structuralIntegrity: 110000,
        cargoCapacity: 500,
        speed: 7500,
        drive: ResearchType.HYPERSPACE_DRIVE,
    },
    [ShipType.BOMBER]: {
        name: "Bombowiec",
        description: "Wolny i słabo opancerzony statek, którego jedynym celem jest niszczenie obrony planetarnej. Niezastąpiony podczas oblężeń.",
        icon: "💣",
        cost: () => ({ metal: 50000, crystal: 25000, deuterium: 15000 }),
        buildTime: () => Math.floor((50000 + 25000 + 15000) / 2500 * 360),
        requirements: { [BuildingType.SHIPYARD]: 8, [ResearchType.IMPULSE_DRIVE]: 6, [ResearchType.PLASMA_TECHNOLOGY]: 7 },
        attack: 1000,
        shield: 50,
        structuralIntegrity: 75000,
        cargoCapacity: 500,
        speed: 4000,
        drive: ResearchType.IMPULSE_DRIVE,
    },
    [ShipType.COLONY_SHIP]: {
        name: "Statek Kolonizacyjny",
        description: "Klucz do prawdziwej ekspansji! Umożliwia założenie nowej kolonii na pustej pozycji w galaktyce.",
        icon: "🌍",
        cost: () => ({ metal: 10000, crystal: 20000, deuterium: 10000 }),
        buildTime: () => Math.floor((10000 + 20000 + 10000) / 2500 * 360),
        requirements: { [BuildingType.SHIPYARD]: 4, [ResearchType.IMPULSE_DRIVE]: 3, [ResearchType.ASTROPHYSICS]: 1 },
        attack: 0,
        shield: 100,
        structuralIntegrity: 30000,
        cargoCapacity: 7500,
        speed: 2500,
        drive: ResearchType.IMPULSE_DRIVE,
    },
    [ShipType.RESEARCH_VESSEL]: {
        name: "Okręt Badawczy",
        description: "Specjalistyczny statek do eksploracji niezamieszkanych planet. Może odkrywać cenne bonusy, ale wymaga ochrony podczas długich misji badawczych.",
        icon: "🧭",
        cost: () => ({ metal: 8000, crystal: 12000, deuterium: 4000 }),
        buildTime: () => Math.floor((8000 + 12000 + 4000) / 2500 * 360),
        requirements: { [BuildingType.SHIPYARD]: 5, [ResearchType.SPY_TECHNOLOGY]: 3, [ResearchType.IMPULSE_DRIVE]: 3 },
        attack: 10,
        shield: 50,
        structuralIntegrity: 24000,
        cargoCapacity: 10000,
        speed: 600,
        drive: ResearchType.IMPULSE_DRIVE,
    },
    [ShipType.BATTLECRUISER]: {
        name: "Pancernik",
        description: "Okręt flagowy, łączący dużą siłę ognia z potężnymi tarczami. Zaprojektowany do walki z najcięższymi jednostkami wroga. Szybszy od Okrętu Wojennego, ale równie niszczycielski.",
        icon: "⛫",
        cost: () => ({ metal: 70000, crystal: 40000, deuterium: 20000 }),
        buildTime: () => Math.floor((70000 + 40000 + 20000) / 2500 * 360),
        requirements: { [BuildingType.SHIPYARD]: 10, [ResearchType.HYPERSPACE_DRIVE]: 7, [ResearchType.PLASMA_TECHNOLOGY]: 6 },
        attack: 2500,
        shield: 800,
        structuralIntegrity: 130000,
        cargoCapacity: 1000,
        speed: 5000,
        drive: ResearchType.HYPERSPACE_DRIVE,
    },
    [ShipType.DEATHSTAR]: {
        name: "Gwiazda Śmierci",
        description: "Ostateczna broń, zdolna niszczyć całe floty i obronę jednym strzałem. Niewyobrażalnie droga i powolna. Jej zniszczenie tworzy ogromne pole zniszczeń.",
        icon: "💀",
        cost: () => ({ metal: 5000000, crystal: 4000000, deuterium: 1000000 }),
        buildTime: () => Math.floor((5000000 + 4000000 + 1000000) / 2500 * 360),
        requirements: { [BuildingType.SHIPYARD]: 12, [ResearchType.GRAVITON_TECHNOLOGY]: 1, [ResearchType.HYPERSPACE_DRIVE]: 8 },
        attack: 200000,
        shield: 50000,
        structuralIntegrity: 9000000,
        cargoCapacity: 1000000,
        speed: 100,
        drive: ResearchType.HYPERSPACE_DRIVE,
        requiredEnergy: 300000,
    },
};

export const DEFENSE_DATA: Record<DefenseType, DefenseInfo> = {
    [DefenseType.ROCKET_LAUNCHER]: {
        name: "Wyrzutnia rakiet",
        description: "Podstawowa jednostka obronna, skuteczna przeciwko myśliwcom.",
        icon: "🎯",
        cost: () => ({ metal: 2000, crystal: 0, deuterium: 0 }),
        buildTime: () => Math.floor(2000 / 2500 * 360),
        requirements: { [BuildingType.SHIPYARD]: 1 },
        attack: 80,
        shield: 20,
        structuralIntegrity: 2000,
    },
    [DefenseType.LIGHT_LASER_CANNON]: {
        name: "Lekkie działo laserowe",
        description: "Lepsza obrona, skuteczna przeciwko lekkim statkom.",
        icon: "🔫",
        cost: () => ({ metal: 1500, crystal: 500, deuterium: 0 }),
        buildTime: () => Math.floor((1500 + 500) / 2500 * 360),
        requirements: { [BuildingType.SHIPYARD]: 2, [ResearchType.LASER_TECHNOLOGY]: 1 },
        attack: 100,
        shield: 25,
        structuralIntegrity: 2000,
    },
    [DefenseType.HEAVY_LASER_CANNON]: {
        name: "Ciężkie działo laserowe",
        description: "Potężniejsza wersja działa laserowego.",
        icon: "💥",
        cost: () => ({ metal: 6000, crystal: 2000, deuterium: 0 }),
        buildTime: () => Math.floor((6000 + 2000) / 2500 * 360),
        requirements: { [BuildingType.SHIPYARD]: 4, [ResearchType.LASER_TECHNOLOGY]: 3, [ResearchType.ENERGY_TECHNOLOGY]: 3 },
        attack: 250,
        shield: 100,
        structuralIntegrity: 8000,
    },
    [DefenseType.ION_CANNON]: {
        name: "Działo jonowe",
        description: "Broń specjalizująca się w niszczeniu tarcz ochronnych wroga.",
        icon: "💠",
        cost: () => ({ metal: 2000, crystal: 6000, deuterium: 0 }),
        buildTime: () => Math.floor((2000 + 6000) / 2500 * 360),
        requirements: { [BuildingType.SHIPYARD]: 6, [ResearchType.ION_TECHNOLOGY]: 4 },
        attack: 150,
        shield: 500,
        structuralIntegrity: 8000,
    },
    [DefenseType.PLASMA_TURRET]: {
        name: "Wieżyczka plazmowa",
        description: "Najpotężniejsza stacjonarna broń defensywna.",
        icon: "🔮",
        cost: () => ({ metal: 20000, crystal: 15000, deuterium: 5000 }),
        buildTime: () => Math.floor((20000 + 15000 + 5000) / 2500 * 360),
        requirements: { [BuildingType.SHIPYARD]: 8, [ResearchType.PLASMA_TECHNOLOGY]: 7 },
        attack: 3000,
        shield: 300,
        structuralIntegrity: 35000,
    }
};

export const SHIP_UPGRADE_DATA: Record<ShipType, ShipUpgradeInfo> = (Object.keys(ShipType) as ShipType[]).reduce((acc, shipType) => {
    const shipData = SHIPYARD_DATA[shipType];
    acc[shipType] = {
        name: `Ulepszenie: ${shipData.name}`,
        description: `Zwiększa atak, tarcze i strukturę jednostki ${shipData.name} o 10% za każdy poziom.`,
        cost: (level: number) => {
            const baseCost = shipData.cost(1);
            return {
                metal: Math.floor(baseCost.metal * level * 0.8),
                crystal: Math.floor(baseCost.crystal * level * 0.8),
                deuterium: Math.floor(baseCost.deuterium * level * 0.8)
            };
        },
        buildTime: (level: number) => Math.floor(shipData.buildTime(1) * level * 2),
        requirements: {
            [BuildingType.RESEARCH_LAB]: 4 + (Object.keys(shipData.requirements ?? {}).length),
            ...(shipData.requirements ?? {})
        }
    };
    return acc;
}, {} as Record<ShipType, ShipUpgradeInfo>);


export const ALL_GAME_OBJECTS = {
    ...BUILDING_DATA,
    ...RESEARCH_DATA,
    ...SHIPYARD_DATA,
    ...DEFENSE_DATA,
    ...SHIP_UPGRADE_DATA
};