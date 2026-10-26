/** Field limits shared by validation, forms and both apps. */
export const LIMITS = {
  placeName: { min: 3, max: 80 },
  shortDescription: { min: 10, max: 160 },
  description: { max: 2000 },
  categoriesPerPlace: { min: 1, max: 3 },
  imagesPerPlace: { max: 8 },
  tagsPerPlace: { max: 8 },
  reviewTitle: { max: 80 },
  reviewBody: { min: 10, max: 1000 },
  reviewerNote: { min: 5, max: 500 },
  rating: { min: 1, max: 5 },
} as const;

/** Bayesian prior used by "recommended" sorting so a single 5-star review does not dominate. */
export const RATING_PRIOR = { mean: 3.8, weight: 3 } as const;
