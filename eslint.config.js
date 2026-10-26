import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '*.cjs',
      '**/node_modules/**',
      '**/dist/**',
      'docs/**',
      '.claude/**',
      '**/migrations/**',
      '**/.local/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': 'error',
      'no-console': ['error', { allow: ['warn', 'error'] }],
      eqeqeq: ['error', 'always'],
    },
  },
  {
    // AGENTS.md: domain code is pure. Inject a clock and an RNG instead.
    files: ['apps/api/src/modules/*/domain/**/*.ts', 'packages/*-core/src/**/*.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "MemberExpression[object.name='Math'][property.name='random']",
          message: 'Inject an RNG (AGENTS.md).',
        },
        {
          selector: "MemberExpression[object.name='Date'][property.name='now']",
          message: 'Inject a Clock (AGENTS.md).',
        },
        {
          selector: "NewExpression[callee.name='Date'][arguments.length=0]",
          message: 'Inject a Clock (AGENTS.md).',
        },
      ],
    },
  },
  {
    files: ['**/scripts/**/*.ts', '**/tests/**/*.ts', '**/*.test.ts'],
    rules: { 'no-console': 'off', '@typescript-eslint/no-explicit-any': 'off' },
  },
);
