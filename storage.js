import { MODE_KEY, MODES } from './config.js';
import { normalizeCategoryValue } from './utils.js';

export async function getSelectedModeId() {
  const result = await chrome.storage.local.get(MODE_KEY);
  const savedModeId = result?.[MODE_KEY];
  return MODES[savedModeId] ? savedModeId : "amazonOrders";
}

export async function getStoredRows(mode) {
  const result = await chrome.storage.session.get(mode.storageKey);
  const rows = Array.isArray(result[mode.storageKey]) ? result[mode.storageKey] : [];
  return rows.map((row) => mode.normalize(row));
}

export async function saveRows(mode, rows) {
  await chrome.storage.session.set({ [mode.storageKey]: rows });
}

export async function clearRows(mode) {
  await chrome.storage.session.remove(mode.storageKey);
}

export async function persistSelectedMode(modeId) {
  await chrome.storage.local.set({ [MODE_KEY]: modeId });
}
