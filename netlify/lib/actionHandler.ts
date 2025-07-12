



import { GameState, QueueItemType, GameObject, Resources, MissionType, AncientArtifactChoice, ShipType, ResearchType, BoostType, Fleet, BattleReport, SpyReport, Loot, DebrisField, BattleMessage, SpyMessage, AncientArtifactMessage, PirateMessage, ColonizationMessage, AncientArtifactStatus } from './types';
import { ALL_GAME_OBJECTS, SHIPYARD_DATA, RESEARCH_DATA, DEBRIS_FIELD_RECOVERY_RATE, PLAYER_HOME_COORDS, PROTECTED_RESOURCES_FACTOR, INITIAL_PIRATE_MERCENARY_STATE } from './constants';
import { calculateTotalPower, getUnitsCost } from './utils';
import { calculateMaxResources } from './calculations';
import { getBoostNameForNotif } from './helpers';


type ActionResult = {
    gameState: GameState;
    notifications: string[];
};

export function handleAction(state: GameState, action: { type: string, payload: any }): ActionResult {
    const notifications: string[] = [];
    let newState = { ...state };
    const now = Date.now();

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
            if (newState.activeCostReduction > 0 && (type === 'building' || type === 'research' || type === 'ship_upgrade')) {
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
                newState.buildQueue.push({ id, type, levelOrAmount, buildTime, startTime: now, endTime: now + buildTime * 1000 });
                notifications.push(`Rozpoczęto: ${objectInfo.name}`);
            } else {
                throw new Error("Za mało surowców!");
            }
            break;
        }

        case 'SEND_FLEET': {
            const { missionFleet, targetCoords, missionType } = action.payload as { missionFleet: Fleet, targetCoords: string, missionType: MissionType };
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

            if (missionType === MissionType.EXPEDITION) missionDuration = Math.floor(missionDuration * (1.5 + Math.random()));
            
            const arrivalTime = now + missionDuration * 1000;
            let returnTime = now + missionDuration * 2 * 1000;
            if(missionType === MissionType.EXPEDITION) returnTime += (10 + Math.random() * 20) * 60 * 1000;
            if(missionType === MissionType.COLONIZE) returnTime = arrivalTime;

            newState.fleetMissions.push({ 
                id: `m-${now}`, fleet: missionFleet, missionType, targetCoords, 
                startTime: now, arrivalTime, returnTime, processedArrival: false, loot: {} 
            });
            for (const shipType in missionFleet) {
                 newState.fleet[shipType as ShipType] = (newState.fleet[shipType as ShipType] || 0) - (missionFleet[shipType as ShipType] || 0);
            }
            break;
        }

        case 'TRADE_MERCHANT': {
            const { resource, amount, tradeType } = action.payload as { resource: keyof Resources, amount: number, tradeType: 'buy' | 'sell' };
            const rate = newState.merchantState.rates[resource][tradeType];
            const costOrGain = Math.floor(amount * rate);

            if (tradeType === 'buy') {
                if (newState.credits < costOrGain) throw new Error("Za mało kredytów!");
                newState.credits -= costOrGain;
                newState.resources[resource] += amount;
            } else {
                if (newState.resources[resource] < amount) throw new Error(`Za mało ${resource}!`);
                newState.credits += costOrGain;
                newState.resources[resource] -= amount;
            }
            break;
        }

        case 'HIRE_PIRATES': {
            if (newState.pirateMercenaryState.status !== 'AVAILABLE') throw new Error("Najemnicy niedostępni.");
            if (newState.credits < newState.pirateMercenaryState.hireCost) throw new Error("Za mało kredytów!");

            newState.credits -= newState.pirateMercenaryState.hireCost;
            for (const shipType in newState.pirateMercenaryState.fleet) {
                newState.fleet[shipType as ShipType] = (newState.fleet[shipType as ShipType] || 0) + (newState.pirateMercenaryState.fleet[shipType as ShipType] || 0);
            }
            const hiredMessage: PirateMessage = { id: `msg-${now}-pirate-hired`, type: 'pirate', timestamp: now, isRead: false, subject: 'Wynajęto najemników', pirateState: newState.pirateMercenaryState };
            newState.messages.unshift(hiredMessage);
            newState.pirateMercenaryState = INITIAL_PIRATE_MERCENARY_STATE;
            notifications.push("Najemnicy dołączyli do Twojej floty!");
            break;
        }
        
        case 'ARTIFACT_CHOICE': {
            const { choice } = action.payload as { choice: AncientArtifactChoice };
            let newMessage: AncientArtifactMessage | null = null;
            if (choice === AncientArtifactChoice.STUDY) {
                 // Simplified logic
                 const techToUpgrade = ResearchType.ENERGY_TECHNOLOGY;
                 const newLevel = (newState.research[techToUpgrade] || 0) + 1;
                 newState.research[techToUpgrade] = newLevel;
                 newMessage = { id: `msg-${now}-art`, type: 'ancient_artifact', timestamp: now, isRead: false, subject: 'Artefakt zbadany', choice, outcome: { success: true, technology: techToUpgrade, newLevel } };
            } else if (choice === AncientArtifactChoice.SELL) {
                const creditsGained = 10000;
                newState.credits += creditsGained;
                newMessage = { id: `msg-${now}-art`, type: 'ancient_artifact', timestamp: now, isRead: false, subject: 'Artefakt sprzedany', choice, outcome: { creditsGained } };
            } else {
                 newMessage = { id: `msg-${now}-art`, type: 'ancient_artifact', timestamp: now, isRead: false, subject: 'Artefakt zignorowany', choice, outcome: {} };
            }
            newState.messages.unshift(newMessage);
            newState.ancientArtifactState = { status: AncientArtifactStatus.INACTIVE };
            break;
        }

        case 'ACTIVATE_BOOST': {
            const { boostId } = action.payload;
            const boostToActivate = newState.inventory.boosts.find(b => b.id === boostId);
            if (!boostToActivate) throw new Error("Bonus nie istnieje.");

            newState.inventory.boosts = newState.inventory.boosts.filter(b => b.id !== boostId);
            if (boostToActivate.type === BoostType.CONSTRUCTION_COST_REDUCTION) {
                newState.activeCostReduction = boostToActivate.level;
            } else {
                newState.activeBoosts[boostToActivate.type] = { level: boostToActivate.level, endTime: now + boostToActivate.duration * 1000 };
            }
            notifications.push(`Bonus "${getBoostNameForNotif(boostToActivate)}" został aktywowany!`);
            break;
        }
        
        case 'MARK_MESSAGE_READ':
            newState.messages = newState.messages.map(m => m.id === action.payload.id ? { ...m, isRead: true } : m);
            break;
        case 'DELETE_MESSAGE':
            newState.messages = newState.messages.filter(m => m.id !== action.payload.id);
            break;
        case 'DELETE_ALL_MESSAGES':
            newState.messages = [];
            break;
        default:
            throw new Error(`Nieznana akcja: ${action.type}`);
    }

    return { gameState: newState, notifications };
}