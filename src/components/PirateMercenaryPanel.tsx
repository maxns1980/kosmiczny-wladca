
import React from 'react';
import { PirateMercenaryState, PirateMercenaryStatus } from '../types';
import { formatNumber } from '../utils/helpers';

interface PirateMercenaryPanelProps {
    pirateState: PirateMercenaryState;
    credits: number;
    onHire: () => void;
}

const PirateMercenaryPanel: React.FC<PirateMercenaryPanelProps> = ({ pirateState, credits, onHire }) => {
    if (pirateState.status !== PirateMercenaryStatus.AVAILABLE) {
        return null;
    }

    return (
        <div className="fixed bottom-4 right-4 bg-yellow-900 bg-opacity-90 border-2 border-yellow-600 text-white p-4 rounded-lg shadow-lg z-50 max-w-sm">
            <h4 className="text-lg font-bold text-yellow-300">Piraccy Najemnicy!</h4>
            <p className="text-sm my-2">Grupa najemników oferuje swoje usługi. Ich flota dołączy do twojej za odpowiednią opłatą.</p>
            <p className="font-semibold">Koszt: <span className="text-yellow-400">{formatNumber(pirateState.hireCost)} Kredytów</span></p>
            <button
                onClick={onHire}
                disabled={credits < pirateState.hireCost}
                className="w-full mt-3 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
                Zatrudnij
            </button>
        </div>
    );
};

export default PirateMercenaryPanel;