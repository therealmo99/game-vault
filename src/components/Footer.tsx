import { t, type Locale } from "../i18n";

interface FooterProps {
  locale: Locale;
}

export function Footer({ locale }: FooterProps) {
  const footer = t(locale, "footer");

  return (
    <footer className="border-t border-border-primary bg-bg-secondary relative noise-overlay" role="contentinfo">
      <div className="container py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          <div>
            <p className="text-brutal text-lg tracking-widest shimmer mb-4">VAULT</p>
            <p className="text-fg-muted text-sm leading-relaxed max-w-xs">
              {t(locale, "hero.subtitle")}
            </p>
          </div>

          <div>
            <h3 className="text-brutal text-xs tracking-widest text-fg-secondary mb-4 uppercase">
              {footer.domain}
            </h3>
            <ul className="space-y-2 text-sm text-fg-muted">
              <li><a href="#" className="hover:text-gold-500 transition-colors">Impressum</a></li>
              <li><a href="#" className="hover:text-gold-500 transition-colors">Datenschutz</a></li>
              <li><a href="#" className="hover:text-gold-500 transition-colors">Barrierefreiheit</a></li>
            </ul>
          </div>

          <div className="text-right md:text-left">
            <p className="text-brutal text-xs tracking-widest text-fg-secondary mb-2">
              {footer.built}
            </p>
            <p className="text-fg-muted text-sm">{footer.noTracking}</p>
            <div className="mt-6 flex justify-end md:justify-start gap-4">
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-fg-muted hover:text-gold-500 transition-colors" aria-label="GitHub">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-fg-muted hover:text-gold-500 transition-colors" aria-label="Twitter">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 1.75h-2.356l6.144 8.116h2.134z"/></svg>
              </a>
            </div>
          </div>
        </div>

        <div className="rule-gold-full mt-12 mb-8" />

        <p className="text-center text-fg-muted text-xs tracking-wider uppercase">
          © {new Date().getFullYear()} VAULT — {footer.domain}
        </p>
      </div>
    </footer>
  );
}