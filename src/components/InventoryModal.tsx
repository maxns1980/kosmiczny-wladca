
import React from 'react';
import { Inventory } from '../types';

interface InventoryModalProps {
    inventory: Inventory;
    onActivateBoost: (boostId: string) => void;
    onClose: () => void;
}

const InventoryModal: React.FC<InventoryModalProps> = (props) => {
    return <div>Inventory Modal Placeholder</div>;
};

export default InventoryModal;
