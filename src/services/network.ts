import { EncryptedMessage } from '../types';

export interface PeerInfo {
  clientId: string;
  codename: string;
  joinedAt: number;
  inVoice: boolean;
  tamperActive: boolean;
}

type EventCallback = (...args: any[]) => void;

class NetworkService {
  private ws: WebSocket | null = null;
  private clientId: string;
  private codename: string;
  private isConnected: boolean = false;
  private listeners: Map<string, Set<EventCallback>> = new Map();
  private reconnectTimer: any = null;
  private peers: PeerInfo[] = [];

  constructor() {
    // Generate or retrieve persistent local device ID
    let storedId = localStorage.getItem('tetris_vault_client_id');
    if (!storedId) {
      storedId = `node-${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem('tetris_vault_client_id', storedId);
    }
    this.clientId = storedId;

    let storedCodename = localStorage.getItem('tetris_vault_codename');
    if (!storedCodename) {
      const suffixes = ['Echo', 'Viper', 'Ghost', 'Vanguard', 'Spectre', 'Cipher'];
      const randName = suffixes[Math.floor(Math.random() * suffixes.length)];
      const randNum = Math.floor(10 + Math.random() * 89);
      storedCodename = `${randName}-${randNum}`;
      localStorage.setItem('tetris_vault_codename', storedCodename);
    }
    this.codename = storedCodename;
  }

  public getClientId(): string {
    return this.clientId;
  }

  public getCodename(): string {
    return this.codename;
  }

  public setCodename(name: string) {
    this.codename = name.trim() || this.codename;
    localStorage.setItem('tetris_vault_codename', this.codename);
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'PEER_HELLO',
        clientId: this.clientId,
        codename: this.codename
      }));
    }
  }

  public getPeers(): PeerInfo[] {
    return this.peers;
  }

  public getIsConnected(): boolean {
    return this.isConnected;
  }

  public connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      const isHttps = window.location.protocol === 'https:';
      const wsProtocol = isHttps ? 'wss:' : 'ws:';
      const wsUrl = `${wsProtocol}//${window.location.host}`;

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnected = true;
        this.emit('connection_change', true);

        // Register peer identity with server
        this.ws?.send(JSON.stringify({
          type: 'PEER_HELLO',
          clientId: this.clientId,
          codename: this.codename
        }));
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleIncoming(data);
        } catch (e) {
          console.error('[Network] Parse error:', e);
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.emit('connection_change', false);
        this.scheduleReconnect();
      };

      this.ws.onerror = (err) => {
        console.warn('[Network] WebSocket issue, reconnecting...', err);
        this.ws?.close();
      };
    } catch (err) {
      console.error('[Network] Failed to initiate WebSocket:', err);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 3000);
  }

  private handleIncoming(data: any) {
    switch (data.type) {
      case 'WELCOME':
        this.emit('welcome', data);
        break;

      case 'PEERS_UPDATE':
        this.peers = data.peers || [];
        this.emit('peers_update', this.peers);
        break;

      case 'NEW_MESSAGE':
        this.emit('new_message', data.message, data.senderClientId);
        break;

      case 'MESSAGE_BURNED':
        this.emit('message_burned', data.messageId);
        break;

      case 'PEER_VOICE_STATE':
        this.emit('peer_voice_state', data);
        break;

      case 'PEER_AUDIO_CHUNK':
        this.emit('peer_audio_chunk', data);
        break;

      case 'REMOTE_PURGE_EXECUTED':
        this.emit('remote_purge', data);
        break;

      case 'TTL_EXPIRED_PURGE':
        this.emit('ttl_purge');
        break;
    }
  }

  public sendMessage(message: EncryptedMessage & { senderCodename?: string; clientId?: string }) {
    const payload = {
      ...message,
      senderCodename: this.codename,
      clientId: this.clientId
    };

    // Send over WebSocket for instantaneous delivery (<15ms)
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'SEND_MESSAGE',
        message: payload
      }));
    }

    // Also persist via REST API for reliability
    fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(err => console.warn('[Network] REST fallback failed:', err));
  }

  public burnMessage(messageId: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'BURN_MESSAGE',
        messageId
      }));
    }

    fetch(`/api/messages/${messageId}/burn`, { method: 'POST' }).catch(() => {});
  }

  public sendVoiceState(inVoice: boolean, tamperActive: boolean, carrierFreq: number = 220) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'VOICE_STATE',
        inVoice,
        tamperActive,
        carrierFreq
      }));
    }
  }

  public sendAudioChunk(spectrum: number[]) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'VOICE_AUDIO_CHUNK',
        spectrum
      }));
    }
  }

  public triggerRemotePurge() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'TRIGGER_REMOTE_PURGE'
      }));
    }

    fetch('/api/purge', { method: 'POST' }).catch(() => {});
  }

  public async fetchServerMessages(contactId?: string): Promise<EncryptedMessage[]> {
    try {
      const url = contactId ? `/api/messages?contactId=${encodeURIComponent(contactId)}` : '/api/messages';
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.messages || [];
    } catch (e) {
      console.warn('[Network] Failed to fetch server messages:', e);
      return [];
    }
  }

  public on(event: string, callback: EventCallback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return () => this.off(event, callback);
  }

  public off(event: string, callback: EventCallback) {
    this.listeners.get(event)?.delete(callback);
  }

  private emit(event: string, ...args: any[]) {
    this.listeners.get(event)?.forEach(cb => {
      try {
        cb(...args);
      } catch (e) {
        console.error(`Error in event listener for ${event}:`, e);
      }
    });
  }
}

export const networkService = new NetworkService();
