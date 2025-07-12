
import React, { useState } from 'react';
import { MissionType, NPCStates, DebrisField, Colony } from '../types';

interface GalaxyPanelProps {
    onAction: (coords: string, mission: MissionType) => void;
    npcStates: NPCStates;
    onNpcUpdate: () => void;
    onNpcMissionLaunch: () => void;
    debrisFields: Record<string, DebrisField>;
    colonies: Colony[];
}

const GalaxyPanel: React.FC<GalaxyPanelProps> = ({ onAction, npcStates, debrisFields, colonies }) => {
    const [galaxy, setGalaxy] = useState(1);
    const [system, setSystem] = useState(42);
    
    const npcCoords = Object.keys(npcStates);
    const colonyCoords = colonies.map(c => c.id);

    return (
        <div className="bg-gray-800 bg-opacity-60 p-6 rounded-lg border border-gray-700">
            <h3 className="text-2xl font-bold text-cyan-400 mb-4">Widok Galaktyki</h3>
            <div className="flex items-center gap-4 mb-6">
                <div>
                    <label>Galaktyka:</label>
                    <input type="number" value={galaxy} onChange={e => setGalaxy(parseInt(e.target.value))} min="1" max="9" className="bg-gray-900 ml-2 p-2 w-20 rounded"/>
                </div>
                 <div>
                    <label>System:</label>
                    <input type="number" value={system} onChange={e => setSystem(parseInt(e.target.value))} min="1" max="499" className="bg-gray-900 ml-2 p-2 w-24 rounded"/>
                </div>
            </div>
            <div className="space-y-2">
                {Array.from({ length: 15 }, (_, i) => i + 1).map(position => {
                    const coords = `${galaxy}:${system}:${position}`;
                    const npc = npcStates[coords];
                    const debris = debrisFields[coords];
                    const colony = colonies.find(c => c.id === coords);
                    
                    let planetType = "Pusta planeta";
                    let planetColor = "bg-gray-700";
                    let actions: {name: string, mission: MissionType}[] = [{name: 'Kolonizuj', mission: MissionType.COLONIZE}];

                    if(npc) {
                         planetType = `Gracz NPC: ${npc.name}`;
                         planetColor = "bg-red-900";
                         actions = [{name: 'Atakuj', mission: MissionType.ATTACK}, {name: 'Szpieguj', mission: MissionType.SPY}];
                    } else if (colony) {
                        planetType = `Twoja kolonia: ${colony.name}`;
                        planetColor = "bg-green-900";
                        actions = [];
                    }

                    if (debris) {
                        actions.push({name: 'Zbieraj', mission: MissionType.HARVEST});
                    }
                    
                    return (
                        <div key={coords} className={`p-4 rounded-md grid grid-cols-1 md:grid-cols-4 items-center gap-4 ${planetColor}`}>
                            <div className="font-bold text-lg">{coords}</div>
                            <div>
                                {planetType}
                                {debris && <div className="text-xs text-yellow-300">Pole zniszczeń</div>}
                            </div>
                            <div className="md:col-span-2 flex justify-end gap-2">
                                {actions.map(action => (
                                     <button key={action.name} onClick={() => onAction(coords, action.mission)} className="bg-cyan-600 hover:bg-cyan-700 px-3 py-1 rounded-md text-sm">{action.name}</button>
                                ))}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    );
};

export default GalaxyPanel;
