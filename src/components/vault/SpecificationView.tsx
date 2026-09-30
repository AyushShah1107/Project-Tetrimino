import React from 'react';
import { FileText, Shield, Terminal, ArrowRight, Layers, Lock, Cpu, Radio, AlertOctagon } from 'lucide-react';

export const SpecificationView: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] max-w-5xl mx-auto w-full p-4 md:p-8 overflow-y-auto space-y-8">
      {/* Document Header */}
      <div className="border-b border-slate-800 pb-5">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[11px] font-mono text-cyan-400 font-semibold tracking-wider uppercase px-2 py-0.5 rounded bg-cyan-950/70 border border-cyan-800/60">
            ARCHITECTURE SPECIFICATION
          </span>
          <span className="text-slate-600 text-xs">·</span>
          <span className="text-xs text-slate-400 font-mono">CONFIDENTIAL SYNOPSIS</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
          Project Tetrimino
        </h1>
        <p className="text-xs md:text-sm text-slate-400 mt-1 font-mono">
          Technical Synopsis: Covert E2EE Messaging Platform with Steganographic Trigger & Self-Destruct Protocols
        </p>
      </div>

      {/* Section 1: System Architecture & Dual-State Paradigm */}
      <section className="space-y-4">
        <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
          <span className="text-cyan-400">1.</span>
          <span>System Architecture & Dual-State Paradigm</span>
        </h2>
        <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
          The application operates under a strict dual-state isolation model, presenting a functional arcade cover to unauthorized observers while encapsulating a zero-knowledge encrypted messaging environment.
        </p>

        {/* ASCII / Visual Flow Diagram from PDF */}
        <div className="p-4 md:p-6 bg-slate-950 rounded-2xl border border-slate-800 font-mono text-xs overflow-x-auto text-slate-300">
          <div className="min-w-[500px] flex flex-col items-center space-y-3">
            <div className="px-4 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200">
              [ Cold Boot ] ──────&gt; [ State A: Arcade Shell ] (Default Game Engine)
            </div>
            <div className="flex flex-col items-center">
              <span className="text-cyan-400 text-[11px]">│ 1 Line Cleared (or Covert Trigger)</span>
              <span className="text-cyan-400">▼</span>
            </div>
            <div className="px-5 py-2.5 rounded-lg bg-slate-900 border border-cyan-700/80 text-cyan-300 font-bold">
              [ Password Challenge ] (Disguised Stage Lock)
            </div>
            <div className="flex items-center gap-12 text-[11px]">
              <span className="text-red-400">Incorrect / Timeout ▼</span>
              <span className="text-emerald-400">Correct Passkey ▼</span>
            </div>
            <div className="flex items-center gap-8">
              <div className="px-3 py-1.5 rounded bg-slate-900 border border-red-900 text-red-300">
                [ Return to Arcade / Purge ]
              </div>
              <div className="px-4 py-2 rounded bg-emerald-950 border border-emerald-700 text-emerald-300 font-bold">
                [ State B: Secure Vault ] (Decrypted SQLite DB)
              </div>
            </div>
            <div className="pt-2 text-red-400">
              ▼ [ Panic Trigger / Self-Destruct ]
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1.5">
            <span className="font-bold text-white font-mono block">State A: Fake Cover (Arcade Mode)</span>
            <p className="text-slate-400 leading-relaxed">
              Fully playable HTML5/Canvas Tetris engine. The encrypted database payload resides on disk obfuscated as a generic binary asset (e.g. <code className="text-cyan-400">.tetris_assets.cache</code>). A line-clear hook triggers the password challenge modal disguised as a stage progression lock.
            </p>
          </div>

          <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1.5">
            <span className="font-bold text-white font-mono block">State B: Secure Vault (Messenger Mode)</span>
            <p className="text-slate-400 leading-relaxed">
              Authenticates credentials against a memory-hard KDF, unlocks the encrypted SQLite database into active RAM, and launches the messaging and voice interface.
            </p>
          </div>
        </div>
      </section>

      {/* Section 2: Cryptographic Foundation & Security Model */}
      <section className="space-y-4">
        <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
          <span className="text-cyan-400">2.</span>
          <span>Cryptographic Foundation & Security Model</span>
        </h2>
        <div className="space-y-3 text-xs md:text-sm text-slate-300">
          <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1">
            <span className="font-bold text-white font-mono">End-to-End Encryption (E2EE):</span>
            <p className="text-slate-400">
              Built on the Signal Protocol (Double Ratchet Algorithm, combining Symmetric Key Ratchet and DH Ratchet) providing Perfect Forward Secrecy (PFS) and Post-Break Security.
            </p>
          </div>

          <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1">
            <span className="font-bold text-white font-mono">Key Derivation Function (KDF):</span>
            <p className="text-slate-400">
              Master key derived via Argon2id (configured with high memory and time costs) to withstand GPU/ASIC brute-force attacks.
            </p>
          </div>

          <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1">
            <span className="font-bold text-white font-mono">Data-at-Rest Encryption:</span>
            <p className="text-slate-400">
              Local databases are encrypted via SQLCipher (AES-256-XTS) with keys held exclusively in non-swappable volatile RAM during active sessions.
            </p>
          </div>
        </div>
      </section>

      {/* Section 3: Panic & Self-Destruct Protocols */}
      <section className="space-y-4">
        <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
          <span className="text-red-400">3.</span>
          <span>Panic & Self-Destruct Protocols</span>
        </h2>
        <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
          Upon triggering the password prompt, an asynchronous 13-second hardware-backed countdown commences.
        </p>

        {/* Purge Sequence Box from PDF */}
        <div className="p-5 bg-red-950/30 border border-red-800/80 rounded-2xl space-y-3 text-xs">
          <span className="font-bold text-red-300 font-mono tracking-wider block">
            PURGE SEQUENCE EXECUTION SEQUENCE
          </span>
          <ul className="space-y-2 text-slate-300 list-disc list-inside font-mono">
            <li>Overwrite AES encryption keys in RAM with cryptographically secure random bytes.</li>
            <li>Execute a multi-pass secure overwrite (DoD 5220.22-M specification) on local cache files.</li>
            <li>Wipe active Signal ratchet session states and private identity keys.</li>
            <li>Drop all local database tables, unpair active cloud sessions, and reset game state.</li>
          </ul>
        </div>
      </section>

      {/* Section 4: Ephemeral Storage (24-Hour Auto-Delete) */}
      <section className="space-y-4">
        <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
          <span className="text-cyan-400">4.</span>
          <span>Ephemeral Storage (24-Hour Auto-Delete)</span>
        </h2>
        <div className="space-y-3 text-xs md:text-sm text-slate-300">
          <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800">
            <span className="font-bold text-white font-mono block mb-1">Local Auto-Deletion:</span>
            <p className="text-slate-400">
              All messages carry an immutable TTL attribute (<code className="text-cyan-400">ttl: 86400</code>). A continuous background routine purges local records past the 24-hour mark.
            </p>
          </div>
          <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800">
            <span className="font-bold text-white font-mono block mb-1">Server Zero-Knowledge:</span>
            <p className="text-slate-400">
              Relay servers hold encrypted blobs only until delivery acknowledgment, with a hard server-side drop cap at 24 hours regardless of delivery state.
            </p>
          </div>
        </div>
      </section>

      {/* Section 5: Voice Channel & Anti-Interruption Security */}
      <section className="space-y-4">
        <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
          <span className="text-cyan-400">5.</span>
          <span>Voice Channel & Anti-Interruption Security</span>
        </h2>
        <div className="space-y-3 text-xs md:text-sm text-slate-300">
          <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800">
            <span className="font-bold text-white font-mono block mb-1">Transport & Protocol:</span>
            <p className="text-slate-400">
              WebRTC encrypted via SRTP with key negotiation handled over DTLS-SRTP / ZRTP.
            </p>
          </div>

          <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800">
            <span className="font-bold text-white font-mono block mb-1">Interruption & Scramble Engine:</span>
            <p className="text-slate-400">
              If SRTP packet validation fails due to active network inspection, proxy tampering, or packet loss, the decoder immediately routes pseudo-random noise / scrambled spectral output instead of plain silence or dropping the call.
            </p>
          </div>

          <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800">
            <span className="font-bold text-white font-mono block mb-1">Anti-Recording Guard:</span>
            <p className="text-slate-400">
              Employs native OS flags (e.g., Android FLAG_SECURE, iOS UIScreen.capturedDidChangeNotification) and low-level audio session exclusivity (CoreAudio/WASAPI) to block virtual capture routing and screen recording.
            </p>
          </div>
        </div>
      </section>

      {/* Section 6: Recommended Tech Stack */}
      <section className="space-y-4">
        <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
          <span className="text-cyan-400">6.</span>
          <span>Recommended Tech Stack</span>
        </h2>
        <div className="rounded-2xl border border-slate-800 overflow-hidden">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-900 text-slate-300 border-b border-slate-800">
              <tr>
                <th className="p-3.5 font-bold">Layer</th>
                <th className="p-3.5 font-bold">Technology Choice</th>
                <th className="p-3.5 font-bold">Implementation Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 bg-slate-950/60 text-slate-300">
              <tr>
                <td className="p-3.5 text-white font-semibold">Frontend Shell</td>
                <td className="p-3.5">Flutter / Rust + Webview (Cross-platform)</td>
                <td className="p-3.5 text-emerald-400">Active (Webview Shell)</td>
              </tr>
              <tr>
                <td className="p-3.5 text-white font-semibold">Game Engine</td>
                <td className="p-3.5">Custom C++ / Canvas engine embedded in native container</td>
                <td className="p-3.5 text-emerald-400">Active (HTML5 Canvas Engine)</td>
              </tr>
              <tr>
                <td className="p-3.5 text-white font-semibold">Crypto Engine</td>
                <td className="p-3.5">libsignal-client (Rust implementation)</td>
                <td className="p-3.5 text-emerald-400">Active (Web Crypto AES-GCM + Ratchet)</td>
              </tr>
              <tr>
                <td className="p-3.5 text-white font-semibold">Local Storage</td>
                <td className="p-3.5">SQLCipher (AES-256)</td>
                <td className="p-3.5 text-emerald-400">Active (Encrypted Volatile RAM DB)</td>
              </tr>
              <tr>
                <td className="p-3.5 text-white font-semibold">VoIP / Audio</td>
                <td className="p-3.5">WebRTC + ZRTP / SRTP</td>
                <td className="p-3.5 text-emerald-400">Active (Scramble Audio Engine)</td>
              </tr>
              <tr>
                <td className="p-3.5 text-white font-semibold">Key Derivation</td>
                <td className="p-3.5">Argon2id</td>
                <td className="p-3.5 text-emerald-400">Active (m=64MB, t=4, p=4)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
