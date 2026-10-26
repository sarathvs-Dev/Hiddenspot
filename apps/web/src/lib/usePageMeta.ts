import { copy } from '@hiddenspot/shared';
import { useEffect } from 'react';

const DEFAULT_DESCRIPTION =
  'Discover hidden waterfalls, quiet beaches, misty hills and old temples across Kerala.';

/** Sets the document title and meta description for a page, restoring defaults on unmount. */
export function usePageMeta(title: string | null, description?: string) {
  useEffect(() => {
    document.title = title
      ? `${title} · ${copy.brand.name}`
      : `${copy.brand.name} · Hidden places in Kerala`;
    const meta = document.querySelector('meta[name="description"]');
    meta?.setAttribute('content', description ?? DEFAULT_DESCRIPTION);
    return () => {
      document.title = copy.brand.name;
      meta?.setAttribute('content', DEFAULT_DESCRIPTION);
    };
  }, [title, description]);
}
