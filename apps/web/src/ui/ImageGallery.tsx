import { ChevronLeft, ChevronRight, Expand } from 'lucide-react';
import { useState, type KeyboardEvent } from 'react';
import { Icon } from './Icon';
import { IconButton } from './IconButton';
import styles from './ImageGallery.module.css';
import { Modal } from './Modal';
import { SpotImage } from './SpotImage';

export interface GalleryImage {
  src: string;
  alt: string;
}

export interface ImageGalleryProps {
  images: GalleryImage[];
  /** Used in the viewer title, e.g. "Mistwood Retreat photos". */
  title: string;
}

/** Thumbnail grid that opens a keyboard-friendly full-screen viewer. */
export function ImageGallery({ images, title }: ImageGalleryProps) {
  const [index, setIndex] = useState<number | null>(null);
  const open = index !== null;
  const current = index !== null ? images[index] : undefined;
  const count = images.length;

  const go = (delta: number) =>
    setIndex((value) => (value === null ? value : (value + delta + count) % count));

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'ArrowRight') go(1);
    if (event.key === 'ArrowLeft') go(-1);
  };

  if (count === 0) return null;

  return (
    <>
      <ul className={styles.grid}>
        {images.map((image, i) => (
          <li key={image.src}>
            <button
              type="button"
              className={styles.thumb}
              onClick={() => setIndex(i)}
              aria-label={`Open photo ${i + 1} of ${count}: ${image.alt}`}
            >
              <SpotImage src={image.src} alt="" ratio="gallery" />
              <span className={styles.expand} aria-hidden="true">
                <Icon icon={Expand} size="sm" />
              </span>
            </button>
          </li>
        ))}
      </ul>

      <Modal
        open={open}
        onClose={() => setIndex(null)}
        title={title}
        hideTitle
        variant="lightbox"
        onKeyDown={onKeyDown}
      >
        {current && index !== null ? (
          <div className={styles.viewer}>
            <img key={current.src} src={current.src} alt={current.alt} className={styles.full} />
            <div className={styles.controls}>
              <IconButton
                icon={ChevronLeft}
                label="Previous photo"
                variant="glass"
                onClick={() => go(-1)}
              />
              <span className="ds-type-label" aria-live="polite">
                {index + 1} of {count}
              </span>
              <IconButton
                icon={ChevronRight}
                label="Next photo"
                variant="glass"
                onClick={() => go(1)}
              />
            </div>
          </div>
        ) : null}
      </Modal>
    </>
  );
}
