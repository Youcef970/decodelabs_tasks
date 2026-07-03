// Popup Script for PhishGuard Extension

const API_BASE_URL = 'http://localhost:8000/api/v1';
const DASHBOARD_URL = 'http://localhost:3000';
let currentTab = null;
let currentResult = null;

const statusContent = document.getElementById('statusContent');
const flagsContainer = document.getElementById('flagsContainer');
const totalScansEl = document.getElementById('totalScans');
const threatsFoundEl = document.getElementById('threatsFound');
const protectionRateEl = document.getElementById('protectionRate');
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');

document.addEventListener('DOMContentLoaded', async () => {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  currentTab = tabs[0];

  await checkConnection();
  await loadStats();
  await checkCurrentPage();
});

// ==================== API FUNCTIONS ====================

async function checkConnection() {
  try {
    const response = await fetch(`${API_BASE_URL.replace('/api/v1', '')}/api/health`);
    if (!response.ok) throw new Error('API not responding');
    statusDot.className = 'status-dot online';
    statusText.textContent = 'Connected';
  } catch (error) {
    statusDot.className = 'status-dot offline';
    statusText.textContent = 'Offline';
    showStatus('error', 'Cannot reach PhishGuard server', 'Is the backend running on :8000?');
  }
}

async function loadStats() {
  try {
    const response = await fetch(`${API_BASE_URL}/stats`);
    if (!response.ok) throw new Error('Failed to load stats');

    const stats = await response.json();
    totalScansEl.textContent = stats.total_scans || 0;
    threatsFoundEl.textContent = stats.phishing_detected || 0;

    const rate = stats.detection_rate || 0;
    protectionRateEl.textContent = Math.round(rate * 100) + '%';
  } catch (error) {
    console.error('Error loading stats:', error);
  }
}

async function checkCurrentPage() {
  if (!currentTab || !currentTab.url) {
    showStatus('error', 'No active tab', 'Unable to analyze');
    return;
  }

  if (!currentTab.url.startsWith('http://') && !currentTab.url.startsWith('https://')) {
    showStatus('safe', 'This page is safe', 'Local or internal page');
    return;
  }

  showLoading();

  // BUG FIX: use a Promise wrapper around sendMessage so we can handle the
  // "Could not establish connection" error that Manifest V3 throws when the
  // background service worker is sleeping.  Previously an uncaught rejection
  // left the popup stuck on the loading spinner forever.
  try {
    const response = await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        { type: 'PHISHGUARD_CHECK_URL', url: currentTab.url, tabId: currentTab.id },
        (resp) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(resp);
          }
        }
      );
    });
    displayResult(response?.result);
  } catch (error) {
    // Service worker was sleeping — fall back to a direct API call from the popup
    console.warn('Background unavailable, falling back to direct API call:', error.message);
    try {
      const apiResp = await fetch(`${API_BASE_URL}/analyze/quick`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: currentTab.url }),
      });
      if (!apiResp.ok) throw new Error(`API ${apiResp.status}`);
      const result = await apiResp.json();
      displayResult(result);
    } catch (apiErr) {
      showStatus('error', 'Analysis failed', apiErr.message);
    }
  }
}

// ==================== UI FUNCTIONS ====================

function showLoading() {
  statusContent.innerHTML = `
    <div class="loading">
      <div class="spinner"></div>
      <span>Analyzing page…</span>
    </div>
  `;
}

function showStatus(type, title, subtitle) {
  const icons = { safe: '✓', suspicious: '!', phishing: '✕', error: '?' };

  statusContent.innerHTML = `
    <div class="verdict">
      <div class="verdict-icon ${type}">${icons[type] || '?'}</div>
      <div class="verdict-text">
        <div class="status ${type}">${title}</div>
        <div class="score">${subtitle || ''}</div>
      </div>
    </div>
  `;
}

function displayResult(result) {
  // BUG FIX: handle null/undefined result more gracefully — this happens when
  // the background worker returns before the API responds
  if (!result) {
    showStatus('error', 'Analysis unavailable', 'Could not analyze this page');
    return;
  }

  currentResult = result;

  const verdict = result.verdict || 'UNKNOWN';
  const score = result.score || 0;
  const flags = result.flags || [];

  const statusMap = {
    SAFE:      { type: 'safe',      title: 'This page appears safe',        subtitle: `${Math.round(score * 100)}% risk score` },
    SUSPICIOUS:{ type: 'suspicious', title: 'Suspicious content detected',   subtitle: `${Math.round(score * 100)}% risk — proceed with caution` },
    PHISHING:  { type: 'phishing',  title: 'Phishing detected',             subtitle: `${Math.round(score * 100)}% risk — do not interact` },
    ERROR:     { type: 'error',     title: 'Analysis error',                subtitle: result.error || 'Unknown error' },
  };

  const status = statusMap[verdict] || statusMap.ERROR;
  showStatus(status.type, status.title, status.subtitle);
  displayFlags(flags);
}

function displayFlags(flags) {
  flagsContainer.innerHTML = '';

  if (!flags || flags.length === 0) {
    flagsContainer.innerHTML = '<span class="flag">No threats detected</span>';
    return;
  }

  const dangerFlags = new Set([
    'idn_homograph', 'suspicious_tld', 'brand_impersonation',
    'sensitive_info_request', 'sensitive_info', 'ip_address', 'suspicious_url',
  ]);

  // BUG FIX: deduplicate flags before rendering
  const unique = [...new Set(flags)];
  unique.forEach((flag) => {
    const severity = dangerFlags.has(flag) ? 'danger' : 'warning';
    const span = document.createElement('span');
    span.className = `flag flag-${severity}`;
    span.textContent = flag.replace(/_/g, ' ');
    flagsContainer.appendChild(span);
  });
}

// ==================== EVENT LISTENERS ====================

document.getElementById('scanBtn').addEventListener('click', async () => {
  if (!currentTab || !currentTab.url) return;
  showLoading();
  try {
    const response = await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        { type: 'PHISHGUARD_CHECK_URL', url: currentTab.url, tabId: currentTab.id },
        (resp) => {
          if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
          else resolve(resp);
        }
      );
    });
    displayResult(response?.result);
  } catch (error) {
    // Fallback: direct API call
    try {
      const apiResp = await fetch(`${API_BASE_URL}/analyze/quick`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: currentTab.url }),
      });
      const result = await apiResp.json();
      displayResult(result);
    } catch (apiErr) {
      showStatus('error', 'Scan failed', apiErr.message);
    }
  }
});

document.getElementById('settingsBtn').addEventListener('click', () => {
  chrome.tabs.create({ url: 'chrome://extensions/?id=' + chrome.runtime.id });
});

document.getElementById('reportLink').addEventListener('click', (e) => {
  e.preventDefault();
  if (currentTab) {
    chrome.runtime.sendMessage(
      { type: 'PHISHGUARD_REPORT', url: currentTab.url, verdict: currentResult },
      () => { if (chrome.runtime.lastError) { /* ignore */ } }
    );
  }
});

document.getElementById('dashboardLink').addEventListener('click', (e) => {
  e.preventDefault();
  chrome.tabs.create({ url: DASHBOARD_URL });
});

console.log('PhishGuard Popup Script Ready');
