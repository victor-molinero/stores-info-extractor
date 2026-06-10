import { MODES } from './config.js';
import { getStoredRows, saveRows, clearRows } from './storage.js';
import { buildCsv, mergeUniqueRows, toRowsForMode, normalizeCategoryValue } from './utils.js';
import { setStatus, renderRows, getRowsBodyElement } from './render.js';

let modeSelectEl;
let extractButton;
let downloadButton;
let resetButton;

export function setDOMElements(elements) {
  modeSelectEl = elements.modeSelectEl;
  extractButton = elements.extractButton;
  downloadButton = elements.downloadButton;
  resetButton = elements.resetButton;
}

export function getSelectedMode() {
  return MODES[modeSelectEl.value] || MODES.amazonOrders;
}

export async function extractCurrentPage() {
  const mode = getSelectedMode();
  extractButton.disabled = true;
  setStatus(mode.statusPrefix);

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab?.id) {
      throw new Error("No active tab found.");
    }

    const response = await new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(tab.id, { action: mode.action }, (result) => {
        const error = chrome.runtime.lastError;
        if (error) {
          reject(new Error(error.message));
          return;
        }

        resolve(result);
      });
    });

    const extractedRows = Array.isArray(response?.rows) ? response.rows : [];

    if (extractedRows.length === 0) {
      setStatus(mode.emptyMessage);
      const storedRows = await getStoredRows(mode);
      renderRows(storedRows, mode);
      return;
    }

    const incomingRows = toRowsForMode(mode, extractedRows);
    const existingRows = await getStoredRows(mode);
    const { rows: storedRows, addedCount } = mergeUniqueRows(mode, existingRows, incomingRows);

    await saveRows(mode, storedRows);

    if (mode.appendMode) {
      setStatus(`Added ${addedCount} new row${addedCount === 1 ? "" : "s"} (${extractedRows.length} extracted on this page).`);
    } else {
      setStatus(`Loaded ${storedRows.length} row${storedRows.length === 1 ? "" : "s"} from the current page.`);
    }

    renderRows(storedRows, mode);
  } catch (error) {
    const message = String(error?.message || "");

    if (/Could not establish connection|Receiving end does not exist|The message port closed/i.test(message)) {
      const mode = getSelectedMode();
      setStatus(`Current tab URL does not match ${mode.label}. Open a supported page such as ${mode.urlHint}.`);
    } else {
      setStatus(`Extraction failed: ${message}`);
    }
  } finally {
    extractButton.disabled = false;
  }
}

export async function downloadRows() {
  const mode = getSelectedMode();
  const rows = await getStoredRows(mode);

  if (rows.length === 0) {
    setStatus("Nothing to download yet.");
    return;
  }

  const csv = buildCsv(rows, mode);
  const dataUrl = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
  const filename = typeof mode.filename === "function" ? mode.filename() : mode.filename;

  chrome.runtime.sendMessage({ action: "downloadCSV", dataUrl, filename });
  setStatus(`Downloading ${rows.length} saved row${rows.length === 1 ? "" : "s"}.`);
}

export async function resetRows() {
  const mode = getSelectedMode();
  await clearRows(mode);
  setStatus("Session data reset.");
  renderRows([], mode);
}

export async function removeRow(rowIndex) {
  const mode = getSelectedMode();
  const rows = await getStoredRows(mode);

  if (rowIndex < 0 || rowIndex >= rows.length) {
    return;
  }

  rows.splice(rowIndex, 1);
  await saveRows(mode, rows);
  setStatus("Item removed from the list.");
  renderRows(rows, mode);
}

export async function updateCategory(rowIndex, category) {
  const mode = getSelectedMode();
  const supportsCategory = mode.columns.some((column) => column.key === "category");
  if (!supportsCategory) {
    return;
  }

  const rows = await getStoredRows(mode);
  if (rowIndex < 0 || rowIndex >= rows.length) {
    return;
  }

  rows[rowIndex] = {
    ...rows[rowIndex],
    category: normalizeCategoryValue(category),
  };

  await saveRows(mode, rows);
  setStatus("Category updated.");
  renderRows(rows, mode);
}

export function attachEventListeners() {
  extractButton.addEventListener("click", extractCurrentPage);
  downloadButton.addEventListener("click", downloadRows);
  resetButton.addEventListener("click", resetRows);

  modeSelectEl.addEventListener("change", async () => {
    // Mode persistence handled by sidebar.js
    setStatus("Mode updated.");
  });

  const rowsBodyEl = getRowsBodyElement();

  rowsBodyEl.addEventListener("click", async (event) => {
    const button = event.target.closest("button.remove-item");
    if (!button) {
      return;
    }

    const rowIndex = Number(button.dataset.rowIndex);
    if (!Number.isInteger(rowIndex)) {
      return;
    }

    await removeRow(rowIndex);
  });

  rowsBodyEl.addEventListener("change", async (event) => {
    const select = event.target.closest("select.category-select");
    if (!select) {
      return;
    }

    const rowIndex = Number(select.dataset.rowIndex);
    if (!Number.isInteger(rowIndex)) {
      return;
    }

    await updateCategory(rowIndex, select.value);
  });
}
