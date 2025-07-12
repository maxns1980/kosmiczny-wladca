
import React from 'react';
import { BuildingLevels, ResearchLevels, Resources, QueueItem, ShipType, Fleet } from '../types';
import ShipRow from './ShipRow';
import { SHIPYARD_DATA } from '../constants';

interface ShipyardPanelProps {
    buildings: BuildingLevels;
    research: ResearchLevels;
    resources: Resources;
    onBuild: (type: ShipType, amount: number) => void;
    buildQueue: QueueItem[];
    fleet: Fleet;
}

const ShipyardPanel: React.FC<ShipyardPanelProps> = (props) => {
     return (
        <div className="space-y-4">
            {(Object.keys(SHIPYARD_DATA) as ShipType[]).map(shipId => (
                <ShipRow
                    key={shipId}
                    shipId={shipId}
                    {...props}
                />
            ))}
        </div>
    );
};

export default ShipyardPanel;
