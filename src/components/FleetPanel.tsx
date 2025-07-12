
import React from 'react';
import { Fleet, FleetMission, ResearchLevels, MissionType, SpacePlagueState, Colony, NPCStates } from '../types';

interface FleetPanelProps {
    fleet: Fleet;
    fleetMissions: FleetMission[];
    onSendFleet: (fleet: Fleet, coords: string, mission: MissionType) => void;
    research: ResearchLevels;
    initialTarget: { coords: string; mission: MissionType } | null;
    onClearInitialTarget: () => void;
    spacePlague: SpacePlagueState;
    colonies: Colony[];
    npcStates: NPCStates;
}

const FleetPanel: React.FC<FleetPanelProps> = (props) => {
    return <div>Fleet Panel Placeholder</div>;
};

export default FleetPanel;
