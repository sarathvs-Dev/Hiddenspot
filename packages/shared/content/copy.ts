/**
 * Shared microcopy. Friendly, short and specific. Keeping it here means both apps
 * say the same thing in the same situation.
 */
export const copy = {
  brand: {
    name: 'HiddenSpot',
    tagline: 'Find the quiet places worth the detour.',
  },
  actions: {
    save: 'Save',
    saved: 'Saved',
    explore: 'Explore spots',
    retry: 'Try again',
    clearFilters: 'Clear filters',
    directions: 'Get directions',
    viewAll: 'View all',
    cancel: 'Cancel',
    close: 'Close',
  },
  empty: {
    noResults: {
      title: 'No spots match yet',
      message: 'Try a broader search or remove a filter or two.',
    },
    noSaved: {
      title: 'Nothing saved yet',
      message: 'Tap the heart on any spot and it will wait for you here.',
    },
    noReviews: {
      title: 'No reviews yet',
      message: 'Be the first to share what this place is like.',
    },
    notFound: {
      title: 'This place is a little too hidden',
      message: 'We could not find that page. It may have moved.',
    },
  },
  errors: {
    generic: {
      title: 'Something went off-trail',
      message: 'We could not load this right now. Please try again.',
    },
  },
  toasts: {
    saved: (name: string) => ({ title: 'Saved', message: `${name} is in your saved spots.` }),
    removed: (name: string) => ({ title: 'Removed', message: `${name} was removed from saved.` }),
    clearedSaved: { title: 'Saved list cleared' },
  },
  confirm: {
    clearSaved: {
      title: 'Clear all saved spots?',
      message: 'This removes every spot from your saved list on this device.',
      confirm: 'Clear all',
    },
  },
  validation: {
    required: (label: string) => `${label} is required.`,
    minLength: (label: string, min: number) => `${label} needs at least ${min} characters.`,
    email: 'Enter an email like name@example.com.',
  },
  distance: {
    /** "from you" for the device location, else "from Kochi". The location pill says when it is a demo. */
    fromReference: (reference: { label: string; kind?: string }) =>
      reference.kind === 'device' ? 'from you' : `from ${reference.label}`,
  },
  /** Shown when the device location cannot be used. The demo location stays clearly labelled. */
  location: {
    denied: 'Location permission was not granted, so a demo location is used instead.',
    unavailable: 'Your location could not be found right now, so a demo location is used instead.',
    /** Add-a-spot: filling coordinates from the device failed. */
    coordinatesUnavailable: 'Your location could not be found. Type the coordinates instead.',
  },
  storage: {
    /** Shown wherever saved or demo data appears. This is not cloud sync. */
    local: 'Saved on this device only. Nothing is synced to the cloud.',
    memoryOnly:
      'Device storage is unavailable, so your changes will be lost when you close the app.',
    recovered: 'Some saved demo data could not be read and was reset.',
    resetTitle: 'Reset demo data?',
    resetMessage:
      'This removes your saved places, demo reviews and demo submissions on this device.',
  },
  place: {
    demoListing: 'Demo listing',
    demoListingNote: 'This is a fictional place created for the demo.',
    notConfirmed: 'Not confirmed yet',
    locationUnverified: 'Exact location not verified yet. Directions search by name and district.',
    locationArea:
      'Approximate area location. Directions search by name and district because the exact spot is not confirmed.',
    locationVerified: (sources: string) => `Location checked against ${sources}.`,
    noPhotos: 'No photos yet',
    noDescription: 'No detailed description yet.',
  },
  review: {
    sampleLabel: 'Sample review',
    sampleNote: 'Reviews in this demo are sample text, not real visitor feedback.',
  },
} as const;
