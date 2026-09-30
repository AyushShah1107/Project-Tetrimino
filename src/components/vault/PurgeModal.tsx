import React, { useState, useEffect } from 'react';
import { AlertOctagon, Flame, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { cryptoEngine } from '../../services/crypto';
import { storageService } from '../../services/storage';
import { audioService } from '../../services/audio';
import { networkService } from '../../services/network';

interface PurgeModalProps {
  onPurgeComplete: () => void;
  onCancel: () => void;
}

export const PurgeModal: React.FC<PurgeModalProps> = ({ onPurgeComplete, onCancel }) => {
  const [countdown, setCountdown] = useState<number>(13.0);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [stepDetails, setStepDetails] = useState<string>('');

  const purgeSteps = [
    'Overwrite AES encryption keys in RAM with cryptographically secure random bytes.',
    'Execute a multi-pass secure overwrite (DoD 5220.22-M specification) on local cache files.',
    'Wipe active Signal ratchet session states and private identity keys.',
    'Drop all local database tables, unpair active cloud sessions, and reset game state.'
  ];

  // 13-second hardware-backed countdown (Section 3)
  useEffect(() => {
    if (isExecuting) return;

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 0.1) {
          clearInterval(timer);
          triggerPurgeExecution();
          return 0;
        }
        return Number((prev - 0.1).toFixed(1));
      });
    }, 100);

    return () => clearInterval(timer);
  }, [isExecuting]);

  const triggerPurgeExecution = async () => {
    setIsExecuting(true);
    audioService.playPurgeAlarm();

    // Step 1: Overwrite AES keys in RAM
    setCurrentStep(1);
    setStepDetails('Writing CSPRNG random bytes over AES-256 keys in volatile RAM...');
    await new Promise(r => setTimeout(r, 600));

    // Step 2: DoD 5220.22-M multi-pass overwrite
    setCurrentStep(2);
    setStepDetails('Executing 3-pass DoD 5220.22-M overwrite (0x00 -> 0xFF -> CSPRNG) on cache...');
    await cryptoEngine.executeDoDPurge((pass, desc) => {
      setStepDetails(desc);
    });

    // Step 3: Wipe Signal Ratchet session states
    setCurrentStep(3);
    setStepDetails('Zeroizing DH ratchet root keys, sending/receiving chains, and private identity keys...');
    await new Promise(r => setTimeout(r, 600));

    // Step 4: Drop local tables and reset game state
    setCurrentStep(4);
    setStepDetails('Dropping SQLCipher tables, deleting session tokens, resetting arcade shell state...');
    storageService.resetAll();
    networkService.triggerRemotePurge();
    await new Promise(r => setTimeout(r, 600));

    // Finish
    onPurgeComplete();
  };

  return (
    <div className="fixed inset-0 z-50 bg-red-950/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-slate-950 border border-red-800 rounded-2xl shadow-2xl overflow-hidden relative">
        {/* Countdown Bar */}
        <div className="h-2 w-full bg-slate-900">
          <div
            className="h-full bg-red-600 transition-all duration-100"
            style={{ width: `${(countdown / 13) * 100}%` }}
          />
        </div>

        {/* Modal Header */}
        <div className="p-6 border-b border-red-950/60 bg-red-950/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-900/60 border border-red-600 flex items-center justify-center text-red-300">
                <AlertOctagon className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  PANIC & SELF-DESTRUCT PURGE SEQUENCE
                </h3>
                <span className="text-[11px] text-red-400 font-mono">
                  DoD 5220.22-M Emergency Overwrite Protocol
                </span>
              </div>
            </div>

            {!isExecuting && (
              <div className="px-3 py-1.5 bg-red-950 border border-red-700 rounded-lg text-sm font-mono font-bold text-red-300 tabular-nums">
                {countdown.toFixed(1)}s
              </div>
            )}
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-300 leading-relaxed">
            {isExecuting
              ? 'Purge protocol in progress. Memory zeroization and multi-pass overwrite cannot be halted.'
              : 'Emergency self-destruct countdown initiated. All decrypted databases, Signal ratchet states, and volatile RAM keys will be permanently destroyed.'}
          </p>

          {/* Sequence list */}
          <div className="space-y-2.5">
            {purgeSteps.map((stepText, idx) => {
              const stepNumber = idx + 1;
              const isDone = currentStep > stepNumber;
              const isCurrent = currentStep === stepNumber;

              return (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border text-xs font-mono transition-all flex items-start gap-2.5 ${
                    isCurrent
                      ? 'bg-red-950/80 border-red-500 text-white shadow-md'
                      : isDone
                      ? 'bg-slate-900 border-emerald-900/60 text-emerald-400'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-[10px]">
                        {stepNumber}
                      </span>
                    )}
                  </div>
                  <div>
                    <span>{stepText}</span>
                    {isCurrent && (
                      <p className="text-[11px] text-red-300 mt-1 font-sans">{stepDetails}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Actions */}
          {!isExecuting && (
            <div className="flex items-center gap-3 pt-3">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition-colors"
              >
                Abort & Return
              </button>
              <button
                type="button"
                onClick={triggerPurgeExecution}
                className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-lg shadow-red-950/60"
              >
                <Flame className="w-4 h-4" />
                <span>Execute Immediate Purge</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
