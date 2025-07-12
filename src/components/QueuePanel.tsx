
import React, { useState, useEffect } from 'react';
import { QueueItem } from '../types';
import { ALL_GAME_OBJECTS } from '../constants';

interface QueuePanelProps {
    queue: QueueItem[];
    queueCapacity: number;
}

const formatTime = (seconds: number) => {
    if (seconds < 0) return "00:00:00";
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
};

const QueueItemDisplay: React.FC<{ item: QueueItem }> = ({ item }) => {
    const [timeLeft, setTimeLeft] = useState(0);

    useEffect(() => {
        const update = () => {
            const now = Date.now();
            const newTimeLeft = Math.round((item.endTime - now) / 1000);
            setTimeLeft(newTimeLeft);
        };
        update();
        const interval = setInterval(update, 1000);
        return () => clearInterval(interval);
    }, [item.endTime]);

    const objectInfo = ALL_GAME_OBJECTS[item.id as keyof typeof ALL_GAME_OBJECTS];
    const progress = Math.max(0, 100 - (timeLeft / item.buildTime) * 100);

    return (
        <div className="bg-gray-800 p-3 rounded-lg border border-gray-700 text-sm">
            <div>
                <span className="font-bold text-cyan-400">{objectInfo.name}</span>
                <span className="text-gray-400"> ({item.type === 'ship' || item.type === 'defense' ? `x${item.levelOrAmount}` : `poz. ${item.levelOrAmount}`})</span>
            </div>
            <div className="text-lg font-mono my-1">{formatTime(timeLeft)}</div>
            <div className="w-full bg-gray-600 rounded-full h-2.5">
                <div className="bg-green-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
            </div>
        </div>
    );
};


const QueuePanel: React.FC<QueuePanelProps> = ({ queue, queueCapacity }) => {
    if (queue.length === 0) {
        return null;
    }
    const buildingQueue = queue.filter(q => ['building', 'research', 'ship_upgrade'].includes(q.type));
    const shipyardQueue = queue.filter(q => ['ship', 'defense'].includes(q.type));

    return (
        <div className="mt-4 p-4 bg-black bg-opacity-40 rounded-lg">
            <h3 className="text-xl font-bold mb-4 text-cyan-300">Aktywność</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <h4 className="font-semibold mb-2">Budowa / Badania ({buildingQueue.length}/{queueCapacity})</h4>
                    <div className="space-y-2">
                        {buildingQueue.length > 0 ? buildingQueue.map(item => <QueueItemDisplay key={item.startTime} item={item} />) : <p className="text-gray-500">Brak aktywności.</p>}
                    </div>
                </div>
                 <div>
                    <h4 className="font-semibold mb-2">Stocznia ({shipyardQueue.length}/{queueCapacity})</h4>
                    <div className="space-y-2">
                        {shipyardQueue.length > 0 ? shipyardQueue.map(item => <QueueItemDisplay key={item.startTime} item={item} />) : <p className="text-gray-500">Brak aktywności.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QueuePanel;
