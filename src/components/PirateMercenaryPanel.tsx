
import React from 'react';
import { PirateMercenaryState } from '../types';

interface PirateMercenaryPanelProps {
    pirateState: PirateMercenaryState;
    credits: number;
    onHire: () => void;
}

const PirateMercenaryPanel: React.FC<PirateMercenaryPanelProps> = (props) => {
    return <div>Pirate Mercenary Panel Placeholder</div>;
};

export default PirateMercenaryPanel;
