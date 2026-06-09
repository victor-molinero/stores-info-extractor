async function enableSidePanelActionBehavior() {
  if (!chrome.sidePanel?.setPanelBehavior) {
    return;
  }

  try {
    await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  } catch (error) {
    console.error("Unable to configure side panel behavior", error);
  }
}

chrome.runtime.onInstalled.addListener(() => {
  enableSidePanelActionBehavior();
});

chrome.runtime.onStartup.addListener(() => {
  enableSidePanelActionBehavior();
});

enableSidePanelActionBehavior();

chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.action !== "downloadCSV") {
    return;
  }

  chrome.downloads.download({
    url: msg.dataUrl,
    filename: msg.filename || "online_purchases.csv",
  });
});
