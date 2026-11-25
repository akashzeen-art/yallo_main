import { Link } from "react-router-dom";
import BrandLogo from "../components/BrandLogo";
import SiteFooter from "../components/SiteFooter";
import { COMPANY } from "../data/company";
import { useI18n } from "../i18n/LanguageContext";

export default function TermsPage() {
  const { t } = useI18n();

  const companyVars = {
    company: COMPANY.name,
    email: COMPANY.email,
    phone: COMPANY.phone,
  };

  const sections = [
    { title: t("terms.s1Title"), body: t("terms.s1Body") },
    { title: t("terms.s2Title"), body: t("terms.s2Body") },
    { title: t("terms.s3Title"), body: t("terms.s3Body") },
    { title: t("terms.s4Title"), body: t("terms.s4Body") },
    { title: t("terms.s5Title"), body: t("terms.s5Body") },
    { title: t("terms.s6Title"), body: t("terms.s6Body") },
    { title: t("terms.s7Title"), body: t("terms.s7Body", companyVars) },
    { title: t("terms.s8Title"), body: t("terms.s8Body", companyVars) },
  ];

  return (
    <div className="min-h-screen hero-bg overflow-x-hidden flex flex-col">
      <section className="relative flex-1 pt-[max(7rem,calc(env(safe-area-inset-top)+5.5rem))] pb-16 px-4">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="float-orb w-72 h-72 bg-primary/12 top-20 right-1/4 animate-pulse-slow" />
          <div className="float-orb w-56 h-56 bg-secondary/12 bottom-8 left-10 animate-pulse-slow" style={{ animationDelay: "1.2s" }} />
        </div>

        <div className="relative z-10 max-w-2xl mx-auto">
          <div className="flex justify-center mb-6">
            <BrandLogo className="text-3xl sm:text-4xl" />
          </div>
          <p className="text-secondary text-xs font-semibold uppercase tracking-[0.2em] mb-3 text-center">
            {t("terms.tag")}
          </p>
          <h1 className="font-headline text-4xl sm:text-5xl font-extrabold text-dark mb-3 text-center">
            {t("terms.title")}
          </h1>
          <p className="text-muted text-sm leading-relaxed text-center mb-2">
            {t("terms.updated")}
          </p>
          <p className="text-muted text-sm sm:text-base leading-relaxed text-center mb-10 max-w-lg mx-auto">
            {t("terms.intro", companyVars)}
          </p>

          <div className="space-y-4">
            {sections.map((s, i) => (
              <article key={s.title} className="bg-white border border-dark/6 rounded-2xl p-5 sm:p-6">
                <h2 className="font-display font-bold text-dark text-base sm:text-lg mb-2">
                  <span className="text-primary/70 mr-2">{String(i + 1).padStart(2, "0")}</span>
                  {s.title}
                </h2>
                <p className="text-muted text-sm leading-relaxed whitespace-pre-line">{s.body}</p>
              </article>
            ))}
          </div>

          <div className="flex flex-wrap justify-center gap-3 mt-10">
            <Link
              to="/legal"
              className="text-sm font-semibold px-5 py-2.5 rounded-xl border border-dark/10 bg-white text-dark hover:border-primary/40 hover:text-primary transition-colors"
            >
              {t("footer.legal")}
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
