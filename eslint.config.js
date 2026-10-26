// @ts-check
import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/** One lint config for the whole monorepo. App-specific rules are scoped by file globs. */
export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/dist-check/**',
      '**/dist-web/**',
      '**/.expo/**',
      'apps/mobile/ios/**',
      'apps/mobile/android/**',
      '**/expo-env.d.ts',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  {
    files: ['packages/shared/**/*.{ts,tsx}'],
    rules: {
      // Keep shared code platform-agnostic.
      'no-restricted-imports': [
        'error',
        {
          paths: [
            { name: 'react-native', message: 'Shared code must not depend on React Native.' },
            { name: 'react-dom', message: 'Shared code must not depend on the DOM.' },
          ],
          patterns: ['expo*', '@expo/*', 'react-router*'],
        },
      ],
    },
  },
  {
    files: ['packages/shared/tests/**/*.ts'],
    rules: { '@typescript-eslint/no-non-null-assertion': 'off' },
  },
  {
    // Apps must read data through HiddenSpotDataService, never from seed JSON.
    files: ['apps/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@hiddenspot/shared/data', '@hiddenspot/shared/data/*', '**/*.json'],
              message:
                'Use the data service (useDataService or the data hooks) instead of importing seed JSON.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser },
    plugins: { 'react-refresh': reactRefresh },
    rules: { 'react-refresh/only-export-components': ['warn', { allowConstantExport: true }] },
  },
  {
    files: ['apps/mobile/**/*.{ts,tsx}'],
    languageOptions: { globals: { ...globals.browser, __DEV__: 'readonly' } },
  },
  {
    files: ['**/*.{js,cjs,mjs}', 'apps/web/vite.config.ts'],
    languageOptions: { globals: globals.node },
  },
);
