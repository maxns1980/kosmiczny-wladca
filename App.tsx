
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
    BuildingType, Resources, BuildingLevels, ResearchLevels, ResearchType, Fleet, QueueItem, QueueItemType, GameObject, 
    Defenses, FleetMission, MissionType, DefenseType, ShipType, Message, SpyReport, BattleReport, Loot, 
    SpyMessage, BattleMessage, MerchantState, MerchantStatus, MerchantInfoMessage, View, NPCStates, NPCState, EspionageEventMessage, NPCFleetMission, ShipLevels, DebrisField,
    PirateMercenaryState, PirateMercenaryStatus, PirateMessage, AsteroidImpactMessage, AsteroidImpactType,
    ResourceVeinBonus, ResourceVeinMessage,
    AncientArtifactState, AncientArtifactStatus, AncientArtifactChoice, AncientArtifactMessage,
    SpacePlagueState, SpacePlagueMessage, OfflineSummaryMessage,
    ExpeditionMessage, ExpeditionOutcomeType, CombatStats,
    Colony, ColonizationMessage,
    Inventory, ActiveBoosts, BoostType, Boost, ExplorationMessage, ExplorationOutcomeType, GameState
} from './types';
import { 
    INITIAL_RESOURCES, INITIAL_BUILDING_LEVELS, INITIAL_RESEARCH_LEVELS, INITIAL_FLEET, INITIAL_DEFENSES, 
    BUILDING_DATA, RESEARCH_DATA, SHIPYARD_DATA, DEFENSE_DATA, TICK_INTERVAL, ALL_GAME_OBJECTS, INITIAL_MERCHANT_STATE, 
    NPC_STATES_KEY, INITIAL_NPC_FLEET_MISSIONS, INITIAL_SHIP_LEVELS, SHIP_UPGRADE_DATA, INITIAL_DEBRIS_FIELDS, 
    DEBRIS_FIELD_RECOVERY_RATE, PLAYER_HOME_COORDS, PROTECTED_RESOURCES_FACTOR, INITIAL_PIRATE_MERCENARY_STATE, 
    INITIAL_RESOURCE_VEIN_BONUS, INITIAL_ANCIENT_ARTIFACT_STATE, INITIAL_SPACE_PLAGUE_STATE, INITIAL_COLONIES, COLONY_INCOME_BONUS_PER_HOUR,
    INITIAL_INVENTORY, INITIAL_ACTIVE_BOOSTS, BASE_STORAGE_CAPACITY
} from './constants';
import Header from './components/Header';
import BuildingsPanel from './components/BuildingsPanel';
import ResearchPanel from './components/ResearchPanel';
import ShipyardPanel from './components/ShipyardPanel';
import DefensePanel from './components/DefensePanel';
import FleetPanel from './components/FleetPanel';
import MessagesPanel from './components/MessagesPanel';
import { MerchantPanel } from './components/MerchantPanel';
import Navigation from './components/Navigation';
import QueuePanel from './components/QueuePanel';
import GalaxyPanel from './components/GalaxyPanel';
import FleetUpgradesPanel from './components/FleetUpgradesPanel';
import PirateMercenaryPanel from './components/PirateMercenaryPanel';
import AncientArtifactModal from './components/AncientArtifactModal';
import InfoModal from './components/InfoModal';
import EncyclopediaModal from './components/EncyclopediaModal';
import InventoryModal from './components/InventoryModal';

// --- Calculation Helpers (extracted for reuse) ---
const formatTime = (seconds: number) => {
    if (seconds < 0) seconds = 0;
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
}

const formatNumber = (num: number): string => {
    return Math.floor(num).toLocaleString('pl-PL');
};

const calculateMaxResources = (buildings: BuildingLevels): Resources => {
    const metalCapacity = BUILDING_DATA[BuildingType.METAL_STORAGE].capacity?.(buildings[BuildingType.METAL_STORAGE]) ?? BASE_STORAGE_CAPACITY;
    const crystalCapacity = BUILDING_DATA[BuildingType.CRYSTAL_STORAGE].capacity?.(buildings[BuildingType.CRYSTAL_STORAGE]) ?? BASE_STORAGE_CAPACITY;
    const deuteriumCapacity = BUILDING_DATA[BuildingType.DEUTERIUM_TANK].capacity?.(buildings[BuildingType.DEUTERIUM_TANK]) ?? BASE_STORAGE_CAPACITY;

    return {
      metal: metalCapacity,
      crystal: crystalCapacity,
      deuterium: deuteriumCapacity,
    };
};

const calculateProductions = (buildings: BuildingLevels, resourceVeinBonus: ResourceVeinBonus, colonies: Colony[], activeBoosts: ActiveBoosts) => {
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

const getBoostNameForNotif = (boost: Omit<Boost, 'id' | 'duration'>) => {
    switch(boost.type) {
        case BoostType.EXTRA_BUILD_QUEUE: return `Dodatkowa kolejka budowy (${boost.level})`;
        case BoostType.RESOURCE_PRODUCTION_BOOST: return `Produkcja +${boost.level}%`;
        case BoostType.COMBAT_TECH_BOOST: return `Kalibracja Broni Polowej (+${boost.level})`;
        case BoostType.ARMOR_TECH_BOOST: return `Wzmocnienie Pancerza (+${boost.level})`;
        case BoostType.DRIVE_TECH_BOOST: return `Przeciążenie Napędu (+${boost.level}%)`;
        case BoostType.STORAGE_PROTECTION_BOOST: return `Moduł Ochronny Magazynów (${boost.level}%)`;
        case BoostType.SECTOR_ACTIVITY_SCAN: return 'Skan Aktywności Sektora';
        default: return 'Nieznany bonus';
    }
}

const getUserId = () => {
    let userId = localStorage.getItem('cosmic-lord-user-id');
    if (!userId) {
        userId = crypto.randomUUID();
        localStorage.setItem('cosmic-lord-user-id', userId);
    }
    return userId;
};

function App() {
  const [resources, setResources] = useState<Resources>(INITIAL_RESOURCES);
  const [buildings, setBuildings] = useState<BuildingLevels>(INITIAL_BUILDING_LEVELS);
  const [research, setResearch] = useState<ResearchLevels>(INITIAL_RESEARCH_LEVELS);
  const [shipLevels, setShipLevels] = useState<ShipLevels>(INITIAL_SHIP_LEVELS);
  const [fleet, setFleet] = useState<Fleet>(INITIAL_FLEET);
  const [defenses, setDefenses] = useState<Defenses>(INITIAL_DEFENSES);
  const [colonies, setColonies] = useState<Colony[]>(INITIAL_COLONIES);
  const [fleetMissions, setFleetMissions] = useState<FleetMission[]>([]);
  const [npcFleetMissions, setNpcFleetMissions] = useState<NPCFleetMission[]>(INITIAL_NPC_FLEET_MISSIONS);
  const [messages, setMessages] = useState<Message[]>([]);
  const [buildQueue, setBuildQueue] = useState<QueueItem[]>([]);
  const [credits, setCredits] = useState<number>(0);
  const [merchantState, setMerchantState] = useState<MerchantState>(INITIAL_MERCHANT_STATE);
  const [lastMerchantCheckTime, setLastMerchantCheckTime] = useState<number>(0);
  const [pirateMercenaryState, setPirateMercenaryState] = useState<PirateMercenaryState>(INITIAL_PIRATE_MERCENARY_STATE);
  const [lastPirateCheckTime, setLastPirateCheckTime] = useState<number>(0);
  const [lastAsteroidCheckTime, setLastAsteroidCheckTime] = useState<number>(0);
  const [resourceVeinBonus, setResourceVeinBonus] = useState<ResourceVeinBonus>(INITIAL_RESOURCE_VEIN_BONUS);
  const [lastResourceVeinCheckTime, setLastResourceVeinCheckTime] = useState<number>(0);
  const [ancientArtifactState, setAncientArtifactState] = useState<AncientArtifactState>(INITIAL_ANCIENT_ARTIFACT_STATE);
  const [lastArtifactCheckTime, setLastArtifactCheckTime] = useState<number>(0);
  const [spacePlague, setSpacePlague] = useState<SpacePlagueState>(INITIAL_SPACE_PLAGUE_STATE);
  const [lastSpacePlagueCheckTime, setLastSpacePlagueCheckTime] = useState<number>(0);
  const [inventory, setInventory] = useState<Inventory>(INITIAL_INVENTORY);
  const [activeBoosts, setActiveBoosts] = useState<ActiveBoosts>(INITIAL_ACTIVE_BOOSTS);
  const [activeCostReduction, setActiveCostReduction] = useState<number>(0);
  const [blackMarketHourlyIncome, setBlackMarketHourlyIncome] = useState<number>(0);
  const [lastBlackMarketIncomeCheck, setLastBlackMarketIncomeCheck] = useState<number>(0);
  const [notification, setNotification] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<View>('buildings');
  const [fleetTarget, setFleetTarget] = useState<{coords: string, mission: MissionType} | null>(null);
  const [npcStates, setNpcStates] = useState<NPCStates>({});
  const [awardedBonuses, setAwardedBonuses] = useState<BuildingType[]>([]);
  const [debrisFields, setDebrisFields] = useState<Record<string, DebrisField>>(INITIAL_DEBRIS_FIELDS);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isEncyclopediaOpen, setIsEncyclopediaOpen] = useState(false);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const gameStateRef = useRef<GameState>();

  const showNotification = useCallback((message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 4000);
  }, []);

  const maxResources = useMemo(() => calculateMaxResources(buildings), [buildings]);
  const productions = useMemo(() => calculateProductions(buildings, resourceVeinBonus, colonies, activeBoosts), [buildings, resourceVeinBonus, colonies, activeBoosts]);
  
    // Effect to update the game state ref for saving
    useEffect(() => {
        gameStateRef.current = {
            resources, buildings, research, shipLevels, fleet, defenses, fleetMissions, npcFleetMissions, messages,
            buildQueue, credits, merchantState, lastMerchantCheckTime, pirateMercenaryState, lastPirateCheckTime,
            lastAsteroidCheckTime, resourceVeinBonus, lastResourceVeinCheckTime, ancientArtifactState, lastArtifactCheckTime,
            spacePlague, lastSpacePlagueCheckTime, lastSaveTime: Date.now(), npcStates, awardedBonuses, debrisFields,
            colonies, inventory, activeBoosts, activeCostReduction, blackMarketHourlyIncome, lastBlackMarketIncomeCheck,
        };
    }, [
        resources, buildings, research, shipLevels, fleet, defenses, fleetMissions, npcFleetMissions, messages,
        buildQueue, credits, merchantState, lastMerchantCheckTime, pirateMercenaryState, lastPirateCheckTime,
        lastAsteroidCheckTime, resourceVeinBonus, lastResourceVeinCheckTime, ancientArtifactState, lastArtifactCheckTime,
        spacePlague, lastSpacePlagueCheckTime, npcStates, awardedBonuses, debrisFields, colonies, inventory, activeBoosts,
        activeCostReduction, blackMarketHourlyIncome, lastBlackMarketIncomeCheck
    ]);
  
    // Effect for Loading State from Server
    useEffect(() => {
        const fetchGameState = async () => {
            setIsLoading(true);
            setError(null);
            const userId = getUserId();
            try {
                const response = await fetch('/.netlify/functions/get-game-state', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId }),
                });

                if (!response.ok) {
                    const errorData = await response.text();
                    throw new Error(`Błąd serwera: ${response.status} - ${errorData}`);
                }

                const data: GameState = await response.json();
                
                // Set all states from the server response
                setResources(data.resources);
                setBuildings(data.buildings);
                setResearch(data.research);
                setShipLevels(data.shipLevels);
                setFleet(data.fleet);
                setDefenses(data.defenses);
                setFleetMissions(data.fleetMissions);
                setNpcFleetMissions(data.npcFleetMissions);
                setMessages(data.messages);
                setBuildQueue(data.buildQueue);
                setCredits(data.credits);
                setMerchantState(data.merchantState);
                setLastMerchantCheckTime(data.lastMerchantCheckTime);
                setPirateMercenaryState(data.pirateMercenaryState);
                setLastPirateCheckTime(data.lastPirateCheckTime);
                setLastAsteroidCheckTime(data.lastAsteroidCheckTime);
                setResourceVeinBonus(data.resourceVeinBonus);
                setLastResourceVeinCheckTime(data.lastResourceVeinCheckTime);
                setAncientArtifactState(data.ancientArtifactState);
                setLastArtifactCheckTime(data.lastArtifactCheckTime);
                setSpacePlague(data.spacePlague);
                setLastSpacePlagueCheckTime(data.lastSpacePlagueCheckTime);
                setNpcStates(data.npcStates);
                setAwardedBonuses(data.awardedBonuses);
                setDebrisFields(data.debrisFields);
                setColonies(data.colonies);
                setInventory(data.inventory);
                setActiveBoosts(data.activeBoosts);
                setActiveCostReduction(data.activeCostReduction);
                setBlackMarketHourlyIncome(data.blackMarketHourlyIncome);
                setLastBlackMarketIncomeCheck(data.lastBlackMarketIncomeCheck);
                
                const offlineSummary = data.messages.find(m => m.type === 'offline_summary') as OfflineSummaryMessage | undefined;
                if (offlineSummary) {
                    showNotification(`Witaj z powrotem! Przetworzono postęp z ${formatTime(offlineSummary.duration)}.`);
                }

            } catch (err) {
                setError(err instanceof Error ? err.message : 'Wystąpił nieznany błąd podczas ładowania gry.');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchGameState();
    }, [showNotification]);


    // Effect for Auto-saving State to Server
    useEffect(() => {
        const saveInterval = setInterval(async () => {
            if (gameStateRef.current && !isLoading && !error) {
                setIsSaving(true);
                const userId = getUserId();
                try {
                    const response = await fetch('/.netlify/functions/save-game-state', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userId, gameState: gameStateRef.current }),
                    });
                    if (!response.ok) {
                        console.error("Nie udało się zapisać stanu gry.");
                    }
                } catch (err) {
                    console.error("Nie udało się zapisać stanu gry:", err);
                } finally {
                    setIsSaving(false);
                }
            }
        }, 30000); // Save every 30 seconds

        return () => clearInterval(saveInterval);
    }, [isLoading, error]);
  
  const handleArtifactChoice = useCallback((choice: AncientArtifactChoice) => {
    const now = Date.now();
    let newMessage: AncientArtifactMessage | null = null;
    
    switch (choice) {
        case AncientArtifactChoice.STUDY: {
            const cost = { credits: 5000, crystal: 2000 };
            if (credits >= cost.credits && resources.crystal >= cost.crystal) {
                setCredits(c => c - cost.credits);
                setResources(r => ({ ...r, crystal: r.crystal - cost.crystal }));

                if (Math.random() < 0.5) { // Success
                    const availableResearch = (Object.keys(research) as ResearchType[]).filter(r => (research[r] || 0) < 10); // cap at 10 for safety
                    if (availableResearch.length > 0) {
                        const techToUpgrade = availableResearch[Math.floor(Math.random() * availableResearch.length)];
                        const newLevel = (research[techToUpgrade] || 0) + 1;
                        setResearch(r => ({ ...r, [techToUpgrade]: newLevel }));
                        
                        const techName = RESEARCH_DATA[techToUpgrade].name;
                        showNotification(`Przełom! Zbadanie artefaktu ulepszyło ${techName} do poz. ${newLevel}!`);
                        newMessage = {
                            id: `msg-${now}-artifact`, type: 'ancient_artifact', timestamp: now, isRead: false,
                            subject: 'Sukces badawczy artefaktu',
                            choice,
                            outcome: { success: true, technology: techToUpgrade, newLevel }
                        };
                    } else { // All research maxed out
                         showNotification("Artefakt rezonuje z Twoją wiedzą, ale nie może już niczego ulepszyć.");
                         newMessage = {
                             id: `msg-${now}-artifact`, type: 'ancient_artifact', timestamp: now, isRead: false,
                             subject: 'Artefakt zbadany - bez efektu',
                             choice,
                             outcome: { success: false }
                         };
                    }
                } else { // Failure
                    showNotification("Niestety, artefakt okazał się bezwartościową bryłą metalu. Stracono surowce.");
                    newMessage = {
                        id: `msg-${now}-artifact`, type: 'ancient_artifact', timestamp: now, isRead: false,
                        subject: 'Porażka badawcza artefaktu',
                        choice,
                        outcome: { success: false }
                    };
                }
            } else {
                showNotification("Za mało surowców by zbadać artefakt!");
                return; // Don't close modal if can't afford
            }
            break;
        }
        case AncientArtifactChoice.SELL: {
            const creditsGained = 10000;
            setCredits(c => c + creditsGained);
            showNotification(`Sprzedano artefakt za ${formatNumber(creditsGained)} kredytów.`);
            newMessage = {
                id: `msg-${now}-artifact`, type: 'ancient_artifact', timestamp: now, isRead: false,
                subject: 'Sprzedano artefakt obcych',
                choice,
                outcome: { creditsGained }
            };
            break;
        }
        case AncientArtifactChoice.IGNORE: {
            showNotification("Postanowiono zignorować artefakt.");
             newMessage = {
                id: `msg-${now}-artifact`, type: 'ancient_artifact', timestamp: now, isRead: false,
                subject: 'Zignorowano artefakt',
                choice,
                outcome: {}
            };
            break;
        }
    }

    if (newMessage) {
        setMessages(m => [newMessage, ...m]);
    }
    setAncientArtifactState({ status: AncientArtifactStatus.INACTIVE });

}, [credits, resources, research, showNotification]);

const handleActivateBoost = useCallback((boostId: string) => {
    const boostToActivate = inventory.boosts.find(b => b.id === boostId);
    if (!boostToActivate) return;

    // Handle one-time boosts first
    if (boostToActivate.type === BoostType.CONSTRUCTION_COST_REDUCTION) {
        if (activeCostReduction > 0) {
            showNotification("Zniżka na budowę jest już aktywna!");
            return;
        }
        setInventory(prev => ({ ...prev, boosts: prev.boosts.filter(b => b.id !== boostId) }));
        setActiveCostReduction(boostToActivate.level);
        showNotification(`Aktywowano zniżkę ${boostToActivate.level}% na następną budowę/badanie!`);
        setIsInventoryOpen(false);
        return;
    }

    if (boostToActivate.type === BoostType.CONSTRUCTION_TIME_REDUCTION) {
        const queueToReduce = buildQueue[0];
        if (!queueToReduce) {
            showNotification("Brak aktywnej budowy lub badania do skrócenia!");
            return; // Don't consume boost if unusable
        }
        setInventory(prev => ({ ...prev, boosts: prev.boosts.filter(b => b.id !== boostId) }));
        const timeReductionSeconds = boostToActivate.level * 3600;
        setBuildQueue(prev => {
            const newQueue = [...prev];
            newQueue[0] = { ...newQueue[0], endTime: newQueue[0].endTime - timeReductionSeconds * 1000 };
            return newQueue;
        });
        showNotification(`Skrócono czas budowy o ${boostToActivate.level}h!`);
        setIsInventoryOpen(false);
        return;
    }

    if (boostToActivate.type === BoostType.SECTOR_ACTIVITY_SCAN) {
        if (activeBoosts[BoostType.SECTOR_ACTIVITY_SCAN]) {
            showNotification("Skan aktywności sektora jest już aktywny!");
            return;
        }
        setInventory(prev => ({ ...prev, boosts: prev.boosts.filter(b => b.id !== boostId) }));
        setActiveBoosts(prev => ({
            ...prev,
            [BoostType.SECTOR_ACTIVITY_SCAN]: {
                endTime: Date.now() + boostToActivate.duration * 1000,
            }
        }));
        showNotification(`Aktywowano skan aktywności sektora na ${boostToActivate.duration / 3600}h!`);
        setIsInventoryOpen(false);
        return;
    }

     if (boostToActivate.type === BoostType.ABANDONED_COLONY_LOOT) {
        setInventory(prev => ({ ...prev, boosts: prev.boosts.filter(b => b.id !== boostId) }));
        const loot = {
            metal: Math.floor(20000 + Math.random() * 30000), // 20k-50k
            crystal: Math.floor(20000 + Math.random() * 30000), // 20k-50k
            deuterium: Math.floor(5000 + Math.random() * 5000), // 5k-10k
            credits: Math.floor(5000 + Math.random() * 5000), // 5k-10k
        };
        setResources(r => ({
            metal: Math.min(maxResources.metal, r.metal + loot.metal),
            crystal: Math.min(maxResources.crystal, r.crystal + loot.crystal),
            deuterium: Math.min(maxResources.deuterium, r.deuterium + loot.deuterium),
        }));
        setCredits(c => c + loot.credits);
        showNotification(`Zrabowano opuszczoną kolonię! Zysk: ${formatNumber(loot.metal)} metalu, ${formatNumber(loot.crystal)} kryształu i ${formatNumber(loot.credits)} kredytów!`);
        setIsInventoryOpen(false);
        return;
    }

    // Handle timed boosts
    if (activeBoosts[boostToActivate.type]) {
        showNotification("Podobny bonus jest już aktywny!");
        return;
    }

    setInventory(prev => ({
        ...prev,
        boosts: prev.boosts.filter(b => b.id !== boostId),
    }));

    setActiveBoosts(prev => ({
        ...prev,
        [boostToActivate.type]: {
            level: boostToActivate.level,
            endTime: Date.now() + boostToActivate.duration * 1000,
        }
    }));

    showNotification(`Bonus "${getBoostNameForNotif(boostToActivate)}" został aktywowany!`);
    setIsInventoryOpen(false);
}, [inventory, activeBoosts, showNotification, activeCostReduction, buildQueue, resources, credits, maxResources]);

  // Main Game Tick (Client-side for UI updates)
  useEffect(() => {
    if (isLoading) return;
      
    const gameLoop = setInterval(() => {
      const now = Date.now();
      
      // Resource update
      setResources(prev => ({
        metal: Math.min(prev.metal + productions.metal / (3600 / (TICK_INTERVAL / 1000)), maxResources.metal),
        crystal: Math.min(prev.crystal + productions.crystal / (3600 / (TICK_INTERVAL / 1000)), maxResources.crystal),
        deuterium: Math.min(prev.deuterium + productions.deuterium / (3600 / (TICK_INTERVAL / 1000)), maxResources.deuterium),
      }));
      
      // No need to update the entire state here, just the UI-related parts.
      // The authoritative state is on the server.
      // This loop is now mostly for animating the resource counters.

    }, TICK_INTERVAL);
    return () => clearInterval(gameLoop);
  }, [isLoading, productions, maxResources]);
  

  const handleAddToQueue = useCallback((id: GameObject, type: QueueItemType, amount = 1) => {
    // This logic remains on client for immediate feedback, server will validate on next load
    const queueCapacity = activeBoosts[BoostType.EXTRA_BUILD_QUEUE]?.level || 1;
    const buildingQueueCount = buildQueue.filter(item => ['building', 'research', 'ship_upgrade'].includes(item.type)).length;
    const shipyardQueueCount = buildQueue.filter(item => ['ship', 'defense'].includes(item.type)).length;

    if ((type === 'building' || type === 'research' || type === 'ship_upgrade') && buildingQueueCount >= queueCapacity) {
        showNotification(`Kolejka budowy/badań jest pełna! (Max: ${queueCapacity})`);
        return;
    }
    if ((type === 'ship' || type === 'defense') && shipyardQueueCount >= queueCapacity) {
        showNotification(`Stocznia jest zajęta! (Max: ${queueCapacity})`);
        return;
    }

    const objectInfo = ALL_GAME_OBJECTS[id as keyof typeof ALL_GAME_OBJECTS];
    let levelOrAmount: number;
    if (type === 'building') levelOrAmount = buildings[id as BuildingType] + 1;
    else if (type === 'research') levelOrAmount = research[id as keyof ResearchLevels] + 1;
    else if (type === 'ship_upgrade') levelOrAmount = shipLevels[id as ShipType] + 1;
    else levelOrAmount = amount;
    
    if (type === 'ship') {
        const shipData = SHIPYARD_DATA[id as ShipType];
        if (shipData.requiredEnergy && productions.energy.produced < shipData.requiredEnergy) {
            showNotification(`Budowa ${shipData.name} wymaga ${formatNumber(shipData.requiredEnergy)} energii!`);
            return;
        }
    }

    let cost = objectInfo.cost(levelOrAmount);

    if (activeCostReduction > 0 && (type === 'building' || type === 'research')) {
        const reduction = activeCostReduction / 100;
        cost = {
            metal: Math.floor(cost.metal * (1 - reduction)),
            crystal: Math.floor(cost.crystal * (1 - reduction)),
            deuterium: Math.floor(cost.deuterium * (1 - reduction)),
        };
        showNotification(`Zastosowano zniżkę ${activeCostReduction}%!`);
        setActiveCostReduction(0); // Consume the boost
    }

    const totalCost = { metal: (cost.metal || 0) * amount, crystal: (cost.crystal || 0) * amount, deuterium: (cost.deuterium || 0) * amount };
    
    if (resources.metal >= totalCost.metal && resources.crystal >= totalCost.crystal && resources.deuterium >= totalCost.deuterium) {
      setResources(prev => ({ metal: prev.metal - totalCost.metal, crystal: prev.crystal - totalCost.crystal, deuterium: prev.deuterium - totalCost.deuterium }));
      const buildTime = objectInfo.buildTime(levelOrAmount) * ((type === 'ship' || type === 'defense') ? amount : 1);
      const now = Date.now();
      const newItem: QueueItem = { id, type, levelOrAmount, buildTime, startTime: now, endTime: now + buildTime * 1000 };
      setBuildQueue(prev => [...prev, newItem]);
      showNotification(`Rozpoczęto: ${objectInfo.name}`);
    } else {
      showNotification("Za mało surowców!");
    }
  }, [resources, buildings, research, shipLevels, buildQueue, showNotification, productions.energy.produced, activeBoosts, activeCostReduction]);
  
  const handleSendFleet = useCallback((missionFleet: Fleet, targetCoords: string, missionType: MissionType) => {
      // This logic also remains on client for immediate feedback
      const now = Date.now();
      const isTargetOccupied = npcStates[targetCoords] || colonies.some(c => c.id === targetCoords) || targetCoords === PLAYER_HOME_COORDS;

      if (missionType === MissionType.SPY && (!missionFleet[ShipType.SPY_PROBE] || (missionFleet[ShipType.SPY_PROBE] ?? 0) === 0)) {
          showNotification("Misja szpiegowska wymaga przynajmniej jednej Sondy Szpiegowskiej!");
          return;
      }
      if (missionType === MissionType.HARVEST && (!missionFleet[ShipType.RECYCLER] || (missionFleet[ShipType.RECYCLER] ?? 0) === 0)) {
          showNotification("Misja zbierania wymaga przynajmniej jednego Recyklera!");
          return;
      }
      if (missionType === MissionType.EXPLORE) {
          if (!missionFleet[ShipType.RESEARCH_VESSEL] || (missionFleet[ShipType.RESEARCH_VESSEL] ?? 0) === 0) {
              showNotification("Misja eksploracyjna wymaga Okrętu Badawczego!");
              return;
          }
          if (isTargetOccupied) {
              showNotification("Można eksplorować tylko niezamieszkane planety!");
              return;
          }
      }
      if (missionType === MissionType.EXPEDITION) {
        const maxExpeditions = 1 + (research[ResearchType.ASTROPHYSICS] || 0);
        const currentExpeditions = fleetMissions.filter(m => m.missionType === MissionType.EXPEDITION).length;
        if(currentExpeditions >= maxExpeditions) {
            showNotification(`Przekroczono limit wypraw! (Max: ${maxExpeditions})`);
            return;
        }
      }
      if (missionType === MissionType.COLONIZE) {
        if (!missionFleet[ShipType.COLONY_SHIP] || (missionFleet[ShipType.COLONY_SHIP] ?? 0) === 0) {
            showNotification("Misja kolonizacyjna wymaga Statku Kolonizacyjnego!");
            return;
        }
        const maxColonies = research[ResearchType.ASTROPHYSICS] || 0;
        if (colonies.length >= maxColonies) {
            showNotification(`Przekroczono limit kolonii! (Max: ${maxColonies}). Zbadaj Astrofizykę, by go zwiększyć.`);
            return;
        }
        if (isTargetOccupied) {
            showNotification("Ta pozycja jest już zajęta!");
            return;
        }
      }

      const speeds = Object.entries(missionFleet).map(([shipId, count]) => {
          if (!count || count <= 0) return Infinity;
          const shipData = SHIPYARD_DATA[shipId as ShipType];
          const driveTech = shipData.drive;
          const driveLevel = research[driveTech] || 0;
          let speedMultiplier = 0.1;
          if (driveTech === ResearchType.IMPULSE_DRIVE) speedMultiplier = 0.2;
          if (driveTech === ResearchType.HYPERSPACE_DRIVE) speedMultiplier = 0.3;
          
          return shipData.speed * (1 + driveLevel * speedMultiplier);
      });
      
      const speedBoost = 1 + (activeBoosts[BoostType.DRIVE_TECH_BOOST]?.level || 0) / 100;
      const slowestSpeed = Math.min(...speeds) * speedBoost;
      let missionDuration = Math.floor(36000000 / slowestSpeed); // one way

      if (missionType === MissionType.EXPEDITION) {
          missionDuration = Math.floor(missionDuration * (1.5 + Math.random())); // Expeditions take longer
      }
      
      const arrivalTime = now + missionDuration * 1000;
      let returnTime = now + missionDuration * 2 * 1000;
      let explorationEndTime: number | undefined;

      if(missionType === MissionType.EXPEDITION) {
        const holdTime = (10 + Math.random() * 20) * 60 * 1000; // 10-30 min hold time
        returnTime += holdTime;
      }
      if(missionType === MissionType.COLONIZE) {
          returnTime = arrivalTime; // One-way trip
      }
      if(missionType === MissionType.EXPLORE) {
          explorationEndTime = arrivalTime + 5 * 3600 * 1000;
          returnTime = explorationEndTime + missionDuration * 1000;
      }

      const newMission: FleetMission = { 
          id: `m-${now}`, fleet: missionFleet, missionType, targetCoords, 
          startTime: now, arrivalTime, returnTime, explorationEndTime,
          processedArrival: false, loot: {}, processedExploration: false,
      };

      setFleetMissions(prev => [...prev, newMission]);
      setFleet(prev => {
          const newFleet = { ...prev };
          for (const shipType in missionFleet) newFleet[shipType as ShipType] = (newFleet[shipType as ShipType] || 0) - (missionFleet[shipType as ShipType] || 0);
          return newFleet;
      });
      showNotification(`Flota wysłana na misję (${missionType}) do [${targetCoords}]. Powrót za ${formatTime((returnTime - now)/1000)}.`);
  }, [showNotification, research, fleetMissions, colonies, npcStates, activeBoosts]);

  const handleMarkAsRead = useCallback((messageId: string) => { setMessages(msgs => msgs.map(m => m.id === messageId ? { ...m, isRead: true } : m)); }, []);
  const handleDeleteMessage = useCallback((messageId: string) => { setMessages(msgs => msgs.filter(m => m.id !== messageId)); }, []);
  const handleDeleteAllMessages = useCallback(() => { setMessages([]); }, []);

  const handleTrade = useCallback((resource: keyof Resources, amount: number, tradeType: 'buy' | 'sell') => {
      if (merchantState.status !== MerchantStatus.ACTIVE) {
          showNotification("Handel jest niedostępny.");
          return;
      }
      const rate = merchantState.rates[resource][tradeType];
      const costOrGain = Math.floor(amount * rate);

      if (tradeType === 'buy') {
          if (credits < costOrGain) {
              showNotification("Za mało kredytów!");
              return;
          }
          if (resources[resource] + amount > maxResources[resource]) {
              showNotification("Niewystarczająca pojemność magazynu!");
              return;
          }
          setCredits(c => c - costOrGain);
          setResources(r => ({ ...r, [resource]: r[resource] + amount }));
          showNotification(`Kupiono ${amount.toLocaleString()} ${resource} za ${costOrGain.toLocaleString()} kredytów.`);
      } else { // sell
          if (resources[resource] < amount) {
              showNotification(`Za mało ${resource}!`);
              return;
          }
          setCredits(c => c + costOrGain);
          setResources(r => ({ ...r, [resource]: r[resource] - amount }));
          showNotification(`Sprzedano ${amount.toLocaleString()} ${resource} za ${costOrGain.toLocaleString()} kredytów.`);
      }
  }, [merchantState, credits, resources, maxResources, showNotification]);

  const handleHirePirates = useCallback(() => {
    if (pirateMercenaryState.status !== PirateMercenaryStatus.AVAILABLE) return;

    if (credits < pirateMercenaryState.hireCost) {
        showNotification("Za mało kredytów by wynająć najemników!");
        return;
    }

    const hireCost = pirateMercenaryState.hireCost;
    const hiredFleet = pirateMercenaryState.fleet;

    setCredits(c => c - hireCost);
    setFleet(prev => {
        const newFleet = { ...prev };
        for (const shipType in hiredFleet) {
            newFleet[shipType as ShipType] = (newFleet[shipType as ShipType] || 0) + (hiredFleet[shipType as ShipType] || 0);
        }
        return newFleet;
    });

    const successState: PirateMercenaryState = { ...pirateMercenaryState, status: PirateMercenaryStatus.DEPARTED };
    const newMessage: PirateMessage = { id: `msg-${Date.now()}-pirate-hired`, type: 'pirate', timestamp: Date.now(), isRead: false, subject: 'Wynajęto najemników', pirateState: successState };
    setMessages(m => [newMessage, ...m]);
    
    setPirateMercenaryState(INITIAL_PIRATE_MERCENARY_STATE);
    showNotification("Najemnicy dołączyli do Twojej floty!");
  }, [pirateMercenaryState, credits, showNotification]);


  const handleActionFromGalaxy = useCallback((targetCoords: string, missionType: MissionType) => {
    setFleetTarget({ coords: targetCoords, mission: missionType });
    setActiveView('fleet');
  }, []);

  const handleNpcUpdate = useCallback((updates: Partial<NPCStates>) => {
      setNpcStates(prev => ({...prev, ...updates}));
  }, []);
  
  const handleNpcMissionLaunch = useCallback((mission: NPCFleetMission) => {
      setNpcFleetMissions(prev => [...prev, mission]);
      const npc = npcStates[mission.sourceCoords];
      if (npc) {
        showNotification(`Wykryto flotę gracza ${npc.name} (NPC) z [${mission.sourceCoords}] zmierzającą w Twoją stronę!`);
      }
  }, [npcStates, showNotification]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white">
                <div className="text-4xl mb-4">🪐</div>
                <h1 className="text-3xl font-bold text-cyan-300 animate-pulse">Ładowanie Twojego Imperium...</h1>
                <p className="text-gray-400 mt-2">Proszę czekać, nawiązujemy połączenie z serwerem galaktycznym.</p>
            </div>
        );
    }
    
    if (error) {
        return (
            <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white p-8">
                 <div className="text-4xl mb-4">☠️</div>
                <h1 className="text-3xl font-bold text-red-500">Błąd Połączenia</h1>
                <p className="text-gray-400 mt-2 text-center">Nie można załadować stanu gry z serwera.</p>
                <p className="text-sm text-gray-500 mt-4 bg-gray-800 p-4 rounded-lg">{error}</p>
                 <button onClick={() => window.location.reload()} className="mt-6 px-6 py-2 bg-cyan-600 hover:bg-cyan-500 rounded font-bold">Spróbuj ponownie</button>
            </div>
        );
    }

  return (
    <div className="min-h-screen bg-gray-900 bg-cover bg-center bg-fixed" style={{backgroundImage: "url('https://picsum.photos/seed/galaxy/1920/1080')"}}>
      {isInfoModalOpen && <InfoModal onClose={() => setIsInfoModalOpen(false)} />}
      {isEncyclopediaOpen && <EncyclopediaModal onClose={() => setIsEncyclopediaOpen(false)} />}
      {isInventoryOpen && <InventoryModal inventory={inventory} onActivateBoost={handleActivateBoost} onClose={() => setIsInventoryOpen(false)} />}
      {ancientArtifactState.status === AncientArtifactStatus.AWAITING_CHOICE && (
        <AncientArtifactModal onChoice={handleArtifactChoice} />
      )}
      <div className="min-h-screen bg-black bg-opacity-70 backdrop-blur-sm">
        <Header 
            resources={resources} 
            productions={productions} 
            maxResources={maxResources}
            credits={credits}
            blackMarketHourlyIncome={blackMarketHourlyIncome} 
            resourceVeinBonus={resourceVeinBonus} 
            inventory={inventory}
            activeBoosts={activeBoosts}
            onInfoClick={() => setIsInfoModalOpen(true)}
            onEncyclopediaClick={() => setIsEncyclopediaOpen(true)}
            onInventoryClick={() => setIsInventoryOpen(true)}
            npcFleetMissions={npcFleetMissions}
            isSaving={isSaving}
        />
        <PirateMercenaryPanel pirateState={pirateMercenaryState} credits={credits} onHire={handleHirePirates} />
        <main className="container mx-auto p-4 md:p-8">
            <Navigation 
                activeView={activeView} 
                setActiveView={setActiveView} 
                unreadMessagesCount={messages.filter(m => !m.isRead).length}
                merchantState={merchantState}
            />
            {notification && (
                <div className="fixed top-24 left-1/2 -translate-x-1/2 bg-blue-900 border border-blue-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-pulse">
                    {notification}
                </div>
            )}
            
            <QueuePanel queue={buildQueue} queueCapacity={activeBoosts[BoostType.EXTRA_BUILD_QUEUE]?.level || 1} />

            <div className="mt-6">
                {activeView === 'buildings' && <BuildingsPanel buildings={buildings} research={research} resources={resources} onUpgrade={(type) => handleAddToQueue(type, 'building')} buildQueue={buildQueue} energyEfficiency={productions.energy.efficiency} />}
                {activeView === 'research' && <ResearchPanel buildings={buildings} research={research} resources={resources} onUpgrade={(type) => handleAddToQueue(type, 'research')} buildQueue={buildQueue} />}
                {activeView === 'fleet_upgrades' && <FleetUpgradesPanel buildings={buildings} research={research} shipLevels={shipLevels} resources={resources} onUpgrade={(type) => handleAddToQueue(type, 'ship_upgrade')} buildQueue={buildQueue} />}
                {activeView === 'shipyard' && <ShipyardPanel buildings={buildings} research={research} resources={resources} onBuild={(type, amount) => handleAddToQueue(type, 'ship', amount)} buildQueue={buildQueue} fleet={fleet} />}
                {activeView === 'defense' && <DefensePanel buildings={buildings} research={research} resources={resources} onBuild={(type, amount) => handleAddToQueue(type, 'defense', amount)} buildQueue={buildQueue} defenses={defenses} />}
                {activeView === 'fleet' && <FleetPanel fleet={fleet} fleetMissions={fleetMissions} onSendFleet={handleSendFleet} research={research} initialTarget={fleetTarget} onClearInitialTarget={() => setFleetTarget(null)} spacePlague={spacePlague} colonies={colonies} npcStates={npcStates} />}
                {activeView === 'galaxy' && <GalaxyPanel onAction={handleActionFromGalaxy} npcStates={npcStates} onNpcUpdate={handleNpcUpdate} onNpcMissionLaunch={handleNpcMissionLaunch} debrisFields={debrisFields} colonies={colonies} />}
                {activeView === 'messages' && <MessagesPanel messages={messages} onRead={handleMarkAsRead} onDelete={handleDeleteMessage} onDeleteAll={handleDeleteAllMessages} />}
                {activeView === 'merchant' && merchantState.status === MerchantStatus.ACTIVE && <MerchantPanel merchantState={merchantState} resources={resources} credits={credits} maxResources={maxResources} onTrade={handleTrade} />}
            </div>
           <footer className="text-center text-gray-500 mt-12 pb-4">
              <p>Kosmiczny Władca - Inspirowane OGame</p>
              <p>Stan gry jest automatycznie zapisywany na serwerze.</p>
           </footer>
        </main>
      </div>
    </div>
  );
}

export default App;
