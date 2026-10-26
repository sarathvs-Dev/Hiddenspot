import { Menu, Search, X, type LucideIcon } from 'lucide-react';
import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router';
import { Icon } from './Icon';
import styles from './Navigation.module.css';
import { cx } from './utils';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Match the path exactly. Use for the home route. */
  end?: boolean;
  /** Small count shown next to the label, e.g. saved places. */
  badge?: number;
  /** Render as the primary call to action. */
  emphasis?: boolean;
}

export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" width="30" height="30" aria-hidden="true" className={className}>
      <rect width="32" height="32" rx="10" fill="var(--color-primary)" />
      <path d="M8 22.5 14 12l4 6 2.5-3.5L25 22.5Z" fill="var(--palette-ivory50)" />
      <circle cx="22" cy="10" r="2.5" fill="var(--color-highlight-strong)" />
    </svg>
  );
}

export interface SiteHeaderProps {
  brand: ReactNode;
  homeHref: string;
  items: NavItem[];
  /** Where the header search submits. Hidden when omitted. */
  searchHref?: string;
}

/**
 * Sticky header. Wide screens show text navigation and a compact search; narrow screens
 * collapse navigation into an accessible disclosure menu.
 */
export function SiteHeader({ brand, homeHref, items, searchHref }: SiteHeaderProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const menuId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [lastPath, setLastPath] = useState(pathname);

  // Close the menu after navigation (derived during render, no effect needed).
  if (pathname !== lastPath) {
    setLastPath(pathname);
    if (open) setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const onSearch = (event: FormEvent) => {
    event.preventDefault();
    if (!searchHref) return;
    const q = query.trim();
    navigate(q ? `${searchHref}?query=${encodeURIComponent(q)}` : searchHref);
    setQuery('');
  };

  const showSearch =
    Boolean(searchHref) && pathname !== homeHref && !pathname.startsWith(searchHref ?? '\0');

  return (
    <header className={styles.header}>
      <div className={cx('container', styles.inner)}>
        <Link to={homeHref} className={styles.brand}>
          <BrandMark />
          <span>{brand}</span>
        </Link>

        {showSearch ? (
          <form role="search" className={styles.search} onSubmit={onSearch}>
            <Icon icon={Search} size="sm" />
            <label className="visually-hidden" htmlFor={`${menuId}-search`}>
              Search places
            </label>
            <input
              id={`${menuId}-search`}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search places or districts"
            />
          </form>
        ) : null}

        <nav aria-label="Primary" className={styles.topNav}>
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={cx(styles.topLink, item.emphasis && styles.topLinkEmphasis)}
            >
              {item.emphasis ? <Icon icon={item.icon} size="sm" /> : null}
              {item.label}
              {item.badge ? (
                <span className={styles.badge} aria-label={`${item.badge} saved`}>
                  {item.badge}
                </span>
              ) : null}
            </NavLink>
          ))}
        </nav>

        <button
          ref={buttonRef}
          type="button"
          className={styles.menuButton}
          aria-expanded={open}
          aria-controls={menuId}
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((v) => !v)}
        >
          <Icon icon={open ? X : Menu} size="md" />
        </button>
      </div>

      <nav
        id={menuId}
        aria-label="Primary mobile"
        className={cx(styles.mobileMenu, open && styles.mobileMenuOpen)}
        hidden={!open}
      >
        <ul className="container">
          {items.map((item) => (
            <li key={item.to}>
              <NavLink to={item.to} end={item.end} className={styles.mobileLink}>
                <Icon icon={item.icon} size="md" />
                <span>{item.label}</span>
                {item.badge ? <span className={styles.badge}>{item.badge}</span> : null}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}

export interface FooterGroup {
  title: string;
  links: { to: string; label: string }[];
}

export function SiteFooter({
  brand,
  tagline,
  groups,
  note,
}: {
  brand: ReactNode;
  tagline: string;
  groups: FooterGroup[];
  note: ReactNode;
}) {
  return (
    <footer className={styles.footer}>
      <div className={cx('container', styles.footerGrid)}>
        <div className={styles.footerBrand}>
          <Link to="/" className={styles.brand}>
            <BrandMark />
            <span>{brand}</span>
          </Link>
          <p className="ds-type-body-small">{tagline}</p>
        </div>
        {groups.map((group) => (
          <nav key={group.title} aria-label={group.title} className={styles.footerGroup}>
            <h2 className="ds-type-overline">{group.title}</h2>
            <ul>
              {group.links.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="ds-type-body-small">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className={cx('container', styles.footerNote)}>{note}</div>
    </footer>
  );
}
