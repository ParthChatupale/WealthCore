function getCurrencyCode(currency: string | null | undefined) {
  if (!currency) {
    return "INR";
  }

  const [code] = currency.split(" ");
  return code || "INR";
}

function getLocaleForCurrency(code: string) {
  switch (code) {
    case "INR":
      return "en-IN";
    case "GBP":
      return "en-GB";
    case "EUR":
      return "de-DE";
    case "JPY":
      return "ja-JP";
    default:
      return "en-US";
  }
}

export function formatCurrency(amount: number, currency: string | null | undefined) {
  const code = getCurrencyCode(currency);

  try {
    return new Intl.NumberFormat(getLocaleForCurrency(code), {
      style: "currency",
      currency: code,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${code} ${amount.toFixed(2)}`;
  }
}

export function formatCurrencyCode(currency: string | null | undefined) {
  return getCurrencyCode(currency);
}
