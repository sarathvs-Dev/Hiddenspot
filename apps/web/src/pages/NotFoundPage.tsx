import { copy } from '@hiddenspot/shared';
import { MapPinOff } from 'lucide-react';
import { paths } from '../lib/paths';
import { ButtonLink, EmptyState } from '../ui';

export function NotFoundPage() {
  return (
    <div className="container">
      <EmptyState
        icon={MapPinOff}
        title={copy.empty.notFound.title}
        message={copy.empty.notFound.message}
        action={<ButtonLink to={paths.home}>Back home</ButtonLink>}
      />
    </div>
  );
}
