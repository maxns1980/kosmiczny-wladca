
import React from 'react';
import { BuildingType, BuildingLevels, ResearchLevels, Resources, QueueItem, ResearchType } from '../types';
import { BUILDING_DATA, RESEARCH_DATA } from '../constants';
import { formatNumber } from '../utils/helpers';

interface BuildingRowProps {
    buildingId: BuildingType;
    buildings: BuildingLevels;
    research: ResearchLevels;
    resources: Resources;
    onUpgrade: (type: BuildingType) => void;
    buildQueue: QueueItem[];
    energyEfficiency: number;
}

const BuildingRow: React.FC<BuildingRowProps> = ({ buildingId, buildings, research, resources, onUpgrade, buildQueue, energyEfficiency }) => {
    const buildingInfo = BUILDING_DATA[buildingId];
    const currentLevel = buildings[buildingId] || 0;
    const nextLevel = currentLevel + 1;
    const cost = buildingInfo.cost(nextLevel);
    const requirements = buildingInfo.requirements || {};

    const canAfford = resources.metal >= cost.metal && resources.crystal >= cost.crystal && resources.deuterium >= cost.deuterium;
    const requirementsMet = Object.entries(requirements).every(([reqId, reqLevel]) => {
        return (buildings[reqId as BuildingType] || 0) >= (reqLevel as number) || (research[reqId as ResearchType] || 0) >= (reqLevel as number);
    });

    const isInQueue = buildQueue.some(item => item.id === buildingId);
    const isUpgradable = canAfford && requirementsMet && !isInQueue;

    const getProductionText = () => {
        if (!buildingInfo.production) return null;
        const currentProd = buildingInfo.production(currentLevel) * (buildingId === BuildingType.SOLAR_PLANT ? 1 : energyEfficiency);
        const nextProd = buildingInfo.production(nextLevel) * (buildingId === BuildingType.SOLAR_PLANT ? 1 : energyEfficiency);
        return `Produkcja: ${formatNumber(currentProd)}/h (+${formatNumber(nextProd - currentProd)} na nast. poz.)`;
    };

    return (
        <div className="bg-gray-800 bg-opacity-60 p-4 rounded-lg border border-gray-700 flex flex-col md:flex-row gap-4">
            <div className="w-full md:w-1/4">
                <img src={buildingInfo.image || `https://via.placeholder.com/150/1a202c/6ee7b7?text=${buildingInfo.name}`} alt={buildingInfo.name} className="w-full h-32 object-cover rounded-md"/>
            </div>
            <div className="flex-grow">
                <h4 className="text-xl font-bold text-cyan-400">{buildingInfo.name} (Poziom {currentLevel})</h4>
                <p className="text-gray-400 mt-1">{buildingInfo.description}</p>
                {getProductionText() && <p className="text-green-400 mt-2">{getProductionText()}</p>}
                
                <div className="mt-3">
                    <p className="font-semibold">Koszt ulepszenia do poz. {nextLevel}:</p>
                    <div className="flex gap-4 text-sm">
                        <span className={resources.metal < cost.metal ? 'text-red-500' : ''}>🔩 Metal: {formatNumber(cost.metal)}</span>
                        <span className={resources.crystal < cost.crystal ? 'text-red-500' : ''}>💎 Kryształ: {formatNumber(cost.crystal)}</span>
                        {cost.deuterium > 0 && <span className={resources.deuterium < cost.deuterium ? 'text-red-500' : ''}>💧 Deuter: {formatNumber(cost.deuterium)}</span>}
                    </div>
                </div>

                {!requirementsMet && (
                     <div className="mt-2 text-sm">
                        <p className="font-semibold text-yellow-500">Wymagania:</p>
                         {Object.entries(requirements).map(([reqId, reqLevel]) => {
                             const reqInfo = BUILDING_DATA[reqId as BuildingType] || RESEARCH_DATA[reqId as ResearchType];
                             const currentReqLevel = buildings[reqId as BuildingType] || research[reqId as ResearchType] || 0;
                             const met = currentReqLevel >= (reqLevel as number);
                             return <span key={reqId} className={`mr-4 ${met ? 'text-green-500 line-through' : 'text-red-500'}`}>{reqInfo.name} ({reqLevel})</span>
                         })}
                    </div>
                )}
            </div>
            <div className="w-full md:w-1/5 flex items-center justify-center">
                <button 
                    onClick={() => onUpgrade(buildingId)}
                    disabled={!isUpgradable}
                    className="w-full h-full bg-green-600 text-white font-bold py-2 px-4 rounded-md transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed hover:bg-green-700 enabled:shadow-lg"
                >
                    {isInQueue ? "W kolejce" : `Ulepsz do poz. ${nextLevel}`}
                </button>
            </div>
        </div>
    );
};

export default BuildingRow;