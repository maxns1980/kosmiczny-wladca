
import React, { useState } from 'react';
import { MissionType, NPCStates, DebrisField, Colony, PlayerPlanets } from '../types';

interface GalaxyPanelProps {
    username: string;
    homePlanet: string;
    onAction: (targetCoords: string, missionType: MissionType) => void;
    npcStates: NPCStates;
    playerPlanets: PlayerPlanets;
    debrisFields: Record<string, DebrisField>;
    colonies: Colony[];
}

const formatNumber = (num: number) => Math.floor(num).toLocaleString('pl-PL');

const GalaxyPanel: React.FC<GalaxyPanelProps> = ({ username, homePlanet, onAction, npcStates, playerPlanets, debrisFields, colonies }) => {
    const [galaxy, setGalaxy] = useState(1);
    const [system, setSystem] = useState(1);

    const handleSystemChange = (delta: number) => {
        let newSystem = system + delta;
        let newGalaxy = galaxy;
        if (newSystem > 499) {
            newSystem = 1;
            newGalaxy++;
        }
        if (newSystem < 1) {
            newSystem = 499;
            newGalaxy = Math.max(1, newGalaxy - 1);
        }
        setSystem(newSystem);
        setGalaxy(newGalaxy);
    };

    const planets = Array.from({ length: 15 }, (_, i) => {
        const position = i + 1;
        const coords = `${galaxy}:${system}:${position}`;
        
        const isPlayerHomePlanet = coords === homePlanet;
        const playerColony = colonies.find(c => c.id === coords);
        const otherPlayerPlanet = playerPlanets[coords];
        const npc = npcStates[coords];
        const debris = debrisFields[coords];
        
        let planetData = null;
        let planetType: 'player_home' | 'player_colony' | 'other_player' | 'npc' | 'empty' = 'empty';

        if (isPlayerHomePlanet) {
            planetData = { name: 'Planeta Matka', owner: username, image: '🌍' };
            planetType = 'player_home';
        } else if (playerColony) {
            planetData = { name: playerColony.name, owner: username, image: '🌍' };
            planetType = 'player_colony';
        } else if (otherPlayerPlanet) {
            planetData = { name: otherPlayerPlanet.name, owner: otherPlayerPlanet.owner, image: '🪐' };
            planetType = 'other_player';
        } else if (npc) {
            planetData = { name: `Planeta ${npc.name}`, owner: `${npc.name} (NPC)`, image: npc.image };
            planetType = 'npc';
        }

        return { coords, planetData, planetType, position, debris };
    });

    const expeditionCoords = `${galaxy}:${system}:16`;

    return (
        <div className="bg-gray-800 bg-opacity-70 backdrop-blur-sm border border-gray-700 rounded-xl shadow-2xl p-4 md:p-6">
            <h2 className="text-2xl font-bold text-cyan-300 mb-4 border-b-2 border-cyan-800 pb-3">Galaktyka</h2>
            
            <div className="flex flex-col md:flex-row justify-between items-center bg-gray-900 p-3 rounded-lg mb-6">
                <div className="flex items-center space-x-2">
                    <button onClick={() => handleSystemChange(-1)} className="px-4 py-2 bg-cyan-700 hover:bg-cyan-600 rounded-md font-bold">Poprzedni</button>
                    <input type="number" value={galaxy} onChange={e => setGalaxy(Math.max(1, parseInt(e.target.value) || 1))} className="w-20 bg-gray-800 border border-gray-600 text-white rounded-md px-2 py-1 text-center"/>
                    <span className="font-bold">:</span>
                    <input type="number" value={system} onChange={e => setSystem(Math.max(1, parseInt(e.target.value) || 1))} className="w-20 bg-gray-800 border border-gray-600 text-white rounded-md px-2 py-1 text-center"/>
                    <button onClick={() => handleSystemChange(1)} className="px-4 py-2 bg-cyan-700 hover:bg-cyan-600 rounded-md font-bold">Następny</button>
                </div>
                <h3 className="text-xl font-bold text-white mt-4 md:mt-0">Układ: [{galaxy}:{system}]</h3>
            </div>

            <div className="space-y-3">
                {planets.map((planet) => {
                    let bgColor = 'bg-gray-900 bg-opacity-60';
                    let borderColor = '';
                    if (planet.planetType === 'player_home' || planet.planetType === 'player_colony') {
                        bgColor = 'bg-blue-900 bg-opacity-50';
                        borderColor = 'border-l-4 border-cyan-400';
                    } else if (planet.planetType === 'other_player') {
                        bgColor = 'bg-yellow-900 bg-opacity-40';
                        borderColor = 'border-l-4 border-yellow-500';
                    } else if (planet.planetType === 'npc') {
                        bgColor = 'bg-red-900 bg-opacity-40';
                        borderColor = 'border-l-4 border-red-500';
                    }

                    return (
                        <div key={planet.coords} className={`p-3 rounded-lg flex flex-col md:flex-row items-center justify-between ${bgColor} ${borderColor}`}>
                            <div className="flex items-center font-semibold w-full md:w-2/5">
                                <span className="text-4xl mr-4 w-10 text-center">{planet.planetData?.image || '⚫'}</span>
                                <div className="flex-1">
                                    <p className="text-lg text-white">Pozycja {planet.position} [{planet.coords}]</p>
                                    {planet.planetData ? (
                                        <p className="text-sm text-gray-400">Gracz: {planet.planetData.owner}</p>
                                    ) : (
                                        <p className="text-sm text-gray-500">[Pusta Przestrzeń]</p>
                                    )}
                                </div>
                            </div>
                            {planet.debris && ((planet.debris.metal || 0) > 1 || (planet.debris.crystal || 0) > 1) && (
                                <div className="flex items-center text-sm text-yellow-300 mx-4">
                                   <span className="text-xl mr-2">♻️</span>
                                   <div>
                                     <p>Metal: {formatNumber(planet.debris.metal || 0)}</p>
                                     <p>Kryształ: {formatNumber(planet.debris.crystal || 0)}</p>
                                   </div>
                                </div>
                            )}
                            <div className="flex items-center space-x-2 mt-3 md:mt-0">
                                {planet.debris && ((planet.debris.metal || 0) > 1 || (planet.debris.crystal || 0) > 1) && (
                                    <button onClick={() => onAction(planet.coords, MissionType.HARVEST)} className="px-4 py-2 bg-green-700 hover:bg-green-600 rounded-md text-sm font-bold transition-transform transform hover:scale-105">Zbieraj</button>
                                )}
                                {planet.planetType === 'npc' || planet.planetType === 'other_player' ? (
                                    <>
                                        <button onClick={() => onAction(planet.coords, MissionType.SPY)} className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 rounded-md text-sm font-bold transition-transform transform hover:scale-105">Szpieguj</button>
                                        <button onClick={() => onAction(planet.coords, MissionType.ATTACK)} className="px-4 py-2 bg-red-700 hover:bg-red-600 rounded-md text-sm font-bold transition-transform transform hover:scale-105">Atakuj</button>
                                    </>
                                ) : planet.planetType === 'player_home' || planet.planetType === 'player_colony' ? (
                                    <span className="px-4 py-2 text-cyan-400 font-bold">{planet.planetType === 'player_home' ? 'Twoja Planeta' : 'Twoja Kolonia'}</span>
                                ) : ( // Empty
                                    <>
                                        <button onClick={() => onAction(planet.coords, MissionType.EXPLORE)} className="px-4 py-2 bg-teal-600 hover:bg-teal-500 rounded-md text-sm font-bold transition-transform transform hover:scale-105">Eksploruj</button>
                                        <button onClick={() => onAction(planet.coords, MissionType.COLONIZE)} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-md text-sm font-bold transition-transform transform hover:scale-105">Kolonizuj</button>
                                    </>
                                )}
                            </div>
                        </div>
                    );
                })}
                 <div key={expeditionCoords} className="p-3 rounded-lg flex flex-col md:flex-row items-center justify-between bg-purple-900 bg-opacity-40 border-l-4 border-purple-500">
                    <div className="flex items-center font-semibold w-full md:w-2/5">
                        <span className="text-4xl mr-4 w-10 text-center">🌌</span>
                        <div className="flex-1">
                            <p className="text-lg text-white">Pozycja 16 [{expeditionCoords}]</p>
                            <p className="text-sm text-purple-300">[Nieznana Przestrzeń]</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2 mt-3 md:mt-0">
                        <button onClick={() => onAction(expeditionCoords, MissionType.EXPEDITION)} className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-md text-sm font-bold transition-transform transform hover:scale-105">Wyprawa</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GalaxyPanel;
