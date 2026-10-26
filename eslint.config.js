import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
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
    files: ['apps/web/src/**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',
      // Clients never decide what is allowed: they read server-computed `capabilities` (docs/01 §4).
      'no-restricted-syntax': [
        'error',
        {
          selector: 'MemberExpression[property.name=/^roles?$/]',
          message:
            'No role checks in clients: use the capabilities the server returns (AGENTS.md).',
        },
        {
          selector: 'Literal[value=/^(custodian|facilitator|moderator|steward|operator)$/]',
          message:
            'No role checks in clients: use the capabilities the server returns (AGENTS.md).',
        },
      ],
    },
  },
  {
    files: [
      '**/scripts/**/*.ts',
      '**/tests/**/*.ts',
      '**/*.test.ts',
      '**/*.test.tsx',
      '**/e2e/**/*.ts',
    ],
    rules: { 'no-console': 'off', '@typescript-eslint/no-explicit-any': 'off' },
  },
);
