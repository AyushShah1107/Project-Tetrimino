import React, { useState, useEffect, useCallback } from 'react';
import { AppState, VaultTab, CryptoState } from './types';
import { TetrisGame } from './components/arcade/TetrisGame';
import { DisguisedModal } from './components/arcade/DisguisedModal';
import { VaultHeader } from './components/vault/VaultHeader';
import { MessengerView } from './components/vault/MessengerView';
import { VoiceChannelView } from './components/vault/VoiceChannelView';
import { CryptoInspectorView } from './components/vault/CryptoInspectorView';
import { SpecificationView } from './components/vault/SpecificationView';
import { PurgeModal } from './components/vault/PurgeModal';
import { CoverGuideModal } from './components/common/CoverGuideModal';
import { cryptoEngine } from './services/crypto';
import { storageService } from './services/storage';
import { audioService } from './services/audio';

export default function App() {
  const [appState, setAppState] = useState<AppState>('ARCADE');
  const [activeTab, setActiveTab] = useState<VaultTab>('MESSAGES');
  const [cryptoState, setCryptoState] = useState<CryptoState | null>(null);
  const [ratchetStep, setRatchetStep] = useState<number>(1);
  const [showBriefing, setShowBriefing] = useState<boolean>(false);
  const [showPurgeModal, setShowPurgeModal] = useState<boolean>(false);

  // Handle successful passkey authentication (Transition from State A -> State B)
  const handleAuthenticationSuccess = async (passkey: string) => {
    try {
      const derivedState = await cryptoEngine.deriveMasterKey(passkey);
      setCryptoState(derivedState);
      setRatchetStep(derivedState.ratchetStep);

      // Initialize storage with AES-GCM encrypted messages
      await storageService.initializeWithKey();

      setAppState('VAULT');
    } catch (err) {
      console.error('KDF derivation failed:', err);
      setAppState('ARCADE');
    }
  };

  // Instant Stealth Cover Mode (Drop straight to State A without data loss)
  const handleReturnToArcade = useCallback(() => {
    audioService.stopVoiceChannel();
    setAppState('ARCADE');
  }, []);

  // Panic Purge Trigger (Section 3: DoD 5220.22-M Wipe)
  const handleTriggerPurge = () => {
    audioService.stopVoiceChannel();
    setShowPurgeModal(true);
  };

  const handlePurgeComplete = () => {
    audioService.stopVoiceChannel();
    setShowPurgeModal(false);
    setCryptoState(null);
    setRatchetStep(1);
    setActiveTab('MESSAGES');
    setAppState('ARCADE');
  };

  // Remote purge listener: if any connected peer initiates emergency purge, wipe locally
  useEffect(() => {
    const unsub = storageService.onRemotePurge(() => {
      handlePurgeComplete();
    });
    return () => {
      unsub();
    };
  }, []);

  // Keyboard shortcut listener for instant stealth cover (Escape key)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && appState === 'VAULT') {
        handleReturnToArcade();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [appState, handleReturnToArcade]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative select-none">
      {/* State A: Arcade Shell (Default Game Engine) */}
      {appState === 'ARCADE' && (
        <TetrisGame
          onTriggerChallenge={() => setAppState('CHALLENGE')}
          onOpenBriefing={() => setShowBriefing(true)}
        />
      )}

      {/* Disguised Password Challenge Modal (13-second hardware countdown) */}
      {appState === 'CHALLENGE' && (
        <DisguisedModal
          onSuccess={handleAuthenticationSuccess}
          onCancel={() => setAppState('ARCADE')}
          onPanic={handleTriggerPurge}
        />
      )}

      {/* State B: Secure Vault (Decrypted Database / Messenger Mode) */}
      {appState === 'VAULT' && (
        <div className="flex-1 flex flex-col min-h-screen">
          <VaultHeader
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onReturnToArcade={handleReturnToArcade}
            onTriggerPurge={handleTriggerPurge}
            ratchetStep={ratchetStep}
          />

          <main className="flex-1 flex flex-col">
            {activeTab === 'MESSAGES' && (
              <MessengerView
                onRatchetAdvance={step => setRatchetStep(step)}
              />
            )}

            {activeTab === 'VOICE' && <VoiceChannelView />}

            {activeTab === 'CRYPTO_INSPECTOR' && (
              <CryptoInspectorView cryptoState={cryptoState} />
            )}

            {activeTab === 'SPECIFICATION' && <SpecificationView />}
          </main>
        </div>
      )}

      {/* Panic & Self-Destruct Purge Modal */}
      {showPurgeModal && (
        <PurgeModal
          onPurgeComplete={handlePurgeComplete}
          onCancel={() => setShowPurgeModal(false)}
        />
      )}

      {/* Architectural Briefing Modal */}
      {showBriefing && (
        <CoverGuideModal
          onClose={() => setShowBriefing(false)}
          onOpenChallenge={() => {
            setShowBriefing(false);
            setAppState('CHALLENGE');
          }}
        />
      )}
    </div>
  );
}
