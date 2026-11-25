/** Fixed Yallo checkout offer + post-continue destination. */
export const CHECKOUT_PLAN = {
  id: "monthly",
  label: "Monthly",
  price: 59,
  currency: "EUR",
  currencySymbol: "€",
  period: "month",
  displayPrice: "€59",
  displayPeriod: "/ month",
};

export const PRODUCT_HOME_URL = "https://yallo.demoproduct.fun/";

export const CHECKOUT_STORAGE_KEYS = {
  MOBILE: "yallo:checkoutMobile",
  PLAN: "yallo:checkoutPlan",
  PRICE: "yallo:checkoutPrice",
  STARTED_AT: "yallo:checkoutStartedAt",
};

/** Digits only, last 15 — international friendly. */
export function normalizeMobileDigits(value) {
  return String(value || "").replace(/\D/g, "").slice(0, 15);
}

export function isValidMobileDigits(digits) {
  return /^\d{8,15}$/.test(digits);
}

export function persistCheckoutLead(mobileDigits, dialCode = "") {
  const clean = normalizeMobileDigits(mobileDigits);
  const full = `${dialCode}${clean}`.replace(/\s/g, "");
  try {
    localStorage.setItem(CHECKOUT_STORAGE_KEYS.MOBILE, clean);
    localStorage.setItem(CHECKOUT_STORAGE_KEYS.PLAN, CHECKOUT_PLAN.id);
    localStorage.setItem(CHECKOUT_STORAGE_KEYS.PRICE, String(CHECKOUT_PLAN.price));
    localStorage.setItem(CHECKOUT_STORAGE_KEYS.STARTED_AT, new Date().toISOString());
    localStorage.setItem("userMobile", clean);
    sessionStorage.setItem(CHECKOUT_STORAGE_KEYS.MOBILE, clean);
    if (full) localStorage.setItem("yallo:checkoutMobileFull", full);
  } catch {
    /* ignore quota / private mode */
  }
  return { clean, full };
}

/** After continue — open the live product with msisdn for continuity. */
export function buildProductContinueUrl(mobileDigits, dialCode = "") {
  const { clean } = persistCheckoutLead(mobileDigits, dialCode);
  const url = new URL(PRODUCT_HOME_URL);
  if (clean) url.searchParams.set("msisdn", clean);
  url.searchParams.set("plan", CHECKOUT_PLAN.id);
  url.searchParams.set("amount", String(CHECKOUT_PLAN.price));
  url.searchParams.set("currency", CHECKOUT_PLAN.currency);
  return url.toString();
}

export const DIAL_CODES = [
  { code: "+31", label: "NL +31" },
  { code: "+33", label: "FR +33" },
  { code: "+34", label: "ES +34" },
  { code: "+39", label: "IT +39" },
  { code: "+49", label: "DE +49" },
  { code: "+32", label: "BE +32" },
  { code: "+971", label: "AE +971" },
  { code: "+91", label: "IN +91" },
  { code: "+1", label: "US +1" },
  { code: "+44", label: "UK +44" },
];
