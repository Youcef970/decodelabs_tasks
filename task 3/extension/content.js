// PhishGuard Content Script — injects a protection indicator into the page

console.log('PhishGuard Content Script Loaded');

let currentVerdict = null;
let isInitialized = false;

// BUG FIX: guard against calling init() before document.body exists (e.g. on
// very fast navigations where the script is injected at document_start).
function init() {
  if (isInitialized) return;
  if (!document.body) {
    // Body not ready yet — wait for it
    document.addEventListener('DOMContentLoaded', init, { once: true });
    return;
  }
  isInitialized = true;

  createShieldUI();

  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'PHISHGUARD_RESULT') {
      updateShieldUI(message.data);
      currentVerdict = message.data;
    }
    return false;
  });

  console.log('PhishGuard initialized on page');
}

// ==================== SHIELD UI ====================

function createShieldUI() {
  // BUG FIX: remove any existing shield before creating a new one to prevent
  // duplicate shields on SPA navigations that re-run the script
  const existing = document.getElementById('phishguard-shield');
  if (existing) existing.remove();

  const container = document.createElement('div');
  container.id = 'phishguard-shield';
  container.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 2147483647;
    width: 44px;
    height: 44px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;

  const button = document.createElement('button');
  button.id = 'phishguard-shield-btn';
  button.style.cssText = `
    width: 100%;
    height: 100%;
    border: none;
    border-radius: 50%;
    background: #161B26;
    border: 1px solid #2A3140;
    color: #FFB627;
    font-size: 18px;
    font-weight: 700;
    box-shadow: 0 4px 16px rgba(0,0,0,0.35);
    cursor: pointer;
    transition: transform 0.15s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  `;
  button.innerHTML = '◆';
  button.title = 'PhishGuard — click for details';

  const tooltip = document.createElement('div');
  tooltip.id = 'phishguard-tooltip';
  tooltip.style.cssText = `
    position: absolute;
    bottom: 56px;
    right: 0;
    width: 280px;
    background: #161B26;
    border: 1px solid #2A3140;
    border-radius: 10px;
    box-shadow: 0 12px 32px rgba(0,0,0,0.45);
    padding: 14px;
    display: none;
    font-size: 13px;
    color: #E8EAED;
  `;

  tooltip.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
      <div id="phishguard-status-icon" style="font-size:18px;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:rgba(63,185,80,0.12);color:#3FB950;">●</div>
      <div>
        <div id="phishguard-status-text" style="font-weight:600;color:#9AA1B0;">Scanning…</div>
        <div id="phishguard-score" style="font-size:11px;color:#6B7280;">Risk score: —</div>
      </div>
    </div>
    <div id="phishguard-flags" style="display:flex;flex-wrap:wrap;gap:4px;margin-top:8px;">
      <span style="background:#1E2430;color:#9AA1B0;font-size:11px;padding:2px 10px;border-radius:12px;">Waiting for result…</span>
    </div>
    <div style="margin-top:12px;padding-top:12px;border-top:1px solid #2A3140;display:flex;gap:8px;">
      <button id="phishguard-scan-btn" style="flex:1;padding:6px;background:#FFB627;color:#0B0E14;border:none;border-radius:6px;cursor:pointer;font-size:12px;font-weight:500;">Scan</button>
      <button id="phishguard-report-btn" style="flex:1;padding:6px;background:#1E2430;color:#C7CCD6;border:none;border-radius:6px;cursor:pointer;font-size:12px;">Report</button>
    </div>
  `;

  container.appendChild(button);
  container.appendChild(tooltip);
  document.body.appendChild(container);

  button.addEventListener('click', () => {
    const isVisible = tooltip.style.display === 'block';
    tooltip.style.display = isVisible ? 'none' : 'block';
  });

  document.getElementById('phishguard-scan-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    const statusText = document.getElementById('phishguard-status-text');
    if (statusText) statusText.textContent = 'Scanning…';
    // BUG FIX: use sendMessage with error handling — the old code silently failed
    // when the background service worker was sleeping (Manifest V3 behaviour)
    chrome.runtime.sendMessage(
      { type: 'PHISHGUARD_CHECK_URL', url: window.location.href },
      (response) => {
        if (chrome.runtime.lastError) {
          console.warn('PhishGuard scan error:', chrome.runtime.lastError.message);
          return;
        }
        if (response?.result) updateShieldUI(response.result);
      }
    );
    tooltip.style.display = 'none';
  });

  document.getElementById('phishguard-report-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    chrome.runtime.sendMessage(
      { type: 'PHISHGUARD_REPORT', url: window.location.href, verdict: currentVerdict },
      () => { if (chrome.runtime.lastError) { /* ignore */ } }
    );
    tooltip.style.display = 'none';
  });

  document.addEventListener('click', (e) => {
    if (!container.contains(e.target)) {
      tooltip.style.display = 'none';
    }
  });
}

// ==================== UPDATE UI ====================

function updateShieldUI(result) {
  if (!result) return;

  const statusIcon = document.getElementById('phishguard-status-icon');
  const statusText = document.getElementById('phishguard-status-text');
  const scoreText = document.getElementById('phishguard-score');
  const flagsContainer = document.getElementById('phishguard-flags');
  const button = document.getElementById('phishguard-shield-btn');

  // BUG FIX: bail out gracefully if UI was removed (navigations, iframes)
  if (!statusIcon || !statusText || !scoreText || !flagsContainer || !button) return;

  const verdict = result.verdict || 'UNKNOWN';
  const score = result.score || 0;
  const flags = result.flags || [];

  const statusMap = {
    SAFE:      { icon: '✓', text: 'Page is safe',      color: '#3FB950', bg: 'rgba(63,185,80,0.12)' },
    SUSPICIOUS:{ icon: '!', text: 'Suspicious page',   color: '#FFB627', bg: 'rgba(255,182,39,0.12)' },
    PHISHING:  { icon: '✕', text: 'Phishing detected', color: '#E5484D', bg: 'rgba(229,72,77,0.12)' },
    ERROR:     { icon: '?', text: 'Analysis error',    color: '#6B7280', bg: 'rgba(107,114,128,0.12)' },
  };

  const status = statusMap[verdict] || statusMap.ERROR;
  statusIcon.textContent = status.icon;
  statusIcon.style.color = status.color;
  statusIcon.style.background = status.bg;
  statusText.textContent = status.text;
  statusText.style.color = status.color;
  scoreText.textContent = `Risk score: ${Math.round(score * 100)}%`;

  flagsContainer.innerHTML = '';
  if (flags.length === 0) {
    flagsContainer.innerHTML = `<span style="background:#1E2430;color:#9AA1B0;font-size:11px;padding:2px 10px;border-radius:12px;">No threats detected</span>`;
  } else {
    // BUG FIX: deduplicate flags (e.g. sensitive_info + sensitive_info_request)
    const unique = [...new Set(flags)];
    unique.forEach((flag) => {
      const span = document.createElement('span');
      span.style.cssText = `
        background: rgba(229,72,77,0.1);
        color: #E5484D;
        font-size: 11px;
        padding: 2px 10px;
        border-radius: 12px;
        border: 1px solid rgba(229,72,77,0.3);
      `;
      span.textContent = flag.replace(/_/g, ' ');
      flagsContainer.appendChild(span);
    });
  }

  button.style.borderColor = status.color;
  button.style.color = status.color;
  button.style.animation = verdict === 'PHISHING' ? 'phishguard-pulse 1s ease-in-out infinite' : 'none';
}

// ==================== CSS ANIMATIONS ====================

const style = document.createElement('style');
style.textContent = `
  @keyframes phishguard-pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.08); }
  }
`;
document.head.appendChild(style);

// ==================== SPA NAVIGATION DETECTION ====================

(function patchHistoryForNavigationDetection() {
  let lastUrl = window.location.href;

  function onPossibleNavigation() {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      // Reset UI for the new page
      isInitialized = false;
      init();
      chrome.runtime.sendMessage(
        { type: 'PHISHGUARD_CHECK_URL', url: window.location.href },
        () => { if (chrome.runtime.lastError) { /* ignore */ } }
      );
    }
  }

  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  history.pushState = function (...args) {
    originalPushState.apply(this, args);
    onPossibleNavigation();
  };
  history.replaceState = function (...args) {
    originalReplaceState.apply(this, args);
    onPossibleNavigation();
  };

  window.addEventListener('popstate', onPossibleNavigation);
})();

// ==================== INIT ====================

init();

// BUG FIX: send with a callback to swallow the "Could not establish connection"
// error that fires when the service worker is still waking up
chrome.runtime.sendMessage(
  { type: 'PHISHGUARD_CHECK_URL', url: window.location.href },
  () => { if (chrome.runtime.lastError) { /* service worker was asleep, it will retry via tabs.onUpdated */ } }
);

console.log('PhishGuard content script ready');
