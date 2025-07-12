
import React from 'react';
import { Resources, ResourceVeinBonus, Inventory, ActiveBoosts, NPCFleetMission } from '../types';

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

const Header: React.FC<HeaderProps> = (props) => {
    return <header className="bg-gray-800 bg-opacity-50 p-2 text-white sticky top-0 z-40 backdrop-blur-md">Header Placeholder</header>;
};

export default Header;
