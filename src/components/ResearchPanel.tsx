
import React from 'react';
import { BuildingLevels, ResearchLevels, Resources, QueueItem, ResearchType } from '../types';

interface ResearchPanelProps {
    buildings: BuildingLevels;
    research: ResearchLevels;
    resources: Resources;
    onUpgrade: (type: ResearchType) => void;
    buildQueue: QueueItem[];
}

const ResearchPanel: React.FC<ResearchPanelProps> = (props) => {
    return <div>Research Panel Placeholder</div>;
};

export default ResearchPanel;
