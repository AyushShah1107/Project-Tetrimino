import React, { useState, useEffect, useRef } from 'react';
import { Send, Shield, Flame, Clock, Lock, CheckCheck, RefreshCw, KeyRound, Edit2, Users, Check } from 'lucide-react';
import { Contact, EncryptedMessage } from '../../types';
import { storageService } from '../../services/storage';
import { networkService } from '../../services/network';

interface MessengerViewProps {
  onRatchetAdvance: (newStep: number) => void;
}

export const MessengerView: React.FC<MessengerViewProps> = ({ onRatchetAdvance }) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<EncryptedMessage[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [selectedTtl, setSelectedTtl] = useState<number>(86400); // 24 hours
  const [showCipherDetails, setShowCipherDetails] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [myCodename, setMyCodename] = useState<string>(networkService.getCodename());
  const [isEditingCodename, setIsEditingCodename] = useState<boolean>(false);
  const [editedCodename, setEditedCodename] = useState<string>(networkService.getCodename());

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Subscribe to storage service real-time updates
  useEffect(() => {
    const initialContacts = storageService.getContacts();
    setContacts(initialContacts);
    if (initialContacts.length > 0 && !selectedContact) {
      setSelectedContact(initialContacts[0]);
    }

    const unsubContacts = storageService.onContactsChange((updatedContacts) => {
      setContacts(updatedContacts);
      setSelectedContact(prev => {
        if (!prev) return updatedContacts[0] || null;
        const found = updatedContacts.find(c => c.id === prev.id);
        return found || updatedContacts[0] || null;
      });
    });

    const unsubMessages = storageService.onMessagesChange((allMessages) => {
      setSelectedContact(current => {
        if (current) {
          const filtered = allMessages.filter(
            m => (m.contactId === current.id || current.id === 'vanguard-01') && !m.isBurned
          );
          setMessages(filtered);
        }
        return current;
      });
    });

    return () => {
      unsubContacts();
      unsubMessages();
    };
  }, []);

  useEffect(() => {
    if (selectedContact) {
      const msgs = storageService.getActiveMessages(selectedContact.id);
      setMessages(msgs);
    }
  }, [selectedContact]);

  // Continuous background routine purges local records past 24-hour mark (Section 4)
  useEffect(() => {
    const purgeInterval = setInterval(() => {
      const purged = storageService.purgeExpiredMessages();
      if (purged > 0 && selectedContact) {
        setMessages(storageService.getActiveMessages(selectedContact.id));
      }
    }, 5000);
    return () => clearInterval(purgeInterval);
  }, [selectedContact]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSaveCodename = () => {
    if (editedCodename.trim()) {
      networkService.setCodename(editedCodename.trim());
      setMyCodename(editedCodename.trim());
    }
    setIsEditingCodename(false);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedContact || isSending) return;

    setIsSending(true);
    const textToSend = inputText.trim();
    setInputText('');

    try {
      const sentMsg = await storageService.addMessage(
        selectedContact.id,
        'me',
        textToSend,
        selectedTtl
      );

      onRatchetAdvance(sentMsg.ratchetIndex);

      // Automated peer response simulation only for automated bot 'cipher-relay'
      if (selectedContact.id === 'cipher-relay') {
        setTimeout(async () => {
          const replies = [
            `Cipher-Relay Echo: Packet decrypted. Symmetric ratchet step #${sentMsg.ratchetIndex + 1} acknowledged.`,
            `Zero-knowledge relay confirmed. Encrypted blob cached with TTL: ${selectedTtl}s.`,
            `DH ratchet exchange complete. Forward secrecy intact.`
          ];
          const randomReply = replies[Math.floor(Math.random() * replies.length)];
          const replyMsg = await storageService.addMessage(selectedContact.id, 'peer', randomReply, selectedTtl);
          onRatchetAdvance(replyMsg.ratchetIndex);
        }, 800);
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleBurnMessage = (messageId: string) => {
    storageService.burnMessage(messageId);
  };

  // Format remaining time for 24h ephemeral storage (Section 4)
  const formatTimeLeft = (expiresAt: number): string => {
    const diff = expiresAt - Date.now();
    if (diff <= 0) return 'Expired';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h ${minutes}m`;
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row h-[calc(100vh-4rem)] max-w-7xl mx-auto w-full border-x border-slate-800 bg-slate-950 overflow-hidden">
      {/* Sidebar: Encrypted Contacts & Node Identity */}
      <div className="w-full md:w-80 border-r border-slate-800 bg-slate-900/60 flex flex-col shrink-0">
        {/* Node Identity Card */}
        <div className="p-3 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
            <span>THIS NODE IDENTITY:</span>
            <div className="flex items-center gap-1 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>LIVE</span>
            </div>
          </div>
          {isEditingCodename ? (
            <div className="flex items-center gap-1.5 mt-1">
              <input
                type="text"
                value={editedCodename}
                onChange={e => setEditedCodename(e.target.value)}
                className="flex-1 px-2 py-1 bg-slate-900 border border-cyan-700 rounded text-xs text-white font-mono focus:outline-none"
                placeholder="Device Codename..."
                autoFocus
              />
              <button
                onClick={handleSaveCodename}
                className="p-1 bg-cyan-700 hover:bg-cyan-600 text-white rounded"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs font-bold font-mono text-cyan-300 truncate">
                {myCodename}
              </span>
              <button
                onClick={() => {
                  setEditedCodename(myCodename);
                  setIsEditingCodename(true);
                }}
                className="p-1 text-slate-500 hover:text-slate-300 rounded"
                title="Rename this device node"
              >
                <Edit2 className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* Channels Header */}
        <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/40">
          <div>
            <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              COMMUNICATION RELAYS
            </h2>
            <span className="text-[10px] text-slate-500">Live Multi-Device Channels</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-mono">
            <Lock className="w-3.5 h-3.5" />
            <span>PFS</span>
          </div>
        </div>

        {/* Contact List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
          {contacts.map(c => {
            const isSelected = selectedContact?.id === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setSelectedContact(c)}
                className={`w-full p-3.5 text-left transition-colors flex items-start gap-3 ${
                  isSelected ? 'bg-slate-800/80' : 'hover:bg-slate-800/40'
                }`}
              >
                <div className="relative shrink-0">
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center font-bold text-xs font-mono ${
                    c.isLivePeer
                      ? 'bg-emerald-950/60 border-emerald-600 text-emerald-300'
                      : 'bg-slate-800 border-slate-700 text-cyan-400'
                  }`}>
                    {c.avatarSeed}
                  </div>
                  <div
                    className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-900 ${
                      c.status === 'online'
                        ? 'bg-emerald-500'
                        : c.status === 'standby'
                        ? 'bg-amber-500'
                        : 'bg-red-500'
                    }`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-white truncate flex items-center gap-1.5">
                      <span>{c.codename}</span>
                      {c.isLivePeer && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-900/80 text-emerald-300 font-mono">
                          PEER
                        </span>
                      )}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">{c.lastActive}</span>
                  </div>
                  <p className="text-xs text-slate-400 truncate mt-0.5">{c.role}</p>
                  <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-500 font-mono">
                    <span>Ratchet #{c.ratchetStep}</span>
                    <span aria-hidden="true">·</span>
                    <span className="truncate">{c.dhFingerprint}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-slate-950 min-w-0">
        {selectedContact ? (
          <>
            {/* Conversation Header */}
            <div className="p-4 border-b border-slate-800 bg-slate-900/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg border flex items-center justify-center text-xs font-bold font-mono ${
                  selectedContact.isLivePeer
                    ? 'bg-emerald-950/60 border-emerald-600 text-emerald-300'
                    : 'bg-slate-800 border-slate-700 text-cyan-400'
                }`}>
                  {selectedContact.avatarSeed}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white tracking-tight">
                      {selectedContact.codename}
                    </h3>
                    <span className="text-[11px] text-slate-400">·</span>
                    <span className="text-xs text-emerald-400 font-mono">
                      {selectedContact.isLivePeer ? 'LIVE DEVICE SYNC' : 'E2EE Verified'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                    <span>Fingerprint: {selectedContact.dhFingerprint}</span>
                    <span aria-hidden="true">·</span>
                    <span>24h Ephemeral TTL</span>
                  </div>
                </div>
              </div>

              {/* Toggle Ciphertext Inspector */}
              <button
                onClick={() => setShowCipherDetails(prev => !prev)}
                className={`py-1.5 px-3 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors border ${
                  showCipherDetails
                    ? 'bg-cyan-950/70 border-cyan-700 text-cyan-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
                title="Toggle raw AES-256-GCM ciphertext inspect mode"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>{showCipherDetails ? 'Raw Cipher Mode ON' : 'Inspect Cipher'}</span>
              </button>
            </div>

            {/* Message Thread */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Ephemeral Notice Banner (Section 4 of PDF) */}
              <div className="max-w-md mx-auto p-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-center">
                <div className="flex items-center justify-center gap-1.5 text-xs text-cyan-400 font-medium">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Cross-Device Real-Time E2EE Active</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Open this link on any 2 devices. Messages sent here decrypt and appear on both screens in real time.
                </p>
              </div>

              {messages.map(msg => {
                const isMe = msg.sender === 'me';
                const senderLabel = isMe
                  ? `You (${myCodename})`
                  : (msg.senderCodename || selectedContact.codename);

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    {/* Sender codename label */}
                    <span className="text-[10px] font-mono text-slate-500 mb-1 px-1">
                      {senderLabel}
                    </span>

                    <div
                      className={`max-w-lg rounded-2xl p-3.5 space-y-1.5 shadow-md ${
                        isMe
                          ? 'bg-cyan-950/40 border border-cyan-800/50 text-slate-100 rounded-br-xs'
                          : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-xs'
                      }`}
                    >
                      {/* Plaintext view */}
                      <p className="text-sm leading-relaxed whitespace-pre-wrap select-text">
                        {msg.plaintext}
                      </p>

                      {/* Raw Ciphertext and IV Inspector */}
                      {showCipherDetails && (
                        <div className="mt-2 pt-2 border-t border-slate-800/80 text-[10px] font-mono text-slate-400 space-y-1 bg-slate-950/60 p-2 rounded-lg">
                          <div className="text-cyan-400 font-semibold flex items-center justify-between">
                            <span>AES-256-GCM Payload:</span>
                            <span>Ratchet #{msg.ratchetIndex}</span>
                          </div>
                          <div className="truncate">
                            <span className="text-slate-500">IV (12B): </span>
                            <span className="text-slate-300">{msg.ivHex || 'N/A'}</span>
                          </div>
                          <div className="truncate">
                            <span className="text-slate-500">Ciphertext: </span>
                            <span className="text-slate-300">{msg.ciphertextHex || 'N/A'}</span>
                          </div>
                        </div>
                      )}

                      {/* Metadata footer */}
                      <div className="flex items-center justify-between gap-3 text-[10px] text-slate-500 font-mono pt-1">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-cyan-500/70" />
                          <span>TTL: {formatTimeLeft(msg.expiresAt)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {isMe && <CheckCheck className="w-3.5 h-3.5 text-cyan-400" />}
                          <button
                            onClick={() => handleBurnMessage(msg.id)}
                            className="text-slate-500 hover:text-red-400 transition-colors"
                            title="Burn message immediately on all devices"
                          >
                            <Flame className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Composer Bar */}
            <div className="p-3.5 border-t border-slate-800 bg-slate-900/60">
              <div className="flex items-center gap-2 mb-2 text-xs text-slate-400">
                <span className="text-[11px] font-medium text-slate-400">Message Ephemeral TTL:</span>
                <div className="flex items-center gap-1">
                  {[
                    { label: '30s', value: 30 },
                    { label: '5m', value: 300 },
                    { label: '1h', value: 3600 },
                    { label: '24h (Standard)', value: 86400 }
                  ].map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setSelectedTtl(option.value)}
                      className={`px-2 py-0.5 text-[11px] rounded font-mono transition-colors ${
                        selectedTtl === option.value
                          ? 'bg-cyan-900/80 text-cyan-300 border border-cyan-700/60 font-medium'
                          : 'text-slate-500 hover:text-slate-300 bg-slate-950/60 border border-slate-800'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  placeholder={`Send live encrypted message to ${selectedContact.codename}...`}
                  className="flex-1 py-2.5 px-4 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 font-sans transition-colors"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || isSending}
                  className="py-2.5 px-4 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-lg shadow-cyan-950/50 whitespace-nowrap"
                >
                  {isSending ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Send E2EE</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-500">
            <Shield className="w-12 h-12 text-slate-700 mb-3" />
            <p className="text-sm font-medium text-slate-400">Select an encrypted peer channel</p>
            <p className="text-xs text-slate-600 mt-1">Double Ratchet cryptographic state is active</p>
          </div>
        )}
      </div>
    </div>
  );
};
