
import { Boost, BoostType } from './types';

export const formatNumber = (num: number): string => {
    if (num === undefined || num === null) return '0';
    return Math.floor(num).toLocaleString('pl-PL');
};

export const getBoostNameForNotif = (boost: Omit<Boost, 'id' | 'duration'>) => {
    switch(boost.type) {
        case BoostType.EXTRA_BUILD_QUEUE: return `Dodatkowa kolejka budowy (${boost.level})`;
        case BoostType.RESOURCE_PRODUCTION_BOOST: return `Produkcja +${boost.level}%`;
        case BoostType.COMBAT_TECH_BOOST: return `Kalibracja Broni Polowej (+${boost.level}%)`;
        case BoostType.ARMOR_TECH_BOOST: return `Wzmocnienie Pancerza (+${boost.level}%)`;
        case BoostType.DRIVE_TECH_BOOST: return `Dopalacz napędu (+${boost.level}%)`;
        case BoostType.CONSTRUCTION_COST_REDUCTION: return `Zniżka na budowę/badania (-${boost.level}%)`;
        default: return 'Nieznany bonus';
    }
}
