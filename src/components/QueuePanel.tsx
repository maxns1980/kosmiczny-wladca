
import React from 'react';
import { QueueItem } from '../types';

interface QueuePanelProps {
    queue: QueueItem[];
    queueCapacity: number;
}

const QueuePanel: React.FC<QueuePanelProps> = (props) => {
    return <div>Queue Panel Placeholder</div>;
};

export default QueuePanel;
