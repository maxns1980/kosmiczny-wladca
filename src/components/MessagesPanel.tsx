
import React, { useState } from 'react';
import { Message, SpyMessage, BattleMessage, MerchantInfoMessage, EspionageEventMessage, PirateMessage, AsteroidImpactMessage, ResourceVeinMessage, AncientArtifactMessage, SpacePlagueMessage, OfflineSummaryMessage, ExpeditionMessage, ColonizationMessage, ExplorationMessage, Resources, Fleet, Defenses } from '../types';
import { SHIPYARD_DATA, DEFENSE_DATA } from '../constants';
import { formatNumber } from '../utils/helpers';

const ResourceDisplay: React.FC<{resources: Partial<Resources>}> = ({ resources }) => (
    <div className="flex gap-4">
        {Object.entries(resources).map(([key, value]) => value && value > 0 ? (
            <span key={key}>{key}: {formatNumber(value)}</span>
        ) : null)}
    </div>
);

const FleetDisplay: React.FC<{fleet: Partial<Fleet | Defenses>}> = ({ fleet }) => (
    <div className="flex flex-wrap gap-x-4 gap-y-1">
        {Object.entries(fleet).map(([key, value]) => value && value > 0 ? (
            <span key={key}>{(SHIPYARD_DATA[key as keyof typeof SHIPYARD_DATA] || DEFENSE_DATA[key as keyof typeof DEFENSE_DATA])?.name}: {formatNumber(value)}</span>
        ) : null)}
    </div>
);

const MessageContent: React.FC<{ message: Message }> = ({ message }) => {
    switch (message.type) {
        case 'spy':
            const { report } = message as SpyMessage;
            return (
                <div className="space-y-2">
                    <p>Raport szpiegowski z [{report.targetCoords}]</p>
                    <div><strong>Surowce:</strong> <ResourceDisplay resources={report.resources} /></div>
                    <div><strong>Flota:</strong> <FleetDisplay fleet={report.fleet || {}} /></div>
                    <div><strong>Obrona:</strong> <FleetDisplay fleet={report.defenses || {}} /></div>
                </div>
            );
        case 'battle':
            const { report: battleReport } = message as BattleMessage;
            return (
                <div className="space-y-2">
                    <p>Wynik bitwy o [{battleReport.targetCoords}]</p>
                    <div className="text-green-400"><strong>Straty Atakującego:</strong> <FleetDisplay fleet={battleReport.attackerLosses} /></div>
                    <div className="text-red-400"><strong>Straty Obrońcy:</strong> <FleetDisplay fleet={battleReport.defenderLosses} /></div>
                    <div><strong>Zebrane surowce:</strong> <ResourceDisplay resources={battleReport.loot} /></div>
                    <div><strong>Utworzone pole zniszczeń:</strong> <ResourceDisplay resources={battleReport.debrisCreated} /></div>
                </div>
            );
         case 'expedition':
            const { outcome, details } = message as ExpeditionMessage;
            return (
                 <div>
                    <p>Wynik ekspedycji: <strong>{outcome}</strong></p>
                     {details.resourcesGained && <div><strong>Znaleziono surowce:</strong> <ResourceDisplay resources={details.resourcesGained}/></div>}
                    {details.creditsGained && <div><strong>Znaleziono kredyty:</strong> {formatNumber(details.creditsGained)}</div>}
                    {details.fleetGained && <div><strong>Odnaleziono flotę:</strong> <FleetDisplay fleet={details.fleetGained}/></div>}
                    {details.fleetLost && <div><strong>Stracono flotę:</strong> <FleetDisplay fleet={details.fleetLost}/></div>}
                </div>
            )
        default:
            return <p>Wiadomość systemowa: {message.subject}</p>;
    }
};

const MessagesPanel: React.FC<{
    messages: Message[];
    onRead: (id: string) => void;
    onDelete: (id: string) => void;
    onDeleteAll: () => void;
}> = ({ messages, onRead, onDelete, onDeleteAll }) => {
    const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
    
    const handleSelectMessage = (message: Message) => {
        setSelectedMessage(message);
        if(!message.isRead) {
            onRead(message.id);
        }
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 bg-gray-800 bg-opacity-60 p-4 rounded-lg border border-gray-700 max-h-[70vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-cyan-400">Skrzynka Odbiorcza</h3>
                    <button onClick={onDeleteAll} className="text-sm bg-red-800 hover:bg-red-700 px-3 py-1 rounded">Usuń Wszystkie</button>
                </div>
                <ul className="space-y-2">
                    {messages.map(msg => (
                        <li 
                            key={msg.id} 
                            onClick={() => handleSelectMessage(msg)}
                            className={`p-3 rounded-md cursor-pointer transition-colors ${selectedMessage?.id === msg.id ? 'bg-cyan-800' : 'bg-gray-700 hover:bg-gray-600'} ${!msg.isRead ? 'border-l-4 border-yellow-400' : ''}`}
                        >
                            <div className={`font-bold ${!msg.isRead ? 'text-white' : 'text-gray-300'}`}>{msg.subject}</div>
                            <div className="text-xs text-gray-400">{new Date(msg.timestamp).toLocaleString()}</div>
                        </li>
                    ))}
                </ul>
            </div>
            <div className="md:col-span-2 bg-gray-800 bg-opacity-60 p-6 rounded-lg border border-gray-700">
                {selectedMessage ? (
                    <div>
                        <div className="flex justify-between items-start">
                             <h2 className="text-2xl font-bold mb-4">{selectedMessage.subject}</h2>
                             <button onClick={() => onDelete(selectedMessage.id)} className="text-sm bg-red-800 hover:bg-red-700 px-3 py-1 rounded">Usuń</button>
                        </div>
                        <div className="prose prose-invert max-w-none text-gray-300">
                            <MessageContent message={selectedMessage} />
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-gray-500">Wybierz wiadomość, aby ją przeczytać.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MessagesPanel;