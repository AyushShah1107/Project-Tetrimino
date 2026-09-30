class AudioService {
  private ctx: AudioContext | null = null;
  private soundEnabled: boolean = true;
  private voiceGain: GainNode | null = null;
  private voiceOscillator: OscillatorNode | null = null;
  private voiceModulator: OscillatorNode | null = null;
  private noiseNode: AudioBufferSourceNode | null = null;
  private noiseGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private micStream: MediaStream | null = null;
  private micSource: MediaStreamAudioSourceNode | null = null;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
  }

  public isSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  // --- Arcade SFX ---

  public playRotate() {
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(480, this.ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.08);
  }

  public playMove() {
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(180, this.ctx.currentTime);

    gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.005, this.ctx.currentTime + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.04);
  }

  public playDrop() {
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(45, this.ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.12);
  }

  public playLineClear() {
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const startTime = this.ctx.currentTime + idx * 0.07;

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.15, startTime);
      gain.gain.exponentialRampToValueAtTime(0.005, startTime + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.18);
    });
  }

  public playTriggerAlert() {
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    // Covert activation sequence tone
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, this.ctx.currentTime);
    osc.frequency.setValueAtTime(1174.66, this.ctx.currentTime + 0.1);
    osc.frequency.setValueAtTime(1760, this.ctx.currentTime + 0.2);

    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.35);
  }

  public playPurgeAlarm() {
    this.initContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(300, this.ctx.currentTime + 0.25);

    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.25);
  }

  // --- Voice Channel & Spectral Scrambler Engine ---

  public startVoiceChannel(useMic: boolean = false): AnalyserNode | null {
    this.initContext();
    if (!this.ctx) return null;

    this.stopVoiceChannel();

    // Create central Analyser
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 128;
    this.analyser.smoothingTimeConstant = 0.8;

    this.voiceGain = this.ctx.createGain();
    this.voiceGain.gain.setValueAtTime(0.18, this.ctx.currentTime);

    if (useMic && navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then((stream) => {
          if (!this.ctx) return;
          this.micStream = stream;
          this.micSource = this.ctx.createMediaStreamSource(stream);
          this.micSource.connect(this.analyser!);
          this.analyser!.connect(this.voiceGain!);
          this.voiceGain!.connect(this.ctx.destination);
        })
        .catch(() => {
          this.setupSyntheticVoiceCarrier();
        });
    } else {
      this.setupSyntheticVoiceCarrier();
    }

    return this.analyser;
  }

  private setupSyntheticVoiceCarrier() {
    if (!this.ctx || !this.analyser || !this.voiceGain) return;

    // Carrier oscillator + formant modulation
    this.voiceOscillator = this.ctx.createOscillator();
    this.voiceModulator = this.ctx.createOscillator();
    const modGain = this.ctx.createGain();

    this.voiceOscillator.type = 'sine';
    this.voiceOscillator.frequency.setValueAtTime(220, this.ctx.currentTime);

    this.voiceModulator.type = 'sawtooth';
    this.voiceModulator.frequency.setValueAtTime(4, this.ctx.currentTime); // 4Hz cadence
    modGain.gain.setValueAtTime(40, this.ctx.currentTime);

    this.voiceModulator.connect(modGain);
    modGain.connect(this.voiceOscillator.frequency);

    this.voiceOscillator.connect(this.analyser);
    this.analyser.connect(this.voiceGain);
    this.voiceGain.connect(this.ctx.destination);

    this.voiceOscillator.start();
    this.voiceModulator.start();
  }

  private ringOsc: OscillatorNode | null = null;
  private ringGain: GainNode | null = null;

  // Interruption & Scramble Engine (PDF Sec 5):
  // Routes pseudo-random noise / scrambled spectral output instead of dropping call
  public setScrambled(scramble: boolean) {
    if (!this.ctx || !this.analyser) return;

    if (scramble) {
      // Mute clean carrier
      if (this.voiceGain) {
        this.voiceGain.gain.setValueAtTime(0, this.ctx.currentTime);
      }

      // Stop previous ring/noise if any
      if (this.ringOsc) {
        try { this.ringOsc.stop(); } catch { /* ignore */ }
        this.ringOsc.disconnect();
        this.ringOsc = null;
      }
      if (this.noiseNode) {
        try { this.noiseNode.stop(); } catch { /* ignore */ }
        this.noiseNode.disconnect();
        this.noiseNode = null;
      }

      // Generate pseudo-random white/pink noise buffer
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        // Pink noise filter
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        output[i] = (b0 + b1 + b2 + white * 0.1) * 0.3;
      }

      this.noiseNode = this.ctx.createBufferSource();
      this.noiseNode.buffer = noiseBuffer;
      this.noiseNode.loop = true;

      this.noiseGain = this.ctx.createGain();
      this.noiseGain.gain.setValueAtTime(0.15, this.ctx.currentTime);

      // Ring modulator for harsh scrambled spectral effect
      this.ringOsc = this.ctx.createOscillator();
      this.ringOsc.type = 'sawtooth';
      this.ringOsc.frequency.setValueAtTime(1420, this.ctx.currentTime);
      this.ringGain = this.ctx.createGain();
      this.ringGain.gain.setValueAtTime(0.4, this.ctx.currentTime);
      this.ringOsc.connect(this.ringGain.gain);

      this.noiseNode.connect(this.ringGain);
      this.ringGain.connect(this.analyser);
      this.analyser.connect(this.noiseGain);
      this.noiseGain.connect(this.ctx.destination);

      this.ringOsc.start();
      this.noiseNode.start();
    } else {
      // Restore clean
      if (this.ringOsc) {
        try { this.ringOsc.stop(); } catch { /* ignore */ }
        this.ringOsc.disconnect();
        this.ringOsc = null;
      }
      if (this.noiseNode) {
        try { this.noiseNode.stop(); } catch { /* ignore */ }
        this.noiseNode.disconnect();
        this.noiseNode = null;
      }
      if (this.noiseGain) {
        this.noiseGain.gain.setValueAtTime(0, this.ctx.currentTime);
      }
      if (this.voiceGain) {
        this.voiceGain.gain.setValueAtTime(0.18, this.ctx.currentTime);
      }
    }
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  public stopVoiceChannel() {
    if (this.ringOsc) {
      try { this.ringOsc.stop(); } catch { /* ignore */ }
      this.ringOsc.disconnect();
      this.ringOsc = null;
    }
    if (this.ringGain) {
      this.ringGain.disconnect();
      this.ringGain = null;
    }
    if (this.voiceOscillator) {
      try { this.voiceOscillator.stop(); } catch { /* ignore */ }
      this.voiceOscillator.disconnect();
      this.voiceOscillator = null;
    }
    if (this.voiceModulator) {
      try { this.voiceModulator.stop(); } catch { /* ignore */ }
      this.voiceModulator.disconnect();
      this.voiceModulator = null;
    }
    if (this.noiseNode) {
      try { this.noiseNode.stop(); } catch { /* ignore */ }
      this.noiseNode.disconnect();
      this.noiseNode = null;
    }
    if (this.voiceGain) {
      try { this.voiceGain.gain.setValueAtTime(0, this.ctx?.currentTime || 0); } catch { /* ignore */ }
      this.voiceGain.disconnect();
      this.voiceGain = null;
    }
    if (this.noiseGain) {
      try { this.noiseGain.gain.setValueAtTime(0, this.ctx?.currentTime || 0); } catch { /* ignore */ }
      this.noiseGain.disconnect();
      this.noiseGain = null;
    }
    if (this.micStream) {
      this.micStream.getTracks().forEach(t => t.stop());
      this.micStream = null;
    }
  }

  public stopAllAudio() {
    this.stopVoiceChannel();
    if (this.ctx && this.ctx.state !== 'closed') {
      try {
        this.ctx.suspend();
      } catch {
        /* ignore */
      }
    }
  }
}

export const audioService = new AudioService();
