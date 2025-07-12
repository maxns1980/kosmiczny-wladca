
import React from 'react';
import { BuildingLevels, ResearchLevels, ShipLevels, Resources, QueueItem, ShipType } from '../types';
import FleetUpgradesRow from './FleetUpgradesRow';
import { SHIP_UPGRADE_DATA } from '../constants';

interface FleetUpgradesPanelProps {
    buildings: BuildingLevels;
    research: ResearchLevels;
    shipLevels: ShipLevels;
    resources: Resources;
    onUpgrade: (type: ShipType) => void;
    buildQueue: QueueItem[];
}

const FleetUpgradesPanel: React.FC<FleetUpgradesPanelProps> = (props) => {
    return (
        <div className="space-y-4">
            {(Object.keys(SHIP_UPGRADE_DATA) as ShipType[]).map(shipId => (
                <FleetUpgradesRow
                    key={shipId}
                    shipId={shipId}
                    {...props}
                />
            ))}
        </div>
    );
};

export default FleetUpgradesPanel;
