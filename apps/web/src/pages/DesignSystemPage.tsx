import {
  BUTTON_SIZES,
  BUTTON_VARIANTS,
  contrastRatio,
  copy,
  durations,
  fontFamilies,
  ICON_BUTTON_VARIANTS,
  iconSizes,
  palette,
  radii,
  semanticColors,
  shadows,
  spacing,
  SUBMISSION_STATUSES,
  TONES,
  typography,
  getSubmissionStatusMeta,
  minLength,
  optional,
  required,
  email,
  validateForm,
  type TypeVariant,
} from '@hiddenspot/shared';
import {
  useCatalog,
  usePlaces,
  useReviewsForPlace,
  useSubmissions,
  useToast,
} from '@hiddenspot/shared/react';
import { ArrowRight, Bell, Heart, MapPin, Plus, Search, Share2 } from 'lucide-react';
import { useState, type FormEvent, type ReactNode } from 'react';
import {
  Avatar,
  Badge,
  Button,
  CategoryIcon,
  Checkbox,
  ConfirmDialog,
  DistanceIndicator,
  EmptyState,
  ErrorState,
  FilterChip,
  ChipGroup,
  IconButton,
  ImageGallery,
  Modal,
  PlaceCard,
  PlaceCardSkeleton,
  RatingIndicator,
  ReviewCard,
  SearchField,
  SectionHeading,
  SelectField,
  Skeleton,
  StatusBadge,
  Text,
  TextArea,
  TextField,
  ValidationMessage,
} from '../ui';
import styles from './DesignSystemPage.module.css';

const SECTIONS = [
  ['colours', 'Colours'],
  ['typography', 'Typography'],
  ['spacing', 'Spacing and shape'],
  ['motion', 'Motion'],
  ['buttons', 'Buttons'],
  ['inputs', 'Search and chips'],
  ['cards', 'Place cards'],
  ['indicators', 'Indicators and badges'],
  ['gallery', 'Gallery'],
  ['overlays', 'Overlays'],
  ['forms', 'Forms'],
  ['feedback', 'Feedback'],
  ['reviews', 'Reviews and avatars'],
  ['principles', 'Principles'],
] as const;

function Section({
  id,
  title,
  intro,
  children,
}: {
  id: string;
  title: string;
  intro?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className={styles.section} aria-labelledby={`${id}-title`}>
      <SectionHeading id={`${id}-title`} title={title} description={intro} />
      {children}
    </section>
  );
}

function Example({
  label,
  children,
  code,
}: {
  label?: string;
  children: ReactNode;
  code?: string;
}) {
  return (
    <figure className={styles.example}>
      {label ? <figcaption className="ds-type-overline">{label}</figcaption> : null}
      <div className={styles.exampleBody}>{children}</div>
      {code ? (
        <pre className={styles.code}>
          <code>{code}</code>
        </pre>
      ) : null}
    </figure>
  );
}

function Swatch({ name, value, on }: { name: string; value: string; on?: string }) {
  const background = semanticColors.background;
  const ratio = value.startsWith('#') ? contrastRatio(value, on ?? background) : undefined;
  return (
    <li className={styles.swatch}>
      <span className={styles.swatchColor} style={{ background: value }} />
      <span className="ds-type-label">{name}</span>
      <span className={`ds-type-caption ${styles.muted}`}>
        {value}
        {ratio ? ` · ${ratio.toFixed(1)}:1` : ''}
      </span>
    </li>
  );
}

function FormDemo() {
  const { categories } = useCatalog();
  const { showToast } = useToast();
  const [values, setValues] = useState({ name: '', email: '', category: '', note: '' });
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof typeof values, string>>>({});
  const [submitting, setSubmitting] = useState(false);

  const set = (key: keyof typeof values) => (value: string) =>
    setValues((v) => ({ ...v, [key]: value }));

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const next = validateForm(values, {
      name: [required('Name')],
      email: [required('Email'), email],
      category: [required('Category')],
      note: [optional(minLength('Description', 20))],
    });
    setErrors(next);
    if (Object.keys(next).length > 0) {
      showToast({ title: 'Check the highlighted fields', tone: 'warning' });
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      showToast({
        title: 'Thanks for sharing',
        message: 'Your demo submission was received.',
        tone: 'success',
      });
    }, 900);
  };

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      <TextField
        label="Your name"
        required
        value={values.name}
        onChange={(e) => set('name')(e.target.value)}
        error={errors.name}
        autoComplete="name"
      />
      <TextField
        label="Email"
        type="email"
        required
        hint="We only use this to tell you when the spot is live."
        value={values.email}
        onChange={(e) => set('email')(e.target.value)}
        error={errors.email}
        autoComplete="email"
      />
      <SelectField
        label="Category"
        required
        placeholder="Choose a category"
        value={values.category}
        onChange={(e) => set('category')(e.target.value)}
        error={errors.category}
        options={categories.map((c) => ({ value: c.id, label: c.name }))}
      />
      <TextArea
        label="What makes it special?"
        optional
        hint="At least 20 characters. Mention access, parking and the best time to go."
        value={values.note}
        onChange={(e) => set('note')(e.target.value)}
        error={errors.note}
      />
      <Checkbox
        label="Notify me about similar spots"
        description="Occasional updates. You can turn this off any time."
        checked={agree}
        onChange={(e) => setAgree(e.target.checked)}
      />
      <div className={styles.row}>
        <Button type="submit" loading={submitting}>
          Submit spot
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            setValues({ name: '', email: '', category: '', note: '' });
            setErrors({});
          }}
        >
          Reset
        </Button>
      </div>
    </form>
  );
}

/** Living documentation: every example renders the real components and tokens. */
export function DesignSystemPage() {
  const { categories } = useCatalog();
  const { data: places } = usePlaces({ sortBy: 'rating', withPhotosOnly: true });
  const { data: reviews } = useReviewsForPlace('pl-athirappilly-falls');
  const { data: submissions } = useSubmissions();
  const { showToast } = useToast();
  const [modal, setModal] = useState<'dialog' | 'sheet' | 'confirm' | null>(null);
  const [chips, setChips] = useState<string[]>(['Waterfalls']);
  const [query, setQuery] = useState('');
  const sample = places?.[0];
  const sample2 = places?.[1];

  return (
    <div className={`container ${styles.page}`}>
      <SectionHeading
        as="h1"
        size="page"
        eyebrow="HiddenSpot design system"
        title="Calm, premium, nature-first"
        description="Tokens, components and patterns shared by the web and mobile apps. Everything on this page is rendered with the production components."
      />

      <nav className={styles.toc} aria-label="Design system sections">
        {SECTIONS.map(([id, label]) => (
          <a key={id} href={`#${id}`} className={styles.tocLink}>
            {label}
          </a>
        ))}
      </nav>

      <Section
        id="colours"
        title="Colours"
        intro="Deep forest for actions, warm ivory backgrounds, charcoal text, sage secondary surfaces and amber highlights. Ratios are measured against the ivory background."
      >
        <Example label="Brand palette">
          <ul className={styles.swatches}>
            {(
              [
                'forest700',
                'forest500',
                'forest50',
                'ivory100',
                'ivory300',
                'sage100',
                'sage300',
                'charcoal900',
                'charcoal600',
                'amber500',
                'amber100',
                'red600',
              ] as const
            ).map((key) => (
              <Swatch key={key} name={key} value={palette[key]} />
            ))}
          </ul>
        </Example>
        <Example
          label="Semantic roles"
          code={`import { semanticColors } from '@hiddenspot/shared';\n// web: var(--color-primary)   mobile: semanticColors.primary`}
        >
          <ul className={styles.swatches}>
            {(
              [
                'primary',
                'background',
                'surface',
                'surfaceSecondary',
                'textPrimary',
                'textSecondary',
                'textTertiary',
                'border',
                'focusRing',
                'highlight',
                'rating',
                'danger',
              ] as const
            ).map((key) => (
              <Swatch key={key} name={key} value={semanticColors[key]} />
            ))}
          </ul>
        </Example>
      </Section>

      <Section
        id="typography"
        title="Typography"
        intro={`${fontFamilies.display.name} for expressive headings, ${fontFamilies.body.name} for everything else. Both are bundled locally with system fallbacks. Web sizes scale fluidly between phone and desktop.`}
      >
        <Example
          code={`<Text variant="h2">Section title</Text>\n<Text variant="body" tone="secondary">Supporting copy</Text>`}
        >
          <div className={styles.typeScale}>
            {(Object.keys(typography) as TypeVariant[]).map((variant) => {
              const style = typography[variant];
              return (
                <div key={variant} className={styles.typeRow}>
                  <span className={`ds-type-caption ${styles.muted}`}>
                    {variant} · {style.size}
                    {'maxSize' in style ? `–${style.maxSize}` : ''}px · {style.weight}
                  </span>
                  <Text variant={variant} as="p" lines={2}>
                    {variant === 'body' || variant === 'bodySmall'
                      ? 'A quiet hideaway surrounded by untouched forest trails and river streams.'
                      : 'Mistwood Retreat'}
                  </Text>
                </div>
              );
            })}
          </div>
        </Example>
      </Section>

      <Section
        id="spacing"
        title="Spacing and shape"
        intro="A 4px spacing scale, generous radii and soft warm shadows."
      >
        <Example label="Spacing">
          <ul className={styles.scale}>
            {Object.entries(spacing)
              .filter(([, v]) => v > 0)
              .map(([key, value]) => (
                <li key={key} className={styles.scaleRow}>
                  <span className={`ds-type-caption ${styles.scaleLabel}`}>
                    {key} · {value}px
                  </span>
                  <span className={styles.spaceBar} style={{ width: value }} />
                </li>
              ))}
          </ul>
        </Example>
        <Example label="Radii and shadows">
          <div className={styles.tiles}>
            {Object.entries(radii)
              .filter(([key]) => key !== 'none')
              .map(([key, value]) => (
                <div
                  key={key}
                  className={styles.tile}
                  style={{ borderRadius: Math.min(value, 48) }}
                >
                  <span className="ds-type-caption">radius {key}</span>
                </div>
              ))}
            {Object.entries(shadows)
              .filter(([key]) => key !== 'none')
              .map(([key, value]) => (
                <div key={key} className={styles.tile} style={{ boxShadow: value }}>
                  <span className="ds-type-caption">shadow {key}</span>
                </div>
              ))}
          </div>
        </Example>
        <Example label="Icon sizes">
          <div className={styles.row}>
            {Object.entries(iconSizes).map(([key, value]) => (
              <span key={key} className={styles.iconSample}>
                <MapPin size={value} strokeWidth={1.75} aria-hidden="true" />
                <span className="ds-type-caption">
                  {key} · {value}
                </span>
              </span>
            ))}
          </div>
        </Example>
      </Section>

      <Section
        id="motion"
        title="Motion"
        intro="Short, subtle transitions. When the system asks for reduced motion, every duration drops to zero and shimmer animations stop."
      >
        <Example>
          <ul className={styles.scale}>
            {Object.entries(durations).map(([key, value]) => (
              <li key={key} className={styles.scaleRow}>
                <span className={`ds-type-caption ${styles.scaleLabel}`}>
                  {key} · {value}ms
                </span>
                <span
                  className={styles.motionDot}
                  style={{ animationDuration: `${Math.max(value, 1) * 4}ms` }}
                />
              </li>
            ))}
          </ul>
        </Example>
      </Section>

      <Section
        id="buttons"
        title="Buttons"
        intro="One primary action per view. Small sizes keep a 44px touch area."
      >
        <Example
          label="Variants"
          code={`<Button variant="primary" leadingIcon={Plus}>Add a spot</Button>`}
        >
          <div className={styles.row}>
            {BUTTON_VARIANTS.map((variant) => (
              <Button key={variant} variant={variant}>
                {variant[0]?.toUpperCase() + variant.slice(1)}
              </Button>
            ))}
          </div>
        </Example>
        <Example label="Sizes, icons and states">
          <div className={styles.row}>
            {BUTTON_SIZES.map((size) => (
              <Button key={size} size={size} leadingIcon={Plus}>
                Size {size}
              </Button>
            ))}
            <Button variant="outline" trailingIcon={ArrowRight}>
              Continue
            </Button>
            <Button loading>Saving</Button>
            <Button disabled>Disabled</Button>
          </div>
        </Example>
        <Example
          label="Icon buttons"
          code={`<IconButton icon={Heart} label="Save spot" variant="soft" />`}
        >
          <div className={styles.row}>
            {ICON_BUTTON_VARIANTS.filter((v) => v !== 'glass').map((variant) => (
              <IconButton
                key={variant}
                icon={Share2}
                label={`Share (${variant})`}
                variant={variant}
              />
            ))}
            <IconButton icon={Bell} label="Notifications (small)" size="sm" />
            <IconButton icon={Heart} label="Saved" filled aria-pressed />
            <span className={styles.onImage}>
              <IconButton icon={Heart} label="Save (on photo)" variant="glass" />
            </span>
          </div>
        </Example>
      </Section>

      <Section id="inputs" title="Search and chips">
        <Example code={`<SearchField value={query} onChange={setQuery} />`}>
          <SearchField value={query} onChange={setQuery} />
        </Example>
        <Example
          label="Filter chips"
          code={`<FilterChip label="Waterfalls" selected onClick={toggle} />`}
        >
          <ChipGroup label="Demo filters" layout="wrap">
            {categories.slice(0, 5).map((category) => (
              <FilterChip
                key={category.id}
                label={category.name}
                icon={<CategoryIcon icon={category.icon} />}
                selected={chips.includes(category.name)}
                onClick={() =>
                  setChips((c) =>
                    c.includes(category.name)
                      ? c.filter((x) => x !== category.name)
                      : [...c, category.name],
                  )
                }
              />
            ))}
            <FilterChip label="Free entry" selected={false} count={8} />
          </ChipGroup>
        </Example>
        <Example label="Category icons">
          <ul className={styles.categoryGrid}>
            {categories.map((category) => (
              <li key={category.id} className={styles.categoryItem}>
                <span className={styles.categoryIcon}>
                  <CategoryIcon icon={category.icon} size="lg" />
                </span>
                <span className="ds-type-label">{category.name}</span>
              </li>
            ))}
          </ul>
        </Example>
      </Section>

      <Section
        id="cards"
        title="Place cards"
        intro="Every card shows the photo, name, category, district, rating with review count and a save action. Distance appears only when both the place and a reference location have verified coordinates; the first compact card passes a sample distance."
      >
        {sample && sample2 ? (
          <div className={styles.cardDemo}>
            <Example label="Featured" code={`<PlaceCard place={place} />`}>
              <div className={styles.featuredSample}>
                <PlaceCard place={sample} />
              </div>
            </Example>
            <Example
              label="Compact"
              code={`<PlaceCard place={place} variant="compact" distanceKm={12.4} />`}
            >
              <div className={styles.stack}>
                <PlaceCard place={sample} variant="compact" distanceKm={12.4} />
                <PlaceCard place={sample2} variant="compact" />
                <PlaceCard
                  place={{
                    ...sample2,
                    id: 'pl-broken-image-demo',
                    name: 'Broken image fallback',
                    imageUrls: ['https://invalid.example/missing.jpg'],
                  }}
                  variant="compact"
                />
                <PlaceCard
                  place={{
                    ...sample2,
                    id: 'pl-no-photo-demo',
                    name: 'No photos and no reviews',
                    imageUrls: [],
                    averageRating: null,
                    reviewCount: 0,
                  }}
                  variant="compact"
                />
              </div>
            </Example>
            <Example label="Loading">
              <div className={styles.stack}>
                <PlaceCardSkeleton variant="compact" />
                <PlaceCardSkeleton variant="compact" />
              </div>
            </Example>
          </div>
        ) : (
          <PlaceCardSkeleton />
        )}
      </Section>

      <Section id="indicators" title="Indicators and badges">
        <Example label="Rating and distance">
          <div className={styles.row}>
            <RatingIndicator rating={4.8} reviewCount={184} />
            <RatingIndicator rating={4.5} size="sm" />
            <span className={styles.onImage}>
              <RatingIndicator rating={4.9} appearance="badge" size="sm" />
            </span>
            <DistanceIndicator distanceKm={6.4} label="from Cusco" />
            <DistanceIndicator distanceKm={0.8} size="sm" />
          </div>
        </Example>
        <Example label="Tones" code={`<Badge tone="success" dot>Open now</Badge>`}>
          <div className={styles.row}>
            {TONES.map((tone) => (
              <Badge key={tone} tone={tone}>
                {tone}
              </Badge>
            ))}
          </div>
        </Example>
        <Example label="Demo submission statuses" code={`<StatusBadge status="in_review" />`}>
          <ul className={styles.statusList}>
            {(submissions ?? []).map((submission) => (
              <li key={submission.id} className={styles.statusItem}>
                <div>
                  <p className="ds-type-title">{submission.place.name}</p>
                  <p className={`ds-type-body-small ${styles.muted}`}>
                    {getSubmissionStatusMeta(submission.status).description}
                  </p>
                  {submission.reviewerNote ? (
                    <ValidationMessage tone="info">{submission.reviewerNote}</ValidationMessage>
                  ) : null}
                </div>
                <StatusBadge status={submission.status} />
              </li>
            ))}
          </ul>
          <div className={styles.row}>
            {SUBMISSION_STATUSES.map((status) => (
              <StatusBadge key={status} status={status} size="sm" />
            ))}
          </div>
        </Example>
      </Section>

      <Section
        id="gallery"
        title="Gallery"
        intro="Thumbnails open a full-screen viewer. Use arrow keys to move between photos."
      >
        {sample ? (
          <ImageGallery
            images={sample.imageUrls.map((src, i) => ({
              src,
              alt: `${sample.name}, photo ${i + 1}`,
            }))}
            title={`${sample.name} photos`}
          />
        ) : null}
      </Section>

      <Section
        id="overlays"
        title="Overlays"
        intro="Modal, bottom sheet and confirmation dialog share one accessible dialog. Focus is trapped, Escape closes, and focus returns to the trigger."
      >
        <Example
          code={`<Modal open={open} onClose={close} title="Share this spot" variant="sheet">…</Modal>`}
        >
          <div className={styles.row}>
            <Button variant="secondary" onClick={() => setModal('dialog')}>
              Open modal
            </Button>
            <Button variant="secondary" onClick={() => setModal('sheet')}>
              Open bottom sheet
            </Button>
            <Button variant="outline" onClick={() => setModal('confirm')}>
              Open confirmation
            </Button>
          </div>
        </Example>
        <Modal
          open={modal === 'dialog'}
          onClose={() => setModal(null)}
          title="Share this spot"
          description="Send Mistwood Retreat to a friend who loves quiet places."
          footer={
            <>
              <Button variant="secondary" onClick={() => setModal(null)}>
                {copy.actions.cancel}
              </Button>
              <Button
                leadingIcon={Share2}
                onClick={() => {
                  setModal(null);
                  showToast({ title: 'Link copied', tone: 'success' });
                }}
              >
                Copy link
              </Button>
            </>
          }
        >
          <TextField label="Link" readOnly value="https://hiddenspot.app/spots/mistwood-retreat" />
        </Modal>
        <Modal
          open={modal === 'sheet'}
          onClose={() => setModal(null)}
          title="Sort spots"
          variant="sheet"
          footer={<Button onClick={() => setModal(null)}>Apply</Button>}
        >
          <ChipGroup label="Sort options" layout="wrap">
            {['Recommended', 'Top rated', 'Closest', 'Newest'].map((label, i) => (
              <FilterChip key={label} label={label} selected={i === 0} />
            ))}
          </ChipGroup>
        </Modal>
        <ConfirmDialog
          open={modal === 'confirm'}
          tone="danger"
          title={copy.confirm.clearSaved.title}
          message={copy.confirm.clearSaved.message}
          confirmLabel={copy.confirm.clearSaved.confirm}
          onCancel={() => setModal(null)}
          onConfirm={() => {
            setModal(null);
            showToast({ title: 'Demo only', message: 'Nothing was deleted.', tone: 'info' });
          }}
        />
      </Section>

      <Section
        id="forms"
        title="Forms"
        intro="Labels above fields, hints below, errors replace hints and are announced. Submit the empty form to see validation."
      >
        <Example>
          <FormDemo />
        </Example>
      </Section>

      <Section
        id="feedback"
        title="Feedback"
        intro="Skeletons while loading, friendly empty and error states, and short toasts for confirmations."
      >
        <Example label="Skeletons">
          <div className={styles.row}>
            <Skeleton shape="circle" width={48} height={48} />
            <div className={styles.stack} style={{ flex: 1 }}>
              <Skeleton shape="text" width="60%" />
              <Skeleton shape="text" width="40%" />
            </div>
          </div>
        </Example>
        <div className={styles.cardDemo}>
          <Example label="Empty state">
            <EmptyState
              size="inline"
              icon={Search}
              title={copy.empty.noResults.title}
              message={copy.empty.noResults.message}
              action={<Button size="sm">{copy.actions.clearFilters}</Button>}
            />
          </Example>
          <Example label="Error state">
            <ErrorState
              size="inline"
              onRetry={() => showToast({ title: 'Retrying…', tone: 'info' })}
            />
          </Example>
        </div>
        <Example label="Toasts" code={`showToast({ title: 'Saved', tone: 'success' })`}>
          <div className={styles.row}>
            {(['success', 'info', 'warning', 'danger', 'neutral'] as const).map((tone) => (
              <Button
                key={tone}
                variant="outline"
                size="sm"
                onClick={() =>
                  showToast({
                    title: `${tone[0]?.toUpperCase()}${tone.slice(1)} toast`,
                    message: 'Short and specific feedback.',
                    tone,
                  })
                }
              >
                {tone}
              </Button>
            ))}
          </div>
        </Example>
      </Section>

      <Section
        id="reviews"
        title="Reviews and avatars"
        intro="Avatars fall back to coloured initials when there is no photo."
      >
        <Example label="Avatars">
          <div className={styles.row}>
            <Avatar
              person={{
                id: 'u-01',
                name: 'Maya Fernandes',
                avatarUrl: 'https://picsum.photos/seed/hs-avatar-maya/96/96',
              }}
              size="xl"
            />
            <Avatar person={{ id: 'u-02', name: 'Tomás Ruiz' }} size="lg" />
            <Avatar person={{ id: 'u-05', name: 'Priya Nair' }} size="md" />
            <Avatar person={{ id: 'u-09', name: 'Giulia Bianchi' }} size="sm" />
            <Avatar
              person={{
                id: 'u-99',
                name: 'Broken Photo',
                avatarUrl: 'https://invalid.example/a.jpg',
              }}
              size="md"
            />
          </div>
        </Example>
        <div className={styles.stack}>
          {(reviews ?? []).slice(0, 2).map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      </Section>

      <Section id="principles" title="Principles">
        <ul className={styles.principles}>
          {[
            [
              'One clear action',
              'Each view has a single primary button. Everything else is secondary, outline or ghost.',
            ],
            [
              'Tokens only',
              'No raw colours, sizes or durations in components. Read them from the shared tokens.',
            ],
            [
              'Readable everywhere',
              'All text pairs meet WCAG AA. Unit tests fail if a token change breaks contrast.',
            ],
            [
              'Thumb friendly',
              'Interactive targets are at least 44px. Navigation sits at the bottom on phones.',
            ],
            [
              'Calm motion',
              'Transitions stay under 320ms and switch off when reduced motion is requested.',
            ],
            ['Friendly words', 'Microcopy is short, specific and lives in one shared file.'],
          ].map(([title, body]) => (
            <li key={title} className={styles.principle}>
              <p className="ds-type-title">{title}</p>
              <p className={`ds-type-body-small ${styles.muted}`}>{body}</p>
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}
