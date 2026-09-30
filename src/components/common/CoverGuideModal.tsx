import React from 'react';
import { X, Shield, Key, Eye, Flame, Radio, Sparkles } from 'lucide-react';

interface CoverGuideModalProps {
  onClose: () => void;
  onOpenChallenge: () => void;
}

export const CoverGuideModal: React.FC<CoverGuideModalProps> = ({ onClose, onOpenChallenge }) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-800/60 flex items-center justify-center text-cyan-400">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                PROJECT TETRIMINO · OPERATOR BRIEFING
              </h3>
              <span className="text-[11px] text-slate-400">
                Steganographic E2EE Messaging & Self-Destruct Protocols
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto text-xs text-slate-300">
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800/80 space-y-2">
            <span className="font-bold text-white font-mono flex items-center gap-2">
              <Key className="w-3.5 h-3.5 text-cyan-400" />
              <span>ACCESS CREDENTIALS & TRIGGERS</span>
            </span>
            <div className="space-y-1 font-mono text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-400">Master Passkey:</span>
                <span className="text-cyan-400 font-bold">CIPHER-77</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Steganographic Trigger:</span>
                <span className="text-emerald-400 font-bold">Clear 1 Line or Hotkey [`]</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Duress PIN (Silent Wipe):</span>
                <span className="text-red-400 font-bold">0000</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Emergency Cover Mode:</span>
                <span className="text-slate-300 font-bold">ESC Key</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-white uppercase text-[11px] tracking-wider">
              KEY ARCHITECTURAL HIGHLIGHTS
            </h4>

            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5">
                <Eye className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="font-semibold text-white block">Dual-State Isolation (Section 1)</span>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  State A is a genuine, playable retro arcade Tetris game. The covert encrypted payload (.tetris_assets.cache) is undetectable without the memory-hard Argon2id key.
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                <Shield className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="font-semibold text-white block">Signal Double Ratchet & Ephemeral TTL (Sec 2 & 4)</span>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Provides Perfect Forward Secrecy (PFS). All messages carry an immutable 24-hour TTL with continuous automatic background purging.
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                <Radio className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="font-semibold text-white block">Voice Interruption & Scramble Engine (Section 5)</span>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  If SRTP packet validation fails due to active network inspection or MitM tampering, the decoder routes pseudo-random noise / scrambled spectral audio instead of silence.
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-red-400 shrink-0 mt-0.5">
                <Flame className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="font-semibold text-white block">DoD 5220.22-M Multi-Pass Purge (Section 3)</span>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  13-second hardware countdown triggers a 3-pass overwrite (0x00, 0xFF, CSPRNG random bytes), wipes RAM keys, and resets to pristine cold boot.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition-colors"
          >
            Close Guide
          </button>
          <button
            onClick={() => {
              onClose();
              onOpenChallenge();
            }}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-lg shadow-cyan-950/50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Launch Passkey Challenge</span>
          </button>
        </div>
      </div>
    </div>
  );
};
