# werkcua — CUA assistant (web app)

This branch contains a small client-side web app for the CUA assistant. It's designed to run fully in the browser with a privacy-first approach (no network requests by default). Use it as a starter for integrating an assistant UI or for local prototyping.

What’s included
- index.html — UI and integration points (already committed)
- styles.css — styling for a responsive, accessible interface
- script.js — assistant logic, local history, copy/export, and UI glue

Features
- Local-only assistant transform function (replace or extend to call a server)
- Local history saved to localStorage
- Copy and export history
- Accessible markup and aria-live output

How to run locally
- Quick (file): open index.html in your browser.
- Recommended (static server):
  - Python 3: `python -m http.server 8000`
  - Node (http-server): `npx http-server -c-1`
  - Then open http://localhost:8000

How to extend
- Replace `assistantTransform` in script.js with your own sync or async function. If using a server, call it with fetch and handle privacy accordingly.
- Convert to a framework (React / Next / Svelte / Vue) if you want a component structure and build tooling.
- Add tests, CI/CD, and deployment (GitHub Pages or Netlify) for public hosting.

Privacy note
This app intentionally does not send user input anywhere. If you add backend calls, make sure to implement proper controls and inform users about where data is sent.

Next steps I can take
- Push these files to the web-demo branch and open a PR (ready to do this).
- Integrate code from your other files/repos into this app.
- Convert to a modern build setup (Vite) or a framework if desired.

Instructions to test right now
- Option A: open index.html (in the branch's folder) in your browser — the assistant transform runs locally, history is stored in localStorage, and copy/export/clear actions work.
- Option B: run a static server for best parity: `python -m http.server 8000` then open http://localhost:8000
