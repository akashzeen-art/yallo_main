import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import BrandLogo from "../components/BrandLogo";
import {
  CHECKOUT_PLAN,
  CHECKOUT_STORAGE_KEYS,
  DIAL_CODES,
  buildProductContinueUrl,
  isValidMobileDigits,
  normalizeMobileDigits,
} from "../data/checkout";
import { useI18n } from "../i18n/LanguageContext";

export default function CheckoutPage() {
  const { t } = useI18n();
  const [dial, setDial] = useState("+31");
  const [mobile, setMobile] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const stored =
        sessionStorage.getItem(CHECKOUT_STORAGE_KEYS.MOBILE) ||
        localStorage.getItem(CHECKOUT_STORAGE_KEYS.MOBILE) ||
        "";
      if (stored) setMobile(normalizeMobileDigits(stored));
    } catch {
      /* ignore */
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    const digits = normalizeMobileDigits(mobile);
    if (!isValidMobileDigits(digits)) {
      setError(t("checkout.invalidMobile"));
      return;
    }
    if (!termsAccepted) {
      setError(t("checkout.acceptTerms"));
      return;
    }

    setSubmitting(true);
    const dest = buildProductContinueUrl(digits, dial);
    window.location.href = dest;
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden px-4 py-10">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 90% 70% at 15% 0%, rgba(255,77,184,0.22) 0%, transparent 55%), radial-gradient(ellipse 70% 55% at 90% 10%, rgba(124,58,237,0.18) 0%, transparent 50%), radial-gradient(ellipse 60% 50% at 50% 100%, rgba(233,30,140,0.12) 0%, transparent 55%), #1a0b16",
        }}
      />
      <div className="float-orb w-[22rem] h-[22rem] bg-primary/25 -top-16 -left-10 animate-pulse-slow pointer-events-none" />
      <div
        className="float-orb w-[18rem] h-[18rem] bg-secondary/20 -bottom-10 -right-8 animate-pulse-slow pointer-events-none"
        style={{ animationDelay: "1.2s" }}
      />

      <div className="relative z-10 w-full max-w-md">
        <div
          className="rounded-3xl p-6 sm:p-7 border border-white/15 shadow-2xl"
          style={{
            background: "rgba(255,255,255,0.10)",
            backdropFilter: "blur(18px)",
            WebkitBackdropFilter: "blur(18px)",
          }}
        >
          <div className="flex justify-center mb-4">
            <BrandLogo className="text-4xl sm:text-5xl" />
          </div>

          <h1 className="font-headline text-3xl sm:text-4xl font-extrabold text-white text-center leading-tight mb-1">
            {t("checkout.title")}
          </h1>
          <p className="text-center text-pink-200/90 text-sm sm:text-base font-semibold mb-5">
            {t("checkout.sub")}
          </p>

          <div className="rounded-2xl border border-pink-300/30 bg-white/5 px-4 py-3 mb-5 text-center">
            <p className="text-white/90 text-sm leading-snug">
              {t("checkout.priceLead")}{" "}
              <strong className="text-pink-200 text-base">
                {CHECKOUT_PLAN.displayPrice}
                {CHECKOUT_PLAN.displayPeriod}
              </strong>
            </p>
            <p className="text-white/55 text-[11px] mt-1 uppercase tracking-[0.14em] font-bold">
              {t("checkout.planBadge")}
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <label className="block text-white font-semibold mb-1.5 text-sm">
              {t("checkout.mobileLabel")}
            </label>
            <div className="flex rounded-xl overflow-hidden border border-white/20 bg-white/10 mb-1">
              <select
                value={dial}
                onChange={(e) => setDial(e.target.value)}
                disabled={submitting}
                className="bg-transparent text-white text-sm px-2.5 py-3 border-r border-white/20 focus:outline-none max-w-[7.5rem]"
                aria-label={t("checkout.countryCode")}
              >
                {DIAL_CODES.map((d) => (
                  <option key={d.code} value={d.code} className="text-dark">
                    {d.label}
                  </option>
                ))}
              </select>
              <input
                type="tel"
                name="mobile"
                inputMode="numeric"
                autoComplete="tel-national"
                value={mobile}
                onChange={(e) => {
                  setMobile(normalizeMobileDigits(e.target.value));
                  setError("");
                }}
                placeholder={t("checkout.mobilePh")}
                required
                disabled={submitting}
                className="w-full px-3 py-3 bg-transparent text-white placeholder-white/45 text-sm focus:outline-none"
              />
            </div>
            {error && (
              <p className="text-red-300 text-sm font-bold text-center mt-2 leading-snug">{error}</p>
            )}

            <label className="flex items-start gap-2.5 mt-4 mb-5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => {
                  setTermsAccepted(e.target.checked);
                  setError("");
                }}
                className="mt-0.5 h-4 w-4 accent-[#e91e8c] shrink-0 cursor-pointer"
              />
              <span className="text-white/85 text-sm leading-snug">
                {t("checkout.termsAge")}
              </span>
            </label>

            <button
              type="submit"
              disabled={submitting || !termsAccepted}
              className="w-full btn-glow text-white font-bold py-3.5 px-6 rounded-2xl text-sm sm:text-base disabled:opacity-50"
            >
              {submitting ? t("checkout.continuing") : t("checkout.continue")}
            </button>
          </form>

          <div className="mt-5 text-center space-y-1.5">
            <p className="text-white/70 text-xs leading-snug">{t("checkout.afterNote")}</p>
            <p className="text-white/55 text-xs">
              {t("checkout.needHelp")}{" "}
              <Link to="/" className="text-pink-200 underline hover:text-white">
                {t("footer.chatSupport")}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
