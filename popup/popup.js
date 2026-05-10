// Popup script
document.getElementById('btn-capture').addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, async ([tab]) => {
    // Injecter les 3 fichiers dans l'ordre : highlight → overlay → inspector
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: [
          'content/highlight.js',  // SCHighlight
          'content/overlay.js',    // SCOverlay
          'content/inspector.js',  // orchestration + messages
        ],
      });
    } catch (e) {
      // Déjà injectés ou page non injectable (chrome://, etc.)
    }

    chrome.tabs.sendMessage(tab.id, { action: 'activateInspector' }, () => {
      if (chrome.runtime.lastError) {
        console.error('Screen Code:', chrome.runtime.lastError.message);
        return;
      }
      window.close();
    });
  });
});
