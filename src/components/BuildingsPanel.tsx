
import React, { useState } from 'react';
import { BuildingLevels, ResearchLevels, Resources, QueueItem, BuildingType, BuildingCategory } from '../types';
import BuildingRow from './BuildingRow';
import { BUILDING_DATA } from '../constants';

interface BuildingsPanelProps {
    buildings: BuildingLevels;
    research: ResearchLevels;
    resources: Resources;
    onUpgrade: (type: BuildingType) => void;
    buildQueue: QueueItem[];
    energyEfficiency: number;
}

const BuildingsPanel: React.FC<BuildingsPanelProps> = ({ buildings, research, resources, onUpgrade, buildQueue, energyEfficiency }) => {
    const [activeCategory, setActiveCategory] = useState<BuildingCategory>(BuildingCategory.RESOURCE);

    const buildingCategories = [
        { id: BuildingCategory.RESOURCE, name: 'Surowcowe' },
        { id: BuildingCategory.INDUSTRIAL, name: 'Przemysłowe' },
        { id: BuildingCategory.STORAGE, name: 'Magazyny' },
    ];
    
    const buildingsToShow = (Object.keys(BUILDING_DATA) as BuildingType[]).filter(
        (type) => BUILDING_DATA[type].category === activeCategory
    );

    return (
        <div>
            <div className="flex space-x-2 mb-4 bg-gray-800 p-2 rounded-lg">
                {buildingCategories.map(category => (
                    <button 
                        key={category.id}
                        onClick={() => setActiveCategory(category.id)}
                        className={`px-4 py-2 rounded-md font-semibold transition-colors ${activeCategory === category.id ? 'bg-cyan-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}
                    >
                        {category.name}
                    </button>
                ))}
            </div>
            <div className="space-y-4">
                {buildingsToShow.map(buildingId => (
                    <BuildingRow 
                        key={buildingId}
                        buildingId={buildingId}
                        buildings={buildings}
                        research={research}
                        resources={resources}
                        onUpgrade={onUpgrade}
                        buildQueue={buildQueue}
                        energyEfficiency={energyEfficiency}
                    />
                ))}
            </div>
        </div>
    );
};

export default BuildingsPanel;
