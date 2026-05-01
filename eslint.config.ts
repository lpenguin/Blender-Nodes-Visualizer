import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import unusedImports from 'eslint-plugin-unused-imports';
import { defineConfig } from 'eslint/config';

export default defineConfig(
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    plugins: {
      'unused-imports': unusedImports,
    },
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // No `any` allowed
      '@typescript-eslint/no-explicit-any': 'error',
      // Require return type on functions (relaxed for test files)
      '@typescript-eslint/explicit-function-return-type': ['error', { allowExpressions: true }],
      // Require type annotations (relaxed - only on parameters and properties)
      '@typescript-eslint/typedef': [
        'error',
        {
          parameter: true,
          propertyDeclaration: true,
        },
      ],
      // No unused vars
      '@typescript-eslint/no-unused-vars': 'off',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],
      // No non-null assertions (warn - prefer optional chaining or nullish coalescing)
      '@typescript-eslint/no-non-null-assertion': 'warn',
      // No unnecessary condition checks if type is known
      '@typescript-eslint/no-unnecessary-condition': 'warn',
      // Require strict null checks (relaxed to allow string checks)
      '@typescript-eslint/strict-boolean-expressions': ['error', { allowNullableBoolean: true, allowNullableString: true }],
      // No floating promises
      '@typescript-eslint/no-floating-promises': 'error',
      // No unsafe assignments
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
      '@typescript-eslint/no-unsafe-argument': 'error',
      // No unnecessary type assertion
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      // Prefer nullish coalescing
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      // Prefer optional chaining
      '@typescript-eslint/prefer-optional-chain': 'error',
      // No empty interfaces
      '@typescript-eslint/no-empty-interface': 'error',
      // No empty functions
      '@typescript-eslint/no-empty-function': 'error',
    },
  },
  {
    files: ['**/*.test.ts', '**/*.test.tsx'],
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/typedef': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-call': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      '@typescript-eslint/no-unsafe-return': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      '@typescript-eslint/strict-boolean-expressions': 'off',
    },
  },
  {
    ignores: ['node_modules', 'dist', '*.js'],
  },
);
