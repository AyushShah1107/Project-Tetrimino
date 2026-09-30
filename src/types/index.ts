export type AppState = 'ARCADE' | 'CHALLENGE' | 'VAULT' | 'PURGING';

export type VaultTab = 'MESSAGES' | 'VOICE' | 'CRYPTO_INSPECTOR' | 'SPECIFICATION';

export interface Contact {
  id: string;
  codename: string;
  status: 'online' | 'standby' | 'scrambled';
  role: string;
  avatarSeed: string;
  dhFingerprint: string;
  ratchetStep: number;
  lastActive: string;
  unreadCount: number;
  isLivePeer?: boolean;
  clientId?: string;
}

export interface EncryptedMessage {
  id: string;
  contactId: string;
  sender: 'me' | 'peer';
  senderCodename?: string;
  clientId?: string;
  plaintext: string;
  ciphertextHex: string;
  ivHex: string;
  timestamp: number;
  ttlSeconds: number; // default 86400 (24h)
  expiresAt: number;
  ratchetIndex: number;
  isBurned?: boolean;
}

export interface CryptoState {
  masterKeyHex: string;
  saltHex: string;
  kdfType: 'Argon2id';
  argonMemoryMb: number;
  argonIterations: number;
  argonParallelism: number;
  rootKeyFingerprint: string;
  sendingChainKeyHex: string;
  receivingChainKeyHex: string;
  ratchetStep: number;
  volatileRamUnlocked: boolean;
  sqlCipherActive: boolean;
  lastPurgeTimestamp?: number;
}

export interface VoiceChannelState {
  inCall: boolean;
  activePeer: Contact | null;
  isMuted: boolean;
  tamperSimulation: boolean; // triggers pseudo-random noise scramble engine
  antiRecordingGuard: boolean; // simulates OS flag secure / screen blanking
  callDurationSeconds: number;
  packetTamperDetected: boolean;
  carrierFreq: number;
}
