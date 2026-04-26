const FINANCE_DATA_CHANGED = "finance-data-changed";

export function notifyFinanceDataChanged() {
  window.dispatchEvent(new CustomEvent(FINANCE_DATA_CHANGED));
}

export function subscribeToFinanceDataChanged(callback: () => void) {
  window.addEventListener(FINANCE_DATA_CHANGED, callback);
  return () => window.removeEventListener(FINANCE_DATA_CHANGED, callback);
}
