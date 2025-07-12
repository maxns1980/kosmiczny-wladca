
import React from 'react';
import { Resources, ResourceVeinBonus, Inventory, ActiveBoosts, NPCFleetMission, BoostType } from '../types';
import { formatNumber } from '../utils/helpers';

interface HeaderProps {
    resources: Resources;
    productions: { metal: number; crystal: number; deuterium: number; energy: { produced: number; consumed: number; } };
    maxResources: Resources;
    credits: number;
    blackMarketHourlyIncome: number;
    resourceVeinBonus: ResourceVeinBonus;
    inventory: Inventory;
    activeBoosts: ActiveBoosts;
    onInfoClick: () => void;
    onEncyclopediaClick: () => void;
    onInventoryClick: () => void;
    npcFleetMissions: NPCFleetMission[];
}

const ResourceBox: React.FC<{ title: string; icon: string; amount: number; max?: number; production?: number; bonusText?: string; color: string; }> = ({ title, icon, amount, max, production, bonusText, color }) => {
    const percentage = max ? (amount / max) * 100 : 0;
    return (
        <div className={`flex-1 bg-black bg-opacity-40 rounded-lg p-3 border ${color}`}>
            <div className="flex items-center justify-between text-lg">
                <span className="font-bold">{icon} {title}</span>
            </div>
            <div className="text-2xl font-bold my-1">{formatNumber(amount)}</div>
            {max !== undefined && (
                <>
                    <div className="text-sm text-gray-400">/ {formatNumber(max)}</div>
                    <div className="w-full bg-gray-700 rounded-full h-1.5 mt-2">
                        <div className={`h-1.5 rounded-full ${percentage > 90 ? 'bg-red-500' : percentage > 70 ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${percentage}%` }}></div>
                    </div>
                </>
            )}
            {production !== undefined && <div className="text-sm text-cyan-400 mt-1">+{formatNumber(production)}/h</div>}
            {bonusText && <div className="text-xs text-yellow-400">{bonusText}</div>}
        </div>
    );
};

const Header: React.FC<HeaderProps> = ({ resources, productions, maxResources, credits, onInfoClick, onEncyclopediaClick, onInventoryClick, activeBoosts }) => {
    const isVeinActive = activeBoosts[BoostType.RESOURCE_PRODUCTION_BOOST];

    return (
        <header className="bg-gray-900 bg-opacity-70 p-2 text-white sticky top-0 z-40 backdrop-blur-md border-b border-cyan-800">
            <div className="container mx-auto flex items-center justify-between gap-2 md:gap-4">
                <div className="flex-grow grid grid-cols-2 md:grid-cols-5 gap-2">
                    <ResourceBox title="Metal" icon="🔩" amount={resources.metal} max={maxResources.metal} production={productions.metal} color="border-gray-500" bonusText={isVeinActive ? `+${isVeinActive.level}%` : undefined} />
                    <ResourceBox title="Kryształ" icon="💎" amount={resources.crystal} max={maxResources.crystal} production={productions.crystal} color="border-blue-500" bonusText={isVeinActive ? `+${isVeinActive.level}%` : undefined}/>
                    <ResourceBox title="Deuter" icon="💧" amount={resources.deuterium} max={maxResources.deuterium} production={productions.deuterium} color="border-purple-500" bonusText={isVeinActive ? `+${isVeinActive.level}%` : undefined}/>
                    <ResourceBox title="Energia" icon="☀️" amount={productions.energy.produced - productions.energy.consumed} max={productions.energy.produced} color="border-teal-500" />
                    <ResourceBox title="Kredyty" icon="💰" amount={credits} color="border-yellow-500" />
                </div>
                <div className="flex flex-col space-y-2">
                    <button onClick={onInfoClick} className="bg-blue-600 hover:bg-blue-700 text-white font-bold p-2 rounded-full text-xs">INFO</button>
                    <button onClick={onEncyclopediaClick} className="bg-purple-600 hover:bg-purple-700 text-white font-bold p-2 rounded-full text-xs">📖</button>
                    <button onClick={onInventoryClick} className="bg-green-600 hover:bg-green-700 text-white font-bold p-2 rounded-full text-xs">📦</button>
                </div>
            </div>
        </header>
    );
};

export default Header;