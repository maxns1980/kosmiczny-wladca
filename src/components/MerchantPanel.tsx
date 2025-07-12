
import React, { useState } from 'react';
import { MerchantState, Resources } from '../types';
import { formatNumber } from '../utils/helpers';

interface MerchantPanelProps {
    merchantState: MerchantState;
    resources: Resources;
    credits: number;
    maxResources: Resources;
    onTrade: (resource: keyof Resources, amount: number, type: 'buy' | 'sell') => void;
}

const TradeRow: React.FC<{
    resourceName: keyof Resources;
    icon: string;
    resourceAmount: number;
    maxResource: number;
    credits: number;
    rates: { buy: number; sell: number };
    onTrade: (resource: keyof Resources, amount: number, type: 'buy' | 'sell') => void;
}> = ({ resourceName, icon, resourceAmount, maxResource, credits, rates, onTrade }) => {
    const [amount, setAmount] = useState(1);
    const costToBuy = Math.ceil(amount * rates.buy);
    const gainFromSell = Math.floor(amount * rates.sell);

    const canBuy = credits >= costToBuy;
    const canSell = resourceAmount >= amount;
    
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center bg-gray-700 p-4 rounded-lg">
            <div className="text-xl font-bold">{icon} {resourceName.charAt(0).toUpperCase() + resourceName.slice(1)}</div>
            
            <div className="flex items-center gap-2">
                 <input
                    type="number"
                    value={amount}
                    onChange={e => setAmount(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-full bg-gray-900 text-white text-center rounded-md border border-gray-600 p-2"
                />
            </div>
            
            <div className="grid grid-cols-2 gap-2">
                 <button onClick={() => onTrade(resourceName, amount, 'buy')} disabled={!canBuy} className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 p-2 rounded-md">
                    Kup za {formatNumber(costToBuy)} 💰
                </button>
                <button onClick={() => onTrade(resourceName, amount, 'sell')} disabled={!canSell} className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 p-2 rounded-md">
                    Sprzedaj za {formatNumber(gainFromSell)} 💰
                </button>
            </div>
        </div>
    );
}

export const MerchantPanel: React.FC<MerchantPanelProps> = ({ merchantState, resources, credits, maxResources, onTrade }) => {
    return (
        <div className="bg-gray-800 bg-opacity-60 p-6 rounded-lg border border-gray-700">
            <h3 className="text-2xl font-bold text-cyan-400 mb-4">Wędrowny Kupiec</h3>
            <p className="mb-6 text-gray-400">Kupiec oferuje swoje towary po okazyjnych cenach. Pospiesz się, nie będzie czekał wiecznie!</p>

            <div className="space-y-4">
                <TradeRow resourceName="metal" icon="🔩" resourceAmount={resources.metal} maxResource={maxResources.metal} credits={credits} rates={merchantState.rates.metal} onTrade={onTrade} />
                <TradeRow resourceName="crystal" icon="💎" resourceAmount={resources.crystal} maxResource={maxResources.crystal} credits={credits} rates={merchantState.rates.crystal} onTrade={onTrade} />
                <TradeRow resourceName="deuterium" icon="💧" resourceAmount={resources.deuterium} maxResource={maxResources.deuterium} credits={credits} rates={merchantState.rates.deuterium} onTrade={onTrade} />
            </div>
        </div>
    );
};