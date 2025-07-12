
import React from 'react';
import { MissionType, NPCStates, DebrisField, Colony } from '../types';

interface GalaxyPanelProps {
    onAction: (coords: string, mission: MissionType) => void;
    npcStates: NPCStates;
    onNpcUpdate: () => void;
    onNpcMissionLaunch: () => void;
    debrisFields: Record<string, DebrisField>;
    colonies: Colony[];
}

const GalaxyPanel: React.FC<GalaxyPanelProps> = (props) => {
    return <div>Galaxy Panel Placeholder</div>;
};

export default GalaxyPanel;
