# Baseline

Dark-mode frontend for an AI speech and presentation coach. Phase 1 includes a simulated UI flow plus Groq-backed live recording sessions, with a modular Professional / Clinical vocabulary layer.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Flow

1. Dashboard — progress hub, trend chart, session history
2. Setup — topic, frequency, hardware check
3. Interview / therapy room — records mic audio, facial-tracking overlay
4. Results — Groq Whisper transcript, filler highlights, coaching feedback

Toggle **Professional** and **Clinical** mode in the header to switch terminology.

## Live sessions (Groq)

Add your key to `.env.local` in the project root:

```bash
GROQ_API_KEY=gsk_...
```

Restart `npm run dev`, then: Start New Session → allow camera/mic → speak for ~15–30s → End Session.
