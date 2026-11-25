import { Link } from "react-router-dom";
import BrandLogo from "./BrandLogo";
import { COMPANY } from "../data/company";
import { useI18n } from "../i18n/LanguageContext";

export default function SiteFooter() {
  const { t } = useI18n();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-dark/6 bg-white/50">
      <div className="max-w-5xl mx-auto px-5 sm:px-6 py-10 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-8">
          <div className="space-y-3 max-w-md">
            <BrandLogo className="text-3xl sm:text-4xl" />
            <p className="text-muted text-xs leading-relaxed">
              {t("home.footerTag", { year })}
            </p>
            <p className="text-dark/70 text-xs leading-relaxed">
              <span className="font-semibold text-dark">{COMPANY.name}</span>
              <br />
              {COMPANY.addressOneLine}
            </p>
            <p className="text-muted text-[11px] leading-relaxed">
              {t("footer.regLabel")}: {COMPANY.registrationNumber}
              <span className="mx-1.5 text-dark/20">·</span>
              {t("footer.vatLabel")}: {COMPANY.vatNumber}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 text-xs">
            <div className="space-y-2">
              <p className="font-bold text-dark/50 uppercase tracking-[0.14em] text-[10px]">
                {t("footer.explore")}
              </p>
              <Link to="/about" className="block text-muted hover:text-primary transition-colors">
                {t("nav.about")}
              </Link>
              <Link to="/checkout" className="block text-muted hover:text-primary transition-colors">
                {t("checkout.navLabel")}
              </Link>
              <Link to="/legal" className="block text-muted hover:text-primary transition-colors">
                {t("footer.legal")}
              </Link>
              <Link to="/terms" className="block text-muted hover:text-primary transition-colors">
                {t("footer.terms")}
              </Link>
            </div>
            <div className="space-y-2">
              <p className="font-bold text-dark/50 uppercase tracking-[0.14em] text-[10px]">
                {t("footer.contact")}
              </p>
              <a
                href={`mailto:${COMPANY.email}`}
                className="block text-muted hover:text-primary transition-colors break-all"
              >
                {COMPANY.email}
              </a>
              <a
                href={`tel:${COMPANY.phoneHref}`}
                className="block text-muted hover:text-primary transition-colors"
              >
                {COMPANY.phone}
              </a>
              <Link to="/" className="block text-muted hover:text-primary transition-colors">
                {t("footer.chatSupport")}
              </Link>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-dark/6 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-muted">
          <p>© {year} {COMPANY.name}. {t("footer.rights")}</p>
          <p className="sm:text-right">{t("footer.operatedBy")}</p>
        </div>
      </div>
    </footer>
  );
}
