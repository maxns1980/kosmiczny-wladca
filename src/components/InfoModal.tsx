
import React from 'react';

interface InfoModalProps {
    onClose: () => void;
}

const InfoModal: React.FC<InfoModalProps> = ({ onClose }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 border border-cyan-700 rounded-lg p-6 max-w-2xl w-full text-left shadow-2xl relative max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold text-cyan-400 mb-4">Witaj w Kosmicznym Władcy!</h2>
                <p className="text-gray-300 mb-4">
                    Twoim celem jest dominacja w kosmosie. Rozwijaj swoje imperium, budując kopalnie, prowadząc badania i tworząc potężną flotę.
                </p>
                <h3 className="text-xl font-semibold text-cyan-300 mt-6 mb-2">Podstawy:</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-300">
                    <li><strong>Surowce:</strong> Metal, Kryształ i Deuter to podstawy Twojej gospodarki. Buduj kopalnie, aby zwiększyć ich produkcję.</li>
                    <li><strong>Energia:</strong> Większość budynków zużywa energię. Upewnij się, że masz jej nadwyżkę, budując elektrownie, inaczej produkcja spadnie.</li>
                    <li><strong>Badania:</strong> Laboratorium Badawcze odblokowuje nowe technologie, statki i budynki.</li>
                    <li><strong>Flota:</strong> W Stoczni budujesz statki do ataku, obrony, transportu i eksploracji.</li>
                    <li><strong>Obrona:</strong> Struktury obronne chronią Twoją planetę przed atakami wroga.</li>
                </ul>
                 <h3 className="text-xl font-semibold text-cyan-300 mt-6 mb-2">Misje:</h3>
                 <ul className="list-disc list-inside space-y-2 text-gray-300">
                    <li><strong>Atak:</strong> Wyślij flotę, aby zaatakować inną planetę i zrabować surowce.</li>
                    <li><strong>Szpieguj:</strong> Wyślij sondy, aby poznać skład floty i obrony przeciwnika.</li>
                    <li><strong>Kolonizuj:</strong> Załóż nową kolonię na pustej planecie, aby rozszerzyć swoje imperium.</li>
                    <li><strong>Ekspedycja:</strong> Wyślij flotę w nieznane. Możesz znaleźć surowce, kredyty, a nawet porzucone statki, ale ryzykujesz utratę floty.</li>
                </ul>
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

export default InfoModal;
