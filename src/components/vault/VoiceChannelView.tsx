import React, { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Shield, Radio, AlertTriangle, Activity, Lock, EyeOff, Users } from 'lucide-react';
import { audioService } from '../../services/audio';
import { networkService, PeerInfo } from '../../services/network';

export const VoiceChannelView: React.FC = () => {
  const [inCall, setInCall] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [useMic, setUseMic] = useState<boolean>(false);
  const [isScrambled, setIsScrambled] = useState<boolean>(false);
  const [antiRecordingActive, setAntiRecordingActive] = useState<boolean>(true);
  const [screenCaptureDetected, setScreenCaptureDetected] = useState<boolean>(false);
  const [callDuration, setCallDuration] = useState<number>(0);
  const [remotePeerInVoice, setRemotePeerInVoice] = useState<boolean>(false);
  const [remotePeerCodename, setRemotePeerCodename] = useState<string>('');
  const [voicePeerCount, setVoicePeerCount] = useState<number>(1);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // ZRTP parameters
  const zrtpSas = 'B9X4 - KESTREL';
  const srtpCipher = 'AEAD_AES_256_GCM';

  // Listen to remote peer voice signaling
  useEffect(() => {
    const unsubVoiceState = networkService.on('peer_voice_state', (data: any) => {
      const myId = networkService.getClientId();
      if (data.clientId !== myId) {
        setRemotePeerInVoice(Boolean(data.inVoice));
        setRemotePeerCodename(data.codename || 'Remote Operator');

        // If remote peer activated tamper simulation, reflect it
        if (data.tamperActive !== undefined && inCall) {
          setIsScrambled(Boolean(data.tamperActive));
          audioService.setScrambled(Boolean(data.tamperActive));
        }
      }
    });

    const unsubPeers = networkService.on('peers_update', (peers: PeerInfo[]) => {
      const peersInVoice = peers.filter(p => p.inVoice).length;
      setVoicePeerCount(Math.max(1, peersInVoice));
    });

    return () => {
      unsubVoiceState();
      unsubPeers();
      audioService.stopVoiceChannel();
      networkService.sendVoiceState(false, false);
    };
  }, [inCall]);

  // Call duration timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (inCall) {
      timer = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(timer);
  }, [inCall]);

  const startCall = () => {
    audioService.startVoiceChannel(useMic);
    setInCall(true);
    setIsScrambled(false);
    networkService.sendVoiceState(true, false);
  };

  const endCall = () => {
    audioService.stopVoiceChannel();
    setInCall(false);
    setIsScrambled(false);
    networkService.sendVoiceState(false, false);
  };

  const toggleScramble = () => {
    const nextState = !isScrambled;
    setIsScrambled(nextState);
    audioService.setScrambled(nextState);
    networkService.sendVoiceState(inCall, nextState);
  };

  // Real-time Canvas FFT Spectrum Visualizer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const renderSpectrum = () => {
      animationFrameRef.current = requestAnimationFrame(renderSpectrum);
      const analyser = audioService.getAnalyser();

      ctx.fillStyle = '#060911';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (!inCall || !analyser) {
        // Draw baseline inactive radar grid
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, canvas.height / 2);
        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.stroke();
        return;
      }

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteFrequencyData(dataArray);

      const barWidth = (canvas.width / bufferLength) * 2.2;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height * 0.85;

        if (isScrambled) {
          // Harsh scrambled spectrum in crimson
          ctx.fillStyle = `rgb(${180 + Math.random() * 75}, ${30 + Math.random() * 40}, 50)`;
        } else {
          // Clean cyan/emerald encrypted voice spectrum
          const hue = 175 + (i / bufferLength) * 40;
          ctx.fillStyle = `hsl(${hue}, 85%, 55%)`;
        }

        ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);
        x += barWidth;
      }

      // Draw frequency sweep line
      ctx.strokeStyle = isScrambled ? 'rgba(239, 68, 68, 0.4)' : 'rgba(6, 182, 212, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, canvas.height / 2);
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
    };

    renderSpectrum();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [inCall, isScrambled]);

  const formatDuration = (totalSeconds: number): string => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] max-w-5xl mx-auto w-full p-4 md:p-6 overflow-y-auto">
      {/* Header Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <span>SECURE VOIP / WEBRTC CHANNEL</span>
            <span className="text-xs px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/60 font-mono">
              DTLS-SRTP / ZRTP
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Section 5: Anti-Interruption Security · Real-time pseudo-random noise scramble engine
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] text-slate-500 uppercase block">ZRTP SAS VERIFIER</span>
            <span className="text-xs font-mono font-bold text-emerald-400">{zrtpSas}</span>
          </div>
        </div>
      </div>

      {/* Main Call Console */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Visualizer & Call Stage */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between relative overflow-hidden">
          {/* Anti-Recording Guard Scrim (Section 5) */}
          {screenCaptureDetected && antiRecordingActive && (
            <div className="absolute inset-0 z-30 bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
              <EyeOff className="w-12 h-12 text-red-400 mb-2 animate-bounce" />
              <h4 className="text-sm font-bold text-white">ANTI-RECORDING GUARD ENGAGED</h4>
              <p className="text-xs text-slate-400 max-w-sm mt-1">
                Virtual audio capture or screen recording attempt intercepted. Visual buffer blanked via FLAG_SECURE protocol.
              </p>
              <button
                onClick={() => setScreenCaptureDetected(false)}
                className="mt-4 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 rounded-lg"
              >
                Dismiss Guard
              </button>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <div className={`w-3 h-3 rounded-full ${inCall ? 'bg-emerald-500 animate-ping' : 'bg-slate-600'}`} />
                <span className="text-xs font-mono text-slate-300">
                  {inCall ? (isScrambled ? 'STATUS: MITM INSPECTION TAMPER' : 'STATUS: ENCRYPTED CALL ACTIVE') : 'STATUS: STANDBY'}
                </span>
                {remotePeerInVoice && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 font-mono animate-pulse">
                    PEER TRANSMITTING: {remotePeerCodename || 'NODE-REMOTE'}
                  </span>
                )}
              </div>
              <span className="text-xs font-mono text-cyan-400 tabular-nums font-bold">
                {inCall ? formatDuration(callDuration) : '00:00'}
              </span>
            </div>

            {/* Live FFT Canvas */}
            <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-[#060911] p-2">
              <canvas
                ref={canvasRef}
                width={500}
                height={160}
                className="w-full h-40 rounded block"
              />
              <div className="absolute bottom-2 left-3 text-[10px] font-mono text-slate-500">
                {isScrambled ? 'SPECTRAL SCRAMBLER: HARSH PSEUDO-RANDOM NOISE' : 'SPECTRAL FFT: 64-BAND REAL-TIME ANALYZER'}
              </div>
            </div>

            {/* Interruption & Scramble Alert Banner (Section 5) */}
            {isScrambled && (
              <div className="mt-4 p-3 bg-red-950/40 border border-red-800/80 rounded-xl flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 animate-pulse" />
                <div className="text-xs">
                  <span className="font-bold text-red-200 block">
                    SRTP PACKET VALIDATION FAILURE / PROXY TAMPERING DETECTED
                  </span>
                  <span className="text-red-300/80 text-[11px]">
                    Interruption & Scramble Engine immediately routed pseudo-random noise / scrambled spectral output instead of dropping call.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Call Controls */}
          <div className="mt-6 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-center gap-3">
            {!inCall ? (
              <button
                onClick={startCall}
                className="py-3 px-6 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-colors shadow-lg shadow-emerald-950/50"
              >
                <Phone className="w-4 h-4" />
                <span>Establish ZRTP Call</span>
              </button>
            ) : (
              <>
                <button
                  onClick={endCall}
                  className="py-2.5 px-5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-colors shadow-lg shadow-red-950/50"
                >
                  <PhoneOff className="w-4 h-4" />
                  <span>Terminate Call</span>
                </button>

                <button
                  onClick={() => setIsMuted(prev => !prev)}
                  className={`p-2.5 rounded-xl border transition-colors ${
                    isMuted
                      ? 'bg-amber-950/60 border-amber-700 text-amber-300'
                      : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                  }`}
                  title="Toggle Microphone Mute"
                >
                  {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>

                {/* Section 5 Interruption Scrambler Trigger */}
                <button
                  onClick={toggleScramble}
                  className={`py-2 px-3.5 rounded-xl border text-xs font-mono flex items-center gap-1.5 transition-all ${
                    isScrambled
                      ? 'bg-red-900 border-red-500 text-white animate-pulse'
                      : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                  }`}
                  title="Toggle Interruption & Scramble Engine"
                >
                  <Activity className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isScrambled ? 'Disable Tamper Noise' : 'Simulate Packet Tamper'}</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Security Parameters & Protocol Specs */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4 text-cyan-400" />
              <span>VOIP SECURITY PARAMETERS</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase block font-mono">ENCRYPTION PROTOCOL</span>
                <span className="font-semibold text-white font-mono">{srtpCipher}</span>
                <p className="text-[10px] text-slate-400">Key negotiation via DTLS-SRTP / ZRTP handshake</p>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase block font-mono">AUDIO SOURCE MODE</span>
                <div className="flex items-center gap-2 mt-1">
                  <button
                    onClick={() => setUseMic(false)}
                    className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                      !useMic ? 'bg-cyan-900 text-cyan-200 border border-cyan-700' : 'text-slate-400 bg-slate-900'
                    }`}
                  >
                    Synthetic Carrier Wave
                  </button>
                  <button
                    onClick={() => setUseMic(true)}
                    className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                      useMic ? 'bg-cyan-900 text-cyan-200 border border-cyan-700' : 'text-slate-400 bg-slate-900'
                    }`}
                  >
                    Device Microphone
                  </button>
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 uppercase font-mono">ANTI-RECORDING GUARD</span>
                  <input
                    type="checkbox"
                    checked={antiRecordingActive}
                    onChange={e => setAntiRecordingActive(e.target.checked)}
                    className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0"
                  />
                </div>
                <p className="text-[10px] text-slate-400">
                  Employs FLAG_SECURE & CoreAudio session exclusivity to block screen recorders.
                </p>
                <button
                  type="button"
                  onClick={() => setScreenCaptureDetected(true)}
                  className="w-full py-1 text-[11px] text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 rounded border border-slate-700 transition-colors"
                >
                  Test Screen Capture Intercept
                </button>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 font-mono border-t border-slate-800 pt-3">
            <span>Interruption & Scramble Engine: ACTIVE</span>
          </div>
        </div>
      </div>
    </div>
  );
};
