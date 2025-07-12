
import { GameState, QueueItemType, GameObject, Resources, MissionType, AncientArtifactChoice, ShipType, ResearchType, BoostType } from './types';
import { ALL_GAME_OBJECTS, SHIPYARD_DATA, RESEARCH_DATA, DEBRIS_FIELD_RECOVERY_RATE, PLAYER_HOME_COORDS, PROTECTED_RESOURCES_FACTOR } from './constants';
import { processExpeditionOutcome, getBoostNameForNotif } from './gameLogic';

type ActionResult = {
    gameState: GameState;
    notifications: string[];
};

export function handleAction(state: GameState, action: { type: string, payload: any }): ActionResult {
    const notifications: string[] = [];
    let newState = { ...state };

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