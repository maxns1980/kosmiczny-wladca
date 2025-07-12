
import React from 'react';
import { AncientArtifactChoice } from '../types';

interface AncientArtifactModalProps {
    onChoice: (choice: AncientArtifactChoice) => void;
}

const AncientArtifactModal: React.FC<AncientArtifactModalProps> = ({ onChoice }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-gray-800 border-2 border-purple-600 rounded-xl p-8 max-w-lg w-full text-center shadow-2xl">
                <h2 className="text-2xl font-bold text-purple-400 mb-4">Odkryto Starożytny Artefakt!</h2>
                <p className="text-gray-300 mb-6">Twoja ekipa badawcza natrafiła na tajemniczy obiekt nieznanego pochodzenia. Emanuje on potężną energią. Co chcesz z nim zrobić?</p>
                <div className="flex justify-around gap-4">
                    <button 
                        onClick={() => onChoice(AncientArtifactChoice.STUDY)}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg"
                    >
                        Zbadaj
                    </button>
                    <button 
                        onClick={() => onChoice(AncientArtifactChoice.SELL)}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg"
                    >
                        Sprzedaj
                    </button>
                     <button 
                        onClick={() => onChoice(AncientArtifactChoice.IGNORE)}
                        className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded-lg"
                    >
                        Zignoruj
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AncientArtifactModal;
