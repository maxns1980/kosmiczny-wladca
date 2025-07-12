
import { CombatStats, ResearchLevels, ActiveBoosts, SpacePlagueState, Fleet, Defenses, Resources, ShipType, GameState, ShipLevels } from './types';
import { ALL_GAME_OBJECTS, SHIPYARD_DATA } from './constants';


export const getUnitsCost = (units: Partial<Fleet | Defenses>): Resources => {
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

export const getFleetValue = (fleet: Fleet, shipLevels: ShipLevels): number => {
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

export const calculateCombatStats = (
    baseStats: CombatStats,
    research: ResearchLevels,
    activeBoosts: ActiveBoosts,
    upgradeLevel: number = 0,
    isPlagued: boolean = false
): CombatStats => {
    const weaponTechLevel = (research.WEAPON_TECHNOLOGY || 0) + (activeBoosts.COMBAT_TECH_BOOST?.level || 0);
    const armorTechLevel = (research.ARMOR_TECHNOLOGY || 0) + (activeBoosts.ARMOR_TECH_BOOST?.level || 0);
    
    let finalAttack = baseStats.attack * (1 + weaponTechLevel * 0.1) * (1 + upgradeLevel * 0.1);
    if (isPlagued) {
        finalAttack *= 0.8;
    }

    const finalShield = baseStats.shield * (1 + (research.SHIELDING_TECHNOLOGY || 0) * 0.1) * (1 + upgradeLevel * 0.1);
    const finalStructuralIntegrity = baseStats.structuralIntegrity * (1 + armorTechLevel * 0.1) * (1 + upgradeLevel * 0.1);

    return {
        attack: finalAttack,
        shield: finalShield,
        structuralIntegrity: finalStructuralIntegrity,
    };
};

export const calculateTotalPower = (
    units: Fleet | Defenses, 
    research: ResearchLevels, 
    shipLevels: GameState['shipLevels'] | null, // null for defenses
    spacePlague?: SpacePlagueState,
    activeBoosts: ActiveBoosts = {}
): number => {
    let totalPower = 0;
    for (const [unitId, count] of Object.entries(units)) {
        if (!count || count <= 0) continue;
        const unitData = ALL_GAME_OBJECTS[unitId as keyof typeof ALL_GAME_OBJECTS];
        
        if (!('attack' in unitData)) continue;

        const isShip = "cargoCapacity" in unitData;

        const upgradeLevel = (isShip && shipLevels) ? shipLevels[unitId as ShipType] || 0 : 0;
        const isPlagued = (isShip && spacePlague) ? spacePlague.active && spacePlague.infectedShip === unitId : false;

        const finalStats = calculateCombatStats(unitData, research, activeBoosts, upgradeLevel, isPlagued);
        
        const unitPower = finalStats.attack + finalStats.shield + (finalStats.structuralIntegrity / 10);
        totalPower += unitPower * count;
    }
    return totalPower;
};
