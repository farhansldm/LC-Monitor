if (window.__lcMonitorContent) {
  /* already injected */
} else {
  window.__lcMonitorContent = true;

  window.postMessage(
    { source: "lc-monitor-ext", type: "LC_MONITOR_PING" },
    window.location.origin,
  );

  window.addEventListener("message", (event) => {
    if (event.source !== window) return;
    if (event.origin !== window.location.origin) return;
    const data = event.data;
    if (!data || data.source !== "lc-monitor") return;

    const type = data.type === "LC_MONITOR_ACTIVATE" || data.type === "ACTIVATE_MONITORING"
      ? "SAVE_SESSION"
      : data.type === "LC_MONITOR_DEACTIVATE"
        ? "DEACTIVATE_MONITORING"
        : data.type === "LC_MONITOR_CLOCKED_IN"
          ? "CLOCKED_IN"
          : data.type === "LC_MONITOR_CLOCKED_OUT"
            ? "CLOCKED_OUT"
            : data.type;

    if (!type) return;

    chrome.runtime.sendMessage(
      { type, token: data.token, user: data.user },
      () => void chrome.runtime.lastError,
    );
  });
}
