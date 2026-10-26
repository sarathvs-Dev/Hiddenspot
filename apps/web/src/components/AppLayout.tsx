import { copy } from '@hiddenspot/shared';
import { useSavedPlaceIds } from '@hiddenspot/shared/react';
import { Compass, Heart, Home, Plus, User } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router';
import { paths } from '../lib/paths';
import { SiteFooter, SiteHeader, ToastViewport, type NavItem } from '../ui';
import styles from './AppLayout.module.css';

/** App shell: header, page outlet, footer and toasts. */
export function AppLayout() {
  const { pathname } = useLocation();
  const { savedPlaceIds } = useSavedPlaceIds();

  const mainRef = useRef<HTMLElement>(null);
  const firstRender = useRef(true);

  useEffect(() => {
    window.scrollTo({ top: 0 });
    // After a navigation, move focus to the new page so keyboard and screen reader users
    // start at its content instead of the link they just used. Not on the first load.
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    mainRef.current?.focus({ preventScroll: true });
  }, [pathname]);

  const items: NavItem[] = [
    { to: paths.home, label: 'Discover', icon: Home, end: true },
    { to: paths.explore, label: 'Explore', icon: Compass },
    { to: paths.saved, label: 'Saved', icon: Heart, badge: savedPlaceIds.length || undefined },
    { to: paths.profile, label: 'Profile', icon: User },
    { to: paths.addSpot, label: 'Add Spot', icon: Plus, emphasis: true },
  ];

  return (
    <div className={styles.app}>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <SiteHeader
        brand={copy.brand.name}
        homeHref={paths.home}
        items={items}
        searchHref={paths.explore}
      />
      <main id="main" ref={mainRef} className={styles.main} tabIndex={-1}>
        {/* Keyed by path, so a new page fades in but filter changes on the same page do not. */}
        <div key={pathname} className={styles.page}>
          <Outlet />
        </div>
      </main>
      <SiteFooter
        brand={copy.brand.name}
        tagline={copy.brand.tagline}
        groups={[
          {
            title: 'Discover',
            links: [
              { to: paths.home, label: 'Home' },
              { to: paths.explore, label: 'Explore all places' },
              { to: `${paths.explore}?categories=waterfalls`, label: 'Waterfalls' },
              { to: `${paths.explore}?categories=beaches`, label: 'Beaches' },
            ],
          },
          {
            title: 'Your demo',
            links: [
              { to: paths.saved, label: 'Saved places' },
              { to: paths.addSpot, label: 'Add a spot' },
              { to: paths.profile, label: 'Profile and settings' },
            ],
          },
          {
            title: 'Project',
            links: [
              { to: paths.admin, label: 'Moderation demo' },
              { to: paths.designSystem, label: 'Design system' },
            ],
          },
        ]}
        note={
          <>
            Phase 1 demo. Places are real Kerala destinations; photos are placeholders and reviews
            are sample text. {copy.storage.local}
          </>
        }
      />
      <ToastViewport />
    </div>
  );
}
