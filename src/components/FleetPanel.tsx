
import React, { useState, useEffect, useMemo } from 'react';
import { Fleet, FleetMission, ResearchLevels, MissionType, SpacePlagueState, Colony, NPCStates, ShipType } from '../types';
import { SHIPYARD_DATA } from '../constants';
import { formatNumber } from '../utils/helpers';

interface FleetPanelProps {
    fleet: Fleet;
    fleetMissions: FleetMission[];
    onSendFleet: (fleet: Fleet, coords: string, mission: MissionType) => void;
    research: ResearchLevels;
    initialTarget: { coords: string; mission: MissionType } | null;
    onClearInitialTarget: () => void;
    spacePlague: SpacePlagueState;
    colonies: Colony[];
    npcStates: NPCStates;
}

const FleetPanel: React.FC<FleetPanelProps> = ({ fleet, fleetMissions, onSendFleet, research, initialTarget, onClearInitialTarget, spacePlague, colonies, npcStates }) => {
    const [missionFleet, setMissionFleet] = useState<Fleet>({});
    const [targetCoords, setTargetCoords] = useState('');
    const [missionType, setMissionType] = useState<MissionType>(MissionType.ATTACK);

    useEffect(() => {
        if (initialTarget) {
            setTargetCoords(initialTarget.coords);
            setMissionType(initialTarget.mission);
            onClearInitialTarget();
        }
    }, [initialTarget, onClearInitialTarget]);

    const handleShipAmountChange = (shipId: ShipType, amount: number) => {
        const available = fleet[shipId] || 0;
        const newAmount = Math.max(0, Math.min(available, amount));
        setMissionFleet(prev => ({ ...prev, [shipId]: newAmount }));
    };

    const handleSendFleet = () => {
        const hasShips = Object.values(missionFleet).some(count => count && count > 0);
        if (hasShips && targetCoords.match(/^\d+:\d+:\d+$/)) {
            onSendFleet(missionFleet, targetCoords, missionType);
            setMissionFleet({});
            setTargetCoords('');
        }
    };
    
    const totalCargoCapacity = useMemo(() => Object.entries(missionFleet).reduce((acc, [shipId, count]) => {
        if (!count) return acc;
        return acc + (SHIPYARD_DATA[shipId as ShipType].cargoCapacity * count);
    }, 0), [missionFleet]);


    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column: Send Fleet */}
            <div className="bg-gray-800 bg-opacity-60 p-6 rounded-lg border border-gray-700">
                <h3 className="text-2xl font-bold text-cyan-400 mb-4">Wyślij Flotę</h3>
                
                <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                    {Object.entries(fleet).map(([shipId, count]) => {
                        if (count <= 0) return null;
                        const shipData = SHIPYARD_DATA[shipId as ShipType];
                        return (
                            <div key={shipId} className="grid grid-cols-3 items-center gap-4">
                                <span>{shipData.name} ({formatNumber(count)})</span>
                                <input
                                    type="range"
                                    min="0"
                                    max={count}
                                    value={missionFleet[shipId as ShipType] || 0}
                                    onChange={(e) => handleShipAmountChange(shipId as ShipType, parseInt(e.target.value))}
                                    className="w-full"
                                />
                                <input 
                                    type="number" 
                                    value={missionFleet[shipId as ShipType] || 0}
                                    onChange={(e) => handleShipAmountChange(shipId as ShipType, parseInt(e.target.value))}
                                    className="bg-gray-900 text-white p-1 rounded-md w-24 text-center"
                                />
                            </div>
                        )
                    })}
                </div>

                <div className="mt-4 border-t border-gray-600 pt-4 space-y-4">
                     <div>
                        <span className="font-semibold">Całkowita pojemność ładowni: {formatNumber(totalCargoCapacity)}</span>
                    </div>
                    <div>
                        <label className="block mb-1">Koordynaty Docelowe (np. 1:23:4):</label>
                        <input type="text" value={targetCoords} onChange={e => setTargetCoords(e.target.value)} className="bg-gray-900 text-white p-2 rounded-md w-full" />
                    </div>
                    <div>
                        <label className="block mb-1">Typ Misji:</label>
                        <select value={missionType} onChange={e => setMissionType(e.target.value as MissionType)} className="bg-gray-900 text-white p-2 rounded-md w-full">
                            {Object.values(MissionType).map(type => <option key={type} value={type}>{type}</option>)}
                        </select>
                    </div>
                    <button onClick={handleSendFleet} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-md transition-colors disabled:bg-gray-600" disabled={!Object.values(missionFleet).some(c => c > 0) || !targetCoords.match(/^\d+:\d+:\d+$/)}>
                        Wyślij
                    </button>
                </div>
            </div>

            {/* Right Column: Active Missions */}
            <div className="bg-gray-800 bg-opacity-60 p-6 rounded-lg border border-gray-700">
                 <h3 className="text-2xl font-bold text-cyan-400 mb-4">Aktywne Misje ({fleetMissions.length})</h3>
                 <div className="space-y-3 max-h-[30rem] overflow-y-auto pr-2">
                     {fleetMissions.map(mission => (
                         <div key={mission.id} className="bg-gray-700 p-3 rounded-md">
                            <div className="font-bold">{mission.missionType} na [{mission.targetCoords}]</div>
                             <div className="text-sm text-gray-400">
                                 Powrót za: {new Date(mission.returnTime).toLocaleTimeString()}
                             </div>
                         </div>
                     ))}
                 </div>
            </div>
        </div>
    );
};

export default FleetPanel;