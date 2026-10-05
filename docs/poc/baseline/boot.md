# Boot probe — 2026-10-05

- Branch: `feat/uat-tab` (from `main`, clean)
- Start: `npx vite --port 5191 --strictPort` → 200, `<title>Intent Studio — Chatbot Backoffice</title>`, listener = node (vite)
- Seed: none needed — app ships fixtures + in-memory store. Login with any username/password.
- Captures (1440×900, full page, light + dark via `localStorage.theme`): dashboard, review, approvals, library, studio.
- Note: current theme is a crimson sidebar + warm canvas (not the earlier "Gallery cobalt" pair).
