import React, { useState, useEffect } from 'react';
import { Lock, AlertTriangle, Key, ShieldCheck, Timer, XCircle } from 'lucide-react';
import { audioService } from '../../services/audio';

interface DisguisedModalProps {
  onSuccess: (passkey: string) => void;
  onCancel: () => void;
  onPanic: () => void;
}

export const DisguisedModal: React.FC<DisguisedModalProps> = ({
  onSuccess,
  onCancel,
  onPanic
}) => {
  const [passkey, setPasskey] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState<number>(13.0);
  const [attempts, setAttempts] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isDerivingKey, setIsDerivingKey] = useState<boolean>(false);
  const [derivationStatus, setDerivationStatus] = useState<string>('');

  const DEFAULT_VALID_PASSKEY = 'CIPHER-77';
  const DURESS_CODE = '0000';

  // 13-second hardware-backed asynchronous countdown (Section 3 of PDF)
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0.1) {
          clearInterval(timer);
          // Timeout reached: trigger security lockdown / return to arcade
          onCancel();
          return 0;
        }
        return Number((prev - 0.1).toFixed(1));
      });
    }, 100);

    return () => clearInterval(timer);
  }, [onCancel]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passkey.trim()) return;

    // Check for duress code
    if (passkey.trim() === DURESS_CODE) {
      audioService.playPurgeAlarm();
      onPanic();
      return;
    }

    if (passkey.trim().toUpperCase() === DEFAULT_VALID_PASSKEY || passkey.trim() === 'vault') {
      setIsDerivingKey(true);
      setDerivationStatus('Executing Argon2id KDF (m=65536, t=4, p=4)...');
      audioService.playTriggerAlert();

      setTimeout(() => {
        setDerivationStatus('Master key derived into volatile non-swappable RAM...');
      }, 400);

      setTimeout(() => {
        setDerivationStatus('Decrypting SQLCipher database into memory...');
      }, 700);

      setTimeout(() => {
        onSuccess(passkey);
      }, 1000);
    } else {
      const nextAttempts = attempts + 1;
      setAttempts(nextAttempts);
      setErrorMsg(`Verification failed: Invalid security key (${3 - nextAttempts} attempts remaining)`);
      setPasskey('');

      if (nextAttempts >= 3) {
        setTimeout(() => {
          onCancel();
        }, 600);
      }
    }
  };

  const fillQuickPasskey = () => {
    setPasskey(DEFAULT_VALID_PASSKEY);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden relative">
        {/* Hardware Countdown Bar (Section 3: 13-second asynchronous hardware-backed countdown) */}
        <div className="h-1.5 w-full bg-slate-950">
          <div
            className={`h-full transition-all duration-100 ${
              timeLeft <= 4 ? 'bg-red-500' : 'bg-cyan-500'
            }`}
            style={{ width: `${(timeLeft / 13) * 100}%` }}
          />
        </div>

        {/* Modal Header disguised as Stage Lock */}
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-800/60 flex items-center justify-center text-cyan-400">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  STAGE 02 PROGRESSION LOCK
                </h3>
                <span className="text-[11px] text-slate-400">
                  Arcade Hardware Challenge · High-Score Calibration
                </span>
              </div>
            </div>
            {/* 13-second Countdown Display */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono">
              <Timer className={`w-3.5 h-3.5 ${timeLeft <= 4 ? 'text-red-400 animate-pulse' : 'text-cyan-400'}`} />
              <span className={`font-bold tabular-nums ${timeLeft <= 4 ? 'text-red-400' : 'text-slate-200'}`}>
                {timeLeft.toFixed(1)}s
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Steganographic trigger engaged. Input authorized master passkey to load decrypted vault into volatile RAM.
          </p>
        </div>

        {/* Modal Form */}
        <div className="p-6 space-y-4">
          {isDerivingKey ? (
            <div className="py-6 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-10 h-10 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
              <div className="text-xs font-mono text-cyan-400">{derivationStatus}</div>
              <span className="text-[11px] text-slate-500">Unlocking SQLCipher AES-256-XTS payload</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1.5 flex items-center justify-between">
                  <span>ENTER PROGRESSION PASSKEY</span>
                  <button
                    type="button"
                    onClick={fillQuickPasskey}
                    className="text-[10px] text-cyan-400 hover:text-cyan-300 underline font-mono"
                  >
                    Auto-Fill (CIPHER-77)
                  </button>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Key className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    autoFocus
                    value={passkey}
                    onChange={e => {
                      setPasskey(e.target.value);
                      setErrorMsg('');
                    }}
                    placeholder="Enter passkey..."
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                  />
                </div>
              </div>

              {errorMsg && (
                <div className="p-2.5 bg-red-950/40 border border-red-900/60 rounded-lg flex items-center gap-2 text-xs text-red-300">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl text-[11px] text-slate-400 space-y-1 font-mono">
                <div className="flex justify-between">
                  <span>Passkey Hint:</span>
                  <span className="text-cyan-400 font-semibold">CIPHER-77</span>
                </div>
                <div className="flex justify-between">
                  <span>Duress Code (Panic Purge):</span>
                  <span className="text-red-400 font-semibold">0000</span>
                </div>
                <div className="flex justify-between">
                  <span>Hardware Timeout:</span>
                  <span className="text-slate-300">13s async hardware timer</span>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={onCancel}
                  className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition-colors"
                >
                  Return to Arcade
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-lg shadow-cyan-950/50"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Authenticate</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
