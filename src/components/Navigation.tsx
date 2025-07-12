
import React from 'react';
import { View, MerchantState } from '../types';

interface NavigationProps {
    activeView: View;
    setActiveView: (view: View) => void;
    unreadMessagesCount: number;
    merchantState: MerchantState;
    onLogout: () => void;
}

const NavButton: React.FC<{
    currentView: View;
    viewName: View;
    setActiveView: (view: View) => void;
    badgeCount?: number;
    isHighlighted?: boolean;
    children: React.ReactNode;
}> = ({ currentView, viewName, setActiveView, children, badgeCount, isHighlighted }) => {
    const isActive = currentView === viewName;
    const baseClasses = 'relative flex-grow text-center px-4 py-2 rounded-md transition-all duration-200 focus:outline-none';
    const activeClasses = 'bg-cyan-600 text-white shadow-lg';
    const inactiveClasses = 'bg-gray-700 hover:bg-gray-600 text-gray-300';
    const highlightedClasses = 'animate-pulse border-2 border-yellow-400';
    
    return (
        <button
            className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses} ${isHighlighted ? highlightedClasses : ''}`}
            onClick={() => setActiveView(viewName)}
        >
            {children}
            {badgeCount !== undefined && badgeCount > 0 && (
                <span className="absolute top-0 right-0 -mt-1 -mr-1 px-2 py-1 bg-red-600 text-white text-xs rounded-full">
                    {badgeCount}
                </span>
            )}
        </button>
    );
};

const Navigation: React.FC<NavigationProps> = ({ activeView, setActiveView, unreadMessagesCount, merchantState, onLogout }) => {
    const navItems: { view: View, label: string, badge?: number, highlight?: boolean }[] = [
        { view: 'buildings', label: 'Budynki' },
        { view: 'research', label: 'Badania' },
        { view: 'fleet_upgrades', label: 'Ulepszenia Floty' },
        { view: 'shipyard', label: 'Stocznia' },
        { view: 'defense', label: 'Obrona' },
        { view: 'fleet', label: 'Flota' },
        { view: 'galaxy', label: 'Galaktyka' },
        { view: 'messages', label: 'Wiadomości', badge: unreadMessagesCount },
        { view: 'merchant', label: 'Kupiec', highlight: merchantState.status === 'ACTIVE' },
    ];

    return (
        <div className="flex flex-wrap gap-2 p-2 bg-black bg-opacity-30 rounded-lg">
            {navItems.map(item => (
                 item.view !== 'merchant' || merchantState.status === 'ACTIVE' ? (
                    <NavButton
                        key={item.view}
                        currentView={activeView}
                        viewName={item.view}
                        setActiveView={setActiveView}
                        badgeCount={item.badge}
                        isHighlighted={item.highlight}
                    >
                        {item.label}
                    </NavButton>
                 ) : null
            ))}
            <button onClick={onLogout} className="flex-grow text-center px-4 py-2 rounded-md transition-all duration-200 focus:outline-none bg-red-800 hover:bg-red-700 text-white">
                Wyloguj
            </button>
        </div>
    );
};

export default Navigation;