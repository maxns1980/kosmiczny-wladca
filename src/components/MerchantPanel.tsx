
import React from 'react';
import { MerchantState, Resources } from '../types';

interface MerchantPanelProps {
    merchantState: MerchantState;
    resources: Resources;
    credits: number;
    maxResources: Resources;
    onTrade: (resource: keyof Resources, amount: number, type: 'buy' | 'sell') => void;
}

export const MerchantPanel: React.FC<MerchantPanelProps> = (props) => {
    return <div>Merchant Panel Placeholder</div>;
};
