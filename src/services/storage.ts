import { Contact, EncryptedMessage } from '../types';
import { cryptoEngine } from './crypto';
import { networkService, PeerInfo } from './network';

export const INITIAL_CONTACTS: Contact[] = [
  {
    id: 'vanguard-01',
    codename: 'Vanguard-01 (Broadcast Relay)',
    status: 'online',
    role: 'Primary Tactical Comms Channel',
    avatarSeed: 'V1',
    dhFingerprint: 'A49E:7F20:BB13:42DE',
    ratchetStep: 28,
    lastActive: 'Live',
    unreadCount: 0
  },
  {
    id: 'cipher-relay',
    codename: 'Cipher-Relay',
    status: 'online',
    role: 'Automated E2EE Node / Echo',
    avatarSeed: 'CR',
    dhFingerprint: '88B1:C934:FA02:11E6',
    ratchetStep: 14,
    lastActive: '2m ago',
    unreadCount: 0
  },
  {
    id: 'ghost-echo',
    codename: 'Ghost-Echo',
    status: 'standby',
    role: 'Encrypted Comms Hub',
    avatarSeed: 'GE',
    dhFingerprint: '33DC:005E:71B9:99F4',
    ratchetStep: 42,
    lastActive: '18m ago',
    unreadCount: 0
  }
];

export const INITIAL_MESSAGES: Omit<EncryptedMessage, 'ciphertextHex' | 'ivHex'>[] = [
  {
    id: 'msg-01',
    contactId: 'vanguard-01',
    sender: 'peer',
    senderCodename: 'Vanguard-01',
    plaintext: 'Arcade shell intact. Physical surveillance perimeter clear. Steganographic relay operational.',
    timestamp: Date.now() - 1000 * 60 * 35,
    ttlSeconds: 86400,
    expiresAt: Date.now() - 1000 * 60 * 35 + 86400 * 1000,
    ratchetIndex: 26
  },
  {
    id: 'msg-02',
    contactId: 'vanguard-01',
    sender: 'me',
    senderCodename: 'Operator-Local',
    plaintext: 'Relay established through Tetrimino steganographic trigger. Memory-hard Argon2id KDF passed.',
    timestamp: Date.now() - 1000 * 60 * 20,
    ttlSeconds: 86400,
    expiresAt: Date.now() - 1000 * 60 * 20 + 86400 * 1000,
    ratchetIndex: 27
  }
];

type MessageListener = (messages: EncryptedMessage[]) => void;
type ContactListener = (contacts: Contact[]) => void;
type PurgeListener = () => void;

class StorageService {
  private messages: EncryptedMessage[] = [];
  private contacts: Contact[] = [...INITIAL_CONTACTS];
  private isInitialized: boolean = false;
  private messageListeners: Set<MessageListener> = new Set();
  private contactListeners: Set<ContactListener> = new Set();
  private purgeListeners: Set<PurgeListener> = new Set();

  constructor() {
    this.setupNetworkListeners();
  }

  private setupNetworkListeners() {
    networkService.on('new_message', async (incoming: any, senderClientId?: string) => {
      // Idempotency: Guard against duplicates
      const exists = this.messages.some(m => m.id === incoming.id);
      if (exists) return;

      const myId = networkService.getClientId();
      const isFromMe = (incoming.clientId === myId) || (senderClientId === myId);

      let plaintext = incoming.plaintext;
      // If ciphertext exists and plaintext wasn't decrypted yet
      if (!plaintext && incoming.ciphertextHex && incoming.ivHex) {
        try {
          plaintext = await cryptoEngine.decryptMessage(incoming.ciphertextHex, incoming.ivHex);
        } catch (e) {
          plaintext = '[ENCRYPTED CIPHERTEXT - KEY MISMATCH]';
        }
      }

      const formatted: EncryptedMessage = {
        id: incoming.id,
        contactId: incoming.contactId || 'vanguard-01',
        sender: isFromMe ? 'me' : 'peer',
        senderCodename: incoming.senderCodename || (isFromMe ? networkService.getCodename() : 'Remote Operator'),
        clientId: incoming.clientId,
        plaintext: plaintext || '[ENCRYPTED PAYLOAD]',
        ciphertextHex: incoming.ciphertextHex || '',
        ivHex: incoming.ivHex || '',
        timestamp: incoming.timestamp || Date.now(),
        ttlSeconds: incoming.ttlSeconds || 86400,
        expiresAt: incoming.expiresAt || (Date.now() + 86400 * 1000),
        ratchetIndex: incoming.ratchetIndex || 1,
        isBurned: Boolean(incoming.isBurned)
      };

      this.messages.push(formatted);

      // Advance contact ratchet step
      const contact = this.contacts.find(c => c.id === formatted.contactId);
      if (contact) {
        contact.ratchetStep = Math.max(contact.ratchetStep, formatted.ratchetIndex);
        contact.lastActive = 'Just now';
        if (!isFromMe) {
          contact.unreadCount += 1;
        }
      }

      this.notifyMessageListeners();
      this.notifyContactListeners();
    });

    networkService.on('message_burned', (messageId: string) => {
      const msg = this.messages.find(m => m.id === messageId);
      if (msg) {
        msg.isBurned = true;
        msg.plaintext = '[PURGED - ZEROIZED]';
        msg.ciphertextHex = '';
        this.notifyMessageListeners();
      }
    });

    networkService.on('peers_update', (peers: PeerInfo[]) => {
      this.syncPeersToContacts(peers);
    });

    networkService.on('remote_purge', () => {
      this.resetAll();
      this.purgeListeners.forEach(cb => cb());
    });

    networkService.on('ttl_purge', () => {
      this.purgeExpiredMessages();
      this.notifyMessageListeners();
    });
  }

  private syncPeersToContacts(peers: PeerInfo[]) {
    const myId = networkService.getClientId();
    // Exclude myself from the remote peer list
    const remotePeers = peers.filter(p => p.clientId !== myId);

    // Keep base static contacts
    const baseContacts = this.contacts.filter(c => !c.isLivePeer);

    const livePeerContacts: Contact[] = remotePeers.map(p => ({
      id: `peer-${p.clientId}`,
      codename: `${p.codename} (Live Peer)`,
      status: p.tamperActive ? 'scrambled' : (p.inVoice ? 'online' : 'online'),
      role: `Remote Connected Device // ${p.inVoice ? 'In Voice' : 'Standby'}`,
      avatarSeed: p.codename.slice(0, 2).toUpperCase(),
      dhFingerprint: `NODE:${p.clientId.slice(-8).toUpperCase()}`,
      ratchetStep: 30,
      lastActive: 'Active Now',
      unreadCount: 0,
      isLivePeer: true,
      clientId: p.clientId
    }));

    this.contacts = [...baseContacts, ...livePeerContacts];
    this.notifyContactListeners();
  }

  public async initializeWithKey(): Promise<EncryptedMessage[]> {
    networkService.connect();

    // Fetch messages from server database
    const serverMsgs = await networkService.fetchServerMessages();

    if (serverMsgs.length > 0) {
      const myId = networkService.getClientId();
      this.messages = serverMsgs.map(m => ({
        ...m,
        sender: (m.clientId === myId) ? 'me' : (m.sender || 'peer')
      }));
    } else if (!this.isInitialized) {
      // Encrypt initial messages with Web Crypto AES-GCM
      const encrypted: EncryptedMessage[] = [];
      for (const msg of INITIAL_MESSAGES) {
        const encResult = await cryptoEngine.encryptMessage(msg.plaintext);
        encrypted.push({
          ...msg,
          ciphertextHex: encResult.ciphertextHex,
          ivHex: encResult.ivHex,
          ratchetIndex: encResult.ratchetIndex
        });
      }
      this.messages = encrypted;
    }

    this.isInitialized = true;
    this.notifyMessageListeners();
    return this.getActiveMessages();
  }

  // Local Auto-Deletion: Continuous purge of records past 24-hour mark (Section 4)
  public purgeExpiredMessages(): number {
    const now = Date.now();
    const initialCount = this.messages.length;
    this.messages = this.messages.filter(m => m.expiresAt > now && !m.isBurned);
    return initialCount - this.messages.length;
  }

  public getActiveMessages(contactId?: string): EncryptedMessage[] {
    this.purgeExpiredMessages();
    if (contactId) {
      return this.messages.filter(m => (m.contactId === contactId || contactId === 'vanguard-01') && !m.isBurned);
    }
    return this.messages.filter(m => !m.isBurned);
  }

  public async addMessage(
    contactId: string,
    sender: 'me' | 'peer',
    plaintext: string,
    customTtlSeconds: number = 86400
  ): Promise<EncryptedMessage> {
    const encResult = await cryptoEngine.encryptMessage(plaintext);
    const now = Date.now();

    const newMsg: EncryptedMessage = {
      id: `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      contactId,
      sender,
      senderCodename: networkService.getCodename(),
      clientId: networkService.getClientId(),
      plaintext,
      ciphertextHex: encResult.ciphertextHex,
      ivHex: encResult.ivHex,
      timestamp: now,
      ttlSeconds: customTtlSeconds,
      expiresAt: now + customTtlSeconds * 1000,
      ratchetIndex: encResult.ratchetIndex
    };

    this.messages.push(newMsg);

    // Update contact ratchet step
    const contact = this.contacts.find(c => c.id === contactId);
    if (contact) {
      contact.ratchetStep = encResult.ratchetIndex;
      contact.lastActive = 'Just now';
    }

    this.notifyMessageListeners();
    this.notifyContactListeners();

    // Broadcast across all connected devices & persist in server database
    networkService.sendMessage(newMsg);

    return newMsg;
  }

  public burnMessage(messageId: string): void {
    const msg = this.messages.find(m => m.id === messageId);
    if (msg) {
      msg.isBurned = true;
      msg.plaintext = '[PURGED - ZEROIZED]';
      msg.ciphertextHex = '';
      this.notifyMessageListeners();
    }
    networkService.burnMessage(messageId);
  }

  public getContacts(): Contact[] {
    return this.contacts;
  }

  public onMessagesChange(callback: MessageListener) {
    this.messageListeners.add(callback);
    return () => this.messageListeners.delete(callback);
  }

  public onContactsChange(callback: ContactListener) {
    this.contactListeners.add(callback);
    return () => this.contactListeners.delete(callback);
  }

  public onRemotePurge(callback: PurgeListener) {
    this.purgeListeners.add(callback);
    return () => this.purgeListeners.delete(callback);
  }

  private notifyMessageListeners() {
    this.messageListeners.forEach(cb => cb([...this.messages]));
  }

  private notifyContactListeners() {
    this.contactListeners.forEach(cb => cb([...this.contacts]));
  }

  public resetAll(): void {
    this.messages = [];
    this.contacts = [...INITIAL_CONTACTS];
    this.isInitialized = false;
    this.notifyMessageListeners();
    this.notifyContactListeners();
  }
}

export const storageService = new StorageService();
