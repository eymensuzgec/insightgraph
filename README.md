# InsightGraph (Clean Build)

Privacy-first, AI-free concept intelligence — runs **entirely in the browser**.

- No external AI / LLM API calls
- Text never leaves the device (client-side analysis)
- Multi-language UI (incl. Arabic RTL)
- Local projects (autosave) + cloud-ready architecture

## Requirements

- Node.js LTS (recommended)
- npm (comes with Node)

## Install & Run (Dev)

```bash
npm install
npm run dev
```

Then open the printed local URL (usually `http://localhost:5173`).

## Build (Production)

```bash
npm run build
npm run preview
```

## Notes

- Auth is **local-only** (for now) and designed to be swapped with Supabase/Firebase later.
- Billing/Plans are UI + gating scaffolding only (no payments yet).
