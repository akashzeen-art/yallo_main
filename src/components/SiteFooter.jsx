import { Link } from "react-router-dom";
import BrandLogo from "./BrandLogo";
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
            </div>
            <div className="space-y-2">
              <p className="font-bold text-dark/50 uppercase tracking-[0.14em] text-[10px]">
                {t("footer.contact")}
              </p>
              <Link to="/" className="block text-muted hover:text-primary transition-colors">
                {t("footer.chatSupport")}
              </Link>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-dark/6 text-[11px] text-muted">
          <p>© {year} Yallo!. {t("footer.rights")}</p>
        </div>
      </div>
    </footer>
  );
}
