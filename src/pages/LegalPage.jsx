import { Link } from "react-router-dom";
import BrandLogo from "../components/BrandLogo";
import SiteFooter from "../components/SiteFooter";
import { COMPANY } from "../data/company";
import { useI18n } from "../i18n/LanguageContext";

export default function LegalPage() {
  const { t } = useI18n();

  const rows = [
    { label: t("legal.companyLabel"), value: COMPANY.name },
    { label: t("legal.formLabel"), value: COMPANY.legalForm },
    {
      label: t("legal.addressLabel"),
      value: (
        <span className="block whitespace-pre-line">
          {COMPANY.addressLines.join("\n")}
        </span>
      ),
    },
    { label: t("legal.regLabel"), value: COMPANY.registrationNumber },
    { label: t("legal.vatLabel"), value: COMPANY.vatNumber },
    {
      label: t("legal.emailLabel"),
      value: (
        <a href={`mailto:${COMPANY.email}`} className="text-primary hover:underline break-all">
          {COMPANY.email}
        </a>
      ),
    },
    {
      label: t("legal.phoneLabel"),
      value: (
        <a href={`tel:${COMPANY.phoneHref}`} className="text-primary hover:underline">
          {COMPANY.phone}
        </a>
      ),
    },
  ];

  return (
    <div className="min-h-screen hero-bg overflow-x-hidden flex flex-col">
      <section className="relative flex-1 pt-[max(7rem,calc(env(safe-area-inset-top)+5.5rem))] pb-16 px-4">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="float-orb w-72 h-72 bg-secondary/15 top-16 left-1/4 animate-pulse-slow" />
          <div className="float-orb w-56 h-56 bg-primary/10 bottom-10 right-8 animate-pulse-slow" style={{ animationDelay: "1s" }} />
        </div>

        <div className="relative z-10 max-w-2xl mx-auto">
          <div className="flex justify-center mb-6">
            <BrandLogo className="text-3xl sm:text-4xl" />
          </div>
          <p className="text-secondary text-xs font-semibold uppercase tracking-[0.2em] mb-3 text-center">
            {t("legal.tag")}
          </p>
          <h1 className="font-headline text-4xl sm:text-5xl font-extrabold text-dark mb-3 text-center">
            {t("legal.title")}
          </h1>
          <p className="text-muted text-sm sm:text-base leading-relaxed text-center mb-10 max-w-lg mx-auto">
            {t("legal.intro")}
          </p>

          <div className="bg-white border border-dark/6 rounded-2xl overflow-hidden divide-y divide-dark/6">
            {rows.map((row) => (
              <div key={row.label} className="px-5 py-4 sm:px-6 sm:py-5 grid sm:grid-cols-[11rem_1fr] gap-1 sm:gap-4">
                <dt className="text-[11px] font-bold uppercase tracking-[0.12em] text-dark/45 pt-0.5">
                  {row.label}
                </dt>
                <dd className="text-sm text-dark font-medium leading-relaxed">{row.value}</dd>
              </div>
            ))}
          </div>

          <p className="text-muted text-xs leading-relaxed mt-6 text-center">
            {t("legal.contactNote")}
          </p>

          <div className="flex flex-wrap justify-center gap-3 mt-8">
            <Link
              to="/terms"
              className="text-sm font-semibold px-5 py-2.5 rounded-xl border border-dark/10 bg-white text-dark hover:border-primary/40 hover:text-primary transition-colors"
            >
              {t("footer.terms")}
            </Link>
            <Link to="/" className="btn-glow text-white font-semibold px-6 py-2.5 rounded-xl text-sm">
              {t("common.home")}
            </Link>
          </div>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
