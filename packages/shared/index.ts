/**
 * @hiddenspot/shared public API. Platform-agnostic: no React Native, DOM or React imports here.
 * React bindings live in the "@hiddenspot/shared/react" subpath.
 *
 * Seed JSON is deliberately not exported. Apps read data only through HiddenSpotDataService.
 */
export * from './content';
export { isKeralaDistrict, KERALA_DISTRICTS, type KeralaDistrict } from './data/kerala';
export * from './services';
export * from './theme';
export * from './types';
export * from './utils';
