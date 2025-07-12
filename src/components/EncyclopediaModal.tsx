
import React, { useState } from 'react';
import { ALL_GAME_OBJECTS, BUILDING_DATA, RESEARCH_DATA, SHIPYARD_DATA, DEFENSE_DATA } from '../constants';
import { BuildingType, ResearchType, ShipType, DefenseType } from '../types';

interface EncyclopediaModalProps {
    onClose: () => void;
}

type Category = 'Buildings' | 'Research' | 'Ships' | 'Defense';

const EncyclopediaModal: React.FC<EncyclopediaModalProps> = ({ onClose }) => {
    const [activeCategory, setActiveCategory] = useState<Category>('Buildings');
    
    const renderContent = () => {
        let data: Record<string, any>;
        switch(activeCategory) {
            case 'Buildings': data = BUILDING_DATA; break;
            case 'Research': data = RESEARCH_DATA; break;
            case 'Ships': data = SHIPYARD_DATA; break;
            case 'Defense': data = DEFENSE_DATA; break;
            default: return null;
        }

        return (
            <div className="space-y-3">
                {Object.values(data).map((item: any) => (
                    <div key={item.name} className="bg-gray-900 p-3 rounded-md">
                        <h4 className="font-bold text-cyan-400">{item.name} {item.icon}</h4>
                        <p className="text-sm text-gray-400">{item.description}</p>
                    </div>
                ))}
            </div>
        )
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 border border-cyan-700 rounded-lg p-6 max-w-4xl w-full text-left shadow-2xl relative max-h-[90vh] flex flex-col">
                <h2 className="text-2xl font-bold text-cyan-400 mb-4">Encyklopedia</h2>
                
                <div className="flex space-x-2 mb-4 border-b border-gray-700 pb-2">
                    {(['Buildings', 'Research', 'Ships', 'Defense'] as Category[]).map(cat => (
                         <button 
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`px-4 py-2 rounded-md font-semibold transition-colors ${activeCategory === cat ? 'bg-cyan-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                <div className="flex-grow overflow-y-auto pr-2">
                    {renderContent()}
                </div>

                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 bg-red-600 hover:bg-red-700 text-white font-bold w-8 h-8 rounded-full"
                >
                    X
                </button>
            </div>
        </div>
    );
};

export default EncyclopediaModal;
