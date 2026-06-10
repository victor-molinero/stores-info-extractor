const MODE_KEY = "selectedExtractionMode";

const DEFAULT_CATEGORY = "No category";
const CATEGORY_OPTIONS = [
"Clothing & Apparel | Casual Wear",
"Education & Work Tools | Digital Books Subscription",
"Education & Work Tools | Electronics",
"Education & Work Tools | Learning Platform",
"Education & Work Tools | Mobile Service",
"Education & Work Tools | Software Subscription",
"Entertainment & Leisure | Streaming",
"Food | Beverages",
"Food | Dining Out",
"Food | Groceries",
"Food | Snacks",
"Health & Personal Care | Haircare",
"Health & Personal Care | Medication",
"Health & Personal Care | Nutrition & Supplements",
"Health & Personal Care | Oral Care",
"Health & Personal Care | Skincare",
"Health & Personal Care | Supplements",
"Housing & Utilities | Cleaning Supplies",
"Housing & Utilities | Electricity",
"Housing & Utilities | Gas",
"Housing & Utilities | Household Supplies",
"Housing & Utilities | Internet Service",
"Housing & Utilities | Maintenance & Repairs",
"Housing & Utilities | Rent",
"No category",
"Pet Care | Dog Food",
"Pet Care | Dog Food (Specialized)",
"Pet Care | Pet Supplies",
"Transportation | Rideshare",
"Transportation | Subscription",
];

const CATEGORY_OPTION_SET = new Set(CATEGORY_OPTIONS);

const MODES = {
  amazonOrders: {
    id: "amazonOrders",
    label: "Amazon Orders",
    helpText: "Open Amazon order history page, extract page by page, then download CSV.",
    urlHint: "https://www.amazon.com.mx/gp/css/order-history/",
    action: "extract-orders",
    storageKey: "rows_amazon_orders",
    filename: "amazon_orders.csv",
    emptyMessage: "No order cards were found on this page.",
    statusPrefix: "Reading the current Amazon orders page...",
    appendMode: true,
    columns: [
      { key: "orderId", label: "OrderNumber" },
      { key: "orderStatus", label: "Status" },
      { key: "date", label: "Date" },
      { key: "itemDescription", label: "Item Description" },
      { key: "price", label: "Price" },
      { key: "category", label: "Category" },
    ],
    csvColumns: ["OrderNumber", "Status", "Date", "Item Description", "Price", "Category"],
    csvRow: (row) => [row.orderId, row.orderStatus, row.date, row.itemDescription, row.price, row.category],
    rowKey: (row) => [row.orderId, row.orderStatus, row.date, row.itemDescription, row.price].join("|"),
    normalize: (row) => ({
      orderId: row?.orderId || "",
      orderStatus: row?.orderStatus || "",
      date: row?.date || "",
      itemDescription: row?.itemDescription || "",
      price: row?.price || "",
      category: normalizeCategoryValue(row?.category),
    }),
  },
  amazonTransactions: {
    id: "amazonTransactions",
    label: "Amazon Transactions",
    helpText: "Open Amazon Your Payments transactions page and extract page by page.",
    urlHint: "https://www.amazon.com.mx/cpe/yourpayments/transactions",
    action: "extract-transactions",
    storageKey: "rows_amazon_transactions",
    filename: "amazon_transactions.csv",
    emptyMessage: "No transaction rows were found on this page.",
    statusPrefix: "Reading the current Amazon transactions page...",
    appendMode: true,
    columns: [
      { key: "date", label: "Date" },
      { key: "account", label: "Account" },
      { key: "orderNumber", label: "OrderNumber" },
      { key: "amount", label: "Amount" },
    ],
    csvColumns: ["Date", "Account", "OrderNumber", "Amount"],
    csvRow: (row) => [row.date, row.account, row.orderNumber, row.amount],
    rowKey: (row) => [row.date, row.account, row.orderNumber, row.amount].join("|"),
    normalize: (row) => ({
      date: row?.date || "",
      account: row?.account || "",
      orderNumber: row?.orderNumber || "",
      amount: row?.amount || "",
    }),
  },
  walmartPrices: {
    id: "walmartPrices",
    label: "Walmart List Prices",
    helpText: "Open a Walmart list page and extract product rows.",
    urlHint: "https://www.walmart.com.mx/lists",
    action: "extract-walmart-prices",
    storageKey: "rows_walmart_prices",
    filename: "walmart_prices.csv",
    emptyMessage: "No product rows were found on this page.",
    statusPrefix: "Reading the current Walmart list page...",
    appendMode: true,
    columns: [
      { key: "product", label: "Product" },
      { key: "price", label: "Price" },
      { key: "category", label: "Category" },
    ],
    csvColumns: ["Product", "Price", "Category"],
    csvRow: (row) => [row.product, row.price, row.category],
    rowKey: (row) => [row.itemId, row.product, row.price].join("|"),
    normalize: (row) => ({
      itemId: row?.itemId || "",
      product: row?.product || "",
      price: row?.price || "",
      category: normalizeCategoryValue(row?.category),
    }),
  },
  walmartCart: {
    id: "walmartCart",
    label: "Walmart Cart",
    helpText: "Open Walmart cart page and extract ProductName, Quantity, Unit Price, and Total.",
    urlHint: "https://www.walmart.com.mx/cart",
    action: "extract-walmart-cart",
    storageKey: "rows_walmart_cart",
    filename: () => {
      const now = new Date();
      const pad = (value) => String(value).padStart(2, "0");
      return `walmart_cart_${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}.csv`;
    },
    emptyMessage: "No cart rows were found on this page.",
    statusPrefix: "Reading the current Walmart cart page...",
    appendMode: false,
    columns: [
      { key: "productName", label: "ProductName" },
      { key: "quantity", label: "Quantity" },
      { key: "unitPrice", label: "Unit Price" },
      { key: "total", label: "Total" },
      { key: "category", label: "Category" },
    ],
    csvColumns: ["ProductName", "Quantity", "Unit Price", "Total", "Category"],
    csvRow: (row) => [row.productName, row.quantity, row.unitPrice, row.total, row.category],
    rowKey: (row) => [row.itemId || "", row.productName, row.quantity, row.unitPrice, row.total].join("|"),
    normalize: (row) => ({
      itemId: row?.itemId || "",
      productName: row?.productName || "",
      quantity: Number.isInteger(row?.quantity) && row.quantity > 0 ? row.quantity : 1,
      unitPrice: row?.unitPrice || "",
      total: row?.total || "",
      category: normalizeCategoryValue(row?.category),
    }),
  },
};

const modeSelectEl = document.getElementById("mode-select");
const modeHelpEl = document.getElementById("mode-help");
const extractButton = document.getElementById("extract");
const downloadButton = document.getElementById("download");
const resetButton = document.getElementById("reset");
const statusEl = document.getElementById("status");
const countEl = document.getElementById("count");
const tableHeadRowEl = document.getElementById("table-head-row");
const rowsBodyEl = document.getElementById("rows-body");

function setStatus(message) {
  statusEl.textContent = message;
}

function escapeCsvValue(value) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

function buildCsv(rows, mode) {
  const lines = [mode.csvColumns.map(escapeCsvValue).join(",")];

  rows.forEach((row) => {
    lines.push(mode.csvRow(row).map(escapeCsvValue).join(","));
  });

  return `\uFEFF${lines.join("\n")}`;
}

async function getSelectedModeId() {
  const result = await chrome.storage.local.get(MODE_KEY);
  const savedModeId = result?.[MODE_KEY];
  return MODES[savedModeId] ? savedModeId : "amazonOrders";
}

function getSelectedMode() {
  return MODES[modeSelectEl.value] || MODES.amazonOrders;
}

function normalizeCategoryValue(category) {
  return CATEGORY_OPTION_SET.has(category) ? category : DEFAULT_CATEGORY;
}

async function getStoredRows(mode) {
  const result = await chrome.storage.session.get(mode.storageKey);
  const rows = Array.isArray(result[mode.storageKey]) ? result[mode.storageKey] : [];
  return rows.map((row) => mode.normalize(row));
}

async function saveRows(mode, rows) {
  await chrome.storage.session.set({ [mode.storageKey]: rows });
}

async function clearRows(mode) {
  await chrome.storage.session.remove(mode.storageKey);
}

function createCell(text) {
  const cell = document.createElement("td");
  cell.textContent = text || "";
  return cell;
}

function createCategoryCell(category, rowIndex) {
  const cell = document.createElement("td");
  const select = document.createElement("select");
  select.className = "category-select";
  select.dataset.rowIndex = String(rowIndex);
  select.setAttribute("aria-label", "Select category");

  CATEGORY_OPTIONS.forEach((optionValue) => {
    const option = document.createElement("option");
    option.value = optionValue;
    option.textContent = optionValue;
    option.selected = optionValue === normalizeCategoryValue(category);
    select.appendChild(option);
  });

  cell.appendChild(select);
  return cell;
}

function renderTableHeader(mode) {
  tableHeadRowEl.replaceChildren();

  mode.columns.forEach((column) => {
    const th = document.createElement("th");
    th.textContent = column.label;
    tableHeadRowEl.appendChild(th);
  });

  const actionsTh = document.createElement("th");
  actionsTh.textContent = "Actions";
  tableHeadRowEl.appendChild(actionsTh);
}

function renderRows(rows, mode) {
  countEl.textContent = `${rows.length} row${rows.length === 1 ? "" : "s"} saved`;
  downloadButton.disabled = rows.length === 0;

  rowsBodyEl.replaceChildren();

  if (rows.length === 0) {
    const emptyRow = document.createElement("tr");
    const emptyCell = document.createElement("td");
    emptyCell.colSpan = mode.columns.length + 1;
    emptyCell.className = "empty";
    emptyCell.textContent = "No extracted rows yet.";
    emptyRow.appendChild(emptyCell);
    rowsBodyEl.appendChild(emptyRow);
    return;
  }

  rows.forEach((row, index) => {
    const tr = document.createElement("tr");

    mode.columns.forEach((column) => {
      if (column.key === "category") {
        tr.appendChild(createCategoryCell(row[column.key], index));
      } else {
        tr.appendChild(createCell(String(row[column.key] ?? "")));
      }
    });

    const actionsCell = document.createElement("td");
    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "remove-item";
    removeButton.dataset.rowIndex = String(index);
    removeButton.textContent = "Remove";
    actionsCell.appendChild(removeButton);

    tr.appendChild(actionsCell);
    rowsBodyEl.appendChild(tr);
  });
}

async function refreshView() {
  const mode = getSelectedMode();
  renderTableHeader(mode);
  modeHelpEl.innerHTML = `${mode.helpText} Example: <a href="${mode.urlHint}" target="_blank" rel="noopener noreferrer">${mode.urlHint}</a>`;

  const rows = await getStoredRows(mode);
  renderRows(rows, mode);
}

async function persistSelectedMode() {
  await chrome.storage.local.set({ [MODE_KEY]: modeSelectEl.value });
}

function toRowsForMode(mode, sourceRows) {
  return sourceRows.map((row) => mode.normalize(row));
}

function mergeUniqueRows(mode, existingRows, incomingRows) {
  if (!mode.appendMode) {
    const deduped = [];
    const keys = new Set();
    incomingRows.forEach((row) => {
      const key = mode.rowKey(row);
      if (!keys.has(key)) {
        keys.add(key);
        deduped.push(row);
      }
    });
    return { rows: deduped, addedCount: deduped.length };
  }

  const merged = [...existingRows];
  const keys = new Set(existingRows.map((row) => mode.rowKey(row)));
  let addedCount = 0;

  incomingRows.forEach((row) => {
    const key = mode.rowKey(row);
    if (!keys.has(key)) {
      keys.add(key);
      merged.push(row);
      addedCount += 1;
    }
  });

  return { rows: merged, addedCount };
}

async function extractCurrentPage() {
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
      await refreshView();
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
      setStatus(`Current tab URL does not match ${mode.label}. Open a supported page such as ${mode.urlHint}.`);
    } else {
      setStatus(`Extraction failed: ${message}`);
    }
  } finally {
    extractButton.disabled = false;
  }
}

async function downloadRows() {
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

async function resetRows() {
  const mode = getSelectedMode();
  await clearRows(mode);
  setStatus("Session data reset.");
  renderRows([], mode);
}

async function removeRow(rowIndex) {
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

async function updateCategory(rowIndex, category) {
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

function populateModeSelect() {
  Object.values(MODES).forEach((mode) => {
    const option = document.createElement("option");
    option.value = mode.id;
    option.textContent = mode.label;
    modeSelectEl.appendChild(option);
  });
}

extractButton.addEventListener("click", extractCurrentPage);
downloadButton.addEventListener("click", downloadRows);
resetButton.addEventListener("click", resetRows);

modeSelectEl.addEventListener("change", async () => {
  await persistSelectedMode();
  setStatus("Mode updated.");
  await refreshView();
});

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

async function init() {
  populateModeSelect();
  const selectedModeId = await getSelectedModeId();
  modeSelectEl.value = selectedModeId;
  await refreshView();
}

init();
