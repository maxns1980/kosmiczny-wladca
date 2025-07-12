
import React from 'react';
import { Inventory, Boost } from '../types';
import { getBoostNameForNotif } from '../utils/helpers';

interface InventoryModalProps {
    inventory: Inventory;
    onActivateBoost: (boostId: string) => void;
    onClose: () => void;
}

const InventoryModal: React.FC<InventoryModalProps> = ({ inventory, onActivateBoost, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 border border-cyan-700 rounded-lg p-6 max-w-2xl w-full text-left shadow-2xl relative max-h-[90vh] flex flex-col">
                <h2 className="text-2xl font-bold text-cyan-400 mb-4">Ekwipunek</h2>
                
                <div className="flex-grow overflow-y-auto pr-2 space-y-3">
                    {inventory.boosts.length > 0 ? inventory.boosts.map((boost: Boost) => (
                        <div key={boost.id} className="bg-gray-900 p-4 rounded-lg flex items-center justify-between">
                            <div>
                                <h4 className="font-bold text-lg text-yellow-400">{getBoostNameForNotif(boost)}</h4>
                                <p className="text-sm text-gray-400">Czas trwania: {boost.duration / 60} minut</p>
                            </div>
                            <button 
                                onClick={() => onActivateBoost(boost.id)}
                                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md"
                            >
                                Aktywuj
                            </button>
                        </div>
                    )) : (
                        <p className="text-gray-500">Twój ekwipunek jest pusty.</p>
                    )}
                </div>

                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 bg-red-600 hover:bg-red-700 text-white font-bold w-8 h-8 rounded-full"
                >
                    X
                </button>
            </div>
        </div>
    );
};

export default InventoryModal;