
import React from 'react';
import { BuildingLevels, ResearchLevels, Resources, QueueItem, DefenseType, Defenses } from '../types';
import DefenseRow from './DefenseRow';
import { DEFENSE_DATA } from '../constants';

interface DefensePanelProps {
    buildings: BuildingLevels;
    research: ResearchLevels;
    resources: Resources;
    onBuild: (type: DefenseType, amount: number) => void;
    buildQueue: QueueItem[];
    defenses: Defenses;
}

const DefensePanel: React.FC<DefensePanelProps> = (props) => {
    return (
        <div className="space-y-4">
            {(Object.keys(DEFENSE_DATA) as DefenseType[]).map(defenseId => (
                <DefenseRow
                    key={defenseId}
                    defenseId={defenseId}
                    {...props}
                />
            ))}
        </div>
    );
};

export default DefensePanel;
