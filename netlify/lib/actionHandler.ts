
import { GameState, QueueItemType, GameObject, Resources, MissionType, AncientArtifactChoice, ShipType, ResearchType, BoostType, Fleet, AncientArtifactStatus, PirateMercenaryStatus, MerchantStatus } from './types';
import { ALL_GAME_OBJECTS, SHIPYARD_DATA, RESEARCH_DATA, DEBRIS_FIELD_RECOVERY_RATE, PLAYER_HOME_COORDS, PROTECTED_RESOURCES_FACTOR, COLONY_INCOME_BONUS_PER_HOUR, BUILDING_DATA } from './constants';
import { calculateProductions, calculateMaxResources } from '../../src/utils/calculations';
import { getBoostNameForNotif } from './gameLogic';

type ActionResult = {
    gameState: GameState;
    notifications: string[];
};

const formatNumber = (num: number) => Math.floor(num).toLocaleString('pl-PL');

export function handleAction(state: GameState, action: { type: string, payload: any }): ActionResult {
    const notifications: string[] = [];
    let newState = JSON.parse(JSON.stringify(state)) as GameState;

    switch (action.type) {
        case 'ADD_TO_QUEUE': {
            const { id, type, amount = 1 } = action.payload as { id: GameObject, type: QueueItemType, amount?: number };
            const queueCapacity = newState.activeBoosts[BoostType.EXTRA_BUILD_QUEUE]?.level || 1;
            const buildingQueueCount = newState.buildQueue.filter(item => ['building', 'research', 'ship_upgrade'].includes(item.type)).length;
            const shipyardQueueCount = newState.buildQueue.filter(item => ['ship', 'defense'].includes(item.type)).length;

            if ((type === 'building' || type === 'research' || type === 'ship_upgrade') && buildingQueueCount >= queueCapacity) {
                throw new Error(`Kolejka budowy/badań jest pełna! (Max: ${queueCapacity})`);
            }
            if ((type === 'ship' || type === 'defense') && shipyardQueueCount >= queueCapacity) {
                throw new Error(`Stocznia jest zajęta! (Max: ${queueCapacity})`);
            }

            const objectInfo = ALL_GAME_OBJECTS[id as keyof typeof ALL_GAME_OBJECTS];
            let levelOrAmount: number;
            if (type === 'building') levelOrAmount = newState.buildings[id as keyof typeof newState.buildings] + 1;
            else if (type === 'research') levelOrAmount = newState.research[id as keyof typeof newState.research] + 1;
            else if (type === 'ship_upgrade') levelOrAmount = newState.shipLevels[id as keyof typeof newState.shipLevels] + 1;
            else levelOrAmount = amount;

            let cost = objectInfo.cost(levelOrAmount);
            if (newState.activeCostReduction > 0 && (type === 'building' || type === 'research')) {
                const reduction = newState.activeCostReduction / 100;
                cost = {
                    metal: Math.floor(cost.metal * (1 - reduction)),
                    crystal: Math.floor(cost.crystal * (1 - reduction)),
                    deuterium: Math.floor(cost.deuterium * (1 - reduction)),
                };
                notifications.push(`Zastosowano zniżkę ${newState.activeCostReduction}%!`);
                newState.activeCostReduction = 0;
            }

            const totalCost = { metal: (cost.metal || 0) * amount, crystal: (cost.crystal || 0) * amount, deuterium: (cost.deuterium || 0) * amount };
            if (newState.resources.metal >= totalCost.metal && newState.resources.crystal >= totalCost.crystal && newState.resources.deuterium >= totalCost.deuterium) {
                newState.resources = { metal: newState.resources.metal - totalCost.metal, crystal: newState.resources.crystal - totalCost.crystal, deuterium: newState.resources.deuterium - totalCost.deuterium };
                const buildTime = objectInfo.buildTime(levelOrAmount) * ((type === 'ship' || type === 'defense') ? amount : 1);
                const now = Date.now();
                newState.buildQueue.push({ id, type, levelOrAmount, buildTime, startTime: now, endTime: now + buildTime * 1000 });
                notifications.push(`Rozpoczęto: ${objectInfo.name}`);
            } else {
                throw new Error("Za mało surowców!");
            }
            break;
        }

        case 'SEND_FLEET': {
            const { missionFleet, targetCoords, missionType } = action.payload as { missionFleet: Fleet, targetCoords: string, missionType: MissionType };
            const now = Date.now();
            const isTargetOccupied = newState.npcStates[targetCoords] || newState.colonies.some(c => c.id === targetCoords) || targetCoords === PLAYER_HOME_COORDS;

            if (missionType === MissionType.SPY && (!missionFleet[ShipType.SPY_PROBE] || (missionFleet[ShipType.SPY_PROBE] ?? 0) === 0)) {
                throw new Error("Misja szpiegowska wymaga przynajmniej jednej Sondy Szpiegowskiej!");
            }
            if (missionType === MissionType.HARVEST && (!missionFleet[ShipType.RECYCLER] || (missionFleet[ShipType.RECYCLER] ?? 0) === 0)) {
                throw new Error("Misja zbierania wymaga przynajmniej jednego Recyklera!");
            }
            if (missionType === MissionType.EXPLORE) {
                if (!missionFleet[ShipType.RESEARCH_VESSEL] || (missionFleet[ShipType.RESEARCH_VESSEL] ?? 0) === 0) {
                    throw new Error("Misja eksploracyjna wymaga Okrętu Badawczego!");
                }
                if (isTargetOccupied) {
                    throw new Error("Można eksplorować tylko niezamieszkane planety!");
                }
            }
            if (missionType === MissionType.EXPEDITION) {
                const maxExpeditions = 1 + (newState.research[ResearchType.ASTROPHYSICS] || 0);
                const currentExpeditions = newState.fleetMissions.filter(m => m.missionType === MissionType.EXPEDITION).length;
                if (currentExpeditions >= maxExpeditions) {
                    throw new Error(`Przekroczono limit wypraw! (Max: ${maxExpeditions})`);
                }
            }
            if (missionType === MissionType.COLONIZE) {
                if (!missionFleet[ShipType.COLONY_SHIP] || (missionFleet[ShipType.COLONY_SHIP] ?? 0) === 0) {
                    throw new Error("Misja kolonizacyjna wymaga Statku Kolonizacyjnego!");
                }
                const maxColonies = newState.research[ResearchType.ASTROPHYSICS] || 0;
                if (newState.colonies.length >= maxColonies) {
                    throw new Error(`Przekroczono limit kolonii! (Max: ${maxColonies}). Zbadaj Astrofizykę, by go zwiększyć.`);
                }
                if (isTargetOccupied) {
                    throw new Error("Ta pozycja jest już zajęta!");
                }
            }

            const speeds = Object.entries(missionFleet).map(([shipId, count]) => {
                if (!count || count <= 0) return Infinity;
                const shipData = SHIPYARD_DATA[shipId as ShipType];
                const driveTech = shipData.drive;
                const driveLevel = newState.research[driveTech] || 0;
                let speedMultiplier = 0.1;
                if (driveTech === ResearchType.IMPULSE_DRIVE) speedMultiplier = 0.2;
                if (driveTech === ResearchType.HYPERSPACE_DRIVE) speedMultiplier = 0.3;
                return shipData.speed * (1 + driveLevel * speedMultiplier);
            });
            
            const speedBoost = 1 + (newState.activeBoosts[BoostType.DRIVE_TECH_BOOST]?.level || 0) / 100;
            const slowestSpeed = Math.min(...speeds) * speedBoost;
            let missionDuration = Math.floor(36000000 / slowestSpeed);

            if (missionType === MissionType.EXPEDITION) {
                missionDuration = Math.floor(missionDuration * (1.5 + Math.random()));
            }
            
            const arrivalTime = now + missionDuration * 1000;
            let returnTime = now + missionDuration * 2 * 1000;
            let explorationEndTime: number | undefined;

            if (missionType === MissionType.EXPEDITION) {
                const holdTime = (10 + Math.random() * 20) * 60 * 1000;
                returnTime += holdTime;
            }
            if (missionType === MissionType.COLONIZE) {
                returnTime = arrivalTime;
            }
            if (missionType === MissionType.EXPLORE) {
                explorationEndTime = arrivalTime + 5 * 3600 * 1000;
                returnTime = explorationEndTime + missionDuration * 1000;
            }

            newState.fleetMissions.push({
                id: `m-${now}`, fleet: missionFleet, missionType, targetCoords,
                startTime: now, arrivalTime, returnTime, explorationEndTime,
                processedArrival: false, loot: {}, processedExploration: false,
            });

            for (const shipType in missionFleet) {
                newState.fleet[shipType as ShipType] = (newState.fleet[shipType as ShipType] || 0) - (missionFleet[shipType as ShipType] || 0);
            }
            notifications.push(`Flota wysłana na misję (${missionType}) do [${targetCoords}].`);
            break;
        }

        case 'MARK_MESSAGE_READ': {
            const { id } = action.payload;
            const message = newState.messages.find(m => m.id === id);
            if (message) {
                message.isRead = true;
            }
            break;
        }

        case 'DELETE_MESSAGE': {
            const { id } = action.payload;
            newState.messages = newState.messages.filter(m => m.id !== id);
            break;
        }

        case 'DELETE_ALL_MESSAGES': {
            newState.messages = [];
            break;
        }

        case 'TRADE_MERCHANT': {
            const { resource, amount, tradeType } = action.payload as { resource: keyof Resources, amount: number, tradeType: 'buy' | 'sell' };
            const maxResources = calculateMaxResources(newState.buildings);

            if (newState.merchantState.status !== MerchantStatus.ACTIVE) {
                throw new Error("Handel jest niedostępny.");
            }
            const rate = newState.merchantState.rates[resource][tradeType];
            const costOrGain = Math.floor(amount * rate);

            if (tradeType === 'buy') {
                if (newState.credits < costOrGain) throw new Error("Za mało kredytów!");
                if (newState.resources[resource] + amount > maxResources[resource]) throw new Error("Niewystarczająca pojemność magazynu!");
                
                newState.credits -= costOrGain;
                newState.resources[resource] += amount;
                notifications.push(`Kupiono ${formatNumber(amount)} ${resource} za ${formatNumber(costOrGain)} kredytów.`);
            } else {
                if (newState.resources[resource] < amount) throw new Error(`Za mało ${resource}!`);
                
                newState.credits += costOrGain;
                newState.resources[resource] -= amount;
                notifications.push(`Sprzedano ${formatNumber(amount)} ${resource} za ${formatNumber(costOrGain)} kredytów.`);
            }
            break;
        }

        case 'HIRE_PIRATES': {
            if (newState.pirateMercenaryState.status !== PirateMercenaryStatus.AVAILABLE) throw new Error("Najemnicy są niedostępni.");
            if (newState.credits < newState.pirateMercenaryState.hireCost) throw new Error("Za mało kredytów by wynająć najemników!");

            const hireCost = newState.pirateMercenaryState.hireCost;
            const hiredFleet = newState.pirateMercenaryState.fleet;

            newState.credits -= hireCost;
            for (const shipType in hiredFleet) {
                newState.fleet[shipType as ShipType] = (newState.fleet[shipType as ShipType] || 0) + (hiredFleet[shipType as ShipType] || 0);
            }
            
            newState.messages.unshift({ id: `msg-${Date.now()}-pirate-hired`, type: 'pirate', timestamp: Date.now(), isRead: false, subject: 'Wynajęto najemników', pirateState: { ...newState.pirateMercenaryState, status: PirateMercenaryStatus.DEPARTED } });
            newState.pirateMercenaryState.status = PirateMercenaryStatus.INACTIVE;
            notifications.push("Najemnicy dołączyli do Twojej floty!");
            break;
        }
        
        case 'ARTIFACT_CHOICE': {
            const { choice } = action.payload as { choice: AncientArtifactChoice };
            const now = Date.now();
            let newMessage: any | null = null;
            
            if (newState.ancientArtifactState.status !== AncientArtifactStatus.AWAITING_CHOICE) {
                throw new Error("Brak artefaktu do zbadania.");
            }

            switch (choice) {
                case AncientArtifactChoice.STUDY: {
                    const cost = { credits: 5000, crystal: 2000 };
                    if (newState.credits < cost.credits || newState.resources.crystal < cost.crystal) {
                       throw new Error("Za mało surowców by zbadać artefakt!");
                    }
                    newState.credits -= cost.credits;
                    newState.resources.crystal -= cost.crystal;

                    if (Math.random() < 0.5) { // Success
                        const availableResearch = (Object.keys(newState.research) as ResearchType[]).filter(r => (newState.research[r] || 0) < 10);
                        if (availableResearch.length > 0) {
                            const techToUpgrade = availableResearch[Math.floor(Math.random() * availableResearch.length)];
                            const newLevel = (newState.research[techToUpgrade] || 0) + 1;
                            newState.research[techToUpgrade] = newLevel;
                            const techName = RESEARCH_DATA[techToUpgrade].name;
                            notifications.push(`Przełom! Zbadanie artefaktu ulepszyło ${techName} do poz. ${newLevel}!`);
                            newMessage = { outcome: { success: true, technology: techToUpgrade, newLevel } };
                        }
                    } else { // Failure
                        notifications.push("Niestety, artefakt okazał się bezwartościową bryłą metalu.");
                        newMessage = { outcome: { success: false } };
                    }
                    break;
                }
                case AncientArtifactChoice.SELL: {
                    const creditsGained = 10000;
                    newState.credits += creditsGained;
                    notifications.push(`Sprzedano artefakt za ${formatNumber(creditsGained)} kredytów.`);
                    newMessage = { outcome: { creditsGained } };
                    break;
                }
                case AncientArtifactChoice.IGNORE: {
                    notifications.push("Postanowiono zignorować artefakt.");
                    newMessage = { outcome: {} };
                    break;
                }
            }
            newState.ancientArtifactState.status = AncientArtifactStatus.INACTIVE;
            if (newMessage) {
                newState.messages.unshift({
                    id: `msg-${now}-artifact`, type: 'ancient_artifact', timestamp: now, isRead: false,
                    subject: `Reakcja na artefakt: ${choice}`, choice, ...newMessage
                });
            }
            break;
        }
        
        case 'ACTIVATE_BOOST': {
             const { boostId } = action.payload as { boostId: string };
             const boostIndex = newState.inventory.boosts.findIndex(b => b.id === boostId);
             if (boostIndex === -1) throw new Error("Nie znaleziono bonusu.");
             
             const [boostToActivate] = newState.inventory.boosts.splice(boostIndex, 1);

             switch (boostToActivate.type) {
                case BoostType.CONSTRUCTION_COST_REDUCTION:
                    if (newState.activeCostReduction > 0) throw new Error("Zniżka na budowę jest już aktywna!");
                    newState.activeCostReduction = boostToActivate.level;
                    notifications.push(`Aktywowano zniżkę ${boostToActivate.level}% na następną budowę/badanie!`);
                    break;
                
                case BoostType.CONSTRUCTION_TIME_REDUCTION:
                    if (newState.buildQueue.length === 0) throw new Error("Brak aktywnej budowy do skrócenia!");
                    const timeReductionSeconds = boostToActivate.level * 3600;
                    newState.buildQueue[0].endTime -= timeReductionSeconds * 1000;
                    notifications.push(`Skrócono czas budowy o ${boostToActivate.level}h!`);
                    break;

                case BoostType.SECTOR_ACTIVITY_SCAN:
                    if (newState.activeBoosts[BoostType.SECTOR_ACTIVITY_SCAN]) throw new Error("Skan aktywności sektora jest już aktywny!");
                    newState.activeBoosts[BoostType.SECTOR_ACTIVITY_SCAN] = { endTime: Date.now() + boostToActivate.duration * 1000 };
                    notifications.push(`Aktywowano skan aktywności sektora na ${boostToActivate.duration / 3600}h!`);
                    break;

                case BoostType.ABANDONED_COLONY_LOOT:
                    const loot = { metal: 25000, crystal: 15000, deuterium: 5000, credits: 10000 };
                    const maxResources = calculateMaxResources(newState.buildings);
                    newState.resources.metal = Math.min(maxResources.metal, newState.resources.metal + loot.metal);
                    newState.resources.crystal = Math.min(maxResources.crystal, newState.resources.crystal + loot.crystal);
                    newState.resources.deuterium = Math.min(maxResources.deuterium, newState.resources.deuterium + loot.deuterium);
                    newState.credits += loot.credits;
                    notifications.push(`Zrabowano opuszczoną kolonię! Zysk: ${formatNumber(loot.metal)} metalu i więcej!`);
                    break;

                default: // For timed boosts
                    if (newState.activeBoosts[boostToActivate.type]) throw new Error("Podobny bonus jest już aktywny!");
                    newState.activeBoosts[boostToActivate.type] = {
                        level: boostToActivate.level,
                        endTime: Date.now() + boostToActivate.duration * 1000,
                    };
                    notifications.push(`Bonus "${getBoostNameForNotif(boostToActivate)}" został aktywowany!`);
             }
             break;
        }

        default:
            // It's good practice to either throw an error or handle unknown actions gracefully.
            // For now, we'll do nothing, but in a real app, logging this would be useful.
            break;
    }
    return { gameState: newState, notifications };
}
