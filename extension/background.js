import { SUPABASE_URL, SUPABASE_KEY } from './config.js';

let session = null;
let historyBuffer = [];
const BATCH_INTERVAL_MS = 60000; // Send history every 1 minute
let batchTimer = null;

// Edge function base URL (accepts our custom JWT)
const FUNCTIONS_URL = `${SUPABASE_URL}/functions/v1`;

// Initialize — restore session if extension was restarted
chrome.storage.local.get('session', (data) => {
  if (data.session) {
    session = data.session;
    startMonitoring();
  }
});

// Listen for login/logout from popup
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'LOGIN_SUCCESS') {
    chrome.storage.local.get('session', (data) => {
      session = data.session;
      startMonitoring();
    });
  } else if (msg.type === 'LOGOUT_SUCCESS') {
    stopMonitoring();
  }
});

function startMonitoring() {
  if (!session) return;
  console.log("Starting monitoring for", session.user.email);

  // Clear any existing alarm before creating new one
  chrome.alarms.clear("screenshot_alarm", () => {
    // Setup 15-minute screenshot alarm (fires every 15 minutes)
    chrome.alarms.create("screenshot_alarm", {
      delayInMinutes: 15,
      periodInMinutes: 15
    });
  });

  // Start history batching timer
  if (batchTimer) clearInterval(batchTimer);
  batchTimer = setInterval(flushHistoryBuffer, BATCH_INTERVAL_MS);

  // Take an immediate initial screenshot
  takeScreenshot();
}

function stopMonitoring() {
  session = null;
  console.log("Stopped monitoring");
  chrome.alarms.clear("screenshot_alarm");
  if (batchTimer) {
    clearInterval(batchTimer);
    batchTimer = null;
  }
  historyBuffer = [];
}

// Handle Screenshot Alarm
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "screenshot_alarm" && session) {
    takeScreenshot();
  }
});

async function takeScreenshot() {
  if (!session) return;
  try {
    // Get the current active tab first
    const [activeTab] = await new Promise((resolve) => {
      chrome.tabs.query({ active: true, currentWindow: true }, resolve);
    });

    if (!activeTab || !activeTab.id) {
      console.warn("Screenshot skipped: no active tab found");
      return;
    }

    // Capture visible tab — requires 'tabs' + host_permissions: <all_urls>
    const dataUrl = await new Promise((resolve, reject) => {
      chrome.tabs.captureVisibleTab(activeTab.windowId, { format: "jpeg", quality: 50 }, (data) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(data);
        }
      });
    });

    if (!dataUrl) return;

    const timestamp = Date.now();

    // Send image as base64 to Edge Function.
    // The Edge Function uses the service role key to upload to Supabase Storage internally
    // (our custom JWT is rejected by Supabase Storage directly).
    const uploadRes = await fetch(`${FUNCTIONS_URL}/work-sessions/screenshots`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': SUPABASE_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        image_base64: dataUrl,       // full data:image/jpeg;base64,... string
        taken_at: new Date(timestamp).toISOString(),
        is_blurred: false
      })
    });

    if (!uploadRes.ok) {
      console.error("Screenshot upload failed", await uploadRes.text());
    } else {
      const result = await uploadRes.json();
      console.log("Screenshot saved! Path:", result?.screenshot?.storage_path);
    }

  } catch (err) {
    console.error("Screenshot error:", err.message);
  }
}

// Handle History Tracking
chrome.history.onVisited.addListener((historyItem) => {
  if (!session) return;

  // Ignore chrome:// or internal extension pages
  if (historyItem.url.startsWith('chrome://') || historyItem.url.startsWith('chrome-extension://')) return;

  historyBuffer.push({
    url: historyItem.url,
    title: historyItem.title || "",
    visited_at: new Date(historyItem.lastVisitTime || Date.now()).toISOString(),
    duration_seconds: 0
  });

  if (historyBuffer.length > 50) {
    flushHistoryBuffer();
  }
});

async function flushHistoryBuffer() {
  if (historyBuffer.length === 0 || !session) return;

  const payload = [...historyBuffer];
  historyBuffer = [];

  try {
    // Route through Edge Function — accepts our custom JWT (not Supabase native JWT)
    const res = await fetch(`${FUNCTIONS_URL}/work-sessions/browser-history`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': SUPABASE_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      console.error("History flush failed", await res.text());
    } else {
      console.log(`Flushed ${payload.length} history items`);
    }
  } catch (err) {
    console.error("History flush error", err);
  }
}