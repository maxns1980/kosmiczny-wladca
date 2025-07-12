
import React from 'react';
import { View, MerchantState } from '../types';

interface NavigationProps {
    activeView: View;
    setActiveView: (view: View) => void;
    unreadMessagesCount: number;
    merchantState: MerchantState;
    onLogout: () => void;
}

const Navigation: React.FC<NavigationProps> = (props) => {
    return <div>Navigation Placeholder</div>;
};

export default Navigation;
