
import React, { useState } from 'react';
import { DefenseType, BuildingLevels, ResearchLevels, Resources, Defenses, BuildingType, ResearchType } from '../types';
import { DEFENSE_DATA, BUILDING_DATA, RESEARCH_DATA } from '../constants';
import { formatNumber } from '../utils/helpers';

interface DefenseRowProps {
    defenseId: DefenseType;
    buildings: BuildingLevels;
    research: ResearchLevels;
    resources: Resources;
    onBuild: (type: DefenseType, amount: number) => void;
    defenses: Defenses;
}

const DefenseRow: React.FC<DefenseRowProps> = ({ defenseId, buildings, research, resources, onBuild, defenses }) => {
    const defenseInfo = DEFENSE_DATA[defenseId];
    const cost = defenseInfo.cost(1);
    const requirements = defenseInfo.requirements || {};
    const [amount, setAmount] = useState(1);

    const requirementsMet = Object.entries(requirements).every(([reqId, reqLevel]) => {
        return (buildings[reqId as BuildingType] || 0) >= (reqLevel as number) || (research[reqId as ResearchType] || 0) >= (reqLevel as number);
    });

    const maxBuildable = Math.min(
        cost.metal > 0 ? Math.floor(resources.metal / cost.metal) : Infinity,
        cost.crystal > 0 ? Math.floor(resources.crystal / cost.crystal) : Infinity,
        cost.deuterium > 0 ? Math.floor(resources.deuterium / cost.deuterium) : Infinity
    );

    const handleBuild = () => {
        if (amount > 0) {
            onBuild(defenseId, amount);
            setAmount(1);
        }
    };

    if (!requirementsMet) {
        return (
             <div className="bg-gray-900 bg-opacity-70 p-4 rounded-lg border border-gray-800 opacity-50">
                 <h4 className="text-xl font-bold text-gray-500">{defenseInfo.name}</h4>
                 <div className="mt-2 text-sm">
                    <p className="font-semibold text-yellow-600">Wymagania:</p>
                     {Object.entries(requirements).map(([reqId, reqLevel]) => {
                         const reqInfo = BUILDING_DATA[reqId as BuildingType] || RESEARCH_DATA[reqId as ResearchType];
                         const currentReqLevel = buildings[reqId as BuildingType] || research[reqId as ResearchType] || 0;
                         const met = currentReqLevel >= (reqLevel as number);
                         return <span key={reqId} className={`mr-4 ${met ? 'text-green-600 line-through' : 'text-red-600'}`}>{reqInfo.name} ({reqLevel})</span>
                     })}
                </div>
            </div>
        );
    }

    const currentAmount = defenses[defenseId] || 0;

    return (
        <div className="bg-gray-800 bg-opacity-60 p-4 rounded-lg border border-gray-700 flex flex-col md:flex-row gap-4">
            <div className="w-full md:w-1/4 flex items-center justify-center text-6xl">
                {defenseInfo.icon}
            </div>
            <div className="flex-grow">
                <h4 className="text-xl font-bold text-cyan-400">{defenseInfo.name} (Posiadane: {formatNumber(currentAmount)})</h4>
                <p className="text-gray-400 mt-1">{defenseInfo.description}</p>
                <div className="grid grid-cols-3 gap-2 text-sm mt-2">
                    <span>Atak: {formatNumber(defenseInfo.attack)}</span>
                    <span>Tarcza: {formatNumber(defenseInfo.shield)}</span>
                    <span>Struktura: {formatNumber(defenseInfo.structuralIntegrity)}</span>
                </div>
                <div className="mt-3">
                    <p className="font-semibold">Koszt 1 sztuki:</p>
                    <div className="flex gap-4 text-sm">
                        <span>🔩 Metal: {formatNumber(cost.metal)}</span>
                        <span>💎 Kryształ: {formatNumber(cost.crystal)}</span>
                        {cost.deuterium > 0 && <span>💧 Deuter: {formatNumber(cost.deuterium)}</span>}
                    </div>
                </div>
            </div>
            <div className="w-full md:w-1/5 flex flex-col items-center justify-center gap-2">
                <label htmlFor={`amount-${defenseId}`} className="text-sm">Ilość:</label>
                <input 
                    id={`amount-${defenseId}`}
                    type="number"
                    min="1"
                    max={maxBuildable}
                    value={amount}
                    onChange={(e) => setAmount(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-full bg-gray-900 text-white text-center rounded-md border border-gray-600 p-2"
                />
                 <button onClick={() => setAmount(maxBuildable)} className="text-xs text-cyan-400 hover:underline">Max: {formatNumber(maxBuildable)}</button>
                <button 
                    onClick={handleBuild}
                    disabled={amount <= 0 || amount > maxBuildable}
                    className="w-full bg-green-600 text-white font-bold py-2 px-4 rounded-md transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed hover:bg-green-700 enabled:shadow-lg"
                >
                    Buduj
                </button>
            </div>
        </div>
    );
};

export default DefenseRow;