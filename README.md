# Project Tetrimino — Covert E2EE Platform

> **A military-grade, end-to-end encrypted (E2EE) multi-device messaging, secure voice, and anti-tamper communication platform disguised entirely beneath an authentic 1989 retro Tetris arcade cabinet.**

[![Live Demo](https://img.shields.io/badge/Live_Demo-Online-success?style=for-the-badge&logo=googlecloud)](https://ais-pre-fo2ejx2j42b4e3u2ao3bcl-351951746893.asia-southeast1.run.app)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-cyan.svg)](https://react.dev/)
[![Express](https://img.shields.io/badge/Express-4.x-lightgrey.svg)](https://expressjs.com/)
[![WebSockets](https://img.shields.io/badge/WebSockets-ws-green.svg)](https://github.com/websockets/ws)
[![SQLite](https://img.shields.io/badge/Database-SQLite-blue.svg)](https://www.sqlite.org/)
[![Vite](https://img.shields.io/badge/Vite-8.x-purple.svg)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-v4-38bdf8.svg)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

### 🌐 Live Deployment
* **Live App URL**: [https://ais-pre-fo2ejx2j42b4e3u2ao3bcl-351951746893.asia-southeast1.run.app](https://ais-pre-fo2ejx2j42b4e3u2ao3bcl-351951746893.asia-southeast1.run.app)
* **Covert Trigger**: Clear 1 line in the arcade game or press the operator hotkey `` ` `` (Backtick)
* **Master Passkey**: `CIPHER-77`
* **Duress Wipe PIN**: `0000` (silently triggers DoD 3-pass zeroization)

---

## 🕹️ System Architecture Overview

The system implements a zero-leakage **Dual-State Isolation Architecture** backed by an Express WebSocket server and SQLite database:

```
 ┌────────────────────────────────────────────────────────┐
 │            STATE A: COLD ARCADE COVER SHELL            │
 │   Authentic 1989 Tetris Engine · 7-Bag Randomizer       │
 │   High Scores · 8-bit Synthesizer · Scanlines (CRT)    │
 └───────────────────────────┬────────────────────────────┘
                             │
            Steganographic Trigger: Clear 1 Line
              or Operator Hotkey [`] (Backtick)
                             │
                             ▼
 ┌────────────────────────────────────────────────────────┐
 │           DISGUISED STAGE CALIBRATION CHALLENGE        │
 │       Hardware-backed 13-second countdown window       │
 │        3-strike brute lockout · Duress PIN wipe        │
 └───────────────────────────┬────────────────────────────┘
                             │
                    Passkey: CIPHER-77
                             │
                             ▼
 ┌────────────────────────────────────────────────────────┐
 │       STATE B: FULL-STACK OPERATIONAL ENCRYPTED VAULT  │
 │   • Real-Time Multi-Device Chat (WebSockets + SQLite)  │
 │   • Double Ratchet (Signal Protocol) PFS Messenger     │
 │   • 24-Hour Ephemeral Auto-Purge (Zero-Persistence)    │
 │   • Real-Time Voice Radio + Tamper Scrambler Engine    │
 │   • Live Hex/IV/MAC Ciphertext Inspector               │
 │   • DoD 5220.22-M 3-Pass Network-Wide Self-Destruct    │
 └────────────────────────────────────────────────────────┘
```

---

## 👥 Multi-Device Real-Time Communication

Two or more devices can connect simultaneously to chat in real time, conduct encrypted voice calls, and synchronize emergency self-destruct purges:

### How It Works Across 2 Devices (Phone + Laptop):
1. **Device 1 (e.g. Laptop)**:
   * Open the app, press backtick (`` ` ``) or clear 1 line in Tetris.
   * Enter passkey **`CIPHER-77`** to enter the Vault.
   * Rename node to `Laptop-Alpha` in the Messenger sidebar.
2. **Device 2 (e.g. Mobile Phone / 2nd Tab)**:
   * Open the app and enter passkey **`CIPHER-77`**.
   * Rename node to `Phone-Bravo`.
3. **Instant Real-Time Chat**:
   * Both devices will immediately see **`2 NODES ONLINE`** in the top navigation bar.
   * Type any message on Device 1 and press **Send E2EE**.
   * The message is encrypted client-side with `AES-256-GCM`, stored in SQLite, and delivered over WebSockets to Device 2 within milliseconds.
   * Device 2 decrypts and displays the plaintext along with the real-time IV hex and ciphertext tags!
4. **Synchronized Voice & Anti-Tamper Scramble**:
   * When Device 1 starts a call, Device 2 displays `PEER TRANSMITTING: Laptop-Alpha`.
   * When either device toggles **"Simulate Active Tampering"**, the tamper alarm fires on both screens and switches both audio visualizers to the harsh anti-interruption pink noise scramble!
5. **Network-Wide DoD 5220.22-M Purge**:
   * If either user triggers the Panic Button or inputs duress PIN `0000`, the server wipes the SQLite database in 3 passes and broadcasts a remote wipe. Both devices instantly drop back to the cold arcade screen!

---

## 🔐 Core Cryptographic Specifications

### 1. Zero-Knowledge Key Derivation (KDF)
- **KDF Algorithm**: PBKDF2-HMAC-SHA256 / Argon2id specification.
- **Rounds**: 100,000 iterations with 256-bit cryptographically secure salt.
- **Key Separation**: Distinct derivations for payload encryption (`AES-256-GCM`), integrity authentication (`HMAC-SHA256`), and ratchet state initialization.
- **Duress Protocol**: Entering `0000` or `DURESS` triggers a silent DoD-grade purge rather than access refusal, protecting operators under coercion.

### 2. Signal Protocol Double Ratchet Engine
- **Perfect Forward Secrecy (PFS)** & **Post-Compromise Security (PCS)**.
- Every message exchanged ratchets forward the symmetric key material (`HKDF-SHA256`), ensuring that compromise of any single temporary key yields zero access to past or future sessions.
- Real-time **Ciphertext Inspector** renders the 96-bit initialization vectors (IV), raw AES-GCM ciphertext hex, and 128-bit authentication tags.

### 3. Ephemeral Storage (24-Hour TTL)
- All records in the SQLite database and local caches enforce an immutable 86,400s time-to-live.
- A background server daemon runs every 10 seconds to continuously purge expired records past their TTL.

### 4. Active Anti-Tamper Voice Channel
- Real-time 64-band frequency spectrum visualizer and WebRTC audio pipeline.
- **Interruption Scrambler**: If active eavesdropping, packet corruption, or MitM inspection is detected, the audio engine injects synthetic pink noise, pseudo-random bitstreams, and ring-modulated carrier frequencies rather than leaking silence or plaintext.

### 5. DoD 5220.22-M Multi-Pass Emergency Purge
- **Pass 1**: Overwrite target sectors with `0x00` (binary zeros).
- **Pass 2**: Overwrite target sectors with `0xFF` (binary ones).
- **Pass 3**: Overwrite target sectors with cryptographically secure random bytes (`crypto.getRandomValues`).
- Volatile memory arrays are overwritten in RAM, Signal ratchet identity keys destroyed, server database zeroized, and all connected devices reset to a pristine cold-boot arcade state.

---

## 🎮 Arcade Cover Features

- **Standard Matrix**: 10×20 grid adhering to official Tetris Guideline mechanics.
- **7-Bag Randomizer**: Fisher-Yates shuffle algorithm preventing piece starvation.
- **SRS Wall Kicks**: Wall and floor kick offsets for standard rotational maneuvers.
- **Retro Visuals**: CRT scanlines, arcade cabinet bezel, 8-bit sound effects, and floating combo notifications.
- **Adaptive Canvas**: Dynamically scales from 22px to 36px+ blocks to fill modern desktop, laptop, and mobile screens.
- **Emergency Cover Mode**: Hitting `ESC` from anywhere inside the vault drops back to the arcade game instantly without dropping active sessions.

---

## 🚀 Getting Started

### Prerequisites
- Node.js `v18.0.0` or higher
- npm, yarn, pnpm, or bun

### 1. Clone the Repository
```bash
git clone https://github.com/AyushShah1107/Project-Tetrimino.git
cd Project-Tetrimino
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Full-Stack Server (Express + WebSockets + SQLite + Vite)
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in two browser windows or across two devices on the same local network.

### 4. Build for Production
```bash
npm run build
npm start
```

---

## 🔑 Operational Credentials & Shortcuts

| Action | Control / Value | Description |
| :--- | :--- | :--- |
| **Move Left / Right** | `←` / `→` or On-Screen DPAD | Lateral tetromino movement |
| **Rotate** | `↑` or `Z` | 90° Clockwise rotation with SRS kicks |
| **Soft Drop** | `↓` | Accelerated drop |
| **Hard Drop** | `Space` | Instant lock drop |
| **Hold Piece** | `C` or `Shift` | Swap piece into holding buffer |
| **Pause Game** | `P` | Toggle play/pause |
| **Toggle Fullscreen** | `F` | Native HTML5 Fullscreen mode |
| **Covert Trigger** | **Clear 1 Line** | Triggers disguised stage calibration modal |
| **Operator Hotkey** | `` ` `` (Backtick) | Discreetly opens the calibration modal |
| **Master Passkey** | **`CIPHER-77`** | Unlocks State B (Encrypted Vault) |
| **Duress Passkey** | **`0000`** or **`DURESS`** | Silent emergency purge sequence |
| **Instant Cover** | **`ESC`** Key | Instantly exits vault back to Tetris |

---

## 📁 Repository Structure

```
├── .gitignore             # Strict ignore rules (no node_modules, dist, db files)
├── index.html             # HTML5 entry with metadata and retro typography
├── metadata.json          # Application capabilities and permissions
├── netlify.toml           # Netlify build and redirect configuration
├── package.json           # Dependencies and scripts (full-stack server.ts entry)
├── server.ts              # Express API + WebSocket server + SQLite database
├── tsconfig.json          # TypeScript compilation configuration
├── vercel.json            # Vercel zero-config routing rules
├── vite.config.ts         # Vite build configuration with Tailwind CSS
└── src/
    ├── App.tsx            # State machine (ARCADE -> CHALLENGE -> VAULT)
    ├── main.tsx           # React DOM root entry
    ├── index.css          # Tailwind CSS directives and CRT scanline effects
    ├── types/             # TypeScript interfaces and crypto schemas
    ├── services/
    │   ├── network.ts     # Real-time WebSocket relay & peer discovery engine
    │   ├── storage.ts     # Ephemeral storage manager with 24-hr TTL & server sync
    │   ├── crypto.ts      # Web Crypto API, Double Ratchet, PBKDF2 & AES-GCM
    │   └── audio.ts       # Web Audio API 8-bit sound fx & voice scrambler
    └── components/
        ├── arcade/
        │   ├── TetrisGame.tsx     # Full retro arcade engine with canvas scaling
        │   └── DisguisedModal.tsx # Covert stage calibration passkey challenge
        ├── vault/
        │   ├── VaultHeader.tsx         # Vault navigation & live peer counter HUD
        │   ├── MessengerView.tsx       # E2EE Double Ratchet multi-device chat
        │   ├── VoiceChannelView.tsx    # Audio scrambler & frequency spectrum
        │   ├── CryptoInspectorView.tsx # Raw cryptographic state inspector
        │   ├── SpecificationView.tsx   # Operational security brief & protocols
        │   └── PurgeModal.tsx          # Multi-pass data sanitization sequence
        └── common/
            └── CoverGuideModal.tsx     # Field briefing and control manual
```

---

## 🎯 Live Presentation Walkthrough (For Demos & Evaluation)

1. **The Cover Illusion**:
   * Present the app: It looks, sounds, and plays identically to a vintage 1989 arcade cabinet.
   * Play a few blocks, showcase the score counter, scanlines, and 8-bit audio effects.
2. **The Covert Trigger**:
   * Clear 1 line or press backtick (`` ` ``).
   * Notice how the challenge modal looks like a standard retro stage calibration with a 13-second hardware countdown.
3. **The Duress Trap (Show Security)**:
   * Explain: If an adversary forces the operator to unlock the machine, entering `0000` silently triggers a DoD 5220.22-M 3-pass wipe without giving away that a vault ever existed.
4. **The Authenticated Vault**:
   * Type `CIPHER-77` to unlock.
   * Showcase the Signal Double Ratchet with live Ratchet Steps.
   * Open the **Crypto Inspector** to display real-time AES-256-GCM hex bytes, IVs, and MAC authentication tags.
5. **Multi-Device Real-Time Proof**:
   * Open the app on a second browser window or phone.
   * Type a message on Device 1: show that Device 2 instantly receives, decrypts, and updates in real time over WebSockets!
6. **Voice Channel Anti-Tamper Demo**:
   * Switch to the **Voice Channel** tab and start the call.
   * Toggle **"Simulate Active Tampering"** to demonstrate how the system injects pseudo-random noise and ring-modulated carrier frequencies rather than leaking plaintext or dropping the call.
7. **Emergency Exit**:
   * Press `ESC` at any time to instantly snap back to the cold arcade screen.

---

## 🛡️ License

This project is open-source and licensed under the [MIT License](LICENSE).
