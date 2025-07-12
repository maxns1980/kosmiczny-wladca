
import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
import { db } from './db';
import {
    INITIAL_RESOURCES, INITIAL_BUILDING_LEVELS, INITIAL_RESEARCH_LEVELS, INITIAL_FLEET, INITIAL_DEFENSES, 
    BUILDING_DATA, ALL_GAME_OBJECTS, INITIAL_MERCHANT_STATE, 
    INITIAL_NPC_FLEET_MISSIONS, INITIAL_SHIP_LEVELS, INITIAL_DEBRIS_FIELDS, 
    INITIAL_PIRATE_MERCENARY_STATE, INITIAL_RESOURCE_VEIN_BONUS, INITIAL_ANCIENT_ARTIFACT_STATE, 
    INITIAL_SPACE_PLAGUE_STATE, INITIAL_COLONIES, INITIAL_INVENTORY, INITIAL_ACTIVE_BOOSTS
} from '../../constants';
import { 
    GameState, BuildingType, ResearchType, ShipType, DefenseType, QueueItem, 
    FleetMission, MissionType, ExpeditionMessage, OfflineSummaryMessage
} from '../../types';
import { calculateProductions, calculateMaxResources, processExpeditionOutcome, evolveNpc, initializeNpc } from './utils';

const getInitialState = (): GameState => ({
    resources: INITIAL_RESOURCES,
    buildings: INITIAL_BUILDING_LEVELS,
    research: INITIAL_RESEARCH_LEVELS,
    shipLevels: INITIAL_SHIP_LEVELS,
    fleet: INITIAL_FLEET,
    defenses: INITIAL_DEFENSES,
    fleetMissions: [],
    npcFleetMissions: INITIAL_NPC_FLEET_MISSIONS,
    messages: [],
    buildQueue: [],
    credits: 10000,
    merchantState: INITIAL_MERCHANT_STATE,
    lastMerchantCheckTime: Date.now(),
    pirateMercenaryState: INITIAL_PIRATE_MERCENARY_STATE,
    lastPirateCheckTime: Date.now(),
    lastAsteroidCheckTime: Date.now(),
    resourceVeinBonus: INITIAL_RESOURCE_VEIN_BONUS,
    lastResourceVeinCheckTime: Date.now(),
    ancientArtifactState: INITIAL_ANCIENT_ARTIFACT_STATE,
    lastArtifactCheckTime: Date.now(),
    spacePlague: INITIAL_SPACE_PLAGUE_STATE,
    lastSpacePlagueCheckTime: Date.now(),
    lastSaveTime: Date.now(),
    npcStates: {},
    awardedBonuses: [],
    debrisFields: INITIAL_DEBRIS_FIELDS,
    colonies: INITIAL_COLONIES,
    inventory: INITIAL_INVENTORY,
    activeBoosts: INITIAL_ACTIVE_BOOSTS,
    activeCostReduction: 0,
    blackMarketHourlyIncome: 0,
    lastBlackMarketIncomeCheck: Date.now(),
});

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { userId } = JSON.parse(event.body || '{}');
        if (!userId) {
            return { statusCode: 400, body: 'User ID is required' };
        }

        let gameState = await db.get(userId);
        
        if (!gameState) {
            gameState = getInitialState();
            await db.set(userId, gameState);
        }

        const now = Date.now();
        const offlineTimeMs = now - gameState.lastSaveTime;
        const offlineSeconds = Math.max(0, Math.floor(offlineTimeMs / 1000));
        
        if (offlineSeconds > 5) {
            // This is the server-side simulation loop, adapted from the client's offline calculation
            let simState = gameState;
            const offlineEvents: string[] = [];
            
            // --- Evolve NPCs ---
            Object.keys(simState.npcStates).forEach(coords => {
                const npc = simState.npcStates[coords];
                const evolvedResult = evolveNpc(npc, (now - npc.lastUpdateTime) / 1000, coords);
                simState.npcStates[coords] = evolvedResult.updatedNpc;
                if (evolvedResult.mission) {
                    simState.npcFleetMissions.push(evolvedResult.mission);
                }
            });

            // --- Process each second of offline time ---
            for (let i = 0; i < offlineSeconds; i++) {
                const tickTime = simState.lastSaveTime + (i + 1) * 1000;
                
                const simProductions = calculateProductions(simState.buildings, simState.resourceVeinBonus, simState.colonies, simState.activeBoosts);
                const simMaxResources = calculateMaxResources(simState.buildings);
    
                // --- Apply 1 second of production ---
                simState.resources.metal = Math.min(simMaxResources.metal, simState.resources.metal + simProductions.metal / 3600);
                simState.resources.crystal = Math.min(simMaxResources.crystal, simState.resources.crystal + simProductions.crystal / 3600);
                simState.resources.deuterium = Math.min(simMaxResources.deuterium, simState.resources.deuterium + simProductions.deuterium / 3600);
                simState.credits += simState.blackMarketHourlyIncome / 3600;

                // --- Process build queue ---
                const newlyCompleted = simState.buildQueue.filter((item: QueueItem) => tickTime >= item.endTime);
                if (newlyCompleted.length > 0) {
                    newlyCompleted.forEach((item: QueueItem) => {
                        const info = ALL_GAME_OBJECTS[item.id as keyof typeof ALL_GAME_OBJECTS];
                        offlineEvents.push(`✅ Ukończono: ${info.name} ${item.type.match(/ship|defense/) ? 'zbudowano' : `poz. ${item.levelOrAmount}`}`);
                        if (item.type === 'building') simState.buildings[item.id as BuildingType] = item.levelOrAmount;
                        else if (item.type === 'research') simState.research[item.id as ResearchType] = item.levelOrAmount;
                        else if (item.type === 'ship_upgrade') simState.shipLevels[item.id as ShipType] = item.levelOrAmount;
                        else if (item.type === 'ship') simState.fleet[item.id as ShipType] = (simState.fleet[item.id as ShipType] || 0) + item.levelOrAmount;
                        else if (item.type === 'defense') simState.defenses[item.id as DefenseType] = (simState.defenses[item.id as DefenseType] || 0) + item.levelOrAmount;
                    });
                    simState.buildQueue = simState.buildQueue.filter((item: QueueItem) => tickTime < item.endTime);
                }
                
                // --- Process fleet missions (simplified for brevity) ---
                const activeMissions: FleetMission[] = [];
                simState.fleetMissions.forEach((mission: FleetMission) => {
                    if (tickTime >= mission.returnTime) { // Fleet returns
                        offlineEvents.push(`🚀 Flota powróciła z misji [${mission.targetCoords}].`);
                        if (mission.missionType === MissionType.EXPEDITION) {
                            const { message, finalFleet, finalLoot } = processExpeditionOutcome(mission, simState.shipLevels);
                            simState.messages.unshift(message);
                            for (const ship in finalFleet) {
                                simState.fleet[ship as ShipType] = (simState.fleet[ship as ShipType] || 0) + (finalFleet[ship as ShipType] || 0);
                            }
                        } else {
                            for (const ship in mission.fleet) {
                                simState.fleet[ship as ShipType] = (simState.fleet[ship as ShipType] || 0) + (mission.fleet[ship as ShipType] || 0);
                            }
                        }
                    } else {
                        activeMissions.push(mission);
                    }
                });
                simState.fleetMissions = activeMissions;
            }

            // --- Add summary message ---
            const summaryMessage: OfflineSummaryMessage = {
                id: `msg-${now}-offline`, type: 'offline_summary', timestamp: now, isRead: false,
                subject: 'Podsumowanie Offline',
                duration: offlineSeconds,
                events: offlineEvents.slice(0, 20), // Limit events to avoid huge message
            };
            if (offlineEvents.length > 0) {
              simState.messages.unshift(summaryMessage);
            }
            
            simState.lastSaveTime = now;
            gameState = simState;
        }

        // Always update save time, even if no processing happened
        gameState.lastSaveTime = now;

        return {
            statusCode: 200,
            body: JSON.stringify(gameState),
            headers: { 'Content-Type': 'application/json' },
        };
    } catch (error) {
        console.error('Error in get-game-state:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};

export { handler };
