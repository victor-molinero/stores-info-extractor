# Stores Info Extractor

Chrome extension (Manifest V3) that unifies multiple extraction workflows into one side panel with selectable extraction modes.

## Included extraction modes

- Amazon Orders
- Amazon Transactions (Your Payments)
- Walmart List Prices
- Walmart Cart

## Features

- Select extraction mode from one side panel.
- Extract rows from current page.
- Keep mode-specific rows in `chrome.storage.session`.
- De-duplicate repeated rows in append modes.
- Replace rows with current page snapshot for Walmart cart mode.
- Remove individual rows and reset session data.
- Download CSV (UTF-8 with BOM for spreadsheet compatibility).

## Style baseline

This extension intentionally keeps the same side panel visual style as the Amazon Orders extension, including colors, typography, spacing, buttons, and table treatment.

## Installation (Developer Mode)

1. Open Chrome and go to `chrome://extensions`.
2. Enable Developer mode.
3. Click **Load unpacked**.
4. Select this folder: `online-purchases-info-extractor`.

## How to use

1. Open one supported page (according to the selected mode):
   - Amazon Orders: `https://www.amazon.com.mx/gp/css/order-history/`
   - Amazon Transactions: `https://www.amazon.com.mx/cpe/yourpayments/transactions`
   - Walmart Lists: `https://www.walmart.com.mx/lists`
   - Walmart Cart: `https://www.walmart.com.mx/cart`
2. Click the extension icon to open side panel.
3. Select extraction mode.
4. Click **Extract current page**.
5. Repeat where relevant (pagination/manual navigation), then click **Download CSV**.

## Notes

- Data is session-based (`chrome.storage.session`) and grouped by mode.
- Website DOM/data structures can change; extractor selectors may need maintenance.
- Current implementation preserves behavior from the original dedicated extensions.
