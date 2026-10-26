import { avatarSizes, getInitials, pickAvatarColors, type AvatarSize } from '@hiddenspot/shared';
import { useState } from 'react';
import styles from './Avatar.module.css';
import { cx } from './utils';

/** Anything with an id, a name and an optional photo, such as a DemoUser. */
export interface AvatarPerson {
  id: string;
  name: string;
  avatarUrl?: string | null;
}

export interface AvatarProps {
  person: AvatarPerson;
  size?: AvatarSize;
  className?: string;
}

/** Photo avatar that falls back to coloured initials when there is no photo or it fails to load. */
export function Avatar({ person, size = 'md', className }: AvatarProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const dimension = avatarSizes[size];
  const colors = pickAvatarColors(person.id);
  const url = person.avatarUrl ?? null;
  const showImage = url !== null && failedUrl !== url;

  return (
    <span
      className={cx(styles.avatar, className)}
      style={{
        width: dimension,
        height: dimension,
        fontSize: Math.round(dimension * 0.38),
        background: colors.background,
        color: colors.foreground,
      }}
    >
      {showImage ? (
        <img src={url} alt="" className={styles.img} onError={() => setFailedUrl(url)} />
      ) : (
        <span aria-hidden="true">{getInitials(person.name)}</span>
      )}
      <span className="visually-hidden">{person.name}</span>
    </span>
  );
}
