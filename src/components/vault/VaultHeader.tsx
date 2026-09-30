import React, { useState, useEffect } from 'react';
import { EyeOff, AlertOctagon, Terminal, Radio, Users } from 'lucide-react';
import { VaultTab } from '../../types';
import { networkService, PeerInfo } from '../../services/network';

interface VaultHeaderProps {
  activeTab: VaultTab;
  onTabChange: (tab: VaultTab) => void;
  onReturnToArcade: () => void;
  onTriggerPurge: () => void;
  ratchetStep: number;
}

export const VaultHeader: React.FC<VaultHeaderProps> = ({
  activeTab,
  onTabChange,
  onReturnToArcade,
  onTriggerPurge,
  ratchetStep
}) => {
  const [isConnected, setIsConnected] = useState<boolean>(networkService.getIsConnected());
  const [peerCount, setPeerCount] = useState<number>(networkService.getPeers().length);

  useEffect(() => {
    const unsubConn = networkService.on('connection_change', (connected: boolean) => {
      setIsConnected(connected);
    });
    const unsubPeers = networkService.on('peers_update', (peers: PeerInfo[]) => {
      setPeerCount(peers.length);
    });

    return () => {
      unsubConn();
      unsubPeers();
    };
  }, []);
  return (
    <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        {/* Zone 1: Single text wordmark with status text */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <span className="text-sm font-bold tracking-tight text-white font-mono">
              PROJECT TETRIMINO
            </span>
          </div>
          <span className="text-slate-600 text-xs hidden sm:inline" aria-hidden="true">·</span>
          <span className="text-xs text-slate-400 font-mono hidden sm:inline">
            STATE B: SECURE VAULT
          </span>
          <span className="text-slate-600 text-xs hidden md:inline" aria-hidden="true">·</span>
          <div className="hidden md:flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[11px] font-mono">
            <Users className="w-3 h-3 text-cyan-400" />
            <span className="text-slate-300">
              {peerCount > 1 ? `${peerCount} NODES ONLINE` : '1 NODE ONLINE'}
            </span>
          </div>
          <span className="text-slate-600 text-xs hidden lg:inline" aria-hidden="true">·</span>
          <span className="text-xs text-cyan-400/90 font-mono hidden lg:inline">
            RATCHET STEP: #{ratchetStep}
          </span>
        </div>

        {/* Zone 2: Navigation Links (Clean typography, no pill badges) */}
        <nav className="hidden lg:flex items-center gap-6 text-xs font-medium">
          <button
            onClick={() => onTabChange('MESSAGES')}
            className={`transition-colors py-1 ${
              activeTab === 'MESSAGES'
                ? 'text-cyan-400 border-b-2 border-cyan-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Encrypted Messenger
          </button>
          <button
            onClick={() => onTabChange('VOICE')}
            className={`transition-colors py-1 ${
              activeTab === 'VOICE'
                ? 'text-cyan-400 border-b-2 border-cyan-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Secure Voice (ZRTP)
          </button>
          <button
            onClick={() => onTabChange('CRYPTO_INSPECTOR')}
            className={`transition-colors py-1 ${
              activeTab === 'CRYPTO_INSPECTOR'
                ? 'text-cyan-400 border-b-2 border-cyan-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Crypto Engine & Ratchet
          </button>
          <button
            onClick={() => onTabChange('SPECIFICATION')}
            className={`transition-colors py-1 ${
              activeTab === 'SPECIFICATION'
                ? 'text-cyan-400 border-b-2 border-cyan-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            System Specs
          </button>
        </nav>

        {/* Zone 3: Primary Actions (Cover Mode & Panic Trigger) */}
        <div className="flex items-center gap-2.5">
          {/* Quick Stealth Cover Switch */}
          <button
            onClick={onReturnToArcade}
            className="py-1.5 px-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-lg text-xs font-medium text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors whitespace-nowrap"
            title="Instant Cover Mode: Return to Tetris Arcade without wiping data (Hotkey: ESC)"
          >
            <EyeOff className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Cover Mode</span>
            <span className="text-[10px] text-slate-500 font-mono">[ESC]</span>
          </button>

          {/* Panic & Self-Destruct Button */}
          <button
            onClick={onTriggerPurge}
            className="py-1.5 px-3 bg-red-950/80 hover:bg-red-900 border border-red-700/60 hover:border-red-500 text-red-200 hover:text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm whitespace-nowrap"
            title="DoD 5220.22-M Multi-pass Purge Sequence: Wipes RAM keys, databases, and ratchet sessions"
          >
            <AlertOctagon className="w-3.5 h-3.5 text-red-400" />
            <span>Panic Purge</span>
          </button>
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="lg:hidden flex items-center justify-around border-t border-slate-900 bg-slate-950 px-2 py-2 text-xs">
        <button
          onClick={() => onTabChange('MESSAGES')}
          className={`px-2 py-1 rounded transition-colors ${
            activeTab === 'MESSAGES' ? 'text-cyan-400 font-semibold bg-slate-900' : 'text-slate-400'
          }`}
        >
          Messenger
        </button>
        <button
          onClick={() => onTabChange('VOICE')}
          className={`px-2 py-1 rounded transition-colors ${
            activeTab === 'VOICE' ? 'text-cyan-400 font-semibold bg-slate-900' : 'text-slate-400'
          }`}
        >
          Voice (ZRTP)
        </button>
        <button
          onClick={() => onTabChange('CRYPTO_INSPECTOR')}
          className={`px-2 py-1 rounded transition-colors ${
            activeTab === 'CRYPTO_INSPECTOR' ? 'text-cyan-400 font-semibold bg-slate-900' : 'text-slate-400'
          }`}
        >
          Crypto
        </button>
        <button
          onClick={() => onTabChange('SPECIFICATION')}
          className={`px-2 py-1 rounded transition-colors ${
            activeTab === 'SPECIFICATION' ? 'text-cyan-400 font-semibold bg-slate-900' : 'text-slate-400'
          }`}
        >
          Specs
        </button>
      </div>
    </header>
  );
};
