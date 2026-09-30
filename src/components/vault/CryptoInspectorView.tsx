import React from 'react';
import { Cpu, ShieldCheck, Database, GitCommit, Layers, RefreshCw, Key, Lock } from 'lucide-react';
import { CryptoState } from '../../types';

interface CryptoInspectorViewProps {
  cryptoState: CryptoState | null;
}

export const CryptoInspectorView: React.FC<CryptoInspectorViewProps> = ({ cryptoState }) => {
  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] max-w-5xl mx-auto w-full p-4 md:p-6 overflow-y-auto space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-slate-800">
        <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
          <span>CRYPTOGRAPHIC FOUNDATION & SECURITY MODEL</span>
          <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-mono">
            SECTION 2 COMPLIANT
          </span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Signal Protocol Double Ratchet · Argon2id Memory-Hard KDF · SQLCipher AES-256-XTS in Volatile RAM
        </p>
      </div>

      {/* Top Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Double Ratchet */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                DOUBLE RATCHET (SIGNAL)
              </span>
              <GitCommit className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Ratchet State:</span>
                <span className="text-white font-mono font-bold">Step #{cryptoState?.ratchetStep || 1}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Forward Secrecy:</span>
                <span className="text-emerald-400 font-mono">PFS Enforced</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Post-Break Security:</span>
                <span className="text-emerald-400 font-mono">Active</span>
              </div>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-4 pt-3 border-t border-slate-800/80">
            Combines Symmetric Key Ratchet and Diffie-Hellman Ratchet on every message turn.
          </p>
        </div>

        {/* Card 2: Argon2id KDF */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                KDF (ARGON2ID)
              </span>
              <Cpu className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Memory Cost (m):</span>
                <span className="text-white font-mono">{cryptoState?.argonMemoryMb || 64} MB</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Time Cost (t):</span>
                <span className="text-white font-mono">{cryptoState?.argonIterations || 4} Iterations</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Parallelism (p):</span>
                <span className="text-white font-mono">{cryptoState?.argonParallelism || 4} Threads</span>
              </div>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-4 pt-3 border-t border-slate-800/80">
            Memory-hard parameters specifically configured to neutralize GPU/ASIC brute-force clusters.
          </p>
        </div>

        {/* Card 3: Volatile RAM Storage */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                SQLCIPHER & RAM STATE
              </span>
              <Database className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Cipher Algorithm:</span>
                <span className="text-white font-mono">AES-256-XTS</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Key Residency:</span>
                <span className="text-emerald-400 font-mono">Non-swappable RAM</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Disk Persistence:</span>
                <span className="text-slate-400 font-mono">Zero Plaintext</span>
              </div>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-4 pt-3 border-t border-slate-800/80">
            Keys reside strictly in volatile memory. Power loss or purge triggers instant unrecoverable loss.
          </p>
        </div>
      </div>

      {/* Visual Hardware Architecture & Detailed Keys */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Hardware Module Artwork & Steganographic Architecture */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-lg flex flex-col">
          <div className="h-44 relative overflow-hidden bg-slate-950">
            <img
              src="/src/assets/images/stealth_transceiver_chip_1790515782148.jpg"
              alt="Hardware Cryptographic Module"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover opacity-75"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
            <div className="absolute bottom-3 left-4 right-4">
              <span className="text-xs font-bold text-white font-mono block">
                HARDWARE-BACKED COVERT ARCHITECTURE
              </span>
              <span className="text-[11px] text-slate-400">
                Obfuscated payload: .tetris_assets.cache disguised as game assets
              </span>
            </div>
          </div>

          <div className="p-5 flex-1 space-y-3 text-xs text-slate-300">
            <p className="leading-relaxed">
              The encrypted database payload is encapsulated on disk as generic binary assets. No plaintext headers, SQLite magic bytes, or Signal protocol identifiers ever touch persistent disk storage.
            </p>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 font-mono text-[11px] space-y-1">
              <div className="text-slate-500 flex justify-between">
                <span>Disk Cache Asset:</span>
                <span className="text-cyan-400">.tetris_assets.cache</span>
              </div>
              <div className="text-slate-500 flex justify-between">
                <span>Entropy Score:</span>
                <span className="text-slate-300">7.9998 (Pseudo-Random)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Cryptographic Registers */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Key className="w-4 h-4 text-cyan-400" />
                <span>ACTIVE VOLATILE REGISTERS</span>
              </h3>
              <span className="text-[10px] text-emerald-400 font-mono">LIVE VOLATILE RAM</span>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block mb-1">ROOT KEY FINGERPRINT</span>
                <span className="text-cyan-400 font-bold select-all">
                  {cryptoState?.rootKeyFingerprint || '7A9F0D22B481C099'}
                </span>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block mb-1">SENDING CHAIN KEY (KDF_CK)</span>
                <span className="text-slate-300 select-all truncate block">
                  {cryptoState?.sendingChainKeyHex || 'e914bf68903c...'}
                </span>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block mb-1">RECEIVING CHAIN KEY (KDF_CK)</span>
                <span className="text-slate-300 select-all truncate block">
                  {cryptoState?.receivingChainKeyHex || '2b881fc0491a...'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span>RAM Allocation: Protected Heap</span>
            <span className="text-emerald-400">Non-Paged Pool</span>
          </div>
        </div>
      </div>
    </div>
  );
};
