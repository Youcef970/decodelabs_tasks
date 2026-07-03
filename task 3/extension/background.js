// Background Service Worker for PhishGuard Extension

const API_BASE_URL = 'http://localhost:8000/api/v1';
const inFlight = new Set(); // tracks URLs currently being analyzed, not a global lock
const cache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

console.log('PhishGuard Extension Background Service Worker Started');

// ==================== URL ANALYSIS ====================

async function analyzeURL(url, tabId) {
  const cached = cache.get(url);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    sendResultToTab(tabId, cached.result);
    return cached.result;
  }

  if (inFlight.has(url)) return null;
  inFlight.add(url);

  try {
    const response = await fetch(`${API_BASE_URL}/analyze/quick`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const result = await response.json();
    cache.set(url, { result, timestamp: Date.now() });
    sendResultToTab(tabId, result);
    return result;
  } catch (error) {
    console.error('Analysis error:', error);
    const errorResult = { verdict: 'ERROR', error: error.message };
    sendResultToTab(tabId, errorResult);
    return errorResult;
  } finally {
    inFlight.delete(url);
  }
}

function sendResultToTab(tabId, result) {
  if (tabId == null) return;
  chrome.tabs.sendMessage(tabId, { type: 'PHISHGUARD_RESULT', data: result }).catch(() => {
    // Tab might not have the content script ready yet, or may have closed.
    console.debug('Could not send result to tab', tabId);
  });
}

// ==================== EVENT LISTENERS ====================

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    if (tab.url.startsWith('http://') || tab.url.startsWith('https://')) {
      analyzeURL(tab.url, tabId);
    }
  }
});

chrome.webNavigation.onCommitted.addListener((details) => {
  if (details.frameId === 0) {
    const url = details.url;
    if (url.startsWith('http://') || url.startsWith('https://')) {
      analyzeURL(url, details.tabId);
    }
  }
});

// ==================== MESSAGE HANDLING ====================

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'PHISHGUARD_CHECK_URL': {
      const tabId = message.tabId ?? sender.tab?.id;
      if (message.url) {
        analyzeURL(message.url, tabId).then((result) => {
          sendResponse({ status: 'done', result });
        });
        return true; // keep the message channel open for the async response
      }
      sendResponse({ status: 'error', error: 'No URL provided' });
      return false;
    }

    case 'PHISHGUARD_GET_CACHE': {
      const cached = message.url ? cache.get(message.url) : null;
      sendResponse({ cached: cached || null });
      return false;
    }

    case 'PHISHGUARD_CLEAR_CACHE': {
      cache.clear();
      sendResponse({ status: 'cleared' });
      return false;
    }

    case 'PHISHGUARD_GET_STATS': {
      sendResponse({ cacheSize: cache.size, inFlightCount: inFlight.size });
      return false;
    }

    case 'PHISHGUARD_REPORT': {
      fetch(
        `${API_BASE_URL}/report?url=${encodeURIComponent(message.url)}&verdict=${encodeURIComponent(
          message.verdict?.verdict || 'UNKNOWN'
        )}`
      )
        .then(() => sendResponse({ status: 'reported' }))
        .catch((error) => sendResponse({ status: 'error', error: error.message }));
      return true;
    }

    default:
      return false;
  }
});

// ==================== CONTEXT MENU ====================

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'analyzeLink',
    title: 'Check link with PhishGuard',
    contexts: ['link'],
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'analyzeLink' && info.linkUrl) {
    analyzeURL(info.linkUrl, tab?.id);
  }
});

// ==================== CACHE CLEANUP ====================

chrome.alarms.create('cleanCache', { periodInMinutes: 60 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'cleanCache') {
    const now = Date.now();
    for (const [key, value] of cache) {
      if (now - value.timestamp > 60 * 60 * 1000) {
        cache.delete(key);
      }
    }
  }
});

console.log('PhishGuard Background Service Worker Ready');
