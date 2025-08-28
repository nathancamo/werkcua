// script.js — assistant logic, history, and UI glue (privacy-first, client-only).
// No external network calls are made by default. Replace or extend `assistantTransform`
// to call a backend (use fetch with CORS and caution about privacy).

const form = document.getElementById('demo-form');
const input = document.getElementById('phrase');
const result = document.getElementById('result');
const clearBtn = document.getElementById('clear-btn');

const STORAGE_KEY = 'werkcua.history.v1';

/* ---------- small helpers ---------- */
function el(tag, attrs = {}, ...kids) {
  const e = document.createElement(tag);
  for (const k in attrs) {
    if (k === 'class') e.className = attrs[k];
    else if (k === 'text') e.textContent = attrs[k];
    else e.setAttribute(k, attrs[k]);
  }
  for (const kid of kids) {
    if (typeof kid === 'string') e.appendChild(document.createTextNode(kid));
    else if (kid) e.appendChild(kid);
  }
  return e;
}

function sanitize(text) {
  const d = document.createElement('div');
  d.textContent = text;
  return d.innerHTML;
}

function saveHistory(arr) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(arr)); } catch (e) { /* ignore */ }
}
function loadHistory() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch (e) { return []; }
}

/* ---------- assistant transform (replace or extend this) ---------- */
/**
 * assistantTransform(inputText)
 * - Input: string
 * - Output: object or Promise resolving to { output: string, note?: string }
 *
 * This demo: performs extraction + rewrite:
 *  - If input looks like a user story / problem: produce a concise problem statement + 3 suggested next steps.
 *  - If input is free text: return reversed words as a playful transformation.
 *
 * Privacy: This function is local-only. If you want server processing, replace with an async function that calls your server.
 */
function assistantTransform(inputText) {
  if (!inputText || !inputText.trim()) return { output: '', note: 'Please enter something to transform.' };
  const t = inputText.trim();

  // Detect email-like strings and refuse to transmit
  const hasEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(t);
  if (hasEmail) return { output: '', note: "Privacy: Detected an email-like string. This client-only demo won't transmit it." };

  // If looks like a "problem" (contains words like 'help', 'problem', 'users', 'issue')
  const problemKeywords = /\b(help|problem|issue|users|error|fail|confusing|need)\b/i;
  if (problemKeywords.test(t) && t.split(/\s+/).length > 4) {
    // Create a concise problem summary and suggestions (deterministic, local)
    const summary = (() => {
      // Keep it simple: sentences up to first period
      const firstSentence = t.split(/[.?!]\s/)[0];
      return `Problem — ${firstSentence.length > 120 ? firstSentence.slice(0, 117) + '...' : firstSentence}`;
    })();

    const suggestions = [
      'Run a 5-user usability test targeting the main flow causing confusion.',
      'Add in-product hints for the specific step where users drop off.',
      'Measure success with a short A/B experiment over 2 weeks.'
    ];
    return { output: `${summary}\n\nSuggestions:\n- ${suggestions.join('\n- ')}`, note: 'Generated local suggestions' };
  }

  // Otherwise playful: reverse words
  const words = t.split(/\s+/).reverse().join(' ');
  return { output: words, note: `Reversed ${t.split(/\s+/).length} word(s)` };
}

/* ---------- rendering ---------- */
function renderResult({ output, note }) {
  result.innerHTML = '';
  if (!output) {
    const p = el('div', { class: 'small' }, note || 'No result');
    result.appendChild(p);
    return;
  }
  const out = el('div', { class: 'out' }, output);
  const meta = el('div', { class: 'small' }, note || '');
  result.appendChild(out);
  result.appendChild(meta);
}

/* ---------- history UI (simple) ---------- */
function renderHistory() {
  const wrapper = document.getElementById('history-slot');
  if (!wrapper) return;
  const items = loadHistory().slice().reverse();
  wrapper.innerHTML = '';
  if (!items.length) {
    wrapper.appendChild(el('div', { class: 'small' }, 'No history yet'));
    return;
  }
  for (const it of items) {
    const row = el('div', { class: 'history-item' });
    const left = el('div', {}, el('div', { class: 'small' }, it.input));
    const right = el('div', {});
    const loadBtn = el('button', { class: 'btn ghost' }, 'Load');
    loadBtn.addEventListener('click', () => {
      input.value = it.input;
      renderResult({ output: it.output, note: it.note });
    });
    const delBtn = el('button', { class: 'btn ghost' }, 'Delete');
    delBtn.addEventListener('click', () => {
      let arr = loadHistory();
      arr = arr.filter(h => !(h.input === it.input && h.output === it.output && h.ts === it.ts));
      saveHistory(arr);
      renderHistory();
    });
    right.appendChild(loadBtn);
    right.appendChild(el('span', { style: 'width:.5rem;display:inline-block' }));
    right.appendChild(delBtn);
    row.appendChild(left);
    row.appendChild(right);
    wrapper.appendChild(row);
  }
}

/* ---------- events ---------- */
form.addEventListener('submit', (ev) => {
  ev.preventDefault();
  const value = input.value || '';
  try {
    const maybe = assistantTransform(value);
    if (maybe instanceof Promise) {
      renderResult({ output: '', note: 'Processing…' });
      maybe.then((res) => {
        if (!res || typeof res.output !== 'string') {
          renderResult({ output: '', note: 'Unexpected response from transform' });
          return;
        }
        renderResult(res);
        const arr = loadHistory();
        arr.push({ input: value, output: res.output, note: res.note || '', ts: Date.now() });
        saveHistory(arr);
        renderHistory();
      }).catch((err) => {
        console.error(err);
        renderResult({ output: '', note: 'Error processing input' });
      });
    } else {
      renderResult(maybe);
      const arr = loadHistory();
      arr.push({ input: value, output: maybe.output, note: maybe.note || '', ts: Date.now() });
      saveHistory(arr);
      renderHistory();
    }
  } catch (err) {
    console.error(err);
    renderResult({ output: '', note: 'An unexpected error occurred' });
  }
});

clearBtn.addEventListener('click', () => {
  input.value = '';
  result.innerHTML = '';
  input.focus();
});

/* copy and export helpers */
document.addEventListener('click', (ev) => {
  const t = ev.target;
  if (t && t.id === 'copy-result') {
    const out = result.querySelector('.out')?.textContent || '';
    navigator.clipboard?.writeText(out).then(() => {
      t.textContent = 'Copied';
      setTimeout(() => t.textContent = 'Copy', 1400);
    }).catch(() => { t.textContent = 'Copy failed'; });
  } else if (t && t.id === 'export-json') {
    const arr = loadHistory();
    const blob = new Blob([JSON.stringify(arr, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'werkcua-history.json';
    a.click();
    URL.revokeObjectURL(url);
  } else if (t && t.id === 'clear-history') {
    if (confirm('Clear local history?')) {
      saveHistory([]);
      renderHistory();
    }
  }
});

/* initialize slots if missing */
(function init() {
  // if the page has a history-slot element, use it; otherwise create a small sidebar
  let hs = document.getElementById('history-slot');
  if (!hs) {
    // create a simple sidebar appended under the first card
    const sb = document.createElement('aside');
    sb.className = 'card sidebar';
    sb.innerHTML = `
      <h3>History & tools</h3>
      <div id="history-slot" class="history-list" aria-live="polite"></div>
      <div style="display:flex;gap:.5rem;margin-top:.5rem">
        <button id="copy-result" class="btn ghost">Copy</button>
        <button id="export-json" class="btn ghost">Export</button>
        <button id="clear-history" class="btn ghost">Clear</button>
      </div>
    `;
    document.querySelector('.container').appendChild(sb);
    hs = document.getElementById('history-slot');
  }
  renderHistory();
})();
