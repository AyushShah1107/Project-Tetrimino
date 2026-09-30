import type { Plugin, ViteDevServer } from 'vite';
import { WebSocketServer, WebSocket } from 'ws';
import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';
import express from 'express';

export function backendPlugin(): Plugin {
  return {
    name: 'project-tetrimino-backend',
    configureServer(server: ViteDevServer) {
      // 1. Ensure persistent database directory exists
      const dataDir = path.resolve(process.cwd(), 'data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      const dbPath = path.join(dataDir, 'vault.db');
      const db = new DatabaseSync(dbPath);

      // 2. Initialize SQLite schemas
      db.exec(`
        CREATE TABLE IF NOT EXISTS messages (
          id TEXT PRIMARY KEY,
          contact_id TEXT NOT NULL,
          sender TEXT NOT NULL,
          sender_codename TEXT,
          client_id TEXT NOT NULL,
          plaintext TEXT,
          ciphertext_hex TEXT,
          iv_hex TEXT,
          timestamp INTEGER NOT NULL,
          ttl_seconds INTEGER NOT NULL,
          expires_at INTEGER NOT NULL,
          ratchet_index INTEGER NOT NULL,
          is_burned INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS audit_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          event_type TEXT NOT NULL,
          details TEXT,
          created_at INTEGER NOT NULL
        );
      `);

      // Seed initial messages if empty
      const countStmt = db.prepare('SELECT count(*) as count FROM messages');
      const result = countStmt.get() as { count: number };
      if (result.count === 0) {
        const seedMsg = db.prepare(`
          INSERT INTO messages (
            id, contact_id, sender, sender_codename, client_id, plaintext,
            ciphertext_hex, iv_hex, timestamp, ttl_seconds, expires_at, ratchet_index, is_burned
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const now = Date.now();
        seedMsg.run(
          'seed-msg-01',
          'vanguard-01',
          'peer',
          'Vanguard-01',
          'server-system',
          'Arcade shell intact. Steganographic relay operational across all connected nodes.',
          '6465616462656566',
          '0102030405060708090a0b0c',
          now - 1000 * 60 * 15,
          86400,
          now + 86400 * 1000,
          28,
          0
        );
      }

      // 3. WebSocket Real-Time Relay Engine
      interface ConnectedPeer {
        ws: WebSocket;
        clientId: string;
        codename: string;
        joinedAt: number;
        inVoice: boolean;
        tamperActive: boolean;
      }

      const connectedPeers = new Map<string, ConnectedPeer>();

      let wss: WebSocketServer | null = null;
      if (server.httpServer) {
        wss = new WebSocketServer({ server: server.httpServer as any, path: '/ws' });

        function broadcast(event: object, excludeClientId?: string) {
          if (!wss) return;
          const payload = JSON.stringify(event);
          wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
              if (excludeClientId) {
                for (const [id, peer] of connectedPeers.entries()) {
                  if (peer.ws === client && id === excludeClientId) {
                    return;
                  }
                }
              }
              client.send(payload);
            }
          });
        }

        function broadcastPeersList() {
          const peers = Array.from(connectedPeers.values()).map(p => ({
            clientId: p.clientId,
            codename: p.codename,
            joinedAt: p.joinedAt,
            inVoice: p.inVoice,
            tamperActive: p.tamperActive
          }));
          broadcast({ type: 'PEERS_UPDATE', peers });
        }

        wss.on('connection', (ws: WebSocket) => {
          let peerClientId = `node-${Math.random().toString(36).substring(2, 9)}`;

          ws.on('message', (data: string) => {
            try {
              const msg = JSON.parse(data.toString());

              switch (msg.type) {
                case 'PEER_HELLO': {
                  peerClientId = msg.clientId || peerClientId;
                  const codename = msg.codename || `Operator-${peerClientId.slice(-4)}`;
                  connectedPeers.set(peerClientId, {
                    ws,
                    clientId: peerClientId,
                    codename,
                    joinedAt: Date.now(),
                    inVoice: false,
                    tamperActive: false
                  });
                  ws.send(JSON.stringify({
                    type: 'WELCOME',
                    yourClientId: peerClientId,
                    peersCount: connectedPeers.size
                  }));
                  broadcastPeersList();
                  break;
                }

                case 'SEND_MESSAGE': {
                  const m = msg.message;
                  if (!m || !m.id) return;

                  const insertStmt = db.prepare(`
                    INSERT OR REPLACE INTO messages (
                      id, contact_id, sender, sender_codename, client_id, plaintext,
                      ciphertext_hex, iv_hex, timestamp, ttl_seconds, expires_at, ratchet_index, is_burned
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                  `);

                  insertStmt.run(
                    m.id,
                    m.contactId || 'vanguard-01',
                    m.sender || 'me',
                    m.senderCodename || 'Anonymous Operator',
                    m.clientId || peerClientId,
                    m.plaintext || '',
                    m.ciphertextHex || '',
                    m.ivHex || '',
                    m.timestamp || Date.now(),
                    m.ttlSeconds || 86400,
                    m.expiresAt || (Date.now() + 86400 * 1000),
                    m.ratchetIndex || 1,
                    m.isBurned ? 1 : 0
                  );

                  broadcast({
                    type: 'NEW_MESSAGE',
                    message: m,
                    senderClientId: peerClientId
                  });
                  break;
                }

                case 'BURN_MESSAGE': {
                  const { messageId } = msg;
                  if (!messageId) return;

                  const burnStmt = db.prepare(`
                    UPDATE messages
                    SET is_burned = 1, plaintext = '[PURGED - ZEROIZED]', ciphertext_hex = ''
                    WHERE id = ?
                  `);
                  burnStmt.run(messageId);

                  broadcast({
                    type: 'MESSAGE_BURNED',
                    messageId
                  });
                  break;
                }

                case 'VOICE_STATE': {
                  const peer = connectedPeers.get(peerClientId);
                  if (peer) {
                    peer.inVoice = Boolean(msg.inVoice);
                    peer.tamperActive = Boolean(msg.tamperActive);
                  }
                  broadcast({
                    type: 'PEER_VOICE_STATE',
                    clientId: peerClientId,
                    codename: peer?.codename || 'Operator',
                    inVoice: Boolean(msg.inVoice),
                    tamperActive: Boolean(msg.tamperActive),
                    carrierFreq: msg.carrierFreq || 220
                  });
                  broadcastPeersList();
                  break;
                }

                case 'VOICE_AUDIO_CHUNK': {
                  broadcast({
                    type: 'PEER_AUDIO_CHUNK',
                    fromClientId: peerClientId,
                    spectrum: msg.spectrum,
                    timestamp: Date.now()
                  }, peerClientId);
                  break;
                }

                case 'TRIGGER_REMOTE_PURGE': {
                  performDoDPurge();
                  broadcast({
                    type: 'REMOTE_PURGE_EXECUTED',
                    initiatedBy: peerClientId,
                    timestamp: Date.now()
                  });
                  break;
                }
              }
            } catch (err) {
              console.error('[WebSocket] Parsing error:', err);
            }
          });

          ws.on('close', () => {
            connectedPeers.delete(peerClientId);
            broadcastPeersList();
          });
        });

        // Ping heartbeat
        setInterval(() => {
          wss?.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
              client.ping();
            }
          });
        }, 20000);
      }

      // DoD 5220.22-M Multi-Pass Purge Function
      function performDoDPurge() {
        try {
          db.exec(`UPDATE messages SET plaintext = '00000000', ciphertext_hex = '00000000', iv_hex = '00000000'`);
          db.exec(`UPDATE messages SET plaintext = 'FFFFFFFF', ciphertext_hex = 'FFFFFFFF', iv_hex = 'FFFFFFFF'`);
          db.exec(`DELETE FROM messages`);
          db.exec(`INSERT INTO audit_logs (event_type, details, created_at) VALUES ('DOD_PURGE_SUCCESS', '3-pass sanitization executed', ${Date.now()})`);
          console.log('[DoD Purge] 3-pass multi-wipe completed.');
        } catch (err) {
          console.error('Failed DoD purge:', err);
        }
      }

      // Continuous 24-hr TTL purge daemon
      setInterval(() => {
        try {
          const now = Date.now();
          const purgeStmt = db.prepare('DELETE FROM messages WHERE expires_at < ?');
          const res = purgeStmt.run(now);
          if (res.changes > 0) {
            console.log(`[Auto-Purge] Expired ${res.changes} messages past TTL.`);
          }
        } catch (e) {
          console.error('Error during auto-purge:', e);
        }
      }, 10000);

      // 4. REST API Endpoints via Express router mounted on Connect
      const apiApp = express();
      apiApp.use(express.json());

      apiApp.get('/health', (req, res) => {
        const msgCount = (db.prepare('SELECT count(*) as count FROM messages').get() as { count: number }).count;
        res.json({
          status: 'online',
          timestamp: Date.now(),
          connectedPeers: connectedPeers.size,
          totalMessages: msgCount,
          version: '2.4.0-E2EE'
        });
      });

      apiApp.get('/peers', (req, res) => {
        const peers = Array.from(connectedPeers.values()).map(p => ({
          clientId: p.clientId,
          codename: p.codename,
          joinedAt: p.joinedAt,
          inVoice: p.inVoice,
          tamperActive: p.tamperActive
        }));
        res.json({ peers, count: peers.length });
      });

      apiApp.get('/messages', (req, res) => {
        const contactId = req.query.contactId as string | undefined;
        const now = Date.now();

        const query = 'SELECT * FROM messages WHERE expires_at > ? ORDER BY timestamp ASC';
        const stmt = db.prepare(query);
        let rows = stmt.all(now) as any[];

        if (contactId) {
          rows = rows.filter(r => r.contact_id === contactId);
        }

        const messages = rows.map(r => ({
          id: r.id,
          contactId: r.contact_id,
          sender: r.sender,
          senderCodename: r.sender_codename,
          clientId: r.client_id,
          plaintext: r.plaintext,
          ciphertextHex: r.ciphertext_hex,
          ivHex: r.iv_hex,
          timestamp: r.timestamp,
          ttlSeconds: r.ttl_seconds,
          expiresAt: r.expires_at,
          ratchetIndex: r.ratchet_index,
          isBurned: Boolean(r.is_burned)
        }));

        res.json({ messages });
      });

      apiApp.post('/messages', (req, res) => {
        const m = req.body;
        if (!m || !m.id) {
          return res.status(400).json({ error: 'Missing message payload' });
        }

        const insertStmt = db.prepare(`
          INSERT OR REPLACE INTO messages (
            id, contact_id, sender, sender_codename, client_id, plaintext,
            ciphertext_hex, iv_hex, timestamp, ttl_seconds, expires_at, ratchet_index, is_burned
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        insertStmt.run(
          m.id,
          m.contactId || 'vanguard-01',
          m.sender || 'me',
          m.senderCodename || 'Anonymous Operator',
          m.clientId || 'api-client',
          m.plaintext || '',
          m.ciphertextHex || '',
          m.ivHex || '',
          m.timestamp || Date.now(),
          m.ttlSeconds || 86400,
          m.expiresAt || (Date.now() + 86400 * 1000),
          m.ratchetIndex || 1,
          m.isBurned ? 1 : 0
        );

        res.json({ status: 'saved', message: m });
      });

      apiApp.post('/messages/:id/burn', (req, res) => {
        const { id } = req.params;
        const burnStmt = db.prepare(`
          UPDATE messages
          SET is_burned = 1, plaintext = '[PURGED - ZEROIZED]', ciphertext_hex = ''
          WHERE id = ?
        `);
        burnStmt.run(id);
        res.json({ status: 'burned', id });
      });

      apiApp.post('/purge', (req, res) => {
        performDoDPurge();
        res.json({ status: 'purged', passes: 3, algorithm: 'DoD 5220.22-M' });
      });

      // Mount Express API onto Vite middleware
      server.middlewares.use('/api', apiApp);
      console.log('[Project Tetrimino] Backend API & WebSocket plugin active on Vite dev server.');
    }
  };
}
