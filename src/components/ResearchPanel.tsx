
import React from 'react';
import { BuildingLevels, ResearchLevels, Resources, QueueItem, ResearchType } from '../types';
import ResearchRow from './ResearchRow';
import { RESEARCH_DATA } from '../constants';

interface ResearchPanelProps {
    buildings: BuildingLevels;
    research: ResearchLevels;
    resources: Resources;
    onUpgrade: (type: ResearchType) => void;
    buildQueue: QueueItem[];
}

const ResearchPanel: React.FC<ResearchPanelProps> = (props) => {
    return (
        <div className="space-y-4">
            {(Object.keys(RESEARCH_DATA) as ResearchType[]).map(researchId => (
                <ResearchRow
                    key={researchId}
                    researchId={researchId}
                    {...props}
                />
            ))}
        </div>
    );
};

export default ResearchPanel;
