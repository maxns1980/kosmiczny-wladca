
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { GameState, GlobalState, View, MissionType, Resources, AncientArtifactChoice, MerchantStatus } from './types';
import Header from './components/Header';
import BuildingsPanel from './components/BuildingsPanel';
import ResearchPanel from './components/ResearchPanel';
import ShipyardPanel from './components/ShipyardPanel';
import DefensePanel from './components/DefensePanel';
import FleetPanel from './components/FleetPanel';
import MessagesPanel from './components/MessagesPanel';
import { MerchantPanel } from './components/MerchantPanel';
import Navigation from './components/Navigation';
import QueuePanel from './components/QueuePanel';
import GalaxyPanel from './components/GalaxyPanel';
import FleetUpgradesPanel from './components/FleetUpgradesPanel';
import PirateMercenaryPanel from './components/PirateMercenaryPanel';
import AncientArtifactModal from './components/AncientArtifactModal';
import InfoModal from './components/InfoModal';
import EncyclopediaModal from './components/EncyclopediaModal';
import InventoryModal from './components/InventoryModal';
import Auth from './Auth';
import { calculateProductions, calculateMaxResources } from './utils/calculations';

const TOKEN_KEY = 'cosmic-lord-token';

interface FullState {
    playerState: GameState;
    worldState: GlobalState;
}

const initialProductions = {
    metal: 0, crystal: 0, deuterium: 0,
    energy: { produced: 0, consumed: 0, efficiency: 1 }
};
const initialMaxResources = { metal: 0, crystal: 0, deuterium: 0 };


function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem(TOKEN_KEY));
  const [fullState, setFullState] = useState<FullState | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<View>('buildings');
  const [fleetTarget, setFleetTarget] = useState<{coords: string, mission: MissionType} | null>(null);

  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isEncyclopediaOpen, setIsEncyclopediaOpen] = useState(false);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  
  const showNotification = useCallback((message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 4000);
  }, []);

  const fetchGameState = useCallback(async (authToken: string) => {
    try {
      const response = await fetch('/api/game', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (response.ok) {
        const data = await response.json();
        setFullState({ playerState: data.playerState, worldState: data.worldState });
        if (data.notifications && data.notifications.length > 0) {
          data.notifications.forEach((notif: string) => showNotification(notif));
        }
      } else {
        handleLogout();
      }
    } catch (error) {
      console.error('Failed to fetch game state:', error);
      showNotification('Błąd połączenia z serwerem.');
    }
  }, [showNotification]);
  
  const sendAction = useCallback(async (type: string, payload: any) => {
    if (!token) return;
    try {
      const response = await fetch('/api/game', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ type, payload })
      });
      if (response.ok) {
        const data = await response.json();
        setFullState({ playerState: data.playerState, worldState: data.worldState });
         if (data.notifications && data.notifications.length > 0) {
          data.notifications.forEach((notif: string) => showNotification(notif));
        }
      } else {
        const errorData = await response.json();
        showNotification(errorData.error || 'Akcja nie powiodła się.');
      }
    } catch (error) {
       console.error('Action failed:', error);
       showNotification('Błąd połączenia z serwerem.');
    }
  }, [token, showNotification]);

  useEffect(() => {
    if (token) {
      fetchGameState(token);
      const interval = setInterval(() => fetchGameState(token), 10000);
      return () => clearInterval(interval);
    }
  }, [token, fetchGameState]);

  const handleLogin = (newToken: string, username: string) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    setToken(newToken);
    showNotification(`Witaj, ${username}!`);
  };

  const handleLogout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setFullState(null);
  }, []);

  const productions = useMemo(() => {
    if (!fullState) return initialProductions;
    const { buildings, resourceVeinBonus, colonies, activeBoosts } = fullState.playerState;
    return calculateProductions(buildings, resourceVeinBonus, colonies, activeBoosts);
  }, [fullState]);

  const maxResources = useMemo(() => {
    if (!fullState) return initialMaxResources;
    return calculateMaxResources(fullState.playerState.buildings);
  }, [fullState?.playerState.buildings]);

  const handleActionFromGalaxy = useCallback((targetCoords: string, missionType: MissionType) => {
    setFleetTarget({ coords: targetCoords, mission: missionType });
    setActiveView('fleet');
  }, []);

  if (!token) {
    return <Auth onLogin={handleLogin} />;
  }

  if (!fullState) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white text-2xl">
        Ładowanie danych z serwera...
      </div>
    );
  }
  
  const { playerState, worldState } = fullState;
  const { resources, buildings, research, shipLevels, fleet, defenses, fleetMissions, npcFleetMissions, messages, buildQueue, credits, merchantState, pirateMercenaryState, ancientArtifactState, inventory, activeBoosts, colonies, spacePlague, homePlanet } = playerState;
  const { npcStates, debrisFields, playerPlanets } = worldState;

  return (
    <div className="min-h-screen bg-gray-900 bg-cover bg-center bg-fixed" style={{backgroundImage: "url('https://picsum.photos/seed/galaxy/1920/1080')"}}>
      {isInfoModalOpen && <InfoModal onClose={() => setIsInfoModalOpen(false)} />}
      {isEncyclopediaOpen && <EncyclopediaModal onClose={() => setIsEncyclopediaOpen(false)} />}
      {isInventoryOpen && <InventoryModal inventory={inventory} onActivateBoost={(boostId) => sendAction('ACTIVATE_BOOST', { boostId })} onClose={() => setIsInventoryOpen(false)} />}
      {ancientArtifactState.status === 'AWAITING_CHOICE' && (
        <AncientArtifactModal onChoice={(choice) => sendAction('ARTIFACT_CHOICE', { choice })} />
      )}
      <div className="min-h-screen bg-black bg-opacity-70 backdrop-blur-sm">
        <Header 
            resources={resources} 
            productions={productions} 
            maxResources={maxResources}
            credits={credits}
            blackMarketHourlyIncome={playerState.blackMarketHourlyIncome} 
            resourceVeinBonus={playerState.resourceVeinBonus} 
            inventory={inventory}
            activeBoosts={activeBoosts}
            onInfoClick={() => setIsInfoModalOpen(true)}
            onEncyclopediaClick={() => setIsEncyclopediaOpen(true)}
            onInventoryClick={() => setIsInventoryOpen(true)}
            npcFleetMissions={npcFleetMissions}
        />
        <PirateMercenaryPanel pirateState={pirateMercenaryState} credits={credits} onHire={() => sendAction('HIRE_PIRATES', {})} />
        <main className="container mx-auto p-4 md:p-8">
            <Navigation 
                activeView={activeView} 
                setActiveView={setActiveView} 
                unreadMessagesCount={messages.filter(m => !m.isRead).length}
                merchantState={merchantState}
                onLogout={handleLogout}
            />
            {notification && (
                <div className="fixed top-24 left-1/2 -translate-x-1/2 bg-blue-900 border border-blue-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-pulse">
                    {notification}
                </div>
            )}
            
            <QueuePanel queue={buildQueue} queueCapacity={activeBoosts.EXTRA_BUILD_QUEUE?.level || 1} />

            <div className="mt-6">
                {activeView === 'buildings' && <BuildingsPanel buildings={buildings} research={research} resources={resources} onUpgrade={(type) => sendAction('ADD_TO_QUEUE', { id: type, type: 'building' })} buildQueue={buildQueue} energyEfficiency={productions.energy.efficiency} />}
                {activeView === 'research' && <ResearchPanel buildings={buildings} research={research} resources={resources} onUpgrade={(type) => sendAction('ADD_TO_QUEUE', { id: type, type: 'research' })} buildQueue={buildQueue} />}
                {activeView === 'fleet_upgrades' && <FleetUpgradesPanel buildings={buildings} research={research} shipLevels={shipLevels} resources={resources} onUpgrade={(type) => sendAction('ADD_TO_QUEUE', { id: type, type: 'ship_upgrade' })} buildQueue={buildQueue} />}
                {activeView === 'shipyard' && <ShipyardPanel buildings={buildings} research={research} resources={resources} onBuild={(type, amount) => sendAction('ADD_TO_QUEUE', { id: type, type: 'ship', amount })} buildQueue={buildQueue} fleet={fleet} />}
                {activeView === 'defense' && <DefensePanel buildings={buildings} research={research} resources={resources} onBuild={(type, amount) => sendAction('ADD_TO_QUEUE', { id: type, type: 'defense', amount })} buildQueue={buildQueue} defenses={defenses} />}
                {activeView === 'fleet' && <FleetPanel homePlanet={homePlanet} fleet={fleet} fleetMissions={fleetMissions} onSendFleet={(...args) => sendAction('SEND_FLEET', { missionFleet: args[0], targetCoords: args[1], missionType: args[2] })} research={research} initialTarget={fleetTarget} onClearInitialTarget={() => setFleetTarget(null)} spacePlague={spacePlague} colonies={colonies} npcStates={npcStates} playerPlanets={playerPlanets} />}
                {activeView === 'galaxy' && <GalaxyPanel username={playerState.username} homePlanet={homePlanet} onAction={handleActionFromGalaxy} npcStates={npcStates} debrisFields={debrisFields} colonies={colonies} playerPlanets={playerPlanets} />}
                {activeView === 'messages' && <MessagesPanel messages={messages} onRead={(id) => sendAction('MARK_MESSAGE_READ', { id })} onDelete={(id) => sendAction('DELETE_MESSAGE', { id })} onDeleteAll={() => sendAction('DELETE_ALL_MESSAGES', {})} />}
                {activeView === 'merchant' && merchantState.status === MerchantStatus.ACTIVE && <MerchantPanel merchantState={merchantState} resources={resources} credits={credits} maxResources={maxResources} onTrade={(...args) => sendAction('TRADE_MERCHANT', { resource: args[0], amount: args[1], tradeType: args[2] })} />}
            </div>
           <footer className="text-center text-gray-500 mt-12 pb-4">
              <p>Kosmiczny Władca ({playerState.username}) - Gra na serwerze Netlify</p>
           </footer>
        </main>
      </div>
    </div>
  );
}

export default App;
