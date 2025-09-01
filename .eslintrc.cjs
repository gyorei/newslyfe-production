module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['react', 'react-hooks', '@typescript-eslint', 'sonarjs', 'unused-imports'],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  rules: {
    // Automatically remove unused imports and variables
    'unused-imports/no-unused-imports': 'error',
    'unused-imports/no-unused-vars': [
      'warn',
      { vars: 'all', varsIgnorePattern: '^_', args: 'after-used', argsIgnorePattern: '^_' },
    ],
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    'react/display-name': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': [
      'warn',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      },
    ],
    '@typescript-eslint/ban-ts-comment': [
      'warn',
      {
        'ts-ignore': 'allow-with-description',
        'ts-nocheck': 'allow-with-description',
        'ts-expect-error': 'allow-with-description',
      },
    ],
    // SonarJS szabályok
    'sonarjs/no-duplicate-string': 'warn',
    'sonarjs/cognitive-complexity': ['warn', 30],
    'sonarjs/no-identical-functions': 'warn',
    'sonarjs/no-redundant-boolean': 'warn',
    'sonarjs/no-unused-collection': 'warn',
    'sonarjs/prefer-immediate-return': 'warn',
    // Általános komplexitási szabályok
    //Ha teljesen ki akarod kapcsolni, ezt írd be:'complexity': 'off',
    complexity: ['warn', 50], // 30-ről 50-ra emelve. Ha teljesen ki akarod kapcsolni, ezt írd be:'complexity': 'off',
    'max-depth': ['warn', 4],
    // Fájlméret korlátozások kikapcsolva vagy növelve
    'max-lines-per-function': 'off', // Kikapcsolva a függvény méret korlátozása
    'max-lines': 'off', // Kikapcsolva a fájl méret korlátozása is
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  env: {
    browser: true,
    node: true,
    es6: true,
  },
  overrides: [
    {
      files: ['*.cjs'],
      rules: {
        '@typescript-eslint/no-require-imports': 'off',
        // Ha van ilyen szabály: 'import/no-commonjs': 'off'
      },
    },
    {
      files: [
        'jest.env.setup.js',
        'jest.env.setup.cjs',
        'jest.config.js',
        'jest.config.ts',
        'babel.config.cjs',
        'config/config.js',
      ],
      rules: {
        '@typescript-eslint/no-require-imports': 'off',
        '@typescript-eslint/no-var-requires': 'off',
      },
    },
  ],
};
