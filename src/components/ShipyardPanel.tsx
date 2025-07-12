
import React from 'react';
import { BuildingLevels, ResearchLevels, Resources, QueueItem, ShipType, Fleet } from '../types';

interface ShipyardPanelProps {
    buildings: BuildingLevels;
    research: ResearchLevels;
    resources: Resources;
    onBuild: (type: ShipType, amount: number) => void;
    buildQueue: QueueItem[];
    fleet: Fleet;
}

const ShipyardPanel: React.FC<ShipyardPanelProps> = (props) => {
    return <div>Shipyard Panel Placeholder</div>;
};

export default ShipyardPanel;
